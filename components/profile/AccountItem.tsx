import React, { memo } from "react";
import { View, Text, TouchableOpacity, Alert } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { styles } from "../../styles/styles";
import { formatCurrency } from "../../util/format-utils";
import type { AccountState } from "../../util/app-config-store";
import { router } from "expo-router";
import { retryAccountBalance } from "../../util/balance-polling-service";

export interface AccountItemProps {
  account: AccountState;
  profileName: string;
  isActive?: boolean;
  onSetActive?: (accountId: string) => void;
  compact?: boolean;
}

export const AccountItem = memo(
  ({
    account,
    profileName,
    isActive,
    onSetActive,
    compact = false,
  }: AccountItemProps) => {
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

    const handleRetryBalance = async () => {
      if (!account.last_error) return;

      try {
        console.log(`Retrying balance fetch for ${account.nickname}`);
        await retryAccountBalance(account.id);
        // Note: UI will update automatically via Legend State reactivity
      } catch (error) {
        console.warn("Failed to retry balance:", error);
        Alert.alert(
          "Retry Failed",
          "Could not refresh balance data. Please check your connection and try again.",
          [{ text: "OK" }]
        );
      }
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
        accessibilityLabel={`Account ${account.nickname}${isActive ? " (active)" : ""}${account.last_error ? " (data may be outdated - long press to retry)" : ""}`}
        onPress={navigateToTransactions}
        onLongPress={account.last_error ? handleRetryBalance : undefined}
      >
        {compact ? (
          // Compact layout for inactive accounts
          <View>
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 6,
                  flex: 1,
                }}
              >
                <Text style={[styles.accountNickname, { fontSize: 14 }]}>
                  {account.nickname}
                </Text>
                {!account.is_key_stored && (
                  <Ionicons
                    name="eye-outline"
                    size={14}
                    color="#c2c2cc"
                    accessibilityLabel="View only account"
                  />
                )}
                {account.last_error && (
                  <Ionicons
                    name="warning-outline"
                    size={12}
                    color="#ff9500"
                    accessibilityLabel="Balance data may be outdated"
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
                    <Ionicons
                      name="checkmark-circle-outline"
                      size={16}
                      color="#a5d6b7"
                    />
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
              <Text
                style={[
                  styles.balanceText,
                  styles.balancePrimary,
                  { fontSize: 13 },
                ]}
              >
                {formatCurrency(account.balance_unlocked, 2)}
              </Text>
              <Text style={[styles.balanceText, { fontSize: 12 }]}>
                Total: {formatCurrency(account.balance_total, 2)}
              </Text>
            </View>
          </View>
        ) : (
          // Full layout for active account
          <View>
            <View style={styles.accountHeader}>
              <View style={styles.accountInfo}>
                <View
                  style={{ flexDirection: "row", alignItems: "center", gap: 6 }}
                >
                  <Text style={styles.accountNickname}>{account.nickname}</Text>
                  {!account.is_key_stored && (
                    <Ionicons
                      name="eye-outline"
                      size={16}
                      color="#c2c2cc"
                      accessibilityLabel="View only account"
                    />
                  )}
                  {account.last_error && (
                    <Ionicons
                      name="warning-outline"
                      size={14}
                      color="#ff9500"
                      accessibilityLabel="Balance data may be outdated"
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
                Unlocked: {formatCurrency(account.balance_unlocked, 2)}
              </Text>
              <Text style={styles.balanceText}>
                Total: {formatCurrency(account.balance_total, 2)}
              </Text>
            </View>

            <View style={styles.accountActionsRow}>
              {onSetActive && !isActive && (
                <TouchableOpacity
                  style={styles.iconButton}
                  onPress={() => onSetActive(account.id)}
                  accessibilityLabel={`Set ${account.nickname} as active account`}
                >
                  <Ionicons
                    name="checkmark-circle-outline"
                    size={20}
                    color="#a5d6b7"
                  />
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
