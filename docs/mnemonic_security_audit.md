# Mnemonic Security Audit

Date: 2025-08-14
Branch: release-1.0
Scope: Review of repository code paths that could lead to exposure or exfiltration of a user's mnemonic ("recovery phrase") or enable a sophisticated attack to extract it.

## Executive Summary
Overall design: Mnemonics are stored (per account) encrypted under a 6‑digit PIN-derived key using PBKDF2(SHA-256, 10k iter, static salt) + AES-GCM (via @noble/ciphers). Storage backend is `expo-secure-store`. Retrieval requires correct PIN verification against a hashed record, then decryption, optionally gated by a "reveal scheduling" delay. Major risks center on (1) low entropy of a fixed-length numeric PIN (brute force), (2) static global salt enabling offline cracking if ciphertext & PIN hash leak, (3) potential enumeration of account keys with predictable naming, (4) insufficient anti-bruteforce / rate limiting, (5) logging & memory lifetime issues, (6) integrity token being static and increasing oracle quality, (7) lack of secure hardware binding / per-device key wrapping, (8) reveal scheduling logic enforceable only client-side, and (9) possible downgrade / replay if attacker controls local storage. Below are detailed findings and recommendations.

Risk rating legend: High – practical path to mnemonic compromise with moderate attacker capability. Medium – increases likelihood given additional conditions. Low – theoretical or requires powerful attacker (e.g., runtime compromise) but still improvable.

## Findings

### 1. Weak Secret Derivation From 6-Digit PIN (High)
- PIN format enforced by `validatePin` is exactly 6 digits (1e6 possibilities). With PBKDF2 10k iterations, an offline attacker can brute force quickly on commodity hardware (≈ <1s for million PBKDF2(10k) with optimized native code / GPU).
- Successful offline scenario: Attacker obtains `user_pin` (salt+hash) plus an encrypted mnemonic (ciphertext) from SecureStore backup / device compromise.
- Result: PIN and mnemonic recoverable. Numeric PIN provides minimal entropy.

Recommendation: Require higher-entropy passphrase (e.g., 8+ digits or alphanumeric), allow optional biometric-gated hardware key, or add a per-account high-entropy random key (wrapped by PIN-derived key) so mnemonic encryption isn't directly brute forced from PIN alone. Increase PBKDF2 iterations (>=100k) and/or switch to Argon2id (native module) if feasible.

### 2. Static Global Salt For Encryption Key Derivation (High)
- In `crypto.ts`, SALT = stringToUint8Array("WalletAppSalt123456") is constant and shared across all users. This enables building rainbow tables for all PINs across the user base.
- A unique per-user (per PIN) salt is only applied for PIN hash in `pin-security.ts` but not for encryption key derivation.

Recommendation: Generate and store a per-account random salt alongside the encrypted mnemonic (e.g., prefix ciphertext with salt+nonce). Derive key with that salt. Maintain backward migration logic.

### 3. Lack of Rate Limiting / Attempt Throttling (High)
- Functions `verifyStoredPin` and `secureDecryptWithPin` impose no retry delay. An attacker with interactive access (malicious automation / overlay attack) can brute force PIN online rapidly.

Recommendation: Maintain PIN failure counters in secure storage; exponential backoff (e.g., 5 failures -> 30s, 10 -> 5m, 15 -> wipe or escalate). Consider device-level biometric requirement after N failures.

### 4. Predictable Storage Key Names (Medium)
- Keys use template `account_${accountId}`. If attacker gains partial SecureStore access (e.g., due to misconfiguration or multi-app environment), enumeration is trivial. Disclosure of encrypted blob + static SALT hastens brute force.

Recommendation: Obfuscate key names (hash(accountId || randomPerInstall) prefix). Store a mapping table encrypted under device key.

### 5. Integrity Token Design (Medium)
- Integrity token `VALID_DECRYPTION_TOKEN_123` appended in clear (post-decrypt) is static. Wrong PIN decrypt attempts give oracle: if token absent, treat as invalid; an attacker can test candidate PINs offline by re-running PBKDF2+decrypt and checking delimiter + token. This speeds brute-force (no padding ambiguity). Not catastrophic, but increases feasibility.

Recommendation: Use AES-GCM auth tag only (already provides integrity) and remove custom token. To detect wrong PIN, rely on GCM failure (catch). Present generic error.

