/**
 * Migration utility for Phase 1 security improvements
 *
 * Handles migration from legacy implementations to new secure implementations:
 * - Legacy PIN verification to rate-limited verification
 * - Old PBKDF2 format to new per-salt format
 * - Predictable keys to obfuscated keys
 * - Legacy logging to secure logging
 */

import { getValue, saveValue, deleteValue } from "./secure-store";
import { migrateToObfuscatedKey, getPinStorageKey } from "./key-obfuscation";
import { devLog, securityLog } from "./secure-logging";
import { reportErrorAuto } from "./error-utils";

export interface MigrationResult {
  success: boolean;
  migratedItems: string[];
  errors: string[];
  summary: string;
}

/**
 * Detects if data needs migration based on storage patterns
 */
export async function needsMigration(): Promise<{
  needsPinMigration: boolean;
  needsAccountMigration: boolean;
  legacyAccountKeys: string[];
}> {
  const result = {
    needsPinMigration: false,
    needsAccountMigration: false,
    legacyAccountKeys: [] as string[],
  };

  try {
    // Check for legacy PIN storage
    const legacyPin = await getValue("user_pin");
    if (legacyPin) {
      result.needsPinMigration = true;
    }

    // Look for legacy account patterns
    const allKeys = await getAllStorageKeys();
    const legacyAccountPattern = /^account_[a-zA-Z0-9]+$/;

    for (const key of allKeys) {
      if (legacyAccountPattern.test(key)) {
        result.legacyAccountKeys.push(key);
        result.needsAccountMigration = true;
      }
    }

    securityLog("Migration assessment completed", {
      needsPinMigration: result.needsPinMigration,
      needsAccountMigration: result.needsAccountMigration,
      legacyAccountCount: result.legacyAccountKeys.length,
    });
  } catch (error) {
    reportErrorAuto("migration.needsMigration", error);
  }

  return result;
}

/**
 * Get all storage keys (helper function)
 */
async function getAllStorageKeys(): Promise<string[]> {
  try {
    // Import here to avoid circular dependency
    const { getAllKeys } = await import("./secure-store");
    return await getAllKeys();
  } catch (error) {
    reportErrorAuto("migration.getAllStorageKeys", error);
    return [];
  }
}

/**
 * Migrates PIN storage to obfuscated key
 */
