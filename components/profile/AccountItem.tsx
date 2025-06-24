import React, { memo, useState, useEffect, useCallback } from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { styles } from "../../styles/styles";
import { formatTimestamp, formatCurrency } from "../../util/format-utils";
import { ActionButton } from "../common/ActionButton";
import type { AccountState } from "../../util/app-config-store";
import { router } from "expo-router";
import { LibraViews, type LibraClient } from "open-libra-sdk";

export interface AccountItemProps {
  account: AccountState;
  onDelete: (accountId: string) => void;
  profileName: string;
  onToggleExpand?: (accountId: string) => void;
  isActive?: boolean;
  onSetActive?: (accountId: string) => void;
  client?: LibraClient;
}

export const AccountItem = memo(
  ({
    account,
    onDelete,
    profileName,
    onToggleExpand,
    isActive,
    onSetActive,
    client,
  }: AccountItemProps) => {
    const [balanceData, setBalanceData] = useState<{
      locked: number;
      unlocked: number;
      isLoading: boolean;
      error: string | null;
      lastUpdated: number;
    }>({
      locked: account.balance_locked,
      unlocked: account.balance_unlocked,
      isLoading: false,
      error: null,
      lastUpdated: account.last_update,
    });

    const fetchBalance = useCallback(async () => {
      if (!client || !account.account_address) {
        return;
      }

      setBalanceData((prev) => ({ ...prev, isLoading: true, error: null }));
      try {
        // Create the view payload using the sugar function
        const payload = LibraViews.olAccount_balance(account.account_address);

        // Call the view function
        const result = await client.viewJson(payload);

        console.log(
          "Balance API response for",
          account.account_address,
          ":",
          result,
        );

        // Handle different possible response formats
        let locked = 0;
        let unlocked = 0;

        if (result && typeof result === "object") {
          // Try different possible response structures
          if ("locked" in result && "unlocked" in result) {
            locked = Number(result.locked) || 0;
            unlocked = Number(result.unlocked) || 0;
          } else if (Array.isArray(result) && result.length >= 2) {
            // Response might be an array [locked, unlocked]
            locked = Number(result[0]) || 0;
            unlocked = Number(result[1]) || 0;
          } else if (Array.isArray(result) && result.length === 1) {
            // Response might be an array with single balance object
            const balanceObj = result[0];
            if (
              balanceObj &&
              typeof balanceObj === "object" &&
              "locked" in balanceObj &&
              "unlocked" in balanceObj
            ) {
              locked = Number(balanceObj.locked) || 0;
              unlocked = Number(balanceObj.unlocked) || 0;
            }
          } else {
            // Log the actual structure for debugging
            console.log(
              "Unexpected balance response structure:",
              JSON.stringify(result, null, 2),
            );
            throw new Error(
              `Unexpected balance response format: ${JSON.stringify(result).substring(0, 100)}...`,
            );
          }

          const now = Date.now();

          setBalanceData({
            locked,
            unlocked,
            isLoading: false,
            error: null,
            lastUpdated: now,
          });
        } else {
          throw new Error(
            `Invalid balance response: ${typeof result} - ${JSON.stringify(result)}`,
          );
        }
      } catch (error) {
        console.error(
          "Failed to fetch balance for account:",
          account.account_address,
          error,
        );
        setBalanceData((prev) => ({
          ...prev,
          isLoading: false,
          error:
            error instanceof Error ? error.message : "Failed to fetch balance",
        }));
      }
    }, [client, account.account_address]);

    // Fetch balance on mount and when client or account changes
    useEffect(() => {
      if (client && account.account_address) {
        fetchBalance();
      }
    }, [fetchBalance]);

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
          {account.account_address || "Address not available"}
        </Text>
        <View style={styles.balanceRow}>
          <Text style={[styles.resultValue, styles.balanceText]}>
            Locked: {formatCurrency(balanceData.locked)}
            {balanceData.isLoading && " (updating...)"}
          </Text>
          <Text style={[styles.resultValue, styles.balanceText]}>
            Unlocked: {formatCurrency(balanceData.unlocked)}
            {balanceData.isLoading && " (updating...)"}
          </Text>
        </View>
        {balanceData.error && (
          <Text style={[styles.errorText, { fontSize: 12, marginTop: 2 }]}>
            Balance fetch error: {balanceData.error}
          </Text>
        )}
        <Text style={[styles.resultValue, styles.lastUpdatedText]}>
          Last updated: {formatTimestamp(balanceData.lastUpdated)}
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
