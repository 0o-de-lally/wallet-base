# Screen Capture Protection Security Specification

**Document Version:** 1.0  
**Date:** 2025-08-18  
**Scope:** Comprehensive screen capture protection system for cryptocurrency wallet application  
**Architecture:** Context-based protection with multi-layer security  

## Executive Summary

This specification defines the screen capture protection system implemented to secure sensitive data in the cryptocurrency wallet application. The system employs a multi-layered defense approach combining native OS protections, JavaScript-level coordination, and user experience safeguards.

**Key Security Objectives:**
- Prevent screenshot capture of cryptographic material (mnemonics, private keys)
- Protect financial data from screenshot-based reconnaissance 
- Secure authentication flows against visual capture attacks
- Provide app switcher preview protection via privacy overlays
- Maintain usability while enforcing defense-in-depth principles

## Architecture Overview

### Multi-Layer Defense Strategy

The protection system implements four complementary security layers:

1. **Native OS Layer (FLAG_SECURE)** - Android native screenshot prevention
2. **JavaScript Layer (expo-screen-capture)** - Cross-platform app-level protection
3. **Context Management Layer** - Centralized protection coordination
4. **Privacy Overlay Layer** - Background state protection

### Protection Level Hierarchy

```typescript
enum ProtectionLevel {
  NONE = 0,           // No protection active
  FINANCIAL = 1,      // Financial data (balances, transactions) 
  AUTHENTICATION = 2, // PIN entry, biometric authentication
  CRITICAL = 3        // Mnemonics, private keys, critical crypto material
}
```

**Escalation Principle:** The system automatically applies the highest protection level required by any active component.

## Technical Implementation

### 1. Context-Based Protection System

**File:** `/context/ScreenCaptureProtectionContext.tsx`

The `ScreenCaptureProtectionProvider` centralizes protection management:

- **Single Native Call:** One `usePreventScreenCapture` instead of multiple per-component calls
- **Automatic Escalation:** Highest protection level automatically applied
- **Performance Optimized:** Reduces redundant native API calls
- **Future-Ready:** Extensible for user preferences and dynamic rules

```typescript
// Components register protection requirements
useScreenCaptureProtection(
  "MnemonicDisplay",
  ProtectionLevel.CRITICAL, 
  true, // enableInDev
  "Seed phrase display"
);
```

### 2. Backward Compatible Hooks

**File:** `/hooks/use-screenshot-protection.ts`

Legacy hooks maintained for seamless migration:
- `useCriticalDataProtection()` - For mnemonics, private keys
- `useFinancialDataProtection()` - For balances, transaction data  
- `useAuthenticationProtection()` - For PIN entry, biometric flows

All legacy hooks now proxy to the context system for improved performance.

### 3. Native Protection Layer

**Android FLAG_SECURE Implementation**
**File:** `/plugins/withFlagSecure.js`

Build-time plugin injects native protection:
```java
getWindow().setFlags(
  WindowManager.LayoutParams.FLAG_SECURE, 
  WindowManager.LayoutParams.FLAG_SECURE
);
```

**Configuration:** `app.json`
```json
{
  "plugins": [
    "expo-screen-capture",
    "./plugins/withFlagSecure.js"
  ]
}
```

### 4. Privacy Overlay System

**File:** `/components/privacy/PrivacyOverlay.tsx`

Background state protection:
- Automatic activation when app goes to background
- Blur overlay prevents app switcher preview exposure
- Immediate activation for zero-exposure window
- Configurable intensity and messaging

## Security Threat Model

### Threat Categories

#### 1. Screenshot-Based Attacks
**Threat Level:** CRITICAL  
**Attack Vectors:**
- Malware with screenshot permissions
- Screen recording applications
- Remote access trojans with visual capture
- Compromised OS components

**Mitigations:**
- Native FLAG_SECURE enforcement (Android)
- expo-screen-capture coordination (iOS/Android)
- Multi-layer redundancy prevents single point of failure

