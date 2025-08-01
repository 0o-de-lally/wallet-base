# Agent Codebase Context

This document provides context for the Carpe mobile wallet codebase to help Gemini assist with development tasks.

## Project Overview

Carpe is a mobile wallet application built with React Native and Expo. It uses TypeScript and Bun. The application is structured around features and a clear separation of concerns between UI components, business logic, and application state.

## Directory Structure

-   **`app/`**: Contains the application's screens, using Expo Router for file-based navigation. Each file in this directory corresponds to a route in the application.
-   **`assets/`**: Static assets like fonts and images.
-   **`components/`**: Reusable React components, organized by feature (e.g., `auth`, `profile`, `pin-input`). This is the primary location for UI elements.
-   **`context/`**: Holds React Context providers for managing global state, such as the `ModalContext`.
-   **`hooks/`**: Contains custom React hooks that encapsulate reusable logic (e.g., `use-secure-storage`, `use-transaction-pin`).
-   **`util/`**: The core of the application's business logic. This directory contains modules for cryptography, interacting with the Libra blockchain, managing secure storage, and other utility functions.
    -   `libra-client.ts`: Manages the connection and interaction with the Libra blockchain.
    -   `secure-store.ts`: A wrapper around `expo-secure-store` for handling sensitive data.
    -   `crypto.ts`: Contains cryptographic functions for key generation and management.
    -   `pin-security.ts`: Handles the logic for PIN creation, verification, and rotation.
-   **`styles/`**: Global styles and theme configuration.
-   **`testing/`**: End-to-end testing setup and harnesses.

## Development Workflow

-   **Package Manager**: The project uses `bun` for dependency management and running scripts.
-   **Linting**: ESLint is used for code quality. Run `bun run lint` to check for issues.
-   **Formatting**: Prettier is used for code formatting. Run `bun run format` to check formatting.
-   **Fixing**: `bun run fix` will automatically fix linting and formatting issues.
-   **State Management**: The primary state management library is `@legendapp/state`.
-   **Navigation**: Navigation is handled by `expo-router`.

## Key Files

-   `package.json`: Defines project scripts and dependencies.
-   `app.json`: Expo configuration file.
-   `tsconfig.json`: TypeScript configuration.
-   `metro.config.js`: Metro bundler configuration.
-- `yak.md`: This file seems to be for notes, I will ask the user about it if it seems relevant to a task.
