# Authentication System

The authentication system provides device-level security for the wallet app using biometric authentication (fingerprint, face recognition) or device passcode.

## Components

### `AuthenticationView` Component
A single, consistent authentication UI component used throughout the app when device authentication is required.

**Props:**
- `isLoading`: boolean (default: false) - shows loading state while checking authentication
- `onAuthenticate`: function - callback when user taps authenticate button
- `title`: string (default: "Authentication Required") - main title text
- `subtitle`: string (default: "Please authenticate...") - subtitle/error message
- `buttonText`: string (default: "Authenticate") - authentication button text

**Features:**
- Designed to be visible even when device authentication modals are overlaid
- Consistent styling and messaging across the app
- Handles both loading and error states
- Provides clear user guidance and context

### `SetupGuard` Component
A wrapper component that protects screens and redirects users to onboarding if needed.

**Props:**
- `requiresPin`: boolean (default: true) - whether the screen requires a PIN
- `requiresAccount`: boolean (default: true) - whether the screen requires an account

## Authentication Flow

1. **App Initialization**: Root layout checks if app is initialized
2. **Device Authentication**: If biometric/passcode is available, user must authenticate
3. **Setup Verification**: SetupGuard ensures user has completed PIN and account setup
4. **App Access**: User gains access to protected content

## Implementation

### Root Level Authentication
Device authentication is handled in the app's root layout (`app/_layout.tsx`):

```tsx
// Authentication is automatic on app start
// Uses AuthenticationView for consistent UI
if (!isAuthenticated) {
  return (
    <Layout>
      <AuthenticationView
        isLoading={false}
        onAuthenticate={authenticate}
      />
    </Layout>
  );
}
```

### Screen Level Protection
Individual screens use SetupGuard for onboarding protection:

```tsx
import { SetupGuard } from '../components/auth/SetupGuard';

export default function MyProtectedScreen() {
  return (
    <SetupGuard requiresPin={true} requiresAccount={true}>
      <View>
        {/* Your protected content */}
      </View>
    </SetupGuard>
  );
}
```

## Security Features

- **Device-level Security**: Uses native biometric authentication APIs
- **Fallback Support**: Automatically falls back to device passcode
- **Graceful Degradation**: Works on devices without biometric support
- **Error Handling**: Provides clear feedback for authentication failures
- **Visual Consistency**: Single authentication view prevents UI conflicts

## User Experience

- **Always Visible**: Authentication view remains visible even when device modals appear
- **Clear Messaging**: Users understand why authentication is required
- **Retry Support**: Easy retry mechanism for failed authentication
- **Context Awareness**: Different messages for different authentication scenarios
