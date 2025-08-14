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

## Prioritized Remediations (Updated Strategy)

### Phase 1: Immediate Security (1-2 sprints)
**Priority: Critical - Address High Severity Vulnerabilities**
- **Implement Argon2id**: Replace PBKDF2 with memory-hard function (native module)
  - Target: 2 iterations, 64MB memory, ~100ms computation time
  - Provides 100,000x brute force cost increase
- **Per-record salt migration**: Store random salt with each ciphertext (lazy migration)
- **Rate limiting implementation**: Exponential backoff on PIN verification attempts
- **Remove static integrity token**: Rely solely on AES-GCM authentication tag
- **PIN complexity increase**: Allow 8-12 digits or alphanumeric passphrases
- **Production logging controls**: Strip debug logs and reduce error verbosity

### Phase 2: Hardware Integration (3-5 sprints)  
**Priority: High - Device Binding and Biometric Security**
- **Hardware keystore binding**: Wrap encryption keys with device-backed keys
  - iOS: Secure Enclave integration via expo-local-authentication
  - Android: Android Keystore with StrongBox when available
- **Biometric authentication gates**: Require biometrics for sensitive operations
- **Device master key**: Generate and protect per-installation root key
- **Attempt counter with hardware backing**: Store failure counts in secure keystore
- **Atomic key rotation**: Implement transaction-based re-encryption with rollback
- **Key name obfuscation**: Encrypt storage key index and randomize names

### Phase 3: Advanced Security (Long-term)
**Priority: Medium - Full TEE Integration and Advanced Features**
- **Native cryptographic module**: Rust/JSI implementation for sensitive operations
- **Platform TEE integration**: iOS Secure Enclave / Android TEE APIs
- **Operation attestation**: Hardware-backed verification of critical operations
- **Secret sharing**: Split mnemonic across secure store + ephemeral components
- **Screen security**: Android FLAG_SECURE and iOS secure window protections
- **Clipboard management**: Controlled copy with automatic scrubbing

### Implementation Priorities by Risk Level

#### Critical (Security Impact: Complete Compromise)
1. **Argon2 Implementation** - Prevents GPU-accelerated brute force
2. **Per-Record Salt** - Eliminates rainbow table attacks
3. **Rate Limiting** - Stops online automated attacks

#### High (Security Impact: Significantly Easier Attacks)  
4. **Hardware Key Wrapping** - Prevents offline device attacks
5. **PIN Complexity** - Increases brute force search space
6. **Biometric Integration** - Adds authentication layer

#### Medium (Security Impact: Reduces Attack Cost)
7. **Key Name Obfuscation** - Prevents storage enumeration
8. **Attempt Counters** - Limits brute force attempts
9. **Atomic Rotation** - Prevents partial state attacks

#### Low (Security Impact: Defense in Depth)
10. **Screen Protection** - Prevents screenshot/shoulder surfing
11. **Clipboard Management** - Reduces accidental exposure
12. **Enhanced Logging Controls** - Limits information leakage

## Additional Code-Level Recommendations

| Issue | Location | Fix Summary | Implementation Priority |
|-------|----------|-------------|------------------------|
| Weak key derivation | `util/crypto.ts` | Replace PBKDF2 with Argon2id native module; 2 iter, 64MB memory | **Critical - Phase 1** |
| Static SALT | `util/crypto.ts` | Replace with per-entry random salt stored with ciphertext | **Critical - Phase 1** |
| Integrity token | `util/crypto.ts` | Remove token & delimiter; rely on GCM failure | **Critical - Phase 1** |
| No rate limit | `pin-security.ts`, `use-secure-storage.ts`, `use-transaction-pin.ts` | Add attempt counter & backoff before calling verify/decrypt | **Critical - Phase 1** |
| Hardware binding | New: `util/hardware-security.ts` | Wrap DEK with device keystore; biometric authentication | **High - Phase 2** |
| Predictable keys | `util/secure-store.ts` and consumers | Derive obfuscated key names; encrypt index | **High - Phase 2** |
| Weak PIN policy | `pin-security.ts` | Expand validation regex; add strength meter; allow passphrases | **High - Phase 1** |
| Logging | Multiple | Strip or guard logs; avoid logging errors with distinguishable semantics | **Medium - Phase 1** |
| Auto-hide window | `use-secure-storage.ts` | Reduce constant & flush memory (overwrite strings) | **Medium - Phase 1** |
| Reveal scheduling trust | `util/reveal-controller.ts` | Document limitation; optionally sign schedules with hardware key | **Low - Phase 3** |

## Migration Sketch for Enhanced Security

### Per-Entry Salt + Argon2 Migration
1. **New ciphertext format** (base64 of JSON): 
   ```json
   {
     "v": 3,
     "alg": "argon2id", 
     "s": "<b64salt>",
     "n": "<b64nonce>", 
     "c": "<b64cipher>",
     "p": {"t":2, "m":65536, "p":1}
   }
   ```
