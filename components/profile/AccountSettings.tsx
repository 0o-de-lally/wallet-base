import React, { memo, useState, useCallback, useEffect } from "react";
import { View, Text, ScrollView } from "react-native";
import { styles } from "../../styles/styles";
import { ActionButton } from "../common/ActionButton";
import { SecureStorageForm } from "../secure-storage/SecureStorageForm";
import { useSecureStorage } from "../../hooks/use-secure-storage";
import { PinInputModal } from "../pin-input/PinInputModal";
import { RevealStatusUI } from "../reveal/RevealStatusUI";
import type { AccountState } from "../../util/app-config-store";
import { appConfig } from "../../util/app-config-store";
import { observer } from "@legendapp/state/react";
import { SecretReveal } from "../secure-storage/SecretReveal";

// Define UI view modes
enum SecretViewMode {
  MANAGE,
  REVEAL,
}

// Define the component props
interface AccountSettingsProps {
  accountId: string;
  profileName: string;
}

export const AccountSettings = memo(
  observer(({ accountId, profileName }: AccountSettingsProps) => {
    const [viewMode, setViewMode] = useState<SecretViewMode>(
      SecretViewMode.MANAGE,
    );
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
      storedValue,
      isLoading: isSecureLoading,
      handleSave,
      handleScheduleReveal,
      handleExecuteReveal,
      handleCancelReveal,
      handleDelete,
      handleClearAll,
      checkHasStoredData,
      pinModalVisible,
      setPinModalVisible,
      handlePinAction,
      currentAction,
      revealStatus,
      clearRevealedValue,
    } = useSecureStorage(); // Pass accountId here

    const switchToRevealMode = useCallback(() => {
      setViewMode(SecretViewMode.REVEAL);
    }, []);

    const switchToManageMode = useCallback(() => {
      setViewMode(SecretViewMode.MANAGE);
    }, []);

    const getPinPurpose = () => {
      switch (currentAction) {
        case "save":
          return "save";
        case "delete":
          return "delete";
        case "schedule_reveal":
          return "schedule_reveal";
        case "execute_reveal":
          return "execute_reveal";
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
        <View style={styles.resultContainer}>
          <Text style={styles.resultLabel}>Account Settings</Text>
          <Text style={styles.resultValue}>{account.nickname}</Text>
        </View>

        <View style={styles.resultContainer}>
          <Text style={styles.resultLabel}>Security Management</Text>

          {account.is_key_stored && (
            <>
              <ActionButton
                text={
                  viewMode === SecretViewMode.MANAGE
                    ? "Reveal Secret"
                    : "Manage Secret"
                }
                onPress={
                  viewMode === SecretViewMode.MANAGE
                    ? switchToRevealMode
                    : switchToManageMode
                }
                size="medium"
                style={{
                  backgroundColor:
                    viewMode === SecretViewMode.MANAGE ? "#5e35b1" : "#4a90e2",
                  marginBottom: 15,
                }}
                accessibilityLabel={`${viewMode === SecretViewMode.MANAGE ? "Reveal" : "Manage"} secret for ${account.nickname}`}
              />

              {/* Add button to clear account data if in manage mode */}
              {viewMode === SecretViewMode.MANAGE && (
                <ActionButton
                  text="Clear Account Data"
                  onPress={() => handleClearAll(accountId)}
                  isDestructive={true}
                  size="small"
                  style={{ marginBottom: 15 }}
                />
              )}
            </>
          )}

          {viewMode === SecretViewMode.MANAGE && (
            <View style={[styles.expandedContent, { marginBottom: 40 }]}>
              <SecureStorageForm
                value={value}
                onValueChange={setValue}
                onSave={() => handleSave(accountId)}
                onDelete={() => handleDelete(accountId)} // Remove the accountId parameter since it's already scoped
                onScheduleReveal={() => handleScheduleReveal(accountId)}
                onClearAll={() => handleClearAll(accountId)}
                checkHasStoredData={checkHasStoredData}
                isLoading={isSecureLoading}
                accountId={account.id}
                accountName={account.nickname}
              />
            </View>
          )}

          {viewMode === SecretViewMode.REVEAL && (
            <View style={[styles.expandedContent, { marginBottom: 40 }]}>
              <RevealStatusUI
                accountId={account.id}
                accountName={account.nickname}
                revealStatus={revealStatus}
                storedValue={storedValue}
                isLoading={isSecureLoading}
                onScheduleReveal={handleScheduleReveal}
                onExecuteReveal={handleExecuteReveal}
                onCancelReveal={handleCancelReveal}
                onClearRevealedValue={clearRevealedValue}
                onSwitchToManage={switchToManageMode}
              />
            </View>
          )}
        </View>

        <PinInputModal
          visible={pinModalVisible}
          onClose={() => setPinModalVisible(false)}
          onPinAction={handlePinAction}
          purpose={getPinPurpose()}
        />

        {/* Only show SecretReveal if user has saved a mnemonic */}
        {account.is_key_stored && (
          <View style={{ marginTop: 24, marginBottom: 40 }}>
            <SecretReveal
              accountId={accountId}
              accountName={account?.nickname}
              onSwitchToManage={switchToManageMode}
            />
          </View>
        )}
      </ScrollView>
    );
  }),
);

AccountSettings.displayName = "AccountSettings";
