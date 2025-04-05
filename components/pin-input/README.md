# Custom PIN Input Components

This directory contains a collection of components that implement a secure PIN entry system for the wallet application.

## Security-Enhanced PIN Pad Design

### Overview

The custom PIN pad implementation (`PinPad.tsx`) provides enhanced security measures for PIN entry compared to standard text inputs. This design was chosen to mitigate several common security vulnerabilities found in mobile financial applications.

### Security Features

#### 1. Randomized Digit Layout

- **Implementation**: The digits (0-9) are shuffled using the Fisher-Yates algorithm each time the PIN pad is rendered.
- **Security Benefit**: Prevents shoulder-surfing attacks by making it impossible to predict the position of digits based on the user's touch pattern.
- **User Experience**: Users must visually locate each digit before tapping, slightly slowing entry but significantly improving security.

#### 2. Masked Input on Interaction

- **Implementation**: When any digit is pressed, all digits on the keypad temporarily display as asterisks (*) for a short period (300ms).
- **Security Benefit**: Prevents observers from determining which specific digit was pressed based on the user's finger position.
- **User Experience**: Provides visual feedback that input was received without revealing the specific digit.

#### 3. Visual PIN Progress Indication

- **Implementation**: PIN entry progress is displayed as a series of dots rather than showing the actual characters entered.
- **Security Benefit**: Prevents the PIN from being displayed on screen at any point during the entry process.
- **User Experience**: Users can still track how many digits they've entered without compromising security.

#### 4. Haptic Feedback

- **Implementation**: Subtle vibration feedback upon digit press.
- **Security Benefit**: Reduces the need for users to visually confirm presses, allowing them to keep their attention on their surroundings.
- **User Experience**: Provides confirmation of input without revealing which digit was pressed.

#### 5. PIN Confirmation Flow

- **Implementation**: When creating or updating a PIN, users must enter it twice to confirm.
- **Security Benefit**: Ensures users correctly enter their intended PIN, reducing the risk of accidental lockouts.
- **User Experience**: Provides a clear, multi-step process for setting up critical security credentials.

### Technical Implementation

The PIN entry system is implemented as four separate components:

1. **PinPad**: The basic keypad UI with scrambled digits and masking behavior.
2. **CustomPinInput**: A wrapper that manages PIN state and integrates the PinPad with labels and error messages.
3. **PinInputOverlay**: An overlay component (not modal) that implements PIN verification against stored credentials without blocking system alerts.
4. **PinManagement**: A screen that handles PIN creation, verification, and updates with a confirmation flow.

The PIN verification overlay is specifically designed as a non-modal overlay to avoid blocking system alerts or other modals, allowing important messages to still appear on top when needed.

### User Flows

The PIN management system supports several distinct flows:

1. **New PIN Creation**: User creates a PIN (requires confirmation)
2. **PIN Verification**: User verifies an existing PIN
3. **PIN Update**: User changes an existing PIN (requires confirmation)
4. **Secure Action Authorization**: User enters PIN to authorize sensitive operations

### Accessibility Considerations

While security is prioritized, the implementation maintains accessibility through:

- Clear visual indication of PIN entry progress
- Adequately sized touch targets (70x70px)
- High contrast between text and button backgrounds
- Haptic feedback for input confirmation

### Limitations and Trade-offs

- **Learning Curve**: First-time users may be momentarily disoriented by the randomized layout.
- **Entry Speed**: Slightly slower PIN entry compared to a standard numeric keypad with a fixed layout.
- **Implementation Complexity**: More complex than standard text inputs, requiring custom state management.

These trade-offs were deemed acceptable given the sensitive nature of financial applications and the higher security requirements for wallet PIN entry.

## Usage

```tsx
// Example usage of CustomPinInput
<CustomPinInput
  onPinComplete={(pin) => console.log("PIN entered:", pin)}
  title="Enter Wallet PIN"
  subtitle="Please enter your 6-digit PIN"
  pinLength={6}
  error={errorState}
/>
```

## Contributing

When modifying the PIN entry system, carefully consider the security implications of any changes. Always prioritize security over convenience for features dealing with authentication and sensitive data access.
