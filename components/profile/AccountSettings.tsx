import React, { memo, useState, useEffect } from "react";
import { View, Text, ScrollView } from "react-native";
import { styles } from "../../styles/styles";
import { SecureStorageForm } from "../secure-storage/SecureStorageForm";
import { useSecureStorage } from "../../hooks/use-secure-storage";
import { PinInputModal } from "../pin-input/PinInputModal";
import type { AccountState } from "../../util/app-config-store";
import { appConfig } from "../../util/app-config-store";
import { observer } from "@legendapp/state/react";
import { AccountNicknameForm } from "./AccountNicknameForm";
import { DeleteAccountSection } from "./DeleteAccountSection";
import { shortenAddress } from "@/util/format-utils";
import { CopyButton } from "../common/CopyButton";

// Define the component props
interface AccountSettingsProps {
  accountId: string;
  profileName: string;
}

export const AccountSettings = memo(
  observer(({ accountId, profileName }: AccountSettingsProps) => {
    const [isLoading, setIsLoading] = useState(true);
    const [account, setAccount] = useState<AccountState | null>(null);

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

    useEffect(() => {
      fetchAccount();
    }, [accountId, profileName]);

    const handleNicknameUpdate = () => {
      // Refresh the account data to show the updated nickname
      fetchAccount();
    };

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
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.sectionTitle}>
          {profileName} •{" "}
          {account
            ? shortenAddress(account.account_address, 4, 4)
            : "Loading..."}
          {account.nickname ? `• ${account.nickname}` : ""}
        </Text>

        {/* Full Address Display Section */}
        <View style={styles.inputContainer}>
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 8,
            }}
          >
            <Text style={styles.label}>Account Address</Text>
            {account && (
              <CopyButton
                text={account.account_address}
                label="Copy"
                variant="icon"
                size="small"
                accessibilityLabel="Copy account address"
                accessibilityHint="Copy the full account address to clipboard"
              />
            )}
          </View>

          <View style={[styles.input, { padding: 16 }]}>
            <Text style={[styles.resultValue, { fontFamily: "monospace" }]}>
              {account ? account.account_address : "Loading..."}
            </Text>
          </View>

          <Text style={[styles.description, { marginTop: 8, marginBottom: 0 }]}>
            This is your account&apos;s full address on the blockchain.
          </Text>
        </View>

        <AccountNicknameForm
          accountId={account.id}
          currentNickname={account.nickname}
          onNicknameUpdate={handleNicknameUpdate}
        />

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

        <DeleteAccountSection
          accountId={account.id}
          accountNickname={account.nickname}
          accountAddress={account.account_address}
        />
      </ScrollView>
    );
  }),
);

AccountSettings.displayName = "AccountSettings";
