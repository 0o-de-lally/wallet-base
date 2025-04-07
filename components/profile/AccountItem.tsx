import React, { memo } from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { styles } from "../../styles/styles";
import { formatTimestamp, formatCurrency } from "../../util/format-utils";
import { ActionButton } from "../common/ActionButton";
import type { AccountState } from "../../util/app-config-store";
import { router } from "expo-router";

export interface AccountItemProps {
  account: AccountState;
  onDelete: (accountAddress: string) => void;
  profileName: string;
  isExpanded?: boolean;
  onToggleExpand?: (accountId: string) => void;
  isActive?: boolean;
  onSetActive?: (accountId: string) => void;
}

export const AccountItem = memo(
  ({
    account,
    onDelete,
    profileName,
    isExpanded,
    onToggleExpand,
    isActive,
    onSetActive
  }: AccountItemProps) => {
    const navigateToSettings = () => {
      router.navigate({
        pathname: "./account-settings",
        params: { accountId: account.id, profileName },
      });
    };

    return (
      <TouchableOpacity
        key={account.account_address}
        style={[
          styles.resultContainer,
          { marginBottom: 10 },
          isActive && { borderColor: "#94c2f3", borderWidth: 2 }
        ]}
        accessible={true}
        accessibilityLabel={`Account ${account.nickname}${isActive ? ' (active)' : ''}`}
        onPress={onToggleExpand ? () => onToggleExpand(account.id) : navigateToSettings}
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
          {onSetActive && !isActive && (
            <ActionButton
              text="Set Active"
              onPress={() => onSetActive(account.id)}
              size="small"
              style={{
                backgroundColor: "#a5d6b7",
              }}
              accessibilityLabel={`Set ${account.nickname} as active account`}
            />
          )}

          {isActive && (
            <View style={{
              paddingVertical: 8,
              paddingHorizontal: 12,
              backgroundColor: "#4a90e2",
              borderRadius: 4,
              marginRight: 8
            }}>
              <Text style={{ color: "#fff", fontSize: 12, fontWeight: "600" }}>
                Active
              </Text>
            </View>
          )}

          <ActionButton
            text="Manage Account"
            onPress={navigateToSettings}
            size="small"
            style={{
              backgroundColor: "#4a90e2",
            }}
            accessibilityLabel={`Manage account ${account.nickname}`}
          />

          <ActionButton
            text="Remove"
            onPress={() => onDelete(account.account_address)}
            isDestructive={true}
            size="small"
            accessibilityLabel={`Remove account ${account.nickname}`}
          />
        </View>
      </TouchableOpacity>
    );
  },
);

AccountItem.displayName = "AccountItem";
