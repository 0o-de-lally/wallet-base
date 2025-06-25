import React, { memo, useState, useEffect, useCallback } from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { styles } from "../../styles/styles";
import { formatTimestamp, formatCurrency } from "../../util/format-utils";
import type { AccountState } from "../../util/app-config-store";
import { router } from "expo-router";
import { LibraViews, type LibraClient } from "open-libra-sdk";

export interface AccountItemProps {
  account: AccountState;
  onDelete: (accountId: string) => void;
  profileName: string;
  isActive?: boolean;
  onSetActive?: (accountId: string) => void;
  client?: LibraClient;
  compact?: boolean;
}

export const AccountItem = memo(
  ({
    account,
    onDelete,
    profileName,
    isActive,
    onSetActive,
    client,
    compact = false,
  }: AccountItemProps) => {
    const [balanceData, setBalanceData] = useState<{
      unlocked: number;
      total: number;
      isLoading: boolean;
      error: string | null;
      lastUpdated: number;
    }>({
      unlocked: account.balance_unlocked,
      total: account.balance_total,
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
        let balance_unlocked = 0;
        let balance_total = 0;

        if (result && typeof result === "object") {
          // Try different possible response structures
          if ("locked" in result && "unlocked" in result) {
            balance_unlocked = Number(result.unlocked) || 0;
            balance_total = Number(result.locked) || 0;
          } else if (Array.isArray(result) && result.length >= 2) {
            // Response is an array [unlocked, total]
            balance_unlocked = Number(result[0]) || 0;
            balance_total = Number(result[1]) || 0;
          } else if (Array.isArray(result) && result.length === 1) {
            // Response might be an array with single balance object
            const balanceObj = result[0];
            if (
              balanceObj &&
              typeof balanceObj === "object" &&
              "locked" in balanceObj &&
              "unlocked" in balanceObj
            ) {
              balance_unlocked = Number(balanceObj.unlocked) || 0;
              balance_total = Number(balanceObj.locked) || 0;
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

          // Update the stored account data with new balances
          try {
            const { appConfig } = await import("../../util/app-config-store");
            const profiles = appConfig.profiles.get();

            // Find and update the account in the profile
            Object.keys(profiles).forEach(profileKey => {
              const profile = profiles[profileKey];
              const accountIndex = profile.accounts.findIndex(acc => acc.id === account.id);
              if (accountIndex !== -1) {
                profile.accounts[accountIndex] = {
                  ...profile.accounts[accountIndex],
                  balance_unlocked: balance_unlocked,
                  balance_total: balance_total,
                  last_update: now,
                };
                // Update the profile in storage
                appConfig.profiles[profileKey].set(profile);
              }
            });

            // Clear loading state after successful update
            setBalanceData((prev) => ({
              ...prev,
              isLoading: false,
              error: null
            }));
          } catch (error) {
            console.error("Failed to update stored account balance:", error);
            setBalanceData((prev) => ({
              ...prev,
              isLoading: false,
              error: "Failed to update balance data",
            }));
          }
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

    // Update local state when account prop changes (reflects stored state)
    useEffect(() => {
      setBalanceData({
        unlocked: account.balance_unlocked,
        total: account.balance_total,
        isLoading: false,
        error: null,
        lastUpdated: account.last_update,
      });
    }, [account.balance_unlocked, account.balance_total, account.last_update]);

    const navigateToTransactions = () => {
      router.navigate({
        pathname: "./transactions",
        params: {
          accountId: account.id,
          profileName,
          accountNickname: account.nickname,
        },
      });
    };

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
          compact && styles.compactAccountItem,
        ]}
        accessible={true}
        accessibilityLabel={`Account ${account.nickname}${isActive ? " (active)" : ""}`}
        onPress={navigateToTransactions}
      >
        {compact ? (
          // Compact layout for inactive accounts
          <View>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flex: 1 }}>
                <Text style={[styles.accountNickname, { fontSize: 14 }]}>{account.nickname}</Text>
                {!account.is_key_stored && (
                  <Ionicons
                    name="eye-outline"
                    size={14}
                    color="#c2c2cc"
                    accessibilityLabel="View only account"
                  />
                )}
              </View>

              <View style={styles.compactActions}>
                {onSetActive && (
                  <TouchableOpacity
                    style={[styles.iconButton, { padding: 6 }]}
                    onPress={() => onSetActive(account.id)}
                    accessibilityLabel={`Set ${account.nickname} as active account`}
                  >
                    <Ionicons name="checkmark-circle-outline" size={16} color="#a5d6b7" />
                  </TouchableOpacity>
                )}

                <TouchableOpacity
                  style={[styles.iconButton, { padding: 6 }]}
                  onPress={navigateToSettings}
                  accessibilityLabel={`Manage account ${account.nickname}`}
                >
                  <Ionicons name="settings-outline" size={16} color="#c2c2cc" />
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.compactBalanceRow}>
              <Text style={[styles.balanceText, styles.balancePrimary, { fontSize: 13 }]}>
                {formatCurrency(balanceData.unlocked)}
                {balanceData.isLoading && " (updating...)"}
              </Text>
              <Text style={[styles.balanceText, { fontSize: 12 }]}>
                Total: {formatCurrency(balanceData.total)}
              </Text>
            </View>

            {balanceData.error && (
              <Text style={[styles.errorText, { fontSize: 11, marginTop: 2 }]}>
                Balance error: {balanceData.error}
              </Text>
            )}
          </View>
        ) : (
          // Full layout for active account
          <View>
            <View style={styles.accountHeader}>
              <View style={styles.accountInfo}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Text style={styles.accountNickname}>{account.nickname}</Text>
                  {!account.is_key_stored && (
                    <Ionicons
                      name="eye-outline"
                      size={16}
                      color="#c2c2cc"
                      accessibilityLabel="View only account"
                    />
                  )}
                </View>
              </View>

              {isActive && (
                <View style={styles.activeIndicatorBadge}>
                  <Text style={styles.activeIndicatorText}>Active</Text>
                </View>
              )}
            </View>

            <View style={styles.balanceRow}>
              <Text style={[styles.balanceText, styles.balancePrimary]}>
                Unlocked: {formatCurrency(balanceData.unlocked)}
                {balanceData.isLoading && " (updating...)"}
              </Text>
              <Text style={styles.balanceText}>
                Total: {formatCurrency(balanceData.total)}
              </Text>
            </View>

            {balanceData.error && (
              <Text style={[styles.errorText, { fontSize: 12, marginTop: 4 }]}>
                Balance error: {balanceData.error}
              </Text>
            )}

            <View style={styles.accountActionsRow}>
              {onSetActive && !isActive && (
                <TouchableOpacity
                  style={styles.iconButton}
                  onPress={() => onSetActive(account.id)}
                  accessibilityLabel={`Set ${account.nickname} as active account`}
                >
                  <Ionicons name="checkmark-circle-outline" size={20} color="#a5d6b7" />
                </TouchableOpacity>
              )}

              <TouchableOpacity
                style={styles.iconButton}
                onPress={navigateToSettings}
                accessibilityLabel={`Manage account ${account.nickname}`}
              >
                <Ionicons name="settings-outline" size={20} color="#c2c2cc" />
              </TouchableOpacity>
            </View>
          </View>
        )}
      </TouchableOpacity>
    );
  },
);

AccountItem.displayName = "AccountItem";
