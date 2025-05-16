# Migrating from Expo to Pure React Native

This document outlines the step-by-step process for migrating our wallet application from Expo to a pure React Native implementation. This will remove our dependency on Expo while maintaining all existing functionality.

## Table of Contents
1. [Pre-Migration Preparation](#1-pre-migration-preparation)
2. [Setting Up the New React Native Project](#2-setting-up-the-new-react-native-project)
3. [Migration Steps by Feature](#3-migration-steps-by-feature)
   - [Navigation (expo-router to react-navigation)](#31-navigation-expo-router-to-react-navigation)
   - [Secure Storage](#32-secure-storage)
   - [Local Authentication](#33-local-authentication)
   - [Cryptography](#34-cryptography)
   - [Splash Screen](#35-splash-screen)
4. [Project Structure Migration](#4-project-structure-migration)
5. [Testing the Migration](#5-testing-the-migration)
6. [Post-Migration Optimization](#6-post-migration-optimization)
7. [Troubleshooting Common Issues](#7-troubleshooting-common-issues)

## 1. Pre-Migration Preparation

### Backup and Version Control
- [ ] Ensure the entire project is committed to version control
- [ ] Create a dedicated branch for the migration work
- [ ] Consider creating a backup of the entire project directory

### Analyze Expo Dependencies
- [ ] List all Expo dependencies and identify their React Native equivalents:

| Expo Package | React Native Alternative |
| --- | --- |
| expo | (N/A - core package) |
| expo-router | @react-navigation/native + stack/bottom-tab/drawer navigators |
| expo-secure-store | react-native-keychain or react-native-encrypted-storage |
| expo-local-authentication | react-native-biometrics |
| expo-crypto | react-native-crypto or crypto-js with polyfills |
| expo-splash-screen | react-native-splash-screen |

### Testing Setup
- [ ] Set up a testing strategy for verifying functionality after migration
- [ ] Create a checklist of critical app features to validate
- [ ] Set up device testing on both iOS and Android

## 2. Setting Up the New React Native Project

### Initialize New React Native Project
```bash
npx react-native init WalletApp --template react-native-template-typescript
```

### Basic Configuration
- [ ] Setup TypeScript configuration similar to the Expo project
- [ ] Initialize ESLint and Prettier with the same rules as the current project
- [ ] Set up folder structure to match the current project for easier migration

### Add Core Dependencies
```bash
yarn add @react-navigation/native @react-navigation/stack @react-navigation/native-stack
yarn add react-native-screens react-native-safe-area-context
yarn add @legendapp/state
yarn add @noble/ciphers @noble/hashes
yarn add react-native-mmkv
yarn add react-native-reanimated

# Install specific replacements for Expo packages
yarn add react-native-keychain
yarn add react-native-biometrics
yarn add react-native-splash-screen
yarn add @react-native-async-storage/async-storage

# Install dev dependencies
yarn add -D @types/react @types/react-native typescript eslint prettier
```

### Link Native Dependencies
React Native auto-links most dependencies, but verify proper linking:

```bash
cd ios && pod install && cd ..
```

### Configure Native Code
- [ ] Update iOS Podfile with any required configurations
- [ ] Update iOS Info.plist with required permissions (Face ID, etc.)
- [ ] Update Android build.gradle with required configurations
- [ ] Add required Android permissions in AndroidManifest.xml

## 3. Migration Steps by Feature

### 3.1 Navigation (expo-router to react-navigation)

#### Steps:
1. Create a navigation container structure:

```jsx
// App.tsx
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { MainNavigator } from './navigation/MainNavigator';
import { ModalProvider } from './context/ModalContext';

function App() {
  return (
    <ModalProvider>
      <NavigationContainer>
        <MainNavigator />
      </NavigationContainer>
    </ModalProvider>
  );
}

export default App;
```

2. Set up stack navigation to replace expo-router:

```jsx
// navigation/MainNavigator.tsx
import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import HomeScreen from '../screens/HomeScreen';
import PinScreen from '../screens/PinScreen';
import ProfilesScreen from '../screens/ProfilesScreen';
import CreateAccountScreen from '../screens/CreateAccountScreen';
import AccountSettingsScreen from '../screens/AccountSettingsScreen';

const Stack = createNativeStackNavigator();

export function MainNavigator() {
  return (
    <Stack.Navigator>
      <Stack.Screen
        name="Home"
        component={HomeScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="PIN"
        component={PinScreen}
        options={{ title: 'PIN', headerBackTitle: 'Back' }}
      />
      <Stack.Screen
        name="Profiles"
        component={ProfilesScreen}
        options={{ title: 'Profiles' }}
      />
      <Stack.Screen
        name="CreateAccount"
        component={CreateAccountScreen}
        options={{ title: 'Create Account' }}
      />
      <Stack.Screen
        name="AccountSettings"
        component={AccountSettingsScreen}
        options={{ title: 'Account Settings' }}
      />
    </Stack.Navigator>
  );
}
```

3. Update all navigation calls:
   - Replace `router.navigate('/pin')` with `navigation.navigate('PIN')`
   - Replace `useRouter()` with `useNavigation()`

#### Validation:
- [ ] All screens are accessible
- [ ] Navigation stack works properly (back button, etc.)
- [ ] Screen transitions work as expected
- [ ] Navigation parameters are passed correctly

### 3.2 Secure Storage

Replace `expo-secure-store` with `react-native-keychain`:

#### Steps:
1. Create a secure-store adapter:

```typescript
// util/secure-store.ts
import * as Keychain from 'react-native-keychain';

export async function saveValue(key: string, value: string): Promise<void> {
  try {
    await Keychain.setInternetCredentials(
      key,
      key, // username (using key as the username)
      value
    );
  } catch (error) {
    console.error("Error saving to secure store:", error);
    throw error;
  }
}

export async function getValue(key: string): Promise<string | null> {
  try {
    const result = await Keychain.getInternetCredentials(key);
    return result ? result.password : null;
  } catch (error) {
    console.error("Error retrieving from secure store:", error);
    throw error;
  }
}

export async function deleteValue(key: string): Promise<void> {
  try {
    await Keychain.resetInternetCredentials(key);
  } catch (error) {
    console.error("Error deleting from secure store:", error);
    throw error;
  }
}

export async function clearAllSecureStorage(): Promise<void> {
  try {
    await Keychain.resetGenericPassword();
  } catch (error) {
    console.error("Error clearing secure store:", error);
    throw error;
  }
}
```

#### Validation:
- [ ] Can save values securely
- [ ] Can retrieve saved values
- [ ] Can delete values
- [ ] Storage persists across app restarts

### 3.3 Local Authentication

Replace `expo-local-authentication` with `react-native-biometrics`:

#### Steps:
1. Create a local-auth adapter:

```typescript
// util/local-auth.ts
import ReactNativeBiometrics, { BiometryTypes } from 'react-native-biometrics';
import { Platform } from 'react-native';

const rnBiometrics = new ReactNativeBiometrics({ allowDeviceCredentials: true });

export async function hasHardwareAsync(): Promise<boolean> {
  try {
    const { available } = await rnBiometrics.isSensorAvailable();
    return available;
  } catch (error) {
    console.error('Error checking hardware:', error);
    return false;
  }
}

export async function isEnrolledAsync(): Promise<boolean> {
  try {
    const { available } = await rnBiometrics.isSensorAvailable();
    return available;
  } catch (error) {
    console.error('Error checking enrollment:', error);
    return false;
  }
}

export async function authenticateAsync(options: {
  promptMessage: string;
  fallbackLabel?: string;
}): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    const { success } = await rnBiometrics.simplePrompt({
      promptMessage: options.promptMessage,
      cancelButtonText: 'Cancel'
    });

    return { success };
  } catch (error) {
    console.error('Authentication error:', error);
    return {
      success: false,
      error: String(error)
    };
  }
}
```

2. Update the `useLocalAuth` hook:

```typescript
// hooks/use-local-auth.ts
import { useState, useCallback, useEffect } from 'react';
import * as LocalAuthentication from '../util/local-auth';
import { Platform } from 'react-native';
import { useModal } from '../context/ModalContext';

export function useLocalAuth() {
  // ... keep the rest of the implementation similar,
  // but update the function calls to use the new adapter
}
```

#### Validation:
- [ ] Biometric prompt appears correctly
- [ ] Authentication success is handled properly
- [ ] Authentication failure is handled properly
- [ ] Fallback to PIN/password works on devices without biometrics

### 3.4 Cryptography

Replace `expo-crypto` with direct imports of `@noble/ciphers` and `@noble/hashes` (which are already being used):

#### Steps:
1. You're already using `@noble/ciphers` and `@noble/hashes` which are platform-agnostic, so minimal changes are needed here
2. Ensure any direct uses of `expo-crypto` are replaced with the appropriate noble implementation

#### Validation:
- [ ] All encryption/decryption operations work correctly
- [ ] Hash functions produce the expected outputs
- [ ] Security utils function properly

### 3.5 Splash Screen

Replace `expo-splash-screen` with `react-native-splash-screen`:

#### Steps:
1. Set up native splash screen files:
   - iOS: Add splash screen images to `LaunchScreen.storyboard`
   - Android: Configure `res/layout/launch_screen.xml`

2. Initialize in native code:
   - iOS: Update AppDelegate.m
   - Android: Update MainActivity.java

3. Control from JavaScript:

```typescript
// App.tsx
import React, { useEffect } from 'react';
import SplashScreen from 'react-native-splash-screen';

function App() {
  useEffect(() => {
    // Hide splash screen when app is ready
    SplashScreen.hide();
  }, []);

  // ... rest of your app
}
```

#### Validation:
- [ ] Splash screen displays on app startup
- [ ] Splash screen hides when app is ready
- [ ] Visuals match the original splash screen

## 4. Project Structure Migration

### Move App Code
- [ ] Migrate screens from `app/` directory to a new `screens/` directory
- [ ] Keep the same component structure in `components/` directory
- [ ] Keep utilities in `util/` directory
- [ ] Migrate contexts to use React Navigation's integration where appropriate

### Update Imports
- [ ] Update all import statements to reflect new file structure
- [ ] Replace Expo imports with their React Native alternatives
- [ ] Ensure all relative paths are correct

### Asset Migration
- [ ] Move assets from `assets/` directory to appropriate locations in the React Native project:
  - Font files to `android/app/src/main/assets/fonts/` and link for iOS
  - Images to appropriate resource directories

## 5. Testing the Migration

### Feature Testing Checklist
- [ ] User authentication flow works (biometrics/PIN)
- [ ] Profile management functions properly
- [ ] Account creation works
- [ ] Secure storage saves and retrieves data correctly
- [ ] Navigation between all screens works
- [ ] PIN management functionality works
- [ ] All UI components render correctly
- [ ] Modals and popups work as expected
- [ ] Error handling works properly

### Platform-Specific Testing
- [ ] Test on iOS (multiple devices if possible)
- [ ] Test on Android (multiple devices if possible)
- [ ] Verify platform-specific behaviors (like biometrics)

### Performance Testing
- [ ] Measure and compare startup time
- [ ] Evaluate memory usage
- [ ] Test responsiveness of UI interactions
- [ ] Verify animations work smoothly

## 6. Post-Migration Optimization

### Bundle Size Optimization
- [ ] Analyze bundle size with tools like `react-native-bundle-visualizer`
- [ ] Implement code splitting where appropriate
- [ ] Remove unused dependencies

### Performance Enhancements
- [ ] Implement UI thread optimization (useNativeDriver for animations)
- [ ] Optimize list rendering with memo, virtualization
- [ ] Implement proper asset caching strategies

### DevOps Update
- [ ] Update build scripts in package.json
- [ ] Configure CI/CD for the React Native project
- [ ] Update deployment workflows for both platforms

## 7. Troubleshooting Common Issues

### Common Navigation Issues
- React Navigation requires explicit type definitions for route params
- Stack navigation behavior differs from Expo Router in some edge cases

### Common Biometrics Issues
- Android requires explicit permissions in AndroidManifest.xml
- iOS requires proper Info.plist configurations

### Common Keychain Issues
- Setting up keychain sharing on iOS if needed
- Android keystore initialization issues

### Build Issues
- iOS Podfile configuration problems
- Android Gradle version mismatches

### React Native Upgrades
- Plan for regular React Native version upgrades
- Test thoroughly after each upgrade

---

This migration guide provides a comprehensive roadmap for transitioning from Expo to pure React Native. By following these steps carefully and validating each component after migration, you can ensure a smooth transition with minimal disruption to app functionality.
