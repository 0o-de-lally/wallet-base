# Screenshot Protection Security Assessment

Date: 2025-08-18
Branch: claude-init
Scope: Analysis of screenshot protection needs and implementation recommendations for cryptocurrency wallet application

## Executive Summary

**Current Risk Assessment: HIGH**

This wallet application currently lacks any screenshot protection mechanisms while displaying highly sensitive information including recovery mnemonics, account balances, and transaction details. The application is vulnerable to screenshot-based attacks that could lead to complete wallet compromise.

**Critical Findings:**
- **CRITICAL**: No screenshot protection implemented despite displaying plaintext mnemonics
- **HIGH**: Sensitive data visible in app switcher/recent apps preview
- **HIGH**: Account balances and transaction data exposed to screenshots
- **MEDIUM**: PIN entry screens vulnerable to shoulder surfing via screenshots

**Immediate Action Required:**
Screenshot protection must be implemented before production deployment, particularly for mnemonic reveal workflows.

Risk Rating Legend:
- **Critical**: Direct mnemonic compromise possible with minimal effort
- **High**: Practical compromise path with moderate attacker capability
- **Medium**: Increases likelihood given additional conditions
- **Low**: Theoretical risk or requires powerful attacker but improvable

## Detailed Findings

### Finding 1: No Screenshot Protection on Critical Screens
**Severity: CRITICAL**
**File Locations:**
- `/Users/lucas/code/ts/wallet-test/components/account-creation/GeneratedMnemonicDisplay.tsx` (lines 63-64)
- `/Users/lucas/code/ts/wallet-test/components/reveal/RevealStatusUI.tsx` (lines 227-229)
- `/Users/lucas/code/ts/wallet-test/components/account-recovery/GeneratedMnemonicSection.tsx` (lines 89-91)

**Technical Description:**
The application displays recovery mnemonics in plaintext without any screenshot protection. Components like `GeneratedMnemonicDisplay` and `RevealStatusUI` render mnemonics directly to the screen using standard React Native `Text` components, making them fully capturable via screenshots.

**Attack Scenario:**
1. Attacker installs malware with screenshot capabilities on user's device
2. Malware automatically captures screenshots when wallet app is active
3. Image analysis extracts plaintext mnemonic from screenshot
4. Attacker gains full control of wallet using recovered mnemonic

**Impact Assessment:**
Complete wallet compromise - attacker gains permanent access to all funds across all accounts derived from the compromised mnemonic. This represents total loss of user assets.

### Finding 2: App Switcher Preview Exposure
**Severity: HIGH**
**File Locations:**
- No current app backgrounding protection implemented
- All sensitive screens vulnerable when app goes to background

**Technical Description:**
When users switch apps or the application goes to background, the OS captures a preview image for the app switcher. This preview can contain sensitive information like mnemonics, balances, or transaction details that remain visible in the app switcher.

**Attack Scenario:**
1. User reveals mnemonic in wallet app
2. User switches to another app (phone call, message, etc.)
3. Attacker with physical device access views app switcher
4. Mnemonic visible in wallet app preview thumbnail
5. Attacker photographs preview screen with separate device

**Impact Assessment:**
Physical device access could lead to wallet compromise through app switcher preview containing mnemonics or other sensitive data.

### Finding 3: Balance and Transaction Data Screenshot Vulnerability
**Severity: HIGH**
**File Locations:**
- `/Users/lucas/code/ts/wallet-test/components/profile/AccountTotals.tsx` (lines 57-58, 64-65)
- `/Users/lucas/code/ts/wallet-test/components/transaction/HistoricalTransactions.tsx` (lines 270-275)
- `/Users/lucas/code/ts/wallet-test/app/account-details.tsx` (lines 56-58)

**Technical Description:**
Account balances, transaction histories, and account addresses are displayed without screenshot protection. While less critical than mnemonic exposure, this financial information represents significant privacy risk.

**Attack Scenario:**
1. Attacker captures screenshots during transaction review
2. Analysis reveals wallet holdings, transaction patterns, and counterparties
3. Information used for targeted phishing, social engineering, or physical robbery
4. Pattern analysis could reveal identity through blockchain transaction correlation

**Impact Assessment:**
Privacy compromise and potential targeting for robbery or social engineering attacks based on revealed wealth and transaction patterns.

### Finding 4: PIN Entry Vulnerable to Screenshot Harvesting
**Severity: MEDIUM**
**File Locations:**
- `/Users/lucas/code/ts/wallet-test/components/pin-input/PinInputField.tsx`
- `/Users/lucas/code/ts/wallet-test/components/pin-input/PinInputModal.tsx`

**Technical Description:**
PIN entry screens lack screenshot protection, making PIN values potentially visible during entry or when fields are filled.

