import React, { memo } from "react";
import { View, Text, TouchableOpacity, Alert } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { styles, colors } from "../../styles/styles";
import { formatCurrency, shortenAddress } from "../../util/format-utils";
import type { AccountState } from "../../util/app-config-store";
import { router } from "expo-router";
import { retryAccountBalance } from "../../util/balance-polling-service";
import { reportErrorAuto } from "../../util/error-utils";
import { Identicon } from "../common/Identicon";

export interface AccountItemProps {
  account: AccountState;
  profileName: string;
  isActive?: boolean;
  onSetActive?: (accountId: string) => void;
  compact?: boolean;
  isSwitching?: boolean;
}

export const AccountItem = memo(
  ({
    account,
    profileName,
    isActive,
    onSetActive,
    compact = false,
    isSwitching = false,
  }: AccountItemProps) => {
    const navigateToAccountDetails = () => {
      router.navigate({
        pathname: "./account-details",
        params: {
          accountId: account.id,
          profileName,
          accountNickname: account.nickname,
        },
      });
    };

    const navigateToTransactionHub = () => {
      router.navigate({
        pathname: "./transaction-hub",
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
        reportErrorAuto("AccountItem.handleRetryBalance", error, {
          accountId: account.id,
        });
        Alert.alert(
          "Retry Failed",
          "Could not refresh balance data. Please check your connection and try again.",
          [{ text: "OK" }],
        );
      }
    };

    const handlePress = () => {
      // If account is not active and onSetActive callback is provided, set it as active
      if (!isActive && onSetActive) {
        onSetActive(account.id);
      } else {
        // If account is already active, navigate to account details
        navigateToAccountDetails();
      }
    };

    return (
      <TouchableOpacity
        key={account.id}
        style={[
          styles.listItem, // Use the same style as historical transactions
          compact
            ? styles.accountItemContainerCompact
            : styles.accountItemContainer,
          isActive && styles.accountItemActive,
          compact && styles.compactAccountItem,
          isSwitching && { opacity: 0.6 },
        ]}
        accessible={true}
        accessibilityLabel={`Account ${account.nickname}${isActive ? " (active)" : ""}${isSwitching ? " (switching)" : ""}${account.last_error ? " (data may be outdated - long press to retry)" : ""}${account.exists_on_chain === false ? " (not found on chain)" : ""}${account.is_v8_authorized === false ? " (not v8 authorized)" : ""}${account.v8_migrated === false ? " (not migrated)" : ""}`}
        onPress={handlePress}
        onLongPress={account.last_error ? handleRetryBalance : undefined}
        disabled={isSwitching}
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
                <View>
                  <Text style={[styles.accountNickname, { fontSize: 14 }]}>
                    <Text style={{ color: colors.textSecondary }}>0x</Text>
                    {shortenAddress(account.account_address, 4, 4)}
                    {account.nickname && ` - ${account.nickname}`}
                  </Text>
                  <Identicon
                    address={account.account_address}
                    size={16}
                    style={{
                      alignSelf: "flex-start",
                    }}
                  />
                </View>
                <View style={{ flex: 1 }} />
                <View
                  style={{ flexDirection: "row", alignItems: "center", gap: 4 }}
                >
                  {account.last_error && (
                    <Ionicons
                      name="warning-outline"
                      size={12}
                      color={colors.danger}
                      accessibilityLabel="Balance data may be outdated"
                    />
                  )}
                  {account.exists_on_chain === false && (
                    <Ionicons
                      name="globe-outline"
                      size={12}
                      color={colors.textSecondary}
                      accessibilityLabel="Account not found on chain"
                    />
                  )}
                  {account.is_v8_authorized === false && (
                    <Ionicons
                      name="alert"
                      size={12}
                      color={colors.danger}
                      accessibilityLabel="Account not v8 authorized"
                    />
                  )}
                  {account.v8_migrated === false && (
                    <Ionicons
                      name="swap-horizontal-outline"
                      size={12}
                      color={colors.danger}
                      accessibilityLabel="Account not migrated"
                    />
                  )}
                </View>
              </View>

              <View style={styles.compactActions}>
                {!account.is_key_stored && (
                  <TouchableOpacity
                    style={[styles.iconButton, { padding: 6 }]}
                    disabled={true}
                    accessibilityLabel="View only account"
                  >
                    <Ionicons
                      name="eye-outline"
                      size={16}
                      color={colors.textSecondary}
                    />
                  </TouchableOpacity>
                )}

                <TouchableOpacity
                  style={[styles.iconButton, { padding: 6 }]}
                  onPress={navigateToSettings}
                  accessibilityLabel={`Manage account ${account.nickname}`}
                >
                  <Ionicons
                    name="settings-outline"
                    size={16}
                    color={colors.textSecondary}
                  />
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
                  <View>
                    <Text style={styles.accountNickname}>
                      <Text style={{ color: colors.textSecondary }}>0x</Text>
                      {shortenAddress(account.account_address, 4, 4)}
                      {account.nickname && ` - ${account.nickname} `}
                    </Text>
                    <Identicon
                      address={account.account_address}
                      size={24}
                      style={{
                        alignSelf: "flex-start",
                      }}
                    />
                  </View>
                  <View style={{ flex: 1 }} />
                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      gap: 4,
                    }}
                  >
                    {account.last_error && (
                      <Ionicons
                        name="warning-outline"
                        size={14}
                        color={colors.danger}
                        accessibilityLabel="Balance data may be outdated"
                      />
                    )}
                    {account.exists_on_chain === false && (
                      <Ionicons
                        name="globe-outline"
                        size={14}
                        color={colors.textSecondary}
                        accessibilityLabel="Account not found on chain"
                      />
                    )}
                    {account.is_v8_authorized === false && (
                      <Ionicons
                        name="alert"
                        size={14}
                        color={colors.danger}
                        accessibilityLabel="Account not v8 authorized"
                      />
                    )}
                    {account.v8_migrated === false && (
                      <Ionicons
                        name="swap-horizontal-outline"
                        size={14}
                        color={colors.danger}
                        accessibilityLabel="Account not migrated"
                      />
                    )}
                  </View>
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
              {!account.is_key_stored && (
                <TouchableOpacity
                  style={styles.iconButton}
                  disabled={true}
                  accessibilityLabel="View only account"
                >
                  <Ionicons
                    name="eye-outline"
                    size={20}
                    color={colors.textSecondary}
                  />
                </TouchableOpacity>
              )}

              <TouchableOpacity
                style={styles.iconButton}
                onPress={navigateToTransactionHub}
                accessibilityLabel={`Transaction hub for ${account.nickname}`}
              >
                <Ionicons
                  name="send-outline"
                  size={20}
                  color={colors.textSecondary}
                />
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.iconButton}
                onPress={navigateToSettings}
                accessibilityLabel={`Manage account ${account.nickname}`}
              >
                <Ionicons
                  name="settings-outline"
                  size={20}
                  color={colors.textSecondary}
                />
              </TouchableOpacity>
            </View>
          </View>
        )}
      </TouchableOpacity>
    );
  },
);

AccountItem.displayName = "AccountItem";
