# Carpe Mobile Wallet

Carpe is a secure mobile wallet application built with React Native and Expo. It provides users with a simple and secure way to manage their digital assets.

## Getting Started

These instructions will get you a copy of the project up and running on your local machine for development and testing purposes.

### Prerequisites

- [Bun](https://bun.sh/)
- [Android Studio](https://developer.android.com/studio) and an Android Virtual Device (AVD)

### Installation

1.  **Clone the repository:**

    ```bash
    git clone <repository-url>
    cd wallet-test
    ```

2.  **Install dependencies:**

    ```bash
    bun install
    ```

### Running the Application

1.  **Start the Metro bundler:**

    ```bash
    bun start
    ```

2.  **Run on Android:**

    In a separate terminal, run the following command to launch the app on your connected Android device or emulator:

    ```bash
    bun run android
    ```

    If you need to start an emulator, you can use:

    ```bash
    bun run emulator
    ```

## Development

### Linting and Formatting

This project uses ESLint for linting and Prettier for code formatting.

-   **Check for linting and formatting errors:**
    ```bash
    bun run lint
    bun run format
    ```
-   **Fix linting and formatting errors:**
    ```bash
    bun run fix
    ```

### End-to-End Testing

End-to-end tests are run using a custom harness.

```bash
bun run e2e
```

## Key Technologies

-   [React Native](https://reactnative.dev/)
-   [Expo](https://expo.dev/)
-   [TypeScript](https://www.typescriptlang.org/)
-   [Bun](https://bun.sh/)
-   [Expo Router](https://docs.expo.dev/router/introduction/) for file-based navigation.
-   [@legendapp/state](https://legendapp.com/open-source/state/) for state management.
-   [Open Libra SDK](https://github.com/open-libra/libra-web-sdk-ts) for blockchain interaction.