**Attack Scenario:**
1. Malware captures screenshots during PIN entry workflow
2. Image analysis reveals PIN characters in input fields
3. Combined with encrypted mnemonic storage access, PIN enables decryption
4. Attacker gains access to encrypted wallet data

**Impact Assessment:**
PIN compromise combined with device access enables decryption of stored encrypted mnemonics and sensitive data.

## Attack Scenarios

### Critical Attack Scenario 1: Malware-Based Mnemonic Harvesting
**Prerequisites:**
- Malware installed on user device with screenshot permissions
- User performs mnemonic reveal operation

**Technical Exploit:**
1. Malware monitors for wallet app activation
2. Captures screenshots every 500ms during mnemonic reveal screens
3. OCR/image analysis extracts mnemonic text from screenshots
4. Mnemonic transmitted to attacker's server
5. Attacker imports mnemonic into separate wallet software

**Expected Outcome:**
Complete wallet compromise within minutes of mnemonic reveal. All current and future funds accessible to attacker.

**Detection Challenges:**
Modern Android malware can capture screenshots without user notification. iOS has stronger protections but jailbroken devices remain vulnerable.

### High-Risk Attack Scenario 2: Social Engineering via Screenshot Sharing
**Prerequisites:**
- User needs technical support
- Support process involves screen sharing or screenshot sharing

**Technical Exploit:**
1. Attacker poses as legitimate support agent
2. Requests user to take screenshots of wallet screens for "troubleshooting"
3. User unknowingly shares screenshot containing mnemonic or sensitive data
4. Attacker gains wallet access through shared sensitive information

**Expected Outcome:**
Wallet compromise through social engineering, even with technically security-conscious users.

### Medium-Risk Attack Scenario 3: Physical Device Access
**Prerequisites:**
- Attacker gains temporary physical access to unlocked device
- Wallet app contains sensitive data in app switcher preview

**Technical Exploit:**
1. Attacker accesses device app switcher
2. Views wallet app preview containing sensitive information
3. Uses separate camera device to photograph preview
4. Analyzes captured image for extractable sensitive data

**Expected Outcome:**
Potential wallet compromise or significant privacy breach depending on preview content.

## Prioritized Remediations

### Immediate Critical Fixes (Deploy Within 1 Week)

#### 1. Implement Screenshot Protection for Mnemonic Displays
**Priority: CRITICAL**
**Implementation Effort: Medium**
**Files to Modify:**
- `/Users/lucas/code/ts/wallet-test/components/account-creation/GeneratedMnemonicDisplay.tsx`
- `/Users/lucas/code/ts/wallet-test/components/reveal/RevealStatusUI.tsx`
- `/Users/lucas/code/ts/wallet-test/components/account-recovery/GeneratedMnemonicSection.tsx`

**Technical Approach:**
Install and implement `expo-screen-capture` module for immediate protection:

```typescript
import { usePreventScreenCapture } from 'expo-screen-capture';

// In mnemonic display components
export const GeneratedMnemonicDisplay = ({ mnemonic, ...props }) => {
  usePreventScreenCapture(); // Prevents screenshots while component mounted
  
  return (
    // existing component JSX
  );
};
```

#### 2. Add App Backgrounding Protection
**Priority: CRITICAL**
**Implementation Effort: Low**
**Files to Modify:**
- `/Users/lucas/code/ts/wallet-test/app/_layout.tsx`

**Technical Approach:**
Implement blur overlay when app goes to background to protect app switcher previews:

```typescript
import { AppState } from 'react-native';
import { BlurView } from 'expo-blur';

// Add app state listener to blur sensitive content when backgrounded
```

### Short-Term High-Priority Improvements (Deploy Within 2 Weeks)

#### 3. Selective Screenshot Protection for Balance Screens
**Priority: HIGH**
**Implementation Effort: Medium**
**Files to Modify:**
- `/Users/lucas/code/ts/wallet-test/components/profile/AccountTotals.tsx`
- `/Users/lucas/code/ts/wallet-test/app/account-details.tsx`

**Technical Approach:**
Implement context-aware screenshot protection that activates when balances are visible.

#### 4. Enhanced PIN Security During Entry
**Priority: HIGH**
**Implementation Effort: Low**
**Files to Modify:**
- `/Users/lucas/code/ts/wallet-test/components/pin-input/PinInputModal.tsx`

**Technical Approach:**
Add screenshot protection during PIN entry workflows.

### Medium-Term Architectural Enhancements (Deploy Within 1 Month)

#### 5. User-Controllable Screenshot Protection Settings
**Priority: MEDIUM**
**Implementation Effort: Medium**