2. **Backward compatibility**: Detect legacy formats (v1: binary, v2: JSON with PBKDF2)
3. **Lazy migration**: On decrypt, if legacy format detected:
   - Decrypt using old algorithm
   - Re-encrypt with Argon2 + new format  
   - Delete old entry atomically
4. **Argon2 native module**: Implement via JSI for performance and security
5. **Configuration validation**: Ensure parameters meet security requirements per device capability

### Hardware Keystore Integration  
1. **Device master key generation**:
   ```typescript
   // One-time setup per app installation
   const deviceKey = await SecureStore.setItemAsync('device_master_key', 
     uint8ArrayToBase64(getRandomBytes(32)), {
       requireAuthentication: true,
       authenticationPrompt: 'Set up wallet security'
     });
   ```
2. **Key wrapping workflow**:
   ```typescript
   // Wrap data encryption key with hardware key
   const dataKey = getRandomBytes(32);
   const wrappedKey = await aesGcmEncrypt(dataKey, deviceMasterKey);
   const encryptedData = await aesGcmEncrypt(mnemonic, dataKey);
   ```
3. **Biometric authentication integration**:
   ```typescript
   // Require biometrics for sensitive operations
   const authResult = await LocalAuthentication.authenticateAsync({
     promptMessage: 'Authenticate to access wallet',
     requireConfirmation: true,
     disableDeviceFallback: false
   });
   ```

### Progressive Enhancement Strategy
- **Phase 1**: All new encryptions use Argon2 + per-record salt
- **Phase 2**: Existing data migrated on first access
- **Phase 3**: Hardware wrapping applied to all encryption keys
- **Phase 4**: TEE operations for critical functions

## Testing & Verification Additions

### Cryptographic Function Tests
- **Argon2 implementation validation**: Verify memory usage, timing consistency, cross-platform compatibility
- **Hardware keystore integration**: Test biometric flows, device binding, fallback scenarios
- **Migration logic verification**: Test legacy format detection and conversion accuracy
- **Performance benchmarking**: Ensure Argon2 parameters meet usability requirements (<200ms)

### Security Property Tests  
- **Brute force protection**: Verify rate limiting lockout scenarios and exponential backoff
- **Nonce uniqueness validation**: Property test ensuring no two encrypt operations produce identical ciphertext for same input
- **Timing consistency verification**: Rough timing test to ensure failures are standardized (mock timers/logs)
- **Memory clearing validation**: Test that sensitive data cleanup occurs as expected
- **Hardware key protection**: Verify keys cannot be extracted without biometric authentication

### Attack Simulation Tests
- **Offline brute force simulation**: Measure actual attack cost with new Argon2 parameters
- **Device binding validation**: Verify encrypted data cannot be used on different devices
- **PIN attempt exhaustion**: Test lockout behavior and recovery mechanisms
- **Migration safety**: Ensure no data loss during algorithm transitions
- **Biometric bypass attempts**: Test fallback scenarios and security boundaries

### Platform-Specific Tests
- **iOS Secure Enclave integration**: Verify key generation and protection in hardware
- **Android Keystore validation**: Test StrongBox availability and fallback behavior  
- **Cross-platform compatibility**: Ensure data encrypted on one platform can be decrypted on another
- **Device capability detection**: Test graceful degradation on older hardware

## Residual Risks
Even with improvements, a fully compromised device (rooted with debugger) can usually extract mnemonics eventually. Defense in depth reduces exposure window and increases attack cost.

## Strategic Security Analysis: TEE vs Argon2

### Executive Recommendation
**Implement a hybrid approach prioritizing Argon2 with incremental TEE adoption.** This strategy addresses immediate high-severity vulnerabilities while establishing a path toward hardware-backed security.

### Current Context Assessment
- **Platform**: Expo/React Native with limited direct TEE access
- **Dependencies**: `expo-local-authentication` (biometrics), `expo-secure-store` (hardware keychain)
- **Critical Vulnerability**: PBKDF2(10k) allows sub-second brute force of 6-digit PINs
- **Attack Surface**: Offline attacks via device compromise or backup extraction

### Why Argon2 First?

#### Immediate Security Impact
- **GPU Resistance**: Memory-hard function prevents efficient GPU acceleration
- **Configurable Security**: Tunable time/memory costs for future-proofing
- **Cross-Platform**: Native module implementation maintains compatibility
- **Proven Standard**: OWASP recommended for password hashing

#### Implementation Timeline
```
Phase 1 (1-2 sprints): Argon2id implementation
Phase 2 (3-5 sprints): Hardware keystore integration  
Phase 3 (Long-term): Full TEE migration
```

