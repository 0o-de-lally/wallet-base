# Account Recovery Specification

## Overview

The account recovery system allows users to restore their cryptocurrency wallet accounts using a 24-word mnemonic phrase. This document outlines the technical implementation, user experience flow, error handling mechanisms, and security fixes implemented.

## Technical Architecture

### Core Components

1. **useRecoveryLogic.ts** - Main recovery workflow logic and state management
2. **RecoverAccountForm.tsx** - Primary UI component orchestrating the recovery flow
3. **MnemonicInputSection.tsx** - Mnemonic phrase input and validation
4. **AddressVerificationSection.tsx** - Address derivation and blockchain verification
5. **RecoveryActionSection.tsx** - Final account creation/recovery actions
6. **use-secure-storage.ts** - PIN-based encryption and secure storage

### Dependencies

- **open-libra-sdk**: Blockchain operations and wallet creation
- **@scure/bip39**: Mnemonic validation and checksum verification
- **PBKDF2**: PIN-based encryption for secure storage
- **React Native Keychain**: Secure device storage

## Recovery Process Flow

### Step 1: Mnemonic Input
**Technical Implementation:**
- Real-time validation using `@scure/bip39.validateMnemonic()`
- 24-word phrase requirement with automatic word count validation
- Immediate visual feedback on mnemonic validity

**User Experience:**
- User enters their 24-word recovery phrase
- Real-time validation feedback (red/green indicators)
- Word count display and completion status
- Auto-advancing when valid mnemonic detected

**Progress Indicator:**
```
"Deriving keys from mnemonic..." (with spinner)
```

### Step 2: Address Derivation
**Technical Implementation:**
```typescript
const wallet = LibraWallet.fromMnemonic(
  state.mnemonic.trim(),
  Network.MAINNET,
  clientUrl,
);
const address = wallet.getAddress();
```

**User Experience:**
- Automatic address derivation upon valid mnemonic
- Display of derived wallet address
- Copy functionality for address verification

**Progress Indicator:**
```
"Deriving keys from mnemonic..." → Displays derived address
```

### Step 3: Blockchain Verification (Automatic in Recovery Mode)
**Technical Implementation:**
```typescript
// Auto-verification triggers after address derivation
await wallet.syncOnchain();
const actualAddress = wallet.getAddress();
```

**User Experience:**
- Automatic verification without user interaction
- Progress indicator showing verification status
- Success feedback with account status

**Progress Indicators:**
```
"Preparing to verify..." → "Verifying account on blockchain..." → Success
```

### Step 4: Profile Selection
**Technical Implementation:**
- Integration with existing profile system
- Validation that account doesn't already exist in selected profile

**User Experience:**
- Dropdown selection of available profiles
- Automatic default selection when only one profile exists

### Step 5: PIN Security and Account Storage
**Technical Implementation:**
```typescript
// PIN-based encryption using PBKDF2
const encryptedMnemonic = await encryptWithPin(mnemonic, pin);
await secureStorage.save(encryptedMnemonic);
```

**User Experience:**
- PIN entry modal for secure storage
- Retry functionality on incorrect PIN
- Success confirmation upon completion

## Error Handling

### Mnemonic Validation Errors
- **Invalid checksum**: "Invalid mnemonic phrase - checksum verification failed"
- **Wrong word count**: "Mnemonic must be exactly 24 words"
- **Invalid words**: "Contains invalid BIP39 words"

### Blockchain Verification Errors
- **Network connectivity**: "Unable to connect to blockchain network"
- **Invalid mnemonic**: "Mnemonic validation failed: derived address mismatch"
- **Sync failures**: Gracefully handled with fallback to derived address

### PIN Security Errors
- **Incorrect PIN**: Modal remains open with error message and retry option
- **Encryption failure**: "Failed to securely store account"

### Profile Management Errors
- **Duplicate account**: "Account already exists in selected profile"
- **Profile not found**: "Selected profile is invalid"

## Security Features

### Multi-Layer Validation
1. **UI Layer**: Real-time BIP39 validation using `@scure/bip39`
2. **Derivation Layer**: LibraWallet mnemonic validation through wallet creation
3. **Blockchain Layer**: On-chain verification with address matching
4. **Storage Layer**: PIN-based PBKDF2 encryption

### PIN Security
- PBKDF2-based encryption with secure key derivation
- No auto-close on incorrect PIN (prevents data corruption)
- Retry mechanism with persistent error states
- Secure device storage using React Native Keychain

## Critical Fixes Implemented