#### 2. App Switcher Preview Exposure  
**Threat Level:** HIGH  
**Attack Vectors:**
- Physical device access during app switching
- Background screenshot capture during transitions
- Memory dumps containing preview images

**Mitigations:**
- Immediate blur overlay on background state
- Privacy message obscures sensitive content
- Zero-delay activation prevents exposure windows

#### 3. Screen Recording Attacks
**Threat Level:** HIGH  
**Attack Vectors:**
- Recording applications with elevated permissions
- Hardware-level screen capture (USB debugging, display mirroring)
- Social engineering for "screen sharing" during support

**Mitigations:**
- Same native protections block recording
- Visual indicators when protection active
- User education about screen sharing risks

#### 4. Shoulder Surfing Enhancement
**Threat Level:** MEDIUM  
**Attack Vectors:**
- Visual observation with screenshot confirmation
- High-resolution photo capture of screen content
- Binocular or telephoto observation

**Mitigations:**
- Protection removes screenshot confirmation option
- Forces attackers to rely purely on visual observation
- Reduces attack reliability and evidence collection

## Implementation Guidelines

### Component Protection Classification

#### Critical Protection (Level 3)
**Always Protected, Including Development Mode**

Components handling cryptographic material:
- `GeneratedMnemonicDisplay.tsx` - Seed phrase generation
- `RevealStatusUI.tsx` - Secret revelation interfaces  
- `SecretReveal.tsx` - Private key/mnemonic display
- `GeneratedMnemonicSection.tsx` - Recovery phrase display

```typescript
useCriticalDataProtection("ComponentName");
```

#### Authentication Protection (Level 2) 
**Production + Development Testing**

Authentication and access control:
- `PinCreationFlow.tsx` - PIN establishment
- `PinInputModal.tsx` - PIN entry dialogs
- `PinInputField.tsx` - PIN input components

```typescript  
useAuthenticationProtection("ComponentName");
```

#### Financial Protection (Level 1)
**Production Only (Dev Debugging Allowed)**

Financial data and transaction information:
- `AccountTotals.tsx` - Balance summaries
- `HistoricalTransactions.tsx` - Transaction history
- `AccountDetailsScreen.tsx` - Account overviews

```typescript
useFinancialDataProtection(true, "ComponentName");
```

### Development Mode Behavior

**Critical Data:** Always protected (enableInDev: true)
- Mnemonics, private keys remain protected during development
- Ensures security testing authenticity
- Prevents accidental exposure during demos/screenshots

**Authentication Data:** Always protected (enableInDev: true)  
- PIN flows protected during development
- Enables realistic security testing
- Maintains muscle memory for secure practices

**Financial Data:** Development allowed (enableInDev: false)
- Balances/transactions can be captured for debugging
- Facilitates UI/UX development and testing
- Non-critical for wallet security (public blockchain data)

## Testing and Validation

### Manual Testing Procedures

#### Screenshot Protection Validation
1. Navigate to component with protection active
2. Attempt screenshot via OS hotkey/gesture
3. Verify screenshot fails or shows blank/protected content
4. Check console logs for protection state confirmation

#### App Switcher Protection Validation
1. Open sensitive screen (mnemonic display)
2. Switch to another app (trigger background state)
3. Open app switcher/recent apps view
4. Verify wallet preview shows blur overlay with privacy message
5. Return to wallet - verify content properly restored

#### Multi-Component Protection Validation
1. Open multiple protected components simultaneously
2. Verify single protection activation (check console logs)
3. Close highest-protection component
4. Verify protection level adjusts to next-highest requirement
5. Verify complete deactivation when no components require protection

### Automated Testing Framework

**Test Categories:**
- Hook registration/unregistration cycles
- Protection level escalation logic
- Context provider integration
- Legacy hook compatibility
- Development mode overrides

**Testing Tools:**
- React Testing Library for hook testing
- Jest for protection logic validation
- Expo development builds for native protection verification

### Security Audit Checklist

#### Code Review
- [ ] All mnemonic display components use `useCriticalDataProtection`
- [ ] PIN entry components use `useAuthenticationProtection`  
- [ ] Financial components use appropriate protection levels
- [ ] No hardcoded protection bypasses or debug overrides in production
- [ ] Context provider properly wraps entire app in layout

