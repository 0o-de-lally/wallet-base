/**
 * Phase 1 Security Implementation Test
 * 
 * This file provides manual testing functions to verify that Phase 1 
 * security improvements are working correctly.
 */

import { performPhase1Migration, getMigrationStatus } from "./phase1-migration";
import { validatePin } from "./pin-security";
import { checkLockoutStatus, recordFailedAttempt, resetRateLimiting } from "./pin-rate-limiting";
import { obfuscateKey, getAccountStorageKey } from "./key-obfuscation";
import { encryptWithPin, decryptWithPin, stringToUint8Array, uint8ArrayToBase64 } from "./crypto";
import { securityLog, devLog } from "./secure-logging";

export interface TestResult {
  testName: string;
  passed: boolean;
  details: string;
  error?: string;
}

/**
 * Test PIN complexity validation
 */
export async function testPinValidation(): Promise<TestResult> {
  try {
    const tests = [
      { pin: "123456", shouldPass: true, name: "6-digit PIN" },
      { pin: "12345", shouldPass: false, name: "5-digit PIN (too short)" },
      { pin: "abc123", shouldPass: true, name: "alphanumeric PIN" },
      { pin: "111111", shouldPass: false, name: "repeated digits" },
      { pin: "123456789012", shouldPass: true, name: "12-character PIN" },
      { pin: "1234567890123", shouldPass: false, name: "13-character PIN (too long)" },
      { pin: "123456!", shouldPass: false, name: "PIN with special characters" },
      { pin: "qwerty", shouldPass: false, name: "common sequence" }
    ];

    const results = tests.map(test => {
      const result = validatePin(test.pin);
      const passed = result.isValid === test.shouldPass;
      return { ...test, passed, result };
    });

    const allPassed = results.every(r => r.passed);
    const passedCount = results.filter(r => r.passed).length;

    return {
      testName: "PIN Validation",
      passed: allPassed,
      details: `${passedCount}/${tests.length} validation tests passed`,
      error: allPassed ? undefined : "Some PIN validation tests failed"
    };
  } catch (error) {
    return {
      testName: "PIN Validation",
      passed: false,
      details: "Test execution failed",
      error: error instanceof Error ? error.message : "Unknown error"
    };
  }
}

/**
 * Test rate limiting functionality
 */
export async function testRateLimiting(): Promise<TestResult> {
  try {
    // Reset rate limiting first
    await resetRateLimiting();

    // Check initial status
    let status = await checkLockoutStatus();
    if (status.isLockedOut) {
      return {
        testName: "Rate Limiting",
        passed: false,
        details: "Rate limiting not properly reset",
        error: "Initial lockout status should be false"
      };
    }

    // Record several failed attempts
    for (let i = 0; i < 3; i++) {
      await recordFailedAttempt();
    }

    status = await checkLockoutStatus();
    const attemptsWork = status.attemptsRemaining === 2; // Should have 2 remaining (5 - 3)

    // Record enough to trigger lockout
    await recordFailedAttempt();
    await recordFailedAttempt();
    
    status = await checkLockoutStatus();
    const lockoutWorks = status.isLockedOut && status.remainingTime > 0;

    // Clean up
    await resetRateLimiting();

    const passed = attemptsWork && lockoutWorks;

    return {
      testName: "Rate Limiting",
      passed,
      details: `Attempt tracking: ${attemptsWork ? 'PASS' : 'FAIL'}, Lockout: ${lockoutWorks ? 'PASS' : 'FAIL'}`,
      error: passed ? undefined : "Rate limiting not working correctly"
    };
  } catch (error) {
    return {
      testName: "Rate Limiting",
      passed: false,
      details: "Test execution failed",
      error: error instanceof Error ? error.message : "Unknown error"
    };
  }
}

/**
 * Test key obfuscation
 */
export async function testKeyObfuscation(): Promise<TestResult> {
  try {
    const testAccountId = "test123";
    const originalKey = `account_${testAccountId}`;
    
    // Test basic obfuscation
    const obfuscated1 = await obfuscateKey(originalKey, "account");
    const obfuscated2 = await obfuscateKey(originalKey, "account");
    
    // Should be deterministic (same input = same output)
    const isDeterministic = obfuscated1 === obfuscated2;
    
    // Should not be the original key
    const isObfuscated = obfuscated1 !== originalKey;
    
    // Should start with "obf_"
    const hasPrefix = obfuscated1.startsWith("obf_");
    
    // Test account-specific helper
    const accountKey = await getAccountStorageKey(testAccountId);
    const isAccountKeyObfuscated = accountKey !== originalKey && accountKey.startsWith("obf_");
    
    const passed = isDeterministic && isObfuscated && hasPrefix && isAccountKeyObfuscated;
    
    return {
      testName: "Key Obfuscation",
      passed,
      details: `Deterministic: ${isDeterministic ? 'PASS' : 'FAIL'}, Obfuscated: ${isObfuscated ? 'PASS' : 'FAIL'}, Prefix: ${hasPrefix ? 'PASS' : 'FAIL'}, Account helper: ${isAccountKeyObfuscated ? 'PASS' : 'FAIL'}`,
      error: passed ? undefined : "Key obfuscation not working correctly"
    };
  } catch (error) {
    return {
      testName: "Key Obfuscation",
      passed: false,
      details: "Test execution failed",
      error: error instanceof Error ? error.message : "Unknown error"
    };
  }
}

