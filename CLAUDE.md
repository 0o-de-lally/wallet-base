# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

### Core Development
- `bun start` - Start Metro bundler with cache clearing
- `bun run android` - Run on Android device/emulator
- `bun run emulator` - Start first available Android emulator

### Code Quality & Testing
- `bun run lint` - Run all linting checks (TypeScript, ESLint, unused exports)
- `bun run lint:tsc` - TypeScript compiler checks only
- `bun run lint:eslint` - ESLint checks only  
- `bun run lint:unused` - Check for unused exports
- `bun run format` - Check code formatting with Prettier
- `bun run fix` - Auto-fix formatting and linting issues
- `bun run e2e` - Run end-to-end tests

## Architecture Overview

### Core Technology Stack
- **React Native 0.79.5** with **Expo 53.0.20** for cross-platform mobile development
- **TypeScript** for type safety and better developer experience
- **Bun** as the runtime and package manager (preferred over npm/yarn)
- **Expo Router** for file-based navigation with TypeScript support

### State Management Architecture
- **@legendapp/state** - Primary reactive state management with built-in persistence
- **AppConfigStore** (`util/app-config-store.ts`) - Centralized app configuration and profile management using observable patterns
- **AsyncStorage persistence** - Automatic state persistence across app restarts
- **Modal Context** (`context/ModalContext.tsx`) - Global modal management for alerts and confirmations

### Security Architecture
This is a cryptocurrency wallet with defense-in-depth security:

**Cryptographic Layer:**
- **PIN-based encryption** (`util/pin-security.ts`) - Core security module using Scrypt key derivation
- **Secure storage** (`util/secure-store.ts`) - Wrapper around Expo SecureStore with key management
- **Reveal controller** (`util/reveal-controller.ts`) - Time-delayed access to sensitive data
- **Hardware authentication** - Biometric support via expo-local-authentication

**Key Security Files:**
- `util/pin-security.ts` - PIN hashing, encryption/decryption with security best practices
- `util/secure-store.ts` - Encrypted storage abstraction with key tracking
- `hooks/use-secure-storage.ts` - React hook for secure data operations
- `util/key-obfuscation.ts` - Storage key name obfuscation

### Component Architecture
- **File-based routing** in `app/` directory using Expo Router
- **Modular components** in `components/` organized by feature:
  - `auth/` - Authentication and biometric flows
  - `pin-input/` - PIN creation, input, and rotation
  - `secure-storage/` - Mnemonic management and secret revelation
  - `transaction/` - Blockchain transaction handling
  - `profile/` - Account and profile management

### Blockchain Integration
- **Open Libra SDK** (`util/libra-client.ts`) - TypeScript SDK for Libra blockchain
- **HD wallet support** - Hierarchical deterministic wallet functionality
- **Account management** - Multiple account support with encrypted storage

### Navigation & UI
- **Expo Router** with TypeScript for file-based routing
- **Safe Area Context** for proper device safe area handling
- **React Native Screens** for optimized navigation performance
- **Custom styling** in `styles/styles.ts` with consistent theming

## Development Patterns

### Security-First Development
- All sensitive data must be encrypted using PIN-based encryption
- Never store PINs or mnemonics in plaintext
- Use secure random generation for all cryptographic operations
- Implement proper memory cleanup for sensitive data

### State Management Patterns
- Use `@legendapp/state` observables for reactive state
- Persist important state using the configured AsyncStorage plugin
- Access global config via `appConfig` observable from `app-config-store.ts`
- Use React hooks for component-level state management

### Component Development
- Follow the existing component structure in `components/`
- Use TypeScript interfaces for props and state
- Implement proper error handling and loading states
- Use the `useModal` hook for alerts and confirmations

### Error Handling
- Use `error-utils.ts` for consistent error reporting
- Implement proper loading states for async operations
- Provide meaningful error messages to users
- Log errors appropriately without exposing sensitive data

## AI Agent Instructions

The `.ai/` directory contains specialized Claude instruction files:
- `security-audit-instructions.md` - Comprehensive security audit workflow
- `development-instructions.md` - Implementation workflow for security fixes and features

These instructions guide systematic security auditing and development following security-first principles.

## Important Notes

### Security Considerations
- This is a cryptocurrency wallet - security is paramount
- All cryptographic operations should follow established patterns in `util/pin-security.ts`
- Never commit secrets, private keys, or sensitive test data
- Review security implications of any changes to core security files

### Development Environment
- Requires Android Studio with AVD for testing
- Bun is the preferred package manager - avoid mixing with npm/yarn
- Use TypeScript strict mode - the project has comprehensive type safety

### Testing
- E2E tests are located in `testing/e2e-harness.ts`
- Always run linting before commits: `bun run lint`
- Test security-critical changes thoroughly

### Legacy Considerations
- The project includes migration logic for data format changes
- Maintain backward compatibility when modifying storage formats
- Check for existing migration patterns in `util/` files