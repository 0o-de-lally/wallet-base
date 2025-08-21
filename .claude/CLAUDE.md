# CLAUDE.md

This file provides guidance to Claude Code when working with this cryptocurrency wallet codebase.

## Development Commands
IMPORTANT: Do not use npm or yarn. Only bun.

- `bun start` - Start Metro bundler
- `bun run android` - Run on Android device/emulator
- `bun run lint` - Run all linting checks
- `bun run fix` - Auto-fix formatting and linting issues
- `bun run e2e` - Run end-to-end tests

## Architecture

**Technology Stack:** React Native 0.79.5, Expo 53.0.20, TypeScript, Bun, Expo Router

**Key Directories:**
- `app/` - File-based routing screens
- `components/` - UI components organized by feature (auth, pin-input, secure-storage, etc.)
- `util/` - Business logic and cryptography
- `hooks/` - Custom React hooks
- `context/` - Global state providers

**Security Architecture:**
- `util/pin-security.ts` - Password-based encryption with Scrypt
- `util/secure-store.ts` - Encrypted storage wrapper
- `util/reveal-controller.ts` - Time-delayed sensitive data access
- Hardware biometric authentication support

**State Management:** @legendapp/state with AsyncStorage persistence

## Development Rules

**Security-First:**
- All sensitive data must be encrypted
- Never store passwords/mnemonics in plaintext
- Follow patterns in `util/pin-security.ts`
- Never commit secrets or test data

**Code Quality:**
- Always run `bun run lint` before commits
- Use TypeScript strict mode
- Follow existing component patterns
- Use `useModal` hook for alerts
- Never use `npx`, `yarn`, or `npm` - use `bun` and `bunx` for all package management and execution

**Essential Files:**
- `util/pin-security.ts` - Core security module
- `util/app-config-store.ts` - Global configuration
- `context/ModalContext.tsx` - Modal management
- `testing/e2e-harness.ts` - E2E tests
