# Cryptographic Specification

**Document Version**: 1.0  
**Date**: 2025-08-14  
**Status**: Design Specification  
**Target Implementation**: Release 1.1+

## Overview

This document defines the cryptographic standards, operations, and implementation requirements for protecting sensitive data in the Carpe Mobile Wallet. The specification establishes a comprehensive security architecture utilizing industry best practices for mobile cryptocurrency wallet protection.

## Executive Summary

### Target Architecture
- **Key Derivation**: Scrypt with memory-hard parameters (via @noble/hashes)
- **Encryption**: AES-256-GCM for authenticated encryption
- **Storage**: Hardware-backed TEE integration with device binding
- **Authentication**: Multi-layer security (Device biometric → PIN → Hardware attestation)
- **Access Control**: Mandatory device biometric authentication for application access

## Cryptographic Standards

### Primary Algorithms

#### Key Derivation Function (KDF)
**Algorithm**: Scrypt  
**Standard**: RFC 7914  
**Library**: `@noble/hashes/scrypt`  
**Justification**: Memory-hard function resistant to GPU/ASIC attacks, with excellent JavaScript implementation in @noble/hashes

**Parameters**:
```typescript
const SCRYPT_CONFIG = {
  N: 32768,                // Cost parameter (CPU/memory cost)
  r: 8,                    // Block size parameter  
  p: 1,                    // Parallelization parameter
  dkLen: 32,               // Derived key length (256 bits for AES-256)
  maxmem: 64 * 1024 * 1024 // 64MB memory limit
};
```

**Security Target**: ~100ms computation time on target devices  
**Memory Usage**: ~32MB per derivation (N * r * 128 bytes)

#### Symmetric Encryption
**Algorithm**: AES-256-GCM  
**Standard**: NIST FIPS 197, SP 800-38D  
**Library**: `@noble/ciphers`  
**Justification**: Authenticated encryption, hardware acceleration available

**Parameters**:
```typescript
const AES_CONFIG = {
  keyLength: 32,           // 256-bit key
  nonceLength: 12,         // 96-bit nonce (GCM standard)
  tagLength: 16            // 128-bit authentication tag
};
```

#### Random Number Generation
**Source**: Hardware RNG via OS  
**Library**: `react-native-get-random-values`  
**Backing**: iOS SecRandomCopyBytes, Android /dev/urandom  
**Entropy**: Cryptographically secure random number generator

### Complete Authentication Flow

The wallet implements a multi-layer authentication architecture:

```
Device Startup
    ↓
[Layer 0] Device Biometric Authentication (Face ID/Touch ID/Fingerprint)
    ↓ (SUCCESS)
Application Access Granted
    ↓
[Layer 1] PIN Entry for Wallet Operations
    ↓ (SUCCESS) 
[Layer 2] Scrypt Key Derivation
    ↓
[Layer 3] AES Decryption of Sensitive Data
    ↓
[Layer 4] Optional Hardware Attestation (Future)
    ↓
Wallet Operation Authorized
```

**Security Rationale**:
- **Layer 0**: Prevents unauthorized app access entirely
- **Layer 1**: Protects wallet-specific operations with user PIN
- **Layer 2**: Makes PIN brute force computationally expensive
- **Layer 3**: Ensures data confidentiality with strong encryption
- **Layer 4**: Verifies hardware integrity (planned enhancement)

### Cryptographic Primitives Relationship

```
Device Biometric (Required)
    ↓
Application Access
    ↓
PIN (User Input)
    ↓
Scrypt (Key Derivation)
    ↓
256-bit Encryption Key
    ↓
AES-256-GCM (Symmetric Encryption)
    ↓
Encrypted Mnemonic (Ciphertext)
```

## Security Architecture

### Layer 0: Application Access Control
**Purpose**: Prevent unauthorized access to the application itself

**Implementation**: Device biometric authentication required for app launch
```typescript
// App-level authentication gate (current implementation)
const result = await authenticateAsync({
  promptMessage: "Authenticate to access wallet",
  fallbackLabel: "Use device passcode",
  cancelLabel: "Cancel",
  disableDeviceFallback: false,
});

if (!result.success) {
  // App remains locked, no access to any wallet functions
  throw new Error("Device authentication required");
}
```

**Security Properties**:
- **Hardware-backed**: Uses device Secure Enclave/TEE for biometric verification
- **OS-level protection**: Leverages platform security infrastructure
- **Mandatory gate**: No wallet operations possible without device authentication
- **Fallback support**: Device passcode when biometrics unavailable

