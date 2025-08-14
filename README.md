# Carpe Mobile Wallet

Carpe is a secure, non-custodial mobile wallet application built with React Native and Expo. It provides users with a simple and secure way to manage their Libra blockchain digital assets with advanced cryptographic security features.

## 🚀 Quick Start

### Prerequisites

- [Bun](https://bun.sh/) - Fast JavaScript runtime and package manager
- [Android Studio](https://developer.android.com/studio) with Android SDK
- Android Virtual Device (AVD) or physical Android device
- [Node.js](https://nodejs.org/) (for Expo compatibility)

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/0o-de-lally/wallet-base.git
   cd wallet-test
   ```

2. **Install dependencies:**
   ```bash
   bun install
   ```

3. **Set up environment:**
   ```bash
   # Copy environment template (if exists)
   cp .env.example .env
   ```

### Running the Application

#### Development Mode

1. **Start the development server:**
   ```bash
   bun start
   ```

2. **Run on Android:**
   ```bash
   bun run android
   ```

3. **Start Android Emulator (if needed):**
   ```bash
   bun run emulator
   ```

#### Production Build

```bash
# Build for Android
bun run build:android

# Run production build
bun run start:production
```

## 🛠️ Development

### Code Quality

This project maintains high code quality standards with automated linting, formatting, and type checking.

#### Available Scripts

```bash
# Development
bun start              # Start Metro bundler with cache clearing
bun run android        # Run on Android device/emulator
bun run emulator       # Start first available Android emulator

# Code Quality
bun run lint           # Run all linting checks (TypeScript, ESLint, unused exports)
bun run lint:eslint    # Run ESLint only
bun run lint:tsc       # Run TypeScript compiler checks
bun run lint:unused    # Check for unused exports
bun run format         # Check code formatting with Prettier
bun run fix            # Auto-fix formatting and linting issues

# Testing
bun run e2e           # Run end-to-end tests
```

### Project Structure

```
wallet-test/
├── .ai/                    # AI agent instructions and workflows
├── app/                    # Main application screens (Expo Router)
├── components/             # Reusable React components
│   ├── auth/              # Authentication components
│   ├── pin-input/         # PIN management components
│   ├── secure-storage/    # Secure storage components
│   └── transaction/       # Transaction components
├── context/               # React context providers
├── docs/                  # Project documentation and security audits
├── hooks/                 # Custom React hooks
├── util/                  # Utility modules
│   ├── crypto.ts         # Cryptographic functions
│   ├── pin-security.ts   # PIN handling and security
│   ├── secure-store.ts   # Secure storage abstraction
│   └── libra-client.ts   # Blockchain interaction
├── testing/              # Test utilities and E2E harness
└── styles/               # Global styles and themes
```

## 🔐 Security Features

### Cryptographic Security
- **AES-GCM Encryption**: Using `@noble/ciphers` for authenticated encryption
- **PBKDF2 Key Derivation**: SHA-256 with configurable iterations
- **Secure Random Generation**: Native OS entropy via `react-native-get-random-values`
- **Constant-Time Comparisons**: Timing attack prevention

### Mnemonic Protection
- **PIN-Protected Storage**: 6-digit PIN with secure hashing
- **Reveal Scheduling**: Time-delayed access to sensitive data
- **Secure Storage**: Expo SecureStore with hardware-backed encryption
- **Memory Protection**: Automatic cleanup of sensitive data

### Access Controls
- **Biometric Authentication**: Face ID/Fingerprint support
- **PIN Rotation**: Secure PIN change functionality
- **Account Isolation**: Per-account encrypted storage

## 🤖 AI Agent Integration

This project includes AI agent workflows for automated security auditing and development tasks.

### Available AI Workflows

#### Security Audit Agent
```bash
# Location: ./.ai/security-audit.yaml
# Purpose: Comprehensive security analysis and vulnerability assessment
# Output: ./docs/mnemonic_security_audit_{date}.md
```

**Usage**: The security audit agent systematically reviews:
- Cryptographic implementations
- Attack vector analysis (offline, online, device compromise)
- Vulnerability assessment with severity ratings
- Mitigation recommendations with implementation guidance

#### Development Agent
```bash
# Location: ./.ai/development.yaml
# Purpose: Automated implementation of security improvements
# Actions: Code changes, testing, documentation updates
```

**Usage**: The development agent:
- Scans documentation for actionable items (TODO, recommendations)
- Prioritizes security fixes over feature additions
- Implements changes with backward compatibility
- Auto-generates changelog entries
- Updates task completion status

### AI Agent Guidelines

1. **Security-First Approach**: Always prioritize security fixes
2. **Backward Compatibility**: Maintain data migration paths
3. **Comprehensive Testing**: Include tests for security-critical changes
4. **Documentation**: Auto-update docs and maintain audit trails
5. **Validation**: Verify implementations don't introduce new vulnerabilities

For detailed AI agent instructions, see [`./.ai/README.md`](./.ai/README.md).

## 📊 Architecture

### State Management
- **@legendapp/state**: Reactive state management with persistence
- **App Config Store**: Centralized configuration and profile management
- **Secure Storage Layer**: Encrypted persistence for sensitive data

### Navigation
- **Expo Router**: File-based routing with TypeScript support
- **Safe Area Context**: Proper handling of device safe areas
- **Screen Management**: Optimized screen transitions and stack management

### Blockchain Integration
- **Open Libra SDK**: TypeScript SDK for Libra blockchain interaction
- **Account Management**: Hierarchical deterministic (HD) wallet support
- **Transaction Processing**: Secure transaction signing and broadcasting

## 🔧 Key Technologies

| Technology | Purpose | Version |
|------------|---------|---------|
| [React Native](https://reactnative.dev/) | Mobile app framework | 0.79.5 |
| [Expo](https://expo.dev/) | Development platform | 53.0.20 |
| [TypeScript](https://www.typescriptlang.org/) | Type safety | ~5.8.3 |
| [Bun](https://bun.sh/) | Runtime and package manager | Latest |
| [Expo Router](https://docs.expo.dev/router/) | File-based navigation | ~5.1.4 |
| [@legendapp/state](https://legendapp.com/open-source/state/) | State management | ^2.1.15 |
| [@noble/ciphers](https://github.com/paulmillr/noble-ciphers) | Cryptography | ^1.3.0 |
| [Open Libra SDK](https://github.com/open-libra/libra-web-sdk-ts) | Blockchain interaction | ^1.1.5 |

## 📖 Documentation

- [`./docs/mnemonic_security_audit.md`](./docs/mnemonic_security_audit.md) - Security audit findings and recommendations
- [`./RECOVERY-SPEC.md`](./RECOVERY-SPEC.md) - Account recovery specifications
- [`./PRIVACY_POLICY.md`](./PRIVACY_POLICY.md) - Privacy policy and data handling
- [`./RESET_APP_DATA.md`](./RESET_APP_DATA.md) - Data reset procedures
- [`./.ai/README.md`](./.ai/README.md) - AI agent instructions and workflows

## 🚨 Security Considerations

### Current Security Status
- ⚠️ **6-digit PIN vulnerability**: Consider implementing longer PINs or passphrases
- ⚠️ **Static salt usage**: Migration to per-record salts recommended
- ⚠️ **No rate limiting**: PIN brute force protection needed
- ✅ **AES-GCM encryption**: Strong authenticated encryption in use
- ✅ **Secure random generation**: Using OS-level entropy
- ✅ **Biometric support**: Hardware-backed authentication available

### Planned Security Improvements
1. Implement PIN attempt rate limiting with exponential backoff
2. Replace static salt with per-record random salts
3. Remove custom integrity tokens (rely on AES-GCM auth tag)
4. Increase PBKDF2 iterations or migrate to Argon2
5. Add hardware keystore binding
6. Implement secure logging controls

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Run security audit: Follow `./.ai/security-audit.yaml` guidelines
4. Implement changes: Use `./.ai/development.yaml` workflow
5. Ensure all tests pass: `bun run lint && bun run e2e`
6. Commit changes with clear security implications
7. Create a Pull Request with security review checklist

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

- **Issues**: [GitHub Issues](https://github.com/0o-de-lally/wallet-base/issues)
- **Security**: For security vulnerabilities, see security audit documentation
- **Documentation**: Comprehensive docs available in `./docs/` directory
