import React, { memo, useState, useCallback } from "react";
import { View, Text } from "react-native";
import { styles } from "../../styles/styles";
import { formatTimestamp, formatCurrency } from "../../util/format-utils";
import { ActionButton } from "../common/ActionButton";
import { SecureStorageForm } from "../secure-storage/SecureStorageForm";
import { useSecureStorage } from "../../hooks/use-secure-storage";
import { ModalProvider } from "../../context/ModalContext";
import { PinInputModal } from "../pin-input/PinInputModal";
import { RevealStatusUI } from "../reveal/RevealStatusUI";
import type { AccountState } from "../../util/app-config-store";

// Define UI view modes
enum SecretViewMode {
  COLLAPSED,
  MANAGE,
  REVEAL,
}

export interface AccountItemProps {
  account: AccountState;
  onToggleExpand: (accountId: string) => void;
  onDelete: (accountAddress: string) => void;
  isExpanded: boolean;
  profileName: string;
}

export const AccountItem = memo(
  ({ account, onToggleExpand, onDelete, isExpanded }: AccountItemProps) => {
    const [viewMode, setViewMode] = useState<SecretViewMode>(
      isExpanded ? SecretViewMode.MANAGE : SecretViewMode.COLLAPSED
    );

    const {
      value,
      setValue,
      isLoading: isSecureLoading,
      handleSave,
      handleDelete,
      pinModalVisible,
      setPinModalVisible,
      handlePinVerified,
      currentAction,
      revealStatus,
      storedValue,
      handleScheduleReveal,
      handleExecuteReveal,
      handleCancelReveal,
      clearRevealedValue,
    } = useSecureStorage();

    const toggleSecretView = useCallback(() => {
      if (viewMode === SecretViewMode.COLLAPSED) {
        setViewMode(SecretViewMode.MANAGE);
        onToggleExpand(account.id);
      } else {
        setViewMode(SecretViewMode.COLLAPSED);
        onToggleExpand("");
      }
    }, [viewMode, account.id, onToggleExpand]);

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
        default:
          return "save";
      }
    };

    return (
      <View
        key={account.account_address}
        style={[styles.resultContainer, { marginBottom: 10 }]}
        accessible={true}
        accessibilityLabel={`Account ${account.nickname}`}
      >
        <Text style={styles.resultLabel}>{account.nickname}</Text>
        <View
          style={{
            paddingVertical: 6,
            paddingHorizontal: 10,
            backgroundColor: account.is_key_stored ? "#a5d6b7" : "#b3b8c3",
            borderRadius: 12,
            alignItems: "center",
            justifyContent: "center",
            minWidth: 80,
          }}
          accessibilityRole="text"
          accessibilityLabel={account.is_key_stored ? "Hot" : "View"}
        >
          <Text
            style={{
              color: "#fff",
              fontWeight: "bold",
              fontSize: 11,
              textAlign: "center",
              textTransform: "uppercase",
              letterSpacing: 0.5,
            }}
          >
            {account.is_key_stored ? "Full Access" : "View Only"}
          </Text>
        </View>
        <Text
          style={styles.resultValue}
          numberOfLines={1}
          ellipsizeMode="middle"
          selectable={true}
        >
          {account.account_address}
        </Text>
        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            marginTop: 5,
          }}
        >
          <Text style={[styles.resultValue, { fontSize: 14 }]}>
            Locked: {formatCurrency(account.balance_locked)}
          </Text>
          <Text style={[styles.resultValue, { fontSize: 14 }]}>
            Unlocked: {formatCurrency(account.balance_unlocked)}
          </Text>
        </View>
        <Text
          style={[
            styles.resultValue,
            { fontSize: 12, color: "#8c8c9e", marginTop: 5 },
          ]}
        >
          Last updated: {formatTimestamp(account.last_update)}
        </Text>

        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            marginTop: 10,
          }}
        >
          <ActionButton
            text={
              viewMode === SecretViewMode.COLLAPSED
                ? "Manage Secret Key"
                : "Hide Secret"
            }
            onPress={toggleSecretView}
            size="small"
            style={{
              backgroundColor:
                viewMode !== SecretViewMode.COLLAPSED ? "#6c757d" : "#4a90e2",
            }}
            accessibilityLabel={`${
              viewMode !== SecretViewMode.COLLAPSED ? "Hide" : "Show"
            } secret management for ${account.nickname}`}
          />

          {viewMode === SecretViewMode.MANAGE && account.is_key_stored && (
            <ActionButton
              text="Reveal Secret"
              onPress={switchToRevealMode}
              size="small"
              style={{
                backgroundColor: "#5e35b1",
              }}
              accessibilityLabel={`Reveal secret for ${account.nickname}`}
            />
          )}

          <ActionButton
            text="Remove"
            onPress={() => onDelete(account.account_address)}
            isDestructive={true}
            size="small"
            accessibilityLabel={`Remove account ${account.nickname}`}
          />
        </View>

        {viewMode === SecretViewMode.MANAGE && isExpanded && (
          <View style={styles.expandedContent}>
            <SecureStorageForm
              value={value}
              onValueChange={setValue}
              onSave={handleSave}
              onDelete={handleDelete}
              isLoading={isSecureLoading}
              accountId={account.id}
              accountName={account.nickname}
            />
          </View>
        )}

        {viewMode === SecretViewMode.REVEAL && isExpanded && (
          <View style={styles.expandedContent}>
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

        <PinInputModal
          visible={pinModalVisible}
          onClose={() => setPinModalVisible(false)}
          onPinVerified={handlePinVerified}
          purpose={getPinPurpose()}
        />
      </View>
    );
  }
);

AccountItem.displayName = "AccountItem";

// Wrapper component that provides ModalProvider context
export const AccountItemWithContext = memo(
  ({ account, ...props }: AccountItemProps) => (
    <ModalProvider key={account.id || account.account_address}>
      <AccountItem account={account} {...props} />
    </ModalProvider>
  )
);

AccountItemWithContext.displayName = "AccountItemWithContext";