### Issue #1: Incorrect Mnemonic Acceptance
**Problem**: Invalid mnemonics were being accepted and stored due to flawed verification logic.

**Root Cause**: Nested try-catch blocks in `verifyOnChain()` were catching and ignoring validation errors.

**Fix**: Removed nested error handling and implemented direct validation with proper error propagation. Now validation errors are correctly surfaced to the user instead of being silently ignored.

### Issue #2: Incorrect PIN Acceptance
**Problem**: Wrong PINs were being treated as correct, causing data corruption.

**Root Cause**: PIN modal was auto-closing regardless of PIN validation result.

**Fix**: Implemented proper PIN validation flow where the modal only closes on successful validation. Failed PIN attempts keep the modal open with error messages and retry functionality.

### Issue #3: Poor User Experience
**Problem**: Manual button pressing required for verification, inconsistent progress indicators.

**Fix**: Implemented automatic verification and consistent UI patterns:
- Automatic chain verification in recovery mode
- Reusable `ProgressIndicator` component for consistent loading states
- Eliminated manual "Verify on Chain" button in recovery flow

### Issue #4: Performance and UX Delays
**Problem**: Redundant validation causing delays before PIN modal appearance.

**Fix**: Removed duplicate validation in `handleRecoverAccount()` that was already performed during address derivation, allowing direct progression to PIN entry after successful verification.

## User Experience Expectations

### Successful Recovery Flow
1. **Input**: User enters valid 24-word mnemonic
2. **Validation**: Immediate green checkmark, progress to address derivation
3. **Derivation**: Brief loading state, then address display
4. **Verification**: Automatic blockchain verification with progress indicator
5. **Success**: Green checkmark with account status (new/existing/rotated keys)
6. **Profile**: Optional profile selection (auto-selected if only one)
7. **Security**: PIN entry for secure storage
8. **Completion**: Success confirmation and navigation

### Error Recovery Scenarios
1. **Invalid Mnemonic**: Clear error message, input remains focused
2. **Network Issues**: Retry mechanism with graceful degradation
3. **Wrong PIN**: Modal stays open, error message, retry button
4. **Duplicate Account**: Clear warning with profile selection guidance

## Known Limitations

### Current Limitations
1. **Network Dependency**: Blockchain verification requires internet connectivity
2. **Profile System**: Account uniqueness enforced per profile, not globally
3. **PIN Complexity**: No enforced PIN complexity requirements
4. **Backup Verification**: No secondary mnemonic verification step

### Future Improvements
1. **Offline Mode**: Support for address derivation without blockchain verification
2. **Biometric Security**: Integration with device biometrics as PIN alternative
3. **Mnemonic Confirmation**: Double-entry verification for critical operations
4. **Progress Persistence**: Recovery state persistence across app restarts

## Testing Scenarios

### Valid Recovery Cases
- ✅ Valid 24-word mnemonic with existing on-chain account
- ✅ Valid 24-word mnemonic for new account (no on-chain presence)
- ✅ Valid mnemonic with rotated keys (address mismatch handled)
- ✅ Recovery with correct PIN entry
- ✅ Multiple profile selection scenarios

### Error Cases
- ✅ Invalid mnemonic phrases (wrong checksum, invalid words, wrong count)
- ✅ Network connectivity issues during verification
- ✅ Incorrect PIN entries with retry functionality
- ✅ Duplicate account detection across profiles
- ✅ Profile system edge cases (deleted profiles, corrupted data)

### Security Tests
- ✅ PIN-based encryption/decryption verification
- ✅ Secure storage integration testing
- ✅ Error state handling without data corruption
- ✅ Multiple validation layer verification

## Development Notes

### Component Dependencies
```
RecoverAccountForm
├── MnemonicInputSection
│   ├── MnemonicInput (common)
│   └── ProgressIndicator (common)
├── GeneratedAddressDisplay
│   ├── CopyButton (common)
│   └── ProgressIndicator (common)
├── AddressVerificationSection
│   ├── FormInput (common)
│   ├── ActionButton (common)
│   └── ProgressIndicator (common)
└── RecoveryActionSection
    └── ActionButton (common)
```

### State Management
- Centralized state in `useRecoveryState.ts`
- Action-based state updates via `useRecoveryLogic.ts`
- Secure storage integration via `use-secure-storage.ts`

### Styling Consistency
- Shared `ProgressIndicator` component for loading states
- Consistent color scheme using `namedColors.blue` for activity indicators
- Unified spacing and typography via `styles.ts`