**Technical Approach:**
Add settings UI allowing users to control screenshot protection granularity:
- Always protect sensitive data (default)
- Protect only mnemonic displays
- Disable protection (with strong warnings)

#### 6. Advanced Anti-Screenshot Measures
**Priority: MEDIUM**
**Implementation Effort: High**

**Technical Approach:**
Implement additional protection layers:
- Dynamic text rendering to defeat OCR
- Watermarking for screenshot attribution
- Screenshot attempt detection and alerting

### Long-Term Security Hardening (Deploy Within 3 Months)

#### 7. Root/Jailbreak Detection
**Priority: LOW**
**Implementation Effort: High**

**Technical Approach:**
Detect compromised devices and warn users about reduced screenshot protection effectiveness.

## Code-Level Recommendations

### 1. Expo Screen Capture Integration

**Installation:**
```bash
npx expo install expo-screen-capture
```

**Core Hook Implementation:**
```typescript
// hooks/use-screenshot-protection.ts
import { usePreventScreenCapture } from 'expo-screen-capture';
import { useEffect } from 'react';

export function useScreenshotProtection(shouldProtect: boolean = true) {
  usePreventScreenCapture(shouldProtect ? undefined : null);
  
  useEffect(() => {
    console.log(`Screenshot protection ${shouldProtect ? 'enabled' : 'disabled'}`);
  }, [shouldProtect]);
}
```

**Mnemonic Component Protection:**
```typescript
// components/account-creation/GeneratedMnemonicDisplay.tsx
import { useScreenshotProtection } from '../../hooks/use-screenshot-protection';

export const GeneratedMnemonicDisplay = ({ mnemonic, ...props }) => {
  useScreenshotProtection(true); // Always protect mnemonic displays
  
  return (
    <View style={styles.container}>
      {/* existing JSX */}
    </View>
  );
};
```

### 2. App State Management for Background Protection

**Implementation in Layout:**
```typescript
// app/_layout.tsx
import { AppState } from 'react-native';
import { BlurView } from 'expo-blur';
import { useState, useEffect } from 'react';

export default function RootLayout() {
  const [isBackground, setIsBackground] = useState(false);
  
  useEffect(() => {
    const handleAppStateChange = (nextAppState: string) => {
      setIsBackground(nextAppState !== 'active');
    };
    
    AppState.addEventListener('change', handleAppStateChange);
    return () => AppState.removeEventListener('change', handleAppStateChange);
  }, []);
  
  return (
    <View style={{ flex: 1 }}>
      {/* Your app content */}
      {isBackground && (
        <BlurView 
          style={StyleSheet.absoluteFill}
          tint="dark" 
          intensity={100} 
        />
      )}
    </View>
  );
}
```

### 3. Conditional Protection for Balance Screens

**Context-Aware Protection:**
```typescript
// components/profile/AccountTotals.tsx
import { useScreenshotProtection } from '../../hooks/use-screenshot-protection';

export const AccountTotals = ({ profileName, protectBalances = true }) => {
  useScreenshotProtection(protectBalances);
  
  // existing component logic
};
```

### 4. Settings Integration

**User Control Implementation:**
```typescript
// Add to app config store
const screenProtectionSettings = {
  protectMnemonics: true,        // Always true, non-configurable
  protectBalances: true,         // User configurable
  protectTransactions: false,    // User configurable
  protectPinEntry: true,         // Always true, non-configurable
};
```

## Migration Considerations

### Backward Compatibility
- Screenshot protection is additive and won't break existing functionality
- Graceful degradation on unsupported platforms
- Expo Screen Capture is compatible with current React Native 0.79 used in this project

### User Experience Impact
- **Positive**: Enhanced security and privacy protection
- **Negative**: Users cannot take legitimate screenshots for support purposes
- **Mitigation**: Provide alternative support mechanisms (error logs, account export)

### Performance Considerations
- Minimal performance impact from screenshot protection
- Expo Screen Capture uses native platform APIs efficiently
- App backgrounding blur may cause minor UI lag on lower-end devices

### Rollback Procedures
```typescript
// Emergency disable via feature flag
const ENABLE_SCREENSHOT_PROTECTION = __DEV__ ? false : true;

export function useScreenshotProtection(shouldProtect: boolean = true) {
  usePreventScreenCapture(
    ENABLE_SCREENSHOT_PROTECTION && shouldProtect ? undefined : null
  );
}
```

### Phased Deployment Strategy
1. **Phase 1**: Deploy mnemonic protection only (critical paths)
2. **Phase 2**: Add balance and transaction protection
3. **Phase 3**: Implement user settings and advanced features
4. **Phase 4**: Add root detection and enhanced security measures

## Security Testing Additions