async function migratePinStorage(): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    const legacyPinData = await getValue("user_pin");
    if (!legacyPinData) {
      return { success: true }; // Nothing to migrate
    }

    // Get new obfuscated PIN key
    const newPinKey = await getPinStorageKey();

    // Move data to new key
    await saveValue(newPinKey, legacyPinData);

    // Verify the migration worked
    const verifyData = await getValue(newPinKey);
    if (verifyData !== legacyPinData) {
      throw new Error("PIN migration verification failed");
    }

    // Delete legacy key
    await deleteValue("user_pin");

    securityLog("PIN storage migrated to obfuscated key");
    return { success: true };
  } catch (error) {
    reportErrorAuto("migration.migratePinStorage", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Migrates account storage keys to obfuscated format
 */
async function migrateAccountStorage(legacyKeys: string[]): Promise<{
  success: boolean;
  migratedCount: number;
  errors: string[];
}> {
  const result = {
    success: true,
    migratedCount: 0,
    errors: [] as string[],
  };

  for (const legacyKey of legacyKeys) {
    try {
      const newKey = await migrateToObfuscatedKey(legacyKey, "account");
      if (newKey) {
        result.migratedCount++;
        devLog(`Migrated account key: ${legacyKey} -> ${newKey}`);
      } else {
        result.errors.push(
          `Failed to migrate ${legacyKey}: migration returned null`,
        );
        result.success = false;
      }
    } catch (error) {
      const errorMsg = `Failed to migrate ${legacyKey}: ${error instanceof Error ? error.message : "Unknown error"}`;
      result.errors.push(errorMsg);
      result.success = false;
      reportErrorAuto("migration.migrateAccountStorage", error, { legacyKey });
    }
  }

  securityLog("Account storage migration completed", {
    migratedCount: result.migratedCount,
    errorCount: result.errors.length,
  });

  return result;
}

/**
 * Performs complete Phase 1 migration
 */
export async function performPhase1Migration(): Promise<MigrationResult> {
  const result: MigrationResult = {
    success: true,
    migratedItems: [],
    errors: [],
    summary: "",
  };

  try {
    securityLog("Starting Phase 1 security migration");

    // Assess what needs migration
    const assessment = await needsMigration();

    // Migrate PIN storage if needed
    if (assessment.needsPinMigration) {
      const pinMigration = await migratePinStorage();
      if (pinMigration.success) {
        result.migratedItems.push("PIN storage (obfuscated key)");
      } else {
        result.errors.push(`PIN migration failed: ${pinMigration.error}`);
        result.success = false;
      }
    }

    // Migrate account storage if needed
    if (assessment.needsAccountMigration) {
      const accountMigration = await migrateAccountStorage(
        assessment.legacyAccountKeys,
      );
      if (accountMigration.success) {
        result.migratedItems.push(
          `${accountMigration.migratedCount} account storage keys (obfuscated)`,
        );
      } else {
        result.errors.push(...accountMigration.errors);
        result.success = false;
      }
    }

    // Create summary
    if (result.migratedItems.length === 0) {
      result.summary =
        "No migration needed - all data already using secure format";
    } else if (result.success) {
      result.summary = `Successfully migrated: ${result.migratedItems.join(", ")}`;
    } else {
      result.summary = `Partial migration completed with ${result.errors.length} errors`;
    }

    securityLog("Phase 1 migration completed", {
      success: result.success,
      migratedCount: result.migratedItems.length,
      errorCount: result.errors.length,
    });
  } catch (error) {
    result.success = false;
    result.errors.push(
      `Migration failed: ${error instanceof Error ? error.message : "Unknown error"}`,
    );
    result.summary = "Migration failed due to unexpected error";
    reportErrorAuto("migration.performPhase1Migration", error);
  }

  return result;
}

/**
 * Checks if data has been migrated to Phase 1 format
 * @internal - Currently unused but kept for potential status checks
 */
/*
async function isPhase1Migrated(): Promise<boolean> {
  try {
    const assessment = await needsMigration();
    return !assessment.needsPinMigration && !assessment.needsAccountMigration;
  } catch (error) {
    reportErrorAuto("migration.isPhase1Migrated", error);
    return false;
  }
}
*/

/**
 * Gets migration status for display
 */
export async function getMigrationStatus(): Promise<{
  isComplete: boolean;
  pendingMigrations: string[];
  lastMigrationDate?: string;
}> {
  try {
    const assessment = await needsMigration();
    const pendingMigrations: string[] = [];

    if (assessment.needsPinMigration) {
      pendingMigrations.push("PIN storage security upgrade");
    }

    if (assessment.needsAccountMigration) {
      pendingMigrations.push(
        `${assessment.legacyAccountKeys.length} account keys security upgrade`,
      );
    }

    // Check for migration timestamp
    let lastMigrationDate: string | undefined;
    try {
      const migrationTimestamp = await getValue("last_migration_timestamp");
      if (migrationTimestamp) {
        lastMigrationDate = new Date(
          parseInt(migrationTimestamp),
        ).toISOString();
      }
    } catch {
      // Ignore error - this is optional info
    }

    return {
      isComplete: pendingMigrations.length === 0,
      pendingMigrations,
      lastMigrationDate,
    };
  } catch (error) {
    reportErrorAuto("migration.getMigrationStatus", error);
    return {
      isComplete: false,
      pendingMigrations: ["Unable to assess migration status"],
    };
  }
}

/**
 * Records successful migration timestamp
 * @internal - Currently unused but kept for potential migration tracking
 */
/*
async function recordMigrationCompletion(): Promise<void> {
  try {
    await saveValue("last_migration_timestamp", Date.now().toString());
    securityLog("Migration completion recorded");
  } catch (error) {
    reportErrorAuto("migration.recordMigrationCompletion", error);
  }
}
*/
