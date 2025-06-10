# Setup Guard System

The Setup Guard system ensures that users complete the necessary onboarding steps before accessing protected screens in the wallet app.

## Components

### `useSetupGuard()` Hook
A React hook that checks the user's setup status and provides the current state.

**Returns:**
- `setupStatus`: `"loading"` | `"needs-pin"` | `"needs-account"` | `"complete"`
- `hasPin`: boolean indicating if user has created a PIN
- `hasUserAccounts`: boolean indicating if user has any accounts
- `checkSetupStatus()`: function to manually recheck setup status

### `SetupGuard` Component
A wrapper component that protects screens and redirects users to onboarding if needed.

**Props:**
- `requiresPin`: boolean (default: true) - whether the screen requires a PIN
- `requiresAccount`: boolean (default: true) - whether the screen requires an account
- `redirectOnComplete`: boolean (default: true) - whether to redirect after onboarding completion

## Usage

### Protecting a Screen
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

### Different Protection Levels

1. **PIN Required Only** (e.g., account creation screens):
```tsx
<SetupGuard requiresPin={true} requiresAccount={false}>
```

2. **No Protection** (e.g., PIN management screen):
```tsx
<SetupGuard requiresPin={false} requiresAccount={false}>
```

3. **Full Protection** (default - e.g., account settings, transactions):
```tsx
<SetupGuard requiresPin={true} requiresAccount={true}>
```

## User Flow

1. **New User (no PIN, no accounts)**:
   - Any protected screen → Onboarding wizard (PIN setup → Account setup)

2. **Partial Setup (has PIN, no accounts)**:
   - Screens requiring accounts → Onboarding wizard (Account setup only)
   - Screens requiring only PIN → Allowed access

3. **Complete Setup (has PIN, has accounts)**:
   - All screens → Allowed access

## Implementation Details

The system integrates with the existing user state utilities:
- `hasCompletedBasicSetup()` - checks if PIN exists
- `hasAccounts()` - checks if any accounts exist
- `isFirstTimeUser()` - determines if onboarding is needed

The `OnboardingWizard` component automatically detects the user's current state and starts from the appropriate step.
