import React, { memo, useState, useEffect } from "react";
import { View } from "react-native";
import { styles } from "../../styles/styles";
import { FormInput } from "../common/FormInput";
import { MnemonicInput } from "../common/MnemonicInput";
import { MnemonicManagement } from "./MnemonicManagement";
import { ActionButton } from "../common/ActionButton";

interface SecureStorageFormProps {
  value: string;
  onValueChange: (text: string) => void;
  onSave: () => void;
  onDelete: () => void;
  onScheduleReveal?: () => void;
  onClearAll: () => void;
  checkHasStoredData: (accountId: string) => Promise<boolean>;
  isLoading: boolean;
  disabled?: boolean;
  accountId: string;
  accountName?: string;
}

export const SecureStorageForm = memo(
  ({
    value,
    onValueChange,
    onSave,
    onDelete,
    onScheduleReveal,
    onClearAll,
    checkHasStoredData,
    isLoading,
    disabled = false,
    accountId,
    accountName,
  }: SecureStorageFormProps) => {
    const [isMnemonicValid, setIsMnemonicValid] = useState(false);
    const [isMnemonicVerified, setIsMnemonicVerified] = useState(false);
    const [hasStoredData, setHasStoredData] = useState(false);
    const [isCheckingData, setIsCheckingData] = useState(true);

    const handleValidationChange = (isValid: boolean, isVerified: boolean) => {
      setIsMnemonicValid(isValid);
      setIsMnemonicVerified(isVerified);
    };

    const handleRotateMnemonic = () => {
      // For rotation, we first delete the existing data, then allow new input
      setHasStoredData(false);
      onValueChange(''); // Clear any current input
    };

    const handleClearAll = async () => {
      // Call the original clear all function
      onClearAll();
      // After clearing, refresh the stored data state
      try {
        const hasData = await checkHasStoredData(accountId);
        setHasStoredData(hasData);
      } catch (error) {
        console.error('Error checking stored data after clear:', error);
        setHasStoredData(false);
      }
    };

    // Check if there's stored data when component mounts or accountId changes
    useEffect(() => {
      const checkStoredData = async () => {
        setIsCheckingData(true);
        try {
          const hasData = await checkHasStoredData(accountId);
          setHasStoredData(hasData);
        } catch (error) {
          console.error('Error checking stored data:', error);
          setHasStoredData(false);
        } finally {
          setIsCheckingData(false);
        }
      };

      checkStoredData();
    }, [accountId, checkHasStoredData]);

    // Re-check stored data when loading state changes (after save/delete operations)
    useEffect(() => {
      if (!isLoading && !isCheckingData) {
        const recheckStoredData = async () => {
          try {
            const hasData = await checkHasStoredData(accountId);
            setHasStoredData(hasData);
          } catch (error) {
            console.error('Error rechecking stored data:', error);
          }
        };

        // Small delay to ensure storage operations have completed
        const timeoutId = setTimeout(recheckStoredData, 100);
        return () => clearTimeout(timeoutId);
      }
    }, [isLoading, isCheckingData, accountId, checkHasStoredData]);

    // Show loading state while checking for stored data
    if (isCheckingData) {
      return (
        <View style={styles.inputContainer}>
          <ActionButton
            text="Checking account data..."
            onPress={() => {}}
            isLoading={true}
            disabled={true}
          />
        </View>
      );
    }

    // If there's stored data, show management options
    if (hasStoredData) {
      return (
        <MnemonicManagement
          accountId={accountId}
          accountName={accountName}
          isLoading={isLoading}
          disabled={disabled}
          onRotateMnemonic={handleRotateMnemonic}
          onClearAll={handleClearAll}
        />
      );
    }

    // If no stored data, show mnemonic input form
    return (
      <>
        <MnemonicInput
          label="Mnemonic Phrase:"
          value={value}
          onChangeText={onValueChange}
          onValidationChange={handleValidationChange}
          placeholder="Enter your 24-word recovery phrase..."
          disabled={disabled}
          showWordCount={true}
          autoValidate={true}
        />

        <View style={styles.buttonContainer}>
          <ActionButton
            style={styles.button}
            text="Save"
            onPress={onSave}
            isLoading={isLoading && value.trim().length > 0}
            disabled={
              disabled ||
              value.trim().length === 0 ||
              !isMnemonicVerified
            }
            accessibilityLabel="Save mnemonic phrase"
            accessibilityHint={`Encrypts and saves mnemonic phrase for ${accountName || accountId}`}
          />

          <ActionButton
            text="Delete"
            style={styles.button}
            onPress={onDelete}
            isLoading={isLoading && !value.trim()}
            disabled={disabled}
            accessibilityLabel="Delete mnemonic phrase"
            accessibilityHint={`Deletes stored mnemonic phrase for ${accountName || accountId}`}
          />
        </View>
      </>
    );
  },
);

SecureStorageForm.displayName = "SecureStorageForm";