### 6. Returning Structured Feedback on Decryption (Medium)
- `decryptWithPin` returns `{ verified: false }` vs null; differences in timing / branching could yield side-channel. Combined with immediate error messaging, an online attacker receives high-quality oracle.

Recommendation: Normalize responses: always constant-time path; return generic error on failure without specifying correctness vs corruption.

### 7. Exposure via Logging (Medium)
- Numerous `console.log` statements around sensitive flows (e.g., success states, failure reasons). While mnemonic itself isn't logged, timestamps and actions can assist attacker behavior analysis, and in compromised builds, additional logging could be injected.

Recommendation: Remove or gate logs behind development flag; ensure production build strips debug logs.

### 8. No Memory Hardening / Wiping (Low)
- JavaScript limitations acknowledged. However, mnemonic strings kept in React state (`RecoveryState.mnemonic`, `useSecureStorage.value`, etc.) persist until reset. After reveal, value lives up to 30s in memory (auto-hide). A runtime memory dump (e.g., via compromised device / debugger) can capture it.

Recommendation: Upon reveal display, render from a transient buffer and immediately overwrite state after handoff to view layer (e.g., show component that fetches on demand). Reduce auto-hide window (e.g., 10s) and add manual copy-only view with ephemeral buffer.

### 9. Client-Side Only Reveal-Scheduling Security (Low/Bypassable)
- Reveal scheduling logic (`reveal-controller.ts`) uses local timestamps; a user or malware can modify device clock or local storage to bypass waiting period. Not a confidentiality issue if PIN enforced, but reduces defense in depth against rapid shoulder-surf exposures.

Recommendation: Treat scheduling purely UX; if security intent, move to server-side or use monotonic timers backed by secure enclave / trusted attestation (not currently feasible in pure Expo). Document limitation.

### 10. Missing Device Binding / Hardware Keystore (Medium)
- Encryption key derivation not bound to device secrets. Exfiltrated secure store blob + PIN hash can be brute forced off-device.

Recommendation: Use platform Keychain / Android Keystore with per-install random master key to wrap mnemonic encryption key; or derive KEK = HKDF(deviceHardwareKey, userSalt) then wrap content key.

### 11. Potential Replay / Rollback Attack (Low)
- No versioning or MAC over metadata. Attacker could replace ciphertext with older one (still valid GCM tag). User may sign with outdated mnemonic if key rotation planned.

Recommendation: Include version + random salt in envelope: {version, salt, nonce, ciphertext, tag}. On decrypt validate version; optionally store last nonce to detect rollback (needs secure monotonic counter or anchor).

### 12. Key Rotation Complexity (Low)
- `pin-rotation.ts` (reviewed partially via grep) re-encrypts data. If interrupted mid-rotation, may leave some items under old PIN; no atomic commit or backup. Could create confusion or partial failure enabling downgrade.

Recommendation: Write new records with suffix, verify, then swap pointer; maintain rotation journal state to resume or rollback.

### 13. Enumeration of All Secure Keys (Low)
- `updateKeysList` maintains `all_storage_keys`. Compromise of that list increases attack surface enumeration.

Recommendation: Encrypt the key index or derive list at runtime from encrypted metadata.

### 14. Static Nonce Reuse Risk (Currently Mitigated) (Info)
- Nonces are random via `getRandomBytes(12)`; confirm `getRandomBytes` uses crypto.getRandomValues. Ensure no deterministic reuse; review `random.ts` (not yet audited here). If weak RNG, GCM catastrophic.

Action: Audit `random.ts` to ensure cryptographically secure randomness.

### 15. Lack of In-App Clipboard Scrubbing (Medium UX / Potential Leak)
- If user copies mnemonic (assuming a copy feature exists elsewhere), no shown logic scrubs clipboard. Native clipboard can leak to other apps / system logs.

Recommendation: Add controlled copy with immediate scrub (after timeout) and explicit warning; on iOS 16+ avoid background pasteboard reads.

### 16. PIN Hash Storage Key Naming (Low)
- `user_pin` key stores JSON (salt, hash, iterations). Predictable; attacker immediately identifies it.

Recommendation: Obfuscate key; store alongside other metadata under single encrypted blob.

### 17. No Screen Overlay / Screenshot Protection (Platform-Specific) (Low)
- Not addressed in code: On Android, FLAG_SECURE not set (RN config). Mnemonic reveal screen may be screenshot or appear in app switcher.