#### Build Configuration
- [ ] `expo-screen-capture` plugin enabled in `app.json`
- [ ] `withFlagSecure.js` plugin configured and builds successfully
- [ ] Android permissions include only required security permissions
- [ ] No development-specific screenshot permissions in production builds

#### Runtime Verification
- [ ] Screenshot attempts fail on protected screens
- [ ] App switcher shows privacy overlay
- [ ] Multiple protection levels coordinate properly
- [ ] Performance impact minimal (single native protection call)
- [ ] Logging provides adequate debugging information

## Performance Considerations

### Optimization Features

**Single Native Protection Call**
- Context system makes one `usePreventScreenCapture` call
- Previous system: N calls for N protected components  
- Reduction in native bridge overhead

**Efficient State Management**
- Protection level calculated only when registrations change
- React state updates batched for multiple simultaneous changes
- Logging throttled to prevent console spam

**Memory Management**
- Component registrations automatically cleaned up on unmount
- Map-based storage for O(1) registration lookup
- No memory leaks from orphaned protection registrations

### Performance Monitoring

**Metrics to Track:**
- Protection state change frequency
- Number of simultaneous protected components
- Native bridge call frequency
- Memory usage of registration tracking

**Expected Overhead:**
- Negligible runtime performance impact
- Slightly larger bundle size (~2KB for context system)
- Minimal memory overhead (component registration map)

## Security Compliance and Standards

### Industry Standards Alignment

**NIST Cybersecurity Framework:**
- Protect (PR): Screen capture controls implement access control objectives
- Detect (DE): Logging provides audit trail for protection activities
- Respond (RS): Automatic escalation responds to highest threat level

**OWASP Mobile Top 10:**  
- M2 Insecure Data Storage: Prevents screenshots creating persistent sensitive data
- M4 Insecure Authentication: Protects PIN entry from visual capture
- M10 Extraneous Functionality: No debug/test screenshots in production

### Regulatory Considerations

**Financial Services Regulations:**
- Protection supports data privacy requirements
- Audit logging demonstrates due diligence 
- Technical safeguards align with cybersecurity frameworks

**Data Protection Regulations:**
- Screenshot prevention supports data minimization principles
- User control over financial data protection levels
- Privacy overlay protects against involuntary data exposure

## Maintenance and Updates

### Version Compatibility

**Expo SDK Compatibility:**
- Current implementation: Expo 53.0.20
- expo-screen-capture: ^7.2.0 (stable API)
- Quarterly compatibility testing recommended

**React Native Compatibility:**
- Current implementation: React Native 0.79.5
- Context API: Stable across React versions
- Native modules: Test with new RN releases

### Security Update Procedures

**Regular Security Reviews:**
- Quarterly assessment of protection effectiveness
- Annual threat model updates
- Continuous monitoring of related vulnerabilities

**Update Triggers:**
- New screenshot bypass techniques discovered
- OS security model changes
- Regulatory requirement changes
- Performance optimization opportunities

### Monitoring and Alerting

**Development Monitoring:**
- Console logging for protection state changes
- Component registration/unregistration tracking
- Performance impact measurement

**Production Monitoring:**
- Protection activation frequency metrics
- Error rates for native protection calls
- User experience impact measurement

## Conclusion

This screen capture protection system provides comprehensive defense against visual data capture attacks while maintaining application performance and developer experience. The multi-layered approach ensures redundancy, while the context-based architecture provides scalability and maintainability.

**Key Achievements:**
- ✅ Eliminated single points of failure through multi-layer defense
- ✅ Improved performance via centralized protection coordination
- ✅ Maintained backward compatibility for seamless adoption
- ✅ Provided comprehensive threat coverage from native to application layers
- ✅ Established clear security classification and implementation guidelines

**Next Steps:**
- Monitor production performance and user experience impact
- Implement user preference controls for financial data protection
- Extend protection to additional sensitive UI components as identified
- Regular security audits and threat model updates