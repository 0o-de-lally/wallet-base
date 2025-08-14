# Mnemonic Security Audit

Date: 2025-08-14
Branch: refector-security-phase-one
Scope: Review of repository code paths that could lead to exposure or exfiltration of a user's mnemonic ("recovery phrase") or enable a sophisticated attack to extract it.

## Executive Summary
Current mnemonic protection uses: (1) PIN-derived Scrypt key (N=32768,r=8,p=1, dkLen=32) → AES-GCM (random salt+nonce per encryption) executed in JS; (2) Expo SecureStore for ciphertext persistence; (3) Time‑delayed reveal workflow plus rate limiting (PIN attempts) and key-name obfuscation (device-salted SHA-256). Overall design is sound for a mobile wallet MVP, but several gaps reduce resistance against determined attackers with device or runtime access. Key issues: incomplete storage key obfuscation coverage (legacy direct `account_${id}` usage persists in `hooks/use-transaction-pin.ts` line 20), absence of ciphertext versioning/migration path, reliance on JS memory for derived keys without zeroization, potential enumeration of key mappings, lack of PIN strength enforcement beyond 6 digits (line 381 in `util/pin-security.ts`), missing confirmation of robust persistent rate limiting, and inconsistent use of obfuscated keys. No critical cryptographic flaws found in Scrypt/AES-GCM usage itself.

Risk rating legend: High – practical path to mnemonic compromise with moderate attacker capability. Medium – increases likelihood given additional conditions. Low – theoretical or requires powerful attacker (e.g., runtime compromise) but still improvable.

## Findings
1. Inconsistent key obfuscation usage (High)
   - Code: `hooks/use-transaction-pin.ts` storage key function line 20 uses `account_${id}`; `use-secure-storage.ts` migrates to obfuscated keys.
   - Impact: Predictable key names allow enumeration of encrypted mnemonics when other paths rely on obfuscation. Bypasses migration logic.
   - Recommendation: Replace with `getAccountStorageKey` + migration similar to `useSecureStorage`.

2. Missing ciphertext versioning and metadata (Medium)
   - Code: `util/pin-security.ts` encrypt/decrypt functions lines 89–118 and 133–171 prepend only salt+nonce.
   - Impact: Future cryptographic parameter evolution (e.g., stronger Scrypt, different AEAD) lacks discriminator; complicates safe migration.
   - Recommendation: Add 1-byte version header (v1) before salt; embed parameters or parameter ID; update decrypt to detect legacy layout (length heuristic) and migrate.

3. Scrypt parameters moderate for 6-digit PIN (Low/Medium)
   - Code: `SCRYPT_CONFIG` lines ~52–59 (`N: 32768`).
   - Impact: Offline brute forcing still feasible for small keyspace (1e6) with optimized hardware; cost per guess reduced by low PIN entropy.
   - Recommendation: Optionally raise N (e.g., 65536/131072) after performance benchmarking; or adopt additional secret (Pepper or device factor) or stronger user PIN mode.

4. Fixed 6-digit numeric PIN requirement (Medium)
   - Code: `validatePinFormat` line 381 enforces `/^\d{6}$/`.
   - Impact: ~20 bits of entropy maximum; insufficient against offline attacks if ciphertext & salt exfiltrated.
   - Recommendation: Provide advanced mode permitting longer numeric or alphanumeric passphrases (e.g., 8–12+ chars) and reflect in Scrypt cost.

5. Legacy key mapping information leakage (Low)
   - Code: `key-obfuscation.ts` mapping storage (function `storeLegacyKeyMapping`) lines ~69–80; stored in plain form `key_mapping_<original>`.
   - Impact: Reveals which original keys existed; aids correlation of obfuscated keys with account IDs.
   - Recommendation: Encrypt or hash mapping entries or gate behind dev flag only.

6. Device salt discoverability (Low)
   - Code: `DEVICE_SALT_KEY = "device_salt_2025"` line 14 in `key-obfuscation.ts`.
   - Impact: If attacker extracts SecureStore, salt trivially found; obfuscation only thwarts casual enumeration.
   - Recommendation: Rename to less obvious pattern; treat obfuscation realistically in threat model docs.

7. No key material zeroization (Low)
   - Code: Derived key arrays (`keyBytes`) in `encryptWithPin` line 100 and `decryptWithPin` lines 155+ not overwritten post-use.
   - Impact: Extended lifespan in JS heap; slight forensic risk.
   - Recommendation: After encryption/decryption, call `keyBytes.fill(0)` inside try/finally.