### Recommended Argon2 Configuration
```typescript
// Target: ~100ms computation time on target devices
const argon2Config = {
  variant: 'argon2id',    // Hybrid mode (best security)
  timeCost: 2,           // iterations
  memoryCost: 65536,     // 64MB memory usage
  parallelism: 1,        // single thread
  hashLength: 32,        // 256-bit output
  saltLength: 16         // 128-bit salt
};
```

### TEE Integration Strategy

#### Immediate Hardware Utilization
- **Device Binding**: Use hardware keystore to wrap encryption keys
- **Biometric Gating**: Leverage existing `expo-local-authentication`
- **Secure Element**: iOS Secure Enclave / Android Keystore for key operations

#### Incremental TEE Adoption
1. **Key Wrapping**: Hardware-derived Device Encryption Key (DEK)
2. **Integrity Verification**: TEE-backed operation attestation
3. **Full Migration**: Move sensitive operations as platform support matures

### Migration Implementation

#### Phase 1: Argon2 Replacement
```typescript
// Replace current PBKDF2 implementation
async function deriveKeyWithArgon2(
  pin: string, 
  salt: Uint8Array
): Promise<Uint8Array> {
  return await argon2id({
    password: stringToUint8Array(pin),
    salt: salt,
    timeCost: 2,
    memoryCost: 65536,
    parallelism: 1,
    hashLength: 32
  });
}
```

#### Phase 2: Hardware Key Wrapping
```typescript
// Wrap data encryption keys with hardware-backed key
async function wrapWithHardwareKey(dataKey: Uint8Array): Promise<Uint8Array> {
  const hwKey = await SecureStore.getItemAsync('device_master_key', {
    requireAuthentication: true,  // Biometric requirement
    authenticationPrompt: 'Authenticate to access wallet'
  });
  return await aesGcmEncrypt(dataKey, base64ToUint8Array(hwKey));
}
```

#### Phase 3: TEE Operations
```typescript
// Platform-specific TEE integration
async function teeVerifyOperation(operation: string): Promise<boolean> {
  if (Platform.OS === 'ios') {
    return await SecureEnclave.verify(operation);
  } else {
    return await AndroidKeystore.verify(operation);
  }
}
```

### Security Impact Analysis

#### Current Risk (PBKDF2)
- **Brute Force Time**: <1 second for 1M PINs with GPU
- **Attack Vector**: Offline via device/backup compromise
- **Success Rate**: 100% given ciphertext + PIN hash

#### Post-Argon2 Risk
- **Brute Force Time**: ~27 hours for 1M PINs (single GPU)
- **Memory Requirement**: 64MB per attempt (limits parallelization)
- **Cost Multiplier**: ~100,000x increase in attack cost

#### Hardware-Backed (Phase 2+)
- **Device Binding**: Offline attacks become infeasible
- **Biometric Fallback**: Additional authentication layer
- **Secure Element**: Hardware-protected key operations

### Platform-Specific Considerations

#### iOS Implementation
- **Secure Enclave**: Hardware-backed key generation/storage
- **Keychain Services**: Biometric-protected item access
- **LocalAuthentication**: Face ID/Touch ID integration

#### Android Implementation  
- **Android Keystore**: Hardware-backed key operations
- **BiometricPrompt**: Fingerprint/face authentication
- **StrongBox**: Hardware security module (newer devices)

### Risk Mitigation Timeline

#### Immediate (Argon2)
- ✅ GPU brute force resistance
- ✅ Memory-hard function protection
- ✅ Configurable security parameters
- ✅ Cross-platform compatibility

#### Medium-term (Hardware Integration)
- ✅ Device binding prevents offline attacks
- ✅ Biometric authentication requirements
- ✅ Hardware-protected key operations
- ✅ Secure element utilization

#### Long-term (Full TEE)
- ✅ Complete hardware isolation
- ✅ Attestation-backed operations
- ✅ Side-channel attack resistance
- ✅ Regulatory compliance alignment

### Development Resource Allocation

#### Argon2 Implementation (40% effort)
- Native module integration
- Configuration optimization
- Migration logic for existing data
- Cross-platform testing

#### Hardware Integration (35% effort)
- Keystore API integration
- Biometric authentication flows
- Device capability detection
- Error handling and fallbacks

#### TEE Migration (25% effort)
- Platform-specific TEE APIs
- Operation attestation
- Secure communication channels
- Future-proofing architecture

### Conclusion
Current implementation prevents trivial accidental exposure but is susceptible to decisive offline and automated online brute-force attacks due to low-entropy PIN and static salt. The recommended hybrid approach (Argon2 → Hardware Integration → TEE) provides an optimal balance of immediate security improvement, development feasibility, and long-term strategic positioning. Addressing the highlighted high-severity issues through Argon2 implementation will substantially raise the attack cost by orders of magnitude while establishing a foundation for hardware-backed security evolution.

---
Prepared by: Automated Audit (GitHub Copilot)
Updated: 2025-08-14 with TEE vs Argon2 Strategic Analysis
