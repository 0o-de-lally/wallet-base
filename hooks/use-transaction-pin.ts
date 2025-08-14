import { useState, useCallback } from "react";
import { getValue } from "../util/secure-store";
import { secureDecryptWithPin, verifyStoredPin } from "../util/pin-security";
import { useModal } from "../context/ModalContext";
import { reportErrorAuto } from "../util/error-utils";
import {
  getAccountStorageKey,
  migrateToObfuscatedKey,
} from "../util/key-obfuscation";

interface UseTransactionPinProps {
  accountId: string;
  onMnemonicRetrieved: (mnemonic: string) => void;
}

export function useTransactionPin({
  accountId,
  onMnemonicRetrieved,
}: UseTransactionPinProps) {
  const { showAlert } = useModal();
  const [pinModalVisible, setPinModalVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  /**
   * Resolves the current storage key for an account, migrating from legacy
   * predictable key (account_<id>) to obfuscated key if necessary.
   */
  const resolveStorageKey = useCallback(async (id: string): Promise<string> => {
    const legacyKey = `account_${id}`;

    try {
      const legacyValue = await getValue(legacyKey);
      if (legacyValue) {
        // Attempt migration to obfuscated key
        const migrated = await migrateToObfuscatedKey(legacyKey, "account");
        if (migrated) {
          return migrated;
        }
        // Fallback: legacy key still (migration failed)
        return legacyKey;
      }
    } catch (e) {
      // Ignore and proceed to generate obfuscated key
    }

    // Generate (or reuse existing) obfuscated key
    return await getAccountStorageKey(id);
  }, []);

  const requestMnemonicWithPin = useCallback(() => {
    setPinModalVisible(true);
  }, []);

  const handlePinSubmit = useCallback(
    async (pin: string) => {
      if (!pin.trim() || !accountId) {
        showAlert("Error", "PIN and account ID are required");
        return;
      }

      setIsLoading(true);

      try {
        // Verify the PIN first
        const pinResult = await verifyStoredPin(pin);
        if (!pinResult.isValid) {
          showAlert("Error", "Invalid PIN. Please try again.");
          setIsLoading(false);
          return;
        }

        // Resolve (and possibly migrate) storage key
        const key = await resolveStorageKey(accountId);
        const encryptedMnemonic = await getValue(key);

        if (!encryptedMnemonic) {
          showAlert(
            "Error",
            "No stored mnemonic found for this account. This account may be view-only.",
          );
          setPinModalVisible(false);
          setIsLoading(false);
          return;
        }

        // Decrypt the mnemonic using the PIN
        const decryptResult = await secureDecryptWithPin(
          encryptedMnemonic,
          pin,
        );

        if (!decryptResult || !decryptResult.verified || !decryptResult.value) {
          showAlert(
            "Error",
            "Failed to decrypt mnemonic. Invalid PIN or corrupted data.",
          );
          setIsLoading(false);
          return;
        }

        // Successfully retrieved mnemonic
        setPinModalVisible(false);
        setIsLoading(false);
        onMnemonicRetrieved(decryptResult.value);
      } catch (error) {
        console.error("Error retrieving mnemonic with PIN:", error);
        const errorMessage =
          error instanceof Error ? error.message : "Unknown error";
        showAlert("Error", `Failed to retrieve mnemonic: ${errorMessage}`);
        reportErrorAuto("useTransactionPin.handlePinSubmit", error, {
          accountId,
        });
        setIsLoading(false);
      }
    },
    [accountId, resolveStorageKey, showAlert, onMnemonicRetrieved],
  );

  const closePinModal = useCallback(() => {
    setPinModalVisible(false);
    setIsLoading(false);
  }, []);

  return {
    pinModalVisible,
    isLoading,
    requestMnemonicWithPin,
    handlePinSubmit,
    closePinModal,
  };
}