8. Logging of migration events (Low)
   - Code: `use-secure-storage.ts` line 72 logs migrations; `key-obfuscation.ts` logs failures and migrations.
   - Impact: In production logs (if not stripped) may aid correlation; potential information disclosure.
   - Recommendation: Gate with dev flag or remove in production build pipeline.

9. Rate limiting implementation not yet verified (Needs Review)
   - Code: Referenced but not audited file `util/pin-rate-limiting.ts` (not opened in this report).
   - Impact: If limits not persistent/tamper-resistant, brute force feasible on-device.
   - Recommendation: Review that file: ensure exponential backoff, persistent counters & timestamps, lockout across restarts, jitter to resist timing automation.

10. No authenticated associated data (AAD) binding metadata (Low)
    - Code: Current AES-GCM usage lines 104–112 & decrypt lines 148–165 lacks AAD usage.
    - Impact: Cannot bind context (e.g., data type, version) to ciphertext aside from embedding inside encrypted payload.
    - Recommendation: When adding version header, also include header bytes as AAD for AEAD authenticity.

## Attack Scenarios
- Offline brute force: Extract salt+nonce+ciphertext; iterate 1e6 PINs with Scrypt(N=32768) until AES-GCM auth passes.
- Legacy key enumeration: Query predictable `account_<id>` keys for accounts not yet migrated or exposed by `use-transaction-pin.ts`.
- Migration ambiguity: Future param change without versioning yields decryption errors or silent misuse; user forced to downgrade security for compatibility.
- Scheduled reveal abuse: Malicious automation waits for reveal availability window, captures decrypted mnemonic via injected instrumentation.
- Memory scraping: Debugger attaches post-decryption to read plaintext mnemonic from JS heap.

## Prioritized Remediations
1. (High) Unify key obfuscation in all code paths; migrate legacy keys on access.
2. (Medium) Introduce ciphertext version header + AAD; implement legacy auto-migration.
3. (Medium) Offer stronger PIN/passphrase option; document trade-offs and update UI.
4. (Medium) Validate and harden rate limiting (pending review of `pin-rate-limiting.ts`).
5. (Low) Optionally increase Scrypt cost or add pepper/device binding.
6. (Low) Secure zeroization of derived key arrays.
7. (Low) Harden key mapping & salt storage naming or encryption.
8. (Low) Production log stripping & sensitive log gating.

## Additional Code-Level Recommendations
- Add `CIPHERTEXT_VERSION = 1` constant; format: `[0x01][salt16][nonce12][ciphertext...]`.
- Detect legacy by total length mod 16 pattern: if length >= 28 and first byte not recognized version but fits old size, treat as v0.
- Add AEAD AAD: `[0x01]` + dataType string bytes.
- Create `secureZero(arr: Uint8Array)` utility; call in finally blocks.
- Replace hardcoded `account_${id}` usage in `use-transaction-pin.ts` with `getAccountStorageKey` and add migration similar to `use-secure-storage.ts`.
- Introduce optional advanced PIN mode: regex allow `[0-9A-Za-z]{8,12}` or passphrase; store metadata flag.

## Migration Notes
- Lazy re-encryption on successful decrypt of legacy format; write back versioned ciphertext.
- Include param set (N,r,p) in header or store separate param ID; maintain backward compatibility.
- Key obfuscation migration already in `use-secure-storage`; replicate for transaction PIN flow.
- Document that existing 6-digit PINs remain valid; recommend upgrade path via settings.

## Testing Recommendations
- Unit tests for versioned encrypt/decrypt & legacy migration.
- Rate limiting tests (simulate multiple failures, restart persistence).
- PIN complexity enforcement tests.
- Obfuscation determinism tests (same inputs -> same key; diff salt -> diff key).
- Zeroization test ensures function runs without error.

## Residual Risks
- Device/root compromise can still exfiltrate mnemonic at runtime.
- User-chosen weak PINs if advanced mode not adopted.
- Obfuscation offers limited protection once SecureStore accessible.
- JS memory management limits full secret eradication.

## Conclusion
Design implements solid baseline (per-record salt, AES-GCM, Scrypt KDF, reveal delay, key obfuscation). Main immediate risk is inconsistent obfuscation usage enabling simpler ciphertext enumeration. Implement versioning and unify key handling next, then expand PIN strength options and review rate limiting. Residual risks are consistent with typical mobile wallet constraints; outlined remediation roadmap will materially raise attack cost.
