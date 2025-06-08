import React, { memo, useState, useEffect } from "react";
import { View, Text, ScrollView } from "react-native";
import { styles } from "../../styles/styles";
import { SecureStorageForm } from "../secure-storage/SecureStorageForm";
import { useSecureStorage } from "../../hooks/use-secure-storage";
import { PinInputModal } from "../pin-input/PinInputModal";
import type { AccountState } from "../../util/app-config-store";
import { appConfig } from "../../util/app-config-store";
import { observer } from "@legendapp/state/react";

// Define the component props
interface AccountSettingsProps {
  accountId: string;
  profileName: string;
}

export const AccountSettings = memo(
  observer(({ accountId, profileName }: AccountSettingsProps) => {
    const [isLoading, setIsLoading] = useState(true);
    const [account, setAccount] = useState<AccountState | null>(null);

    useEffect(() => {
      // Fetch account data using accountId (UUID)
      const fetchAccount = async () => {
        try {
          // Get the profile from app-config-store
          const profile = appConfig.profiles[profileName].get();

          if (!profile) {
            console.error(`Profile '${profileName}' not found`);
            setIsLoading(false);
            return;
          }

          // Find the account by ID (UUID)
          const foundAccount = profile.accounts.find(
            (acc) => acc.id === accountId,
          );

          if (foundAccount) {
            setAccount(foundAccount);
          } else {
            console.error(
              `Account with ID '${accountId}' not found in profile '${profileName}'`,
            );
          }

          setIsLoading(false);
        } catch (error) {
          console.error("Error fetching account:", error);
          setIsLoading(false);
        }
      };

      fetchAccount();
    }, [accountId, profileName]);

    // Pass accountId to the useSecureStorage hook to scope it to this account
    const {
      value,
      setValue,
      isLoading: isSecureLoading,
      handleSave,
      handleDelete,
      handleClearAll,
      checkHasStoredData,
      pinModalVisible,
      handlePinModalClose,
      handlePinAction,
      currentAction,
    } = useSecureStorage(accountId);

    const getPinPurpose = () => {
      switch (currentAction) {
        case "save":
          return "save";
        case "delete":
          return "delete";
        case "clear_all":
          return "clear_all";
        default:
          return "save";
      }
    };

    if (isLoading || !account) {
      return (
        <View style={styles.container}>
          <Text>Loading account details...</Text>
        </View>
      );
    }

    return (
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.label}>{account.nickname}</Text>

        <View>
          <SecureStorageForm
            value={value}
            onValueChange={setValue}
            onSave={() => handleSave(accountId)}
            onDelete={() => handleDelete(accountId)}
            onClearAll={() => handleClearAll(accountId)}
            checkHasStoredData={checkHasStoredData}
            isLoading={isSecureLoading}
            accountId={account.id}
            accountName={account.nickname}
          />
        </View>

        <PinInputModal
          visible={pinModalVisible}
          onClose={handlePinModalClose}
          onPinAction={handlePinAction}
          purpose={getPinPurpose()}
        />
      </ScrollView>
    );
  }),
);

AccountSettings.displayName = "AccountSettings";
