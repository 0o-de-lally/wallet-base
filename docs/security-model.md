# Security Model

Date: 2025-08-14
Status: Draft (living document – update when implementation or assumptions change)
Scope: iOS + Android (Expo / React Native) wallet application storing per-account encrypted mnemonic phrases.

## 1. Assets (Confidentiality Priority)
| Asset | Description | Classification |
|-------|-------------|----------------|
| Mnemonic (per account) | 12/24-word recovery phrase enabling full wallet control | Critical / Secret |
| Private keys / derived keys | In-memory / transient derivations from mnemonic | Critical |
| PIN | 6-digit user PIN (will evolve to higher-entropy passphrase) | Sensitive |
| Scrypt Parameters & Salt | Non-secret but required for brute force speed | Sensitive (integrity) |
| Encrypted ciphertext blobs | AES-GCM output (salt+nonce+cipher) | Sensitive |
| Rate limiting metadata | Attempt counters / lockout state | Sensitive (oracle hardening) |
| Obfuscated storage keys | Account mapping (prevents enumeration) | Sensitive |
| Profiles / account metadata | Non-cryptographic user info | Internal |

## 2. Trust & Environmental Assumptions
(Anything that becomes false may invalidate security guarantees.)

### 2.1 Platform Baseline
- Device OS (iOS / Android) is up-to-date and not broadly compromised at kernel level.
- App is installed from official store; binary not tampered (supply-chain not compromised).
- Device secure boot & sandboxing enforce per-app data isolation (no other normal app can read SecureStore items).
- Hardware-backed key storage is available & functioning (Keychain on iOS, Keystore on Android) though current implementation uses SecureStore *as a protected storage*, not full hardware key wrapping of mnemonic encryption keys yet.

### 2.2 User Behavior
- User does not jailbreak / root the device (unless stated otherwise in threat scenarios).
- User sets a device passcode / biometric lock.
- User does not install untrusted accessibility / screen recording malware intentionally.