Recommendation: Add native module / config to enable secure window flag and blur app switcher previews.

## Attack Scenarios

1. Device File Extraction + Offline Brute Force:
   - Attacker extracts SecureStore data (rooted device or backup) containing encrypted mnemonic and `user_pin` hash. Uses static salt for encryption + per-hash salt to brute force 1M PINs swiftly, recovers mnemonic.
2. Malicious Automation (On-Device):
   - Malware injects UI events, rapidly tries PIN guesses (no lockout) until success, decrypts mnemonic and exfiltrates.
3. Overlay Phishing:
   - Fake PIN modal harvests user PIN; attacker reads stored ciphertext and decrypts offline.
4. Clock Manipulation:
   - User toggles system clock to bypass reveal wait; not direct exfiltration but reduces friction for local shoulder-surf attack.

## Prioritized Remediations

Short Term (1-2 sprints):
- Increase PIN complexity: allow 8-12 digits or passphrase; enforce minimum entropy.
- Introduce rate limiting & exponential backoff on PIN verification attempts.
- Remove static encryption salt; store per-record random salt with ciphertext (migrate existing entries lazily on decrypt).
- Remove custom integrity token; rely on AES-GCM authentication tag only.
- Reduce logging & strip in production.
- Shorten auto-hide timer (30s -> 10s) and provide manual re-reveal.

Medium Term (3-5 sprints):
- Add biometric + hardware keystore binding (wrap random DEK with hardware key; DEK encrypts mnemonic with GCM).
- Implement rotation journal + atomic re-encryption process.
- Obfuscate / encrypt key index; randomize storage key names.
- Add attempt counter with optional mnemonic wipe after severe thresholds (with user warnings).
- Clipboard management and screen security flags.

Long Term:
- Migrate crypto to native module (Rust/JSI) or platform Keychain for derivation; adopt Argon2id.
- Consider secret sharing (split mnemonic across secure store + derived ephemeral component) making one path insufficient for recovery.
- Explore enclave-backed passkeys or secure element for gating mnemonic decryption.

## Additional Code-Level Recommendations

| Issue | Location | Fix Summary |
|-------|----------|-------------|
| Static SALT | `util/crypto.ts` | Replace with per-entry random salt stored with ciphertext. |
| Integrity token | `util/crypto.ts` | Remove token & delimiter; rely on GCM failure. |
| No rate limit | `pin-security.ts`, `use-secure-storage.ts`, `use-transaction-pin.ts` | Add attempt counter & backoff before calling verify/decrypt. |
| Predictable keys | `util/secure-store.ts` and consumers | Derive obfuscated key names; encrypt index. |
| Logging | Multiple | Strip or guard logs; avoid logging errors with distinguishable semantics. |
| Weak PIN policy | `pin-security.ts` | Expand validation regex; add strength meter. |
| Auto-hide window | `use-secure-storage.ts` | Reduce constant & flush memory (overwrite strings). |
| Reveal scheduling trust | `util/reveal-controller.ts` | Document limitation; optionally sign schedules. |

## Migration Sketch for Per-Entry Salt

1. New ciphertext format (base64 of JSON): `{v:2,s:<b64salt>,n:<b64nonce>,c:<b64cipher>}`.
2. On decrypt: detect if legacy (binary with fixed salt). If legacy, decrypt using old path, then re-encrypt with new format & delete old.
3. Store version to permit future algorithm agility.

## Testing & Verification Additions

- Unit tests for brute force protection logic (lockout scenarios).
- Property test ensuring no two encrypt operations produce identical ciphertext for same mnemonic & PIN (nonce uniqueness).
- Timing test (rough) to ensure failures standardized (mock timers/logs).
- Migration test for legacy ciphertext -> new format.

## Residual Risks
Even with improvements, a fully compromised device (rooted with debugger) can usually extract mnemonics eventually. Defense in depth reduces exposure window and increases attack cost.

## Conclusion
Current implementation prevents trivial accidental exposure but is susceptible to decisive offline and automated online brute-force attacks due to low-entropy PIN and static salt. Addressing the highlighted high-severity issues (PIN entropy, per-record salt, rate limiting) will substantially raise the bar. Subsequent medium-term measures further harden against sophisticated adversaries.

---
Prepared by: Automated Audit (GitHub Copilot)