/**
 * Test new crypto implementation (per-record salt, no integrity token)
 */
export async function testCryptoImplementation(): Promise<TestResult> {
  try {
    const testData = "test mnemonic phrase for encryption";
    const testPin = "testpin123";
    
    const dataBytes = stringToUint8Array(testData);
    const pinBytes = stringToUint8Array(testPin);
    
    // Encrypt
    const encrypted = await encryptWithPin(dataBytes, pinBytes);
    
    // Check format: should be salt(16) + nonce(12) + ciphertext
    const hasCorrectFormat = encrypted.length >= 28; // minimum size
    
    // Decrypt with correct PIN
    const decrypted = await decryptWithPin(encrypted, pinBytes);
    const correctDecryption = decrypted && decrypted.verified && 
      new TextDecoder().decode(decrypted.value) === testData;
    
    // Try decrypt with wrong PIN
    const wrongPinBytes = stringToUint8Array("wrongpin");
    const wrongDecrypted = await decryptWithPin(encrypted, wrongPinBytes);
    const wrongPinRejected = !wrongDecrypted || !wrongDecrypted.verified;
    
    // Test multiple encryptions produce different outputs (due to random salt/nonce)
    const encrypted2 = await encryptWithPin(dataBytes, pinBytes);
    const differentOutputs = uint8ArrayToBase64(encrypted) !== uint8ArrayToBase64(encrypted2);
    
    const passed = hasCorrectFormat && !!correctDecryption && wrongPinRejected && differentOutputs;
    
    return {
      testName: "Crypto Implementation",
      passed,
      details: `Format: ${hasCorrectFormat ? 'PASS' : 'FAIL'}, Correct PIN: ${correctDecryption ? 'PASS' : 'FAIL'}, Wrong PIN rejection: ${wrongPinRejected ? 'PASS' : 'FAIL'}, Random outputs: ${differentOutputs ? 'PASS' : 'FAIL'}`,
      error: passed ? undefined : "Crypto implementation not working correctly"
    };
  } catch (error) {
    return {
      testName: "Crypto Implementation",
      passed: false,
      details: "Test execution failed",
      error: error instanceof Error ? error.message : "Unknown error"
    };
  }
}

/**
 * Test migration system
 */
export async function testMigration(): Promise<TestResult> {
  try {
    const status = await getMigrationStatus();
    
    // Should be able to get migration status without error
    const statusAvailable = typeof status.isComplete === 'boolean' && 
      Array.isArray(status.pendingMigrations);
    
    // Migration should be available to run
    const migration = await performPhase1Migration();
    const migrationRuns = typeof migration.success === 'boolean' && 
      Array.isArray(migration.migratedItems) && 
      Array.isArray(migration.errors) &&
      typeof migration.summary === 'string';
    
    const passed = statusAvailable && migrationRuns;
    
    return {
      testName: "Migration System",
      passed,
      details: `Status check: ${statusAvailable ? 'PASS' : 'FAIL'}, Migration execution: ${migrationRuns ? 'PASS' : 'FAIL'}`,
      error: passed ? undefined : "Migration system not working correctly"
    };
  } catch (error) {
    return {
      testName: "Migration System",
      passed: false,
      details: "Test execution failed",
      error: error instanceof Error ? error.message : "Unknown error"
    };
  }
}

/**
 * Run all Phase 1 tests
 */
export async function runPhase1Tests(): Promise<{
  overallPassed: boolean;
  results: TestResult[];
  summary: string;
}> {
  securityLog("Starting Phase 1 security tests");
  
  const tests = [
    testPinValidation,
    testRateLimiting,
    testKeyObfuscation,
    testCryptoImplementation,
    testMigration
  ];
  
  const results: TestResult[] = [];
  
  for (const test of tests) {
    try {
      const result = await test();
      results.push(result);
      devLog(`Test: ${result.testName} - ${result.passed ? 'PASS' : 'FAIL'}`);
      if (!result.passed && result.error) {
        devLog(`  Error: ${result.error}`);
      }
    } catch (error) {
      results.push({
        testName: test.name || "Unknown Test",
        passed: false,
        details: "Test failed to execute",
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
  }
  
  const passedCount = results.filter(r => r.passed).length;
  const totalCount = results.length;
  const overallPassed = passedCount === totalCount;
  
  const summary = `Phase 1 Security Tests: ${passedCount}/${totalCount} passed${overallPassed ? ' ✅' : ' ❌'}`;
  
  securityLog("Phase 1 tests completed", {
    overallPassed,
    passedCount,
    totalCount
  });
  
  return {
    overallPassed,
    results,
    summary
  };
}

/**
 * Quick validation that Phase 1 security is active
 */
export async function validatePhase1Security(): Promise<boolean> {
  try {
    // Quick checks that key security features are working
    const tests = await Promise.all([
      // Check PIN validation accepts new format
      Promise.resolve(validatePin("abc123").isValid),
      
      // Check key obfuscation works
      obfuscateKey("test", "test").then(key => key.startsWith("obf_")),
      
      // Check rate limiting is available
      checkLockoutStatus().then(status => typeof status.isLockedOut === 'boolean'),
      
      // Check crypto uses new format
      encryptWithPin(
        stringToUint8Array("test"), 
        stringToUint8Array("test123")
      ).then(encrypted => encrypted.length >= 28)
    ]);
    
    return tests.every(result => result === true);
  } catch (error) {
    devLog("Phase 1 security validation failed:", error);
    return false;
  }
}
