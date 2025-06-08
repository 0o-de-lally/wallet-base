import React, { memo } from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { styles } from "../../styles/styles";
import { formatTimestamp, formatCurrency } from "../../util/format-utils";
import { ActionButton } from "../common/ActionButton";
import type { AccountState } from "../../util/app-config-store";
import { router } from "expo-router";

export interface AccountItemProps {
  account: AccountState;
  onDelete: (accountId: string) => void;
  profileName: string;
  onToggleExpand?: (accountId: string) => void;
  isActive?: boolean;
  onSetActive?: (accountId: string) => void;
}

export const AccountItem = memo(
  ({
    account,
    onDelete,
    profileName,
    onToggleExpand,
    isActive,
    onSetActive,
  }: AccountItemProps) => {
    const navigateToSettings = () => {
      router.navigate({
        pathname: "./account-settings",
        params: { accountId: account.id, profileName },
      });
    };

    return (
      <TouchableOpacity
        key={account.id}
        style={[
          styles.resultContainer,
          styles.accountItemContainer,
          isActive && styles.accountItemActive,
        ]}
        accessible={true}
        accessibilityLabel={`Account ${account.nickname}${isActive ? " (active)" : ""}`}
        onPress={
          onToggleExpand ? () => onToggleExpand(account.id) : navigateToSettings
        }
      >
        <Text style={styles.resultLabel}>{account.nickname}</Text>
        <View
          style={[
            styles.accessTypeBadge,
            account.is_key_stored
              ? styles.accessTypeBadgeHot
              : styles.accessTypeBadgeView,
          ]}
          accessibilityRole="text"
          accessibilityLabel={account.is_key_stored ? "Hot" : "View"}
        >
          <Text style={styles.accessTypeBadgeText}>
            {account.is_key_stored ? "Full Access" : "View Only"}
          </Text>
        </View>
        <Text
          style={styles.resultValue}
          numberOfLines={1}
          ellipsizeMode="middle"
          selectable={true}
        >
          {account.account_address?.toStringLong?.() || "Address not available"}
        </Text>
        <View style={styles.balanceRow}>
          <Text style={[styles.resultValue, styles.balanceText]}>
            Locked: {formatCurrency(account.balance_locked)}
          </Text>
          <Text style={[styles.resultValue, styles.balanceText]}>
            Unlocked: {formatCurrency(account.balance_unlocked)}
          </Text>
        </View>
        <Text style={[styles.resultValue, styles.lastUpdatedText]}>
          Last updated: {formatTimestamp(account.last_update)}
        </Text>

        <View style={styles.accountActionsRow}>
          {onSetActive && !isActive && (
            <ActionButton
              text="Set Active"
              onPress={() => onSetActive(account.id)}
              size="small"
              style={styles.setActiveButtonStyle}
              accessibilityLabel={`Set ${account.nickname} as active account`}
            />
          )}

          {isActive && (
            <View style={styles.activeIndicatorBadge}>
              <Text style={styles.activeIndicatorText}>Active</Text>
            </View>
          )}

          <ActionButton
            text="Manage Account"
            onPress={navigateToSettings}
            size="small"
            style={styles.manageAccountButtonStyle}
            accessibilityLabel={`Manage account ${account.nickname}`}
          />

          <ActionButton
            text="Remove"
            onPress={() => onDelete(account.id)}
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