### Unit Tests for Screenshot Protection
```typescript
// __tests__/screenshot-protection.test.ts
import { renderHook } from '@testing-library/react-hooks';
import { useScreenshotProtection } from '../hooks/use-screenshot-protection';

describe('Screenshot Protection', () => {
  it('should enable protection when shouldProtect is true', () => {
    const { result } = renderHook(() => useScreenshotProtection(true));
    // Test protection activation
  });
  
  it('should disable protection when shouldProtect is false', () => {
    const { result } = renderHook(() => useScreenshotProtection(false));
    // Test protection deactivation
  });
});
```

### Integration Tests for Sensitive Screens
```typescript
// __tests__/mnemonic-protection.test.tsx
import { render } from '@testing-library/react-native';
import { GeneratedMnemonicDisplay } from '../components/account-creation/GeneratedMnemonicDisplay';

describe('Mnemonic Display Protection', () => {
  it('should activate screenshot protection when mnemonic is displayed', () => {
    const mockMnemonic = 'abandon abandon abandon...';
    render(<GeneratedMnemonicDisplay mnemonic={mockMnemonic} onRegenerate={() => {}} />);
    // Verify screenshot protection is active
  });
});
```

### Manual Security Testing Scenarios
1. **Screenshot Attempt Testing**: Verify screenshots are blocked on sensitive screens
2. **App Switcher Testing**: Confirm sensitive data is hidden in app previews  
3. **Screen Recording Testing**: Validate screen recording prevention on critical flows
4. **Cross-Platform Testing**: Test protection effectiveness on both iOS and Android

### Automated Security Regression Tests
```typescript
// Security test suite for CI/CD pipeline
describe('Security Regression Tests', () => {
  it('should protect all mnemonic display components', () => {
    // Automated test ensuring all mnemonic components have protection
  });
  
  it('should never display plaintext mnemonics without protection', () => {
    // Static analysis test for unprotected sensitive data display
  });
});
```

## Residual Risk Analysis

### Post-Mitigation Risk Assessment

**Remaining Critical Risks:**
- **None** - With proper implementation, no critical screenshot-based risks remain

**Remaining High Risks:**
- **Rooted/Jailbroken Device Bypass**: Screenshots may still be possible on compromised devices
- **Mitigation**: Implement root detection and warnings

**Remaining Medium Risks:**
- **Social Engineering**: Users may disable protection or share information despite warnings
- **Advanced Malware**: Sophisticated malware may find alternative data extraction methods
- **Mitigation**: User education and advanced malware detection

**Remaining Low Risks:**
- **Platform API Changes**: Future OS updates may affect screenshot protection effectiveness
- **Performance Impact**: Minor performance overhead from protection mechanisms

### Acceptable Risk Thresholds
- **Financial Impact**: Zero tolerance for mnemonic exposure risks
- **Privacy Impact**: Minimal tolerance for balance/transaction exposure
- **Usability Impact**: Moderate tolerance for screenshot protection inconvenience

### Ongoing Monitoring Requirements
1. **Security Alert Monitoring**: Track new screenshot bypass techniques
2. **Platform Update Monitoring**: Monitor iOS/Android changes affecting protection
3. **User Feedback Analysis**: Monitor support requests related to screenshot needs
4. **Threat Intelligence**: Track wallet-specific malware evolution

### Future Security Considerations
1. **Quantum-Resistant Protection**: Prepare for post-quantum screenshot attack vectors
2. **AI-Enhanced Attacks**: Consider ML-based OCR and image analysis improvements
3. **Cross-Platform Evolution**: Monitor React Native and Expo security enhancements
4. **Regulatory Compliance**: Track emerging regulations requiring screenshot protection

## Conclusion

Screenshot protection implementation is **mandatory** for this cryptocurrency wallet application before production deployment. The current lack of protection represents an unacceptable security risk that could lead to complete wallet compromise.

**Strategic Recommendations:**
1. **Immediate Implementation**: Deploy critical screenshot protection within 1 week
2. **Comprehensive Coverage**: Protect all sensitive data display paths
3. **User Education**: Implement clear warnings about screenshot risks
4. **Ongoing Vigilance**: Establish monitoring for new screenshot attack vectors

**Implementation Priority:**
The recommended `expo-screen-capture` solution provides excellent balance of security, compatibility, and implementation simplicity. This approach should be prioritized over more complex third-party solutions for initial deployment.

**Security Posture Post-Implementation:**
With proper screenshot protection implementation, this wallet application will achieve industry-standard protection against screenshot-based attacks while maintaining excellent user experience and cross-platform compatibility.

The investment in screenshot protection is minimal compared to the catastrophic risk of mnemonic exposure, making this implementation both technically and economically justified for any production cryptocurrency wallet.