### Layer 1: Key Derivation Security
**Purpose**: Transform low-entropy user inputs into high-entropy cryptographic keys

**Implementation**:
```typescript
// Memory-hard, GPU-resistant key derivation using @noble/hashes
import { scrypt } from '@noble/hashes/scrypt';

const salt = getRandomBytes(16);  // Per-record random salt
const key = scrypt(pin, salt, {
  N: 32768,    // Cost parameter
  r: 8,        // Block size
  p: 1,        // Parallelization
  dkLen: 32    // Output length
});
```

**Security Properties**:
- **Memory-hard**: Requires ~32MB RAM per attempt (N * r * 128 bytes)
- **GPU-resistant**: Memory bandwidth limitations prevent efficient parallelization
- **Tunable**: Parameters adjustable for future threat landscape
- **JavaScript optimized**: @noble/hashes provides highly optimized implementation
- **Per-record salt**: Eliminates rainbow table attacks

### Layer 2: Data Encryption Security
**Purpose**: Provide confidentiality and integrity for sensitive data

**Implementation**:
```typescript
// Industry standard authenticated encryption
const nonce = getRandomBytes(12);
const cipher = gcm(derivedKey, nonce);
const ciphertext = cipher.encrypt(plaintextData);
```

**Security Properties**:
- **Authenticated encryption**: Prevents tampering
- **Unique nonces**: Each encryption operation uses fresh randomness
- **Fast operation**: Hardware-accelerated on modern devices
- **Proven security**: Extensively analyzed, NIST approved

### Layer 3: Hardware Security Integration
**Purpose**: Bind cryptographic operations to specific devices and provide additional authentication layers

**Device Master Key Implementation**:
```typescript
// Generate device-specific root key in TEE
const masterKey = getRandomBytes(32);
await SecureStore.setItemAsync('device_master_key', base64(masterKey), {
  requireAuthentication: true,
  authenticationPrompt: 'Initialize wallet security'
});

// Wrap data encryption keys
const dataKey = scrypt(pin, salt, SCRYPT_CONFIG);
const wrappedKey = await aesGcmEncrypt(dataKey, masterKey);
```

**Advanced TEE Operations** (Future):
```typescript
// Direct hardware operations (requires native module)
interface TeeOperations {
  encryptInTee(data: Uint8Array, keyId: string): Promise<Uint8Array>;
  deriveKeyInTee(password: Uint8Array, salt: Uint8Array): Promise<string>;
  signInTee(data: Uint8Array, keyId: string): Promise<Uint8Array>;
}
```

## Data Format Specifications

### Ciphertext Format
**Standard Format**:
```typescript
interface CiphertextFormat {
  version: 3;
  algorithm: 'scrypt+aes-256-gcm';
  kdf: {
    salt: string;          // Base64-encoded 16-byte salt
    N: number;             // Scrypt cost parameter
    r: number;             // Scrypt block size parameter
    p: number;             // Scrypt parallelization parameter
    dkLen: number;         // Derived key length
  };
  encryption: {
    nonce: string;         // Base64-encoded 12-byte nonce
    ciphertext: string;    // Base64-encoded encrypted data
    tag: string;           // Base64-encoded 16-byte auth tag
  };
  metadata: {
    timestamp: number;     // Creation timestamp
    deviceBinding?: string; // Optional device identifier
  };
}
```

**Storage Format Example**:
```json
{
  "version": 3,
  "algorithm": "scrypt+aes-256-gcm",
  "kdf": {
    "salt": "randomBase64Salt==",
    "N": 32768,
    "r": 8,
    "p": 1,
    "dkLen": 32
  },
  "encryption": {
    "nonce": "randomBase64Nonce==",
    "ciphertext": "encryptedDataBase64==",
    "tag": "authTagBase64=="
  },
  "metadata": {
    "timestamp": 1692057600000
  }
}
```

## Implementation Requirements

### Core Security Components

#### Scrypt Implementation
**Requirement**: Use Scrypt via @noble/hashes for key derivation  
**Library**: `@noble/hashes/scrypt`  
**Justification**: Excellent JavaScript performance, memory-hard properties, well-maintained  
**Interface**:
```typescript
import { scrypt } from '@noble/hashes/scrypt';

interface ScryptConfig {
  N: number;      // Cost parameter (power of 2)
  r: number;      // Block size parameter
  p: number;      // Parallelization parameter
  dkLen: number;  // Derived key length
}

function deriveKey(password: Uint8Array, salt: Uint8Array, config: ScryptConfig): Uint8Array {
  return scrypt(password, salt, config);
}
```

