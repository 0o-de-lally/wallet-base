# E2E Testing Documentation

## Testing Philosophy

The project follows a **"Test on Real Emulators, Never Mocks"** philosophy:

- **Real Environment Testing**: All E2E tests run against actual Android emulators, not mocked environments
- **Production-Like Conditions**: Tests use the same runtime environment that users experience
- **Hardware Integration**: Tests validate real device capabilities including secure storage, biometrics, and hardware-backed encryption
- **Complete Stack Testing**: Tests verify the entire application stack from UI to blockchain integration

### Why Mobile App Testing is Complex

Testing mobile apps is inherently challenging, and testing blockchain mobile apps with production settings compounds this complexity significantly. We've designed our test harness to address these fundamental issues:

#### The Node.js Cryptography Problem

We **never use JavaScript test environments** because they fundamentally cannot replicate the mobile runtime:

- **Different Cryptographic Implementations**: Node.js uses completely different cryptographic libraries than React Native/mobile platforms
- **Missing Hardware Integration**: Node.js cannot access device-specific security features like hardware-backed keystores
- **Platform Inconsistencies**: Cryptographic operations that work in Node.js may fail or behave differently on actual devices

#### The Mocking Trap

Traditional JS testing requires extensive mocking of essential mobile components:

- **Secure Storage Mocking**: Cannot replicate the actual security guarantees of Expo SecureStore or Android Keystore
- **Biometric Authentication**: Impossible to mock Face ID/TouchID behavior and security flows
- **Hardware Entropy**: Random number generation differs significantly between Node.js and mobile platforms
- **Network Conditions**: Mobile network behavior (cellular, WiFi switching) cannot be accurately simulated

#### Blockchain Integration Complexity

Testing against production blockchain settings introduces additional challenges:

- **Network Latency**: Production blockchain networks have real latency and congestion
- **Transaction Costs**: Real networks require actual tokens for testing
- **State Persistence**: Blockchain state affects subsequent tests
- **API Rate Limits**: Production APIs have throttling and authentication requirements

## Tool Choice: Maestro

**Maestro** was chosen as the E2E testing framework because it's a **"one-stop shop"** solution:

- **Unified Testing**: Single tool for mobile app automation across Android/iOS
- **Declarative YAML**: Simple, readable test definitions (`maestro/home.yaml`)
- **Built-in Waits**: Advanced waiting mechanisms for app states and UI elements
- **No Code Required**: Tests written in YAML configuration files
- **Cross-Platform**: Works consistently across different mobile platforms

### Current Test Coverage

The main test case (`maestro/home.yaml:testing/e2e-harness.ts:74`) validates:
- App launch functionality
- PIN Management screen accessibility
- Extended wait handling (5-minute timeout for complex initialization)

## Architecture

### Comprehensive Test Harness Solution

Our test harness addresses mobile blockchain testing complexity through a **5-stage orchestrated process**:

1. **Build the App** - Compile and bundle the React Native application
2. **Start an Emulator** - Launch Android Virtual Device with proper configuration  
3. **Install App on Emulator** - Deploy the built application to the running emulator
4. **Drive the App** - Execute user interaction flows via Maestro automation
5. **Start Ephemeral Twin Blockchains** - Spin up Docker-based blockchain nodes for API testing

### E2E Test Harness (`testing/e2e-harness.ts`)

The test harness orchestrates these components in sequence:

1. **Android Emulator Management** (`testing/e2e-harness.ts:30-43`)
   - Spawns emulator with CI-specific configurations
   - Handles headless mode for GitHub Actions (`-no-window` flag)
   - Uses dynamic AVD selection (first available)
   - Waits for complete device boot cycle

2. **Expo Development Server** (`testing/e2e-harness.ts:45-70`)
   - Starts bundler and builds Android app
   - Monitors stdout for "Android Bundled" completion signal
   - Automatically installs app on connected emulator
   - Provides development-mode app deployment

3. **Maestro Test Execution** (`testing/e2e-harness.ts:72-83`)
   - Runs Maestro tests against live emulator
   - Executes tests from `./maestro` directory
   - Returns proper exit codes for CI integration

### Ephemeral Blockchain Infrastructure

To solve blockchain testing challenges, we deploy **ephemeral twin blockchains** using Docker:

- **Isolated Test Networks**: Each test run gets fresh blockchain state
- **Production-Like APIs**: Real blockchain node endpoints without production costs
- **Controlled Environment**: Predictable network conditions and unlimited test tokens
- **Parallel Execution**: Multiple test instances can run simultaneously
- **Automatic Cleanup**: Docker containers are destroyed after test completion

This approach provides production-realistic blockchain behavior while maintaining test isolation and repeatability.

### Process Management

- **Lifecycle Management**: All processes (emulator, expo, maestro) are tracked and cleaned up
- **Signal Handling**: SIGINT and exit handlers ensure proper resource cleanup (`testing/e2e-harness.ts:18-28`)
- **Error Propagation**: Failed processes terminate the entire test suite with appropriate exit codes

## Local Development Challenges

### Emulator Spawning Difficulties

**Problem**: Most developer machines struggle with Android emulator setup:
- Hardware virtualization requirements
- AVD configuration complexity  
- Resource-intensive emulator processes
- Platform-specific emulator tooling

**Solution**: Helper scripts and automated tooling:
- `bun run emulator` - Automated emulator startup (`package.json:8`)
- Dynamic AVD detection in test harness
- CI-specific headless configurations

### GitHub CI Helpers

The CI environment includes specialized helpers:
- **Headless Mode**: Emulator runs without UI (`-no-window` flag)
- **Device Boot Waiting**: `waitForDeviceBoot()` function ensures emulator is ready (`testing/e2e-harness.ts:3-12`)
- **ADB Integration**: Uses Android Debug Bridge for device state monitoring
- **Resource Management**: Automatic process cleanup prevents CI resource leaks

## Usage

### Local Testing
```bash
bun run e2e  # Runs complete E2E test suite
```

### CI Integration
The harness automatically detects CI environment (`process.env.CI === "true"`) and:
- Runs emulator in headless mode
- Uses appropriate timeouts for slower CI machines
- Provides proper exit codes for build status

This architecture ensures reliable, maintainable E2E testing that closely mirrors production environments while handling the complexity of mobile emulator management.