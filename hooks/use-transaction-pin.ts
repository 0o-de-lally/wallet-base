import { useState, useCallback } from "react";
import { getValue } from "../util/secure-store";
import { secureDecryptWithPin, verifyStoredPin } from "../util/pin-security";
import { useModal } from "../context/ModalContext";
import { reportErrorAuto } from "../util/error-utils";

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

  const getStorageKey = useCallback((id: string) => `account_${id}`, []);

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
        const isPinValid = await verifyStoredPin(pin);
        if (!isPinValid) {
          showAlert("Error", "Invalid PIN. Please try again.");
          setIsLoading(false);
          return;
        }

        // Get the encrypted mnemonic from storage
        const key = getStorageKey(accountId);
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
    [accountId, getStorageKey, showAlert, onMnemonicRetrieved],
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