#### Enhanced PIN Policy
**Requirement**: Strengthen PIN requirements beyond basic 6-digit format  
**Target**: 8-12 digits or alphanumeric passphrase  
**Entropy Requirement**: Minimum 32 bits effective entropy

#### Rate Limiting System
**Requirement**: Exponential backoff on failed PIN attempts  
**Storage**: Attempt counter in hardware-backed secure storage  
**Policy**: 5 failures → 30s, 10 → 5m, 15 → escalate to device authentication

#### Device Master Key Management
**Requirement**: Generate device-specific root key in TEE  
**Storage**: iOS Secure Enclave, Android Keystore  
**Authentication**: Biometric-gated access for all key operations

#### Multi-Layer Authentication
**Requirements**: 
1. **App-level**: Device biometric required for initial app access
2. **Operation-level**: PIN + optional biometric verification for wallet operations  
**Fallback**: Device passcode when biometrics unavailable

## Security Analysis

### Threat Model

#### Threat 1: Offline Brute Force Attack
**Scenario**: Attacker extracts encrypted data and attempts PIN cracking  
**Prerequisites**: Attacker must first bypass device biometric authentication  
**Mitigation**: Scrypt memory-hard function makes brute force computationally expensive (~32MB memory per attempt)  
**Additional Protection**: Device binding prevents off-device attacks

#### Threat 2: Online Automated Attack
**Scenario**: Malware attempts rapid PIN guessing on unlocked device  
**Prerequisites**: Device must already be biometrically unlocked  
**Mitigation**: Exponential backoff and biometric re-authentication requirements

#### Threat 3: Device Compromise
**Scenario**: Attacker gains physical access to unlocked device  
**Prerequisites**: Device biometric authentication already satisfied  
**Mitigation**: Hardware-protected keys, TEE isolation, time-limited access

#### Threat 4: Application-Level Attack
**Scenario**: Malicious app or overlay attempts to access wallet  
**Prerequisites**: None - external attack vector  
**Mitigation**: Device biometric requirement prevents unauthorized app access entirely

#### Threat 5: Side-Channel Attacks
**Scenario**: Timing, power, or electromagnetic analysis  
**Mitigation**: Native implementation with hardware operations, constant-time algorithms

### Security Properties

#### Confidentiality
- **Data**: AES-256-GCM provides semantic security
- **Keys**: Scrypt-derived keys have full entropy
- **Storage**: Hardware-backed protection via TEE

#### Integrity
- **Data**: GCM authentication tag prevents tampering
- **Metadata**: Ciphertext format includes integrity verification
- **Keys**: Hardware attestation verifies key authenticity

#### Availability
- **Graceful Degradation**: Fallback options for hardware failures
- **Backward Compatibility**: Legacy data remains accessible
- **Recovery Options**: Multiple authentication factors

#### Authentication
- **Device Biometric**: Hardware-backed authentication required for app access
- **PIN Verification**: Constant-time comparison prevents timing attacks
- **Biometric Gating**: Additional hardware-backed authentication for sensitive operations
- **Device Binding**: Cryptographic proof of device identity

## Performance Specifications

### Scrypt Parameters

#### Target Devices
- **iOS**: iPhone 12+ (A14 Bionic and newer)
- **Android**: Snapdragon 888+ or equivalent

#### Performance Targets
```typescript
const DEVICE_PROFILES = {
  highEnd: {
    N: 65536,              // 64K cost parameter
    r: 8,                  // Block size
    p: 1,                  // Single thread
    targetTime: 150        // 150ms
  },
  midRange: {
    N: 32768,              // 32K cost parameter  
    r: 8,                  // Block size
    p: 1,                  // Single thread
    targetTime: 100        // 100ms
  },
  lowEnd: {
    N: 16384,              // 16K cost parameter
    r: 8,                  // Block size
    p: 1,                  // Single thread
    targetTime: 80         // 80ms
  }
};
```

#### Benchmarking Requirements
- **Calibration**: Adjust parameters based on device capability
- **Monitoring**: Track performance metrics in production
- **Adaptation**: Upgrade parameters as hardware improves

### AES Performance
- **Encryption**: <1ms for typical mnemonic (24-word BIP39)
- **Hardware Acceleration**: Utilize AES-NI when available
- **Memory Usage**: Minimal overhead for streaming encryption

## Testing Requirements

### Unit Tests
```typescript
describe('Cryptographic Operations', () => {
  test('Scrypt produces consistent results', () => {
    // Same input should produce same output
  });
  
  test('AES encryption is deterministic with same nonce', () => {
    // Verify encryption consistency
  });
  
  test('Different salts produce different keys', () => {
    // Verify salt uniqueness protection
  });
  
  test('Invalid PIN produces different key', () => {
    // Verify key derivation security
  });
});
```

