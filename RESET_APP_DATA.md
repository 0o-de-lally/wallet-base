# App Data Reset Feature

This feature allows you to completely wipe all application data to simulate a clean installation. This is particularly useful for development and testing purposes.

## How to Use

1. **Enable the Reset**: Open the `.env` file in the project root and uncomment the following line:
   ```
   EXPO_PUBLIC_RESET_APP_DATA=true
   ```

2. **Restart the App**: The reset will trigger on the next app startup. You can restart the app by:
   - Running `bun start` again
   - Refreshing the Metro bundler
   - Reloading the app in your simulator/device

3. **Disable the Reset**: After the reset is complete, comment out or remove the environment variable to prevent future resets:
   ```
   # EXPO_PUBLIC_RESET_APP_DATA=true
   ```

## What Gets Cleared

When the reset is triggered, the following data is completely removed:

- **Secure Storage**: All sensitive data stored with `expo-secure-store` including:
  - User PINs and authentication data
  - Private keys and wallet data
  - User tokens and settings
  - All account-specific secure data

- **AsyncStorage**: All persistent app configuration including:
  - Legend State persistence data
  - User profiles and accounts
  - App settings and preferences
  - Network configurations

- **Scheduled Operations**: All scheduled reveals and background operations

## Important Notes

- ⚠️ **This is a destructive operation** - all user data will be permanently lost
- 🔄 The reset happens **automatically on app startup** when the environment variable is set
- 📱 The app will behave exactly like a fresh installation after the reset
- 🚀 This feature only works in development builds (not production)
- 🔧 Make sure to disable the flag after testing to avoid accidental data loss

## Use Cases

- **Development**: Quickly test onboarding flows without manually clearing data
- **Testing**: Ensure clean state between test runs
- **Debugging**: Reset to a known clean state when troubleshooting issues
- **QA**: Test first-time user experience repeatedly

## Technical Details

The reset is implemented in `util/initialize-app.ts` and uses the `resetAppToCleanState()` function from `util/clear-storage-controller.ts`. The environment variable is checked early in the app initialization process, before any other app logic runs.

The feature respects Expo's environment variable conventions by using the `EXPO_PUBLIC_` prefix, making it available in the client-side code.
