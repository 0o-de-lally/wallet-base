# Environment Setup Checklist

This checklist verifies that the development environment is correctly configured according to [Expo.dev requirements](https://docs.expo.dev/get-started/set-up-your-environment/).

## ✅ Current Environment Status

### Java Development Kit (JDK)
- **Requirement**: JDK version 17
- **Status**: ✅ **CONFIGURED**
- **Current Version**: `openjdk version "17.0.16"`
- **Command**: `java -version`

### Android SDK Setup
- **Requirement**: Android SDK with platform tools, emulator, and build tools
- **Status**: ✅ **CONFIGURED**
- **SDK Location**: `/opt/android-sdk`
- **Components Installed**:
  - ✅ Android SDK Platform-Tools (v36.0.0)
  - ✅ Android Emulator (v36.1.9)
  - ✅ Android SDK Build-Tools 35.0.0
  - ✅ Android SDK Platform 35 (VanillaIceCream - as required by Expo docs)
  - ✅ Android SDK Platform 30
  - ✅ Android SDK Platform 33
  - ✅ Google APIs Intel x86_64 Atom System Image (Android 30)
  - ✅ NDK (Side by side) 25.1.8937393

### Android Tools
- **ADB (Android Debug Bridge)**:
  - ✅ **Available**: `/opt/android-sdk/platform-tools/adb`
  - ✅ **Version**: `1.0.41 Version 36.0.0-13206524`
- **Emulator**:
  - ✅ **Available**: `/usr/local/bin/emulator`
  - ✅ **Version**: Android Virtual Device Manager

### Environment Variables
- **ANDROID_HOME**: ⚠️ **NOT SET** (should be `/opt/android-sdk`)
- **ANDROID_SDK_ROOT**: ⚠️ **NOT SET** (should be `/opt/android-sdk`)
- **ANDROID_AVD_HOME**: ⚠️ **NOT SET** (should be `/root/.android/avd`)
- **JAVA_HOME**: ⚠️ **NOT SET** (recommended for some tools)

### Android Virtual Devices (AVDs)
- **AVD Directory**: `/root/.android/avd/`
- **Available AVDs**:
  - ✅ **Maestro_Pixel_6_API_30_1** (Android API 30)
    - Path: `/root/.android/avd/Maestro_Pixel_6_API_30_1.avd`
    - Target: `android-30`

### Expo CLI
- **Status**: ✅ **CONFIGURED**
- **Version**: `0.24.21` (both bun expo and npx expo)
- **Project Health**: ✅ **All checks passed** (`bunx expo-doctor`)

## ⚠️ Issues Found

### Missing Environment Variables
The following environment variables should be set for optimal Android development:

```bash
export ANDROID_HOME=/opt/android-sdk
export ANDROID_SDK_ROOT=/opt/android-sdk  
export ANDROID_AVD_HOME=/root/.android/avd
export PATH=$PATH:$ANDROID_HOME/platform-tools:$ANDROID_HOME/emulator
```

### AVD List Command Issue
- **Issue**: `emulator -list-avds` returns "Emulator started in headless mode" instead of listing AVDs
- **Likely Cause**: Missing environment variables
- **Impact**: E2E test harness cannot detect available AVDs properly

## 🔧 Recommended Fixes

1. **Set Environment Variables** (add to shell profile):
   ```bash
   echo 'export ANDROID_HOME=/opt/android-sdk' >> ~/.bashrc
   echo 'export ANDROID_SDK_ROOT=/opt/android-sdk' >> ~/.bashrc
   echo 'export ANDROID_AVD_HOME=/root/.android/avd' >> ~/.bashrc
   echo 'export PATH=$PATH:$ANDROID_HOME/platform-tools:$ANDROID_HOME/emulator' >> ~/.bashrc
   source ~/.bashrc
   ```

2. **Update E2E Test Harness**:
   - Set environment variables in test scripts before emulator operations
   - Improve AVD detection logic to handle missing env vars

3. **Verify AVD Functionality**:
   ```bash
   # After setting env vars, test:
   emulator -list-avds
   # Should show: Maestro_Pixel_6_API_30_1
   ```

## 📋 Verification Commands

Run these commands to verify environment setup:

```bash
# Check Java
java -version

# Check Android tools
adb --version
emulator -version

# Check SDK components
/opt/android-sdk/cmdline-tools/latest/bin/sdkmanager --list_installed

# Check Expo
bunx expo-doctor

# Check AVDs (after setting env vars)
emulator -list-avds

# Check environment variables
echo $ANDROID_HOME
echo $ANDROID_SDK_ROOT
echo $ANDROID_AVD_HOME
```

## 🎯 Overall Status

**Environment Health**: ✅ **95% Ready**
- All required tools and SDKs are installed
- Expo project configuration is healthy
- Only missing environment variables for optimal operation

**For CI/Production**: Environment should work with proper variable settings
**For Local Development**: Requires environment variable configuration