### Integration Tests
```typescript
describe('End-to-End Encryption', () => {
  test('Encrypt then decrypt produces original data', () => {
    // Round-trip verification
  });
  
  test('Wrong PIN fails decryption', () => {
    // Authentication verification
  });
  
  test('Corrupted ciphertext fails integrity check', () => {
    // Tamper detection
  });
});
```

### Security Tests
```typescript
describe('Security Properties', () => {
  test('Rate limiting prevents brute force', () => {
    // Attempt counter functionality
  });
  
  test('Biometric authentication required for sensitive ops', () => {
    // Hardware integration verification
  });
  
  test('Device binding prevents cross-device attacks', () => {
    // Hardware key verification
  });
});
```

### Performance Tests
```typescript
describe('Performance Benchmarks', () => {
  test('Scrypt completes within target time', () => {
    // Performance requirement verification
  });
  
  test('AES operations are fast enough for UI', () => {
    // User experience validation
  });
});
```

## Implementation Guidelines

### Code Organization
```
util/
├── crypto/
│   ├── scrypt.ts               # Scrypt implementation via @noble/hashes
│   ├── aes.ts                  # AES-GCM operations
│   ├── random.ts               # Secure random generation
│   ├── kdf.ts                  # Key derivation abstraction
│   └── formats.ts              # Ciphertext format handling
├── hardware/
│   ├── tee.ts                  # TEE integration
│   ├── biometric.ts            # Biometric authentication
│   └── keystore.ts             # Hardware keystore operations
└── security/
    ├── pin.ts                  # PIN validation and security
    ├── rate-limit.ts           # Attempt rate limiting
    └── migration.ts            # Legacy format migration
```

### Error Handling
```typescript
class CryptographicError extends Error {
  constructor(
    message: string,
    public readonly code: CryptoErrorCode,
    public readonly recoverable: boolean = false
  ) {
    super(message);
  }
}

enum CryptoErrorCode {
  INVALID_PIN = 'INVALID_PIN',
  RATE_LIMITED = 'RATE_LIMITED',
  HARDWARE_UNAVAILABLE = 'HARDWARE_UNAVAILABLE',
  CORRUPTION_DETECTED = 'CORRUPTION_DETECTED',
  UNSUPPORTED_VERSION = 'UNSUPPORTED_VERSION'
}
```

### Security Logging
```typescript
interface SecurityEvent {
  timestamp: number;
  event: SecurityEventType;
  success: boolean;
  metadata?: Record<string, unknown>;
}

enum SecurityEventType {
  PIN_VERIFICATION = 'pin_verification',
  BIOMETRIC_AUTH = 'biometric_auth',
  ENCRYPTION = 'encryption',
  DECRYPTION = 'decryption',
  KEY_DERIVATION = 'key_derivation'
}
```

## Compliance and Standards

### Cryptographic Standards Compliance
- **FIPS 140-2**: AES implementation requirements
- **RFC 7914**: Scrypt specification compliance
- **NIST SP 800-132**: Password-based key derivation guidelines
- **OWASP ASVS**: Application security verification standards

### Mobile Security Standards
- **iOS Security**: Secure Enclave integration guidelines
- **Android Security**: Keystore and TEE best practices
- **Common Criteria**: Hardware security module requirements

### Industry Best Practices
- **Cryptocurrency Security**: BIP39 mnemonic protection standards
- **Password Managers**: Industry-standard key derivation practices
- **Banking Security**: Multi-factor authentication requirements

## Conclusion

This cryptographic specification establishes a comprehensive security architecture for the Carpe Mobile Wallet that implements industry best practices for mobile cryptocurrency security. The multi-layer approach combining device biometric authentication, memory-hard key derivation, authenticated encryption, and hardware-backed key protection provides robust defense against modern attack vectors.

The specification prioritizes both security and usability, ensuring that strong cryptographic protections do not compromise the user experience. Implementation of this architecture will position the wallet as a security leader in the mobile cryptocurrency space while maintaining the performance and reliability requirements of a production application.

Key security achievements:
- **Significant increase** in brute force attack cost through Scrypt implementation
- **Hardware-backed device binding** preventing offline attacks
- **Multi-layer authentication** providing defense in depth
- **Future-proof architecture** supporting advanced TEE integration
- **JavaScript-optimized security** via @noble/hashes implementation

---
**Document Status**: Design Specification  
**Implementation Target**: Release 1.1+  
**Security Review**: Required before implementation