### 2.3 Cryptographic Primitives
- @noble/* libraries are uncompromised and used correctly (Scrypt + AES-GCM).
- CSPRNG (react-native-get-random-values) uses platform entropy (no seeded downgrade).

### 2.4 Data at Rest
- SecureStore protects confidentiality against *non-privileged* adversaries (co-resident apps, casual filesystem browsing, cloud backups without device compromise).
- Offline extraction of SecureStore values *requires* privileged escalation (root, jailbreak, forensic extraction, or live instrumentation with attached debugger / Frida / similar).
- Backup behavior (explicit):
	- iOS: Expo SecureStore stores values in the iOS Keychain. Keychain items are included in encrypted device backups (iTunes/Finder or iCloud) when the backup itself is encrypted; unencrypted backups exclude many keychain classes. Recovery of items from backups still requires possession of the backup encryption password (for iTunes) or the user's iCloud authentication plus device passcode factors. We treat access to an encrypted backup as a privileged compromise equivalent.
	- Android: SecureStore (backed by EncryptedSharedPreferences / Keystore) is not exported in standard ADB backup flows on modern Android (adb backup is deprecated) and requires root / physical forensic extraction or OEM-specific backup with user authentication. We assume a normal Google account cloud backup does not yield raw keystore-protected secrets to an attacker without device compromise.
	- Conclusion: Routine user-generated backups do not grant an attacker plaintext or ciphertext secrets unless the attacker already satisfies privileged compromise conditions (backup password, cloud account takeover + device unlock, or root).

### 2.5 Networking
- (If applicable) No transmission of plaintext mnemonic over network; currently all mnemonic handling is local.

### 2.6 SecureStore Dump Feasibility (Explicit)
This clarifies under what circumstances an attacker can obtain the encrypted mnemonic blobs and PIN hash from Expo SecureStore (Keychain / Keystore abstraction):

| Scenario | Platform | Preconditions / Attacker Capability | Data Obtainable | Notes / Mitigations |
|----------|----------|--------------------------------------|-----------------|---------------------|
| Normal sandboxed malicious app | iOS & Android | None beyond standard app install | None (cannot enumerate or read another app's SecureStore) | Platform process & keychain / keystore isolation blocks access |
| Encrypted iOS backup acquisition | iOS | Access to encrypted iTunes/Finder backup file AND backup password (or iCloud account + MFA) | Keychain items (including stored ciphertext & PIN hash) | Treat possession of decrypted backup as privileged compromise; encourage encrypted backups |
| Unencrypted iOS backup | iOS | User created unencrypted local backup | Limited keychain classes; often excludes items needing device passcode | Still assume partial leakage risk; users should prefer encrypted backups |
| Jailbreak / root filesystem access | iOS (jailbreak) | Kernel / root privileges | Full keychain database + app container | Strengthen PIN, hardware key wrapping, detect jailbreak (optional) |
| Android root / custom recovery / physical forensic imaging | Android | Rooted device / unlocked bootloader / physical forensic toolkit | EncryptedSharedPreferences file + keystore blobs (yielding ciphertext & PIN hash) | Hardware-backed keystore may protect raw keys; ciphertext still exposed |
| Live runtime instrumentation (Frida / debugger attach) | Both | Physical access + user device unlock & dev mode (or root/jailbreak) | Plaintext mnemonic at decryption moment; ciphertext & PIN hash trivially observable | Mitigate via native crypto, ephemeral buffers, debugger detection (optional) |
| Cloud account compromise alone (no device) | Both | iCloud / Google account creds but no device unlock factors | Insufficient for raw secret extraction | Still risk of social engineering & push to device; defense: MFA |
| Supply-chain injected code | Both | Build / signing pipeline compromise | Arbitrary (plaintext exfiltration) | Harden CI, code signing integrity, reproducible builds |

What is NOT possible in the standard threat model:
- A random third-party app cannot dump another app's SecureStore contents.
- Remote network adversary cannot fetch ciphertext directly without prior device compromise.
- Possessing an encrypted iOS backup without the backup password does not yield SecureStore / Keychain secrets.

Mitigation alignment:
- Increase user secret entropy (stronger PIN / passphrase) to raise cost after privileged dump.
- Hardware master key wrapping to bind ciphertext to device-kept key material.
- Obfuscate metadata keys to reduce targeted tampering after partial dump.
- Shorten mnemonic in-memory residency to limit value of runtime instrumentation.
- Optionally detect debugger / jailbreak / root to warn or restrict sensitive operations.

## 3. Adversary Classes & Capabilities
| Class | Capability Summary | Examples |
|-------|--------------------|----------|
| Casual App Malware | No root/jailbreak; can request permissions (overlay, accessibility, clipboard) | Ad SDK spyware, trojan app |
| Privileged Local Attacker | Root/jailbreak or physical forensic tool access; can dump SecureStore, memory, process | Stolen unlocked rooted phone |
| Remote Network Attacker | Cannot access device storage directly, may phish user | Phishing site, MITM |
| Supply Chain Attacker | Injects malicious code into distributed build | CI compromise |
| On-Device Instrumentation Attacker | User or attacker attaches debugger/Frida to running process | Reverse engineer |

## 4. Threats Out of Scope (Explicit)
- Hardware side-channel (power analysis) on commodity mobile devices.
- Nation-state baseband / firmware implants.
- Users ignoring all security prompts and installing obviously malicious tweaks post-jailbreak.

## 5. Storage & Data Flow Overview
```
Mnemonic (plaintext, transient) --> Scrypt(pin, randomSalt) --> 256-bit key
Key + randomNonce --> AES-GCM --> ciphertextBlob = salt || nonce || cipher
ciphertextBlob stored in SecureStore under obfuscated key (post-migration)
PIN hash (Scrypt again w/ separate salt) stored as JSON (key to be obfuscated in future)
```

## 6. Current Defensive Controls
| Control | Purpose | Status |
|---------|---------|--------|
| Scrypt (N=32768,r=8,p=1) | Memory-hard KDF for PIN -> key derivation | Implemented |
| Per-record salt (16B) | Prevent cross-user precomputation | Implemented |
| AES-256-GCM | Authenticated encryption | Implemented |
| Random nonce (12B) | Uniqueness for GCM | Implemented |
| Key obfuscation for account secrets | Reduce key enumeration | Partially deployed (migration in progress) |
| Rate limiting / exponential backoff | Throttle online PIN guessing | Baseline implemented |
| Constant-time compare | Reduce timing oracle | Implemented |
| Integrity token removal | Eliminate static oracle | Implemented |
| PIN format validation | Input sanity | Weak (6 digits) |
| Logging review | Prevent sensitive leakage | Partial (dev logs remain) |

## 7. Platform Attack Surface Details

### 7.1 iOS
| Vector | Precondition | Potential Result | Mitigations |
|--------|-------------|------------------|-------------|
| Keychain / SecureStore extraction via jailbreak | Jailbreak + user device access | Obtain ciphertext + PIN hash | Strengthen PIN, hardware wrapping (future) |
| Unencrypted iTunes / Finder backup parsing | User creates unencrypted backup + local attacker | Possible recovery of some keychain classes (depends on protection class) | Encourage encrypted backups; hardware binding (future) |
| Runtime instrumentation (Frida) | Developer mode + physical access | Hook decryption, grab plaintext mnemonic in memory | Plan: move crypto to native / ephemeral buffers |
| Screen capture / recording | User grants screen recording or malware exploit | Mnemonic visually exfiltrated | Shorter display window, screen security flags (future) |
| Clipboard leakage | User copies mnemonic | Other app reads clipboard | Add controlled copy + timed scrub |
| Over-the-shoulder / app switcher snapshot | User opens multitask view | Phrase visible in snapshot | Use blur / secure view flags |

### 7.2 Android
| Vector | Precondition | Potential Result | Mitigations |
|--------|-------------|------------------|-------------|
| Keystore / SecureStore extraction | Root / custom recovery | Ciphertext + PIN hash exfil | Stronger PIN, hardware wrapping (StrongBox) |
| adb backup / debug build leakage | USB debugging enabled + unlocked device | Process memory inspection | Ship release builds; detect debuggers (optional) |
| Accessibility overlay phishing | Malicious accessibility service | Capture PIN entry | PIN complexity, biometric gating, UI hardening |
| Screen overlay (SYSTEM_ALERT_WINDOW) | Malicious app permission | Fake PIN modal harvests PIN | Use FLAG_SECURE + focus heuristics |
| Clipboard / global pasteboard | User copies mnemonic | Background app reads clipboard | Timed scrub, discourage copy |
| Frida / hooking | Root or user-enabled debugging | Extract mnemonic in memory | Native crypto + ephemeral buffers |

## 8. Mnemonic Recovery Paths (Enumerated)
| Path # | Description | Required Attacker Capability | Current Difficulty | Notes |
|--------|-------------|------------------------------|--------------------|-------|
| 1 | Brute force 6-digit PIN offline after SecureStore dump | Privileged (root/jailbreak/forensic) | Moderate (1e6 Scrypt ops) | Conditional on privileged compromise |
| 2 | Runtime instrumentation to intercept decrypted mnemonic post-PIN | On-device instrumentation / debugger attach | Moderate | Window: immediately after successful decrypt |
| 3 | UI phishing overlay to capture PIN then decrypt (online) | Malicious app + overlay permission | Moderate | Rate limiting slows brute force only, not single capture |
| 4 | Screen recording / screenshot of reveal screen | Malware or user negligence | Low | Reduced by shorter display & FLAG_SECURE (future) |
| 5 | Clipboard capture after copy | Co-resident app reading clipboard | Low | Add controlled copy + wipe |
| 6 | Supply-chain injected malicious code exfiltrates plaintext | Build system compromise | High impact / Low likelihood | Requires CI/human signing compromise |
| 7 | Social engineering user to export or manually reveal & send | Human-level attack | Variable | Out of purely technical control |
| 8 | Memory dump (process) shortly after decryption | Privileged or instrumentation | Moderate | Reduce dwell time of plaintext in JS memory |
| 9 | Log scraping if mnemonic ever logged (bug/regression) | Any log collector | Low (currently not logged) | Maintain log hygiene & static analysis |

## 9. Residual Risks (Current State)
| Risk | Explanation | Planned Mitigation |
|------|------------|--------------------|
| Low-entropy PIN | 1e6 search space | Increase length/allow passphrases + optional biometrics |
| No hardware key wrapping | Ciphertext usable if PIN brute forced | Introduce device master key & wrap DEK |
| PIN hash & rate limit metadata predictable keys | Targeted tampering enumeration | Obfuscate / unify metadata storage |
| Plaintext mnemonic lifetime in memory | Interception window | Ephemeral buffer + immediate zeroization attempt |
| Overlay / accessibility phishing | PIN capture | Biometric gating + UI detection + user education |
| Clipboard leakage | Copy/paste exfiltration | Controlled copy + timeout clear |
| Lack of ciphertext versioning | Harder future migrations | Add version byte + lazy migration |

## 10. Planned Enhancements (Roadmap Alignment)
| Enhancement | Security Benefit | Priority |
|------------|------------------|----------|
| Ciphertext version header | Future-proof migrations, rollback detection | High |
| PIN policy upgrade + passphrase option | Exponential brute force cost increase | High |
| Hardware-backed master key (iOS Keychain / Android StrongBox) | Device binding; offline brute force denial | High |
| Metadata key obfuscation | Reduce enumeration, targeted tampering | High |
| Biometric gating for reveal | Blocks passive PIN disclosure attacks | High |
| Logging gating / stripping | Limit info leakage | Medium |
| Clipboard scrub implementation | Reduce unbounded exposure | Medium |
| FLAG_SECURE / snapshot blur | Mitigate visual side-channel | Medium |
| Native crypto module (JSI/Rust) | Reduce hook surface; better zeroization | Medium |
| Ephemeral mnemonic fetch & explicit reveal session | Minimize memory dwell time | Medium |
| Attempt uniform failure responses | Oracle reduction | Medium |

## 11. Assumption Validation Checklist
| Assumption | Validation Method | Review Interval |
|-----------|------------------|-----------------|
| SecureStore inaccessible to non-privileged apps | Attempt cross-app read in test harness | Quarterly |
| Scrypt parameters remain performant (<200ms) | Performance benchmark CI job | Release cycle |
| No mnemonics in logs | Static + runtime log scan | Each release |
| Obfuscation migration coverage complete | Automated test enumerating legacy keys | Until legacy keys <1% |
| Rate limiting effective (lockout) | Unit + instrumentation tests | Each release |

## 12. Summary
Under default (non-rooted, non-jailbroken) conditions, direct offline brute force requires an escalation the model treats as *privileged compromise*. Current controls focus on raising cost post-compromise (Scrypt, per-record salt) and reducing casual data leakage. Primary near-term improvement remains increasing user secret entropy (stronger PIN/passphrase) and binding encrypted material to device hardware to deny usefulness of exfiltrated ciphertext.

---
Maintainer: Security Automation (GitHub Copilot)
