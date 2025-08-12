import React, { memo } from "react";
import { View, Text, TouchableOpacity, Alert } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSelector } from "@legendapp/state/react";
import { styles, colors } from "../../styles/styles";
import { formatCurrency, shortenAddress } from "../../util/format-utils";
import { appConfig, type AccountState } from "../../util/app-config-store";
import { router } from "expo-router";
import { retryAccountBalance } from "../../util/balance-polling-service";
import { reportErrorAuto } from "../../util/error-utils";
import { Identicon } from "../common/Identicon";

// Helper component for account status icons
const AccountStatusIcons = ({
  account,
  iconSize = 14,
}: {
  account: AccountState;
  iconSize?: number;
}) => {
  if (account.exists_on_chain === false) {
    return (
      <Ionicons
        name="globe-outline"
        size={iconSize}
        color={colors.danger}
        accessibilityLabel="Account not found on chain"
      />
    );
  }

  return (
    <>
      {account.last_error && (
        <Ionicons
          name="warning-outline"
          size={iconSize}
          color={colors.danger}
          accessibilityLabel="Balance data may be outdated"
        />
      )}
      {account.is_v8_authorized === false && (
        <Ionicons
          name="alert"
          size={iconSize}
          color={colors.danger}
          accessibilityLabel="Account not v8 authorized"
        />
      )}
      {account.v8_migrated === false && (
        <Ionicons
          name="swap-horizontal-outline"
          size={iconSize}
          color={colors.danger}
          accessibilityLabel="Account not migrated"
        />
      )}
    </>
  );
};

// Helper component for account address and nickname
const AccountHeader = ({
  account,
  fontSize = 16,
}: {
  account: AccountState;
  fontSize?: number;
}) => (
  <Text style={[styles.accountNickname, { fontSize }]}>
    <Text style={{ color: colors.textSecondary }}>0x</Text>
    {shortenAddress(account.account_address, 4, 4)}
    {account.nickname && ` - ${account.nickname}`}
  </Text>
);

// Helper component for view-only icon
const ViewOnlyIcon = ({
  account,
  iconSize = 20,
}: {
  account: AccountState;
  iconSize?: number;
}) => {
  if (account.is_key_stored) return null;

  return (
    <TouchableOpacity
      style={[styles.iconButton, iconSize < 20 ? { padding: 6 } : undefined]}
      disabled={true}
      accessibilityLabel="View only account"
    >
      <Ionicons
        name="eye-outline"
        size={iconSize}
        color={colors.textSecondary}
      />
    </TouchableOpacity>
  );
};

// Compact view component
const CompactAccountView = ({ account }: { account: AccountState }) => (
  <View>
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
      }}
    >
      <View
        style={{ flexDirection: "row", alignItems: "center", gap: 6, flex: 1 }}
      >
        <AccountHeader account={account} fontSize={14} />
        <View style={{ flex: 1 }} />
        <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
          <AccountStatusIcons account={account} iconSize={12} />
        </View>
      </View>

      <View style={styles.compactActions}>
        <ViewOnlyIcon account={account} iconSize={16} />
      </View>
    </View>

    <View style={styles.compactBalanceRow}>
      <Text
        style={[styles.balanceText, styles.balancePrimary, { fontSize: 13 }]}
      >
        {formatCurrency(account.balance_unlocked, 2)}
      </Text>
      <Text style={[styles.balanceText, { fontSize: 12 }]}>
        Total: {formatCurrency(account.balance_total, 2)}
      </Text>
    </View>
  </View>
);

// Full view component
const FullAccountView = ({
  account,
  isActive,
  navigateToTransactionHub,
  navigateToSettings,
}: {
  account: AccountState;
  isActive?: boolean;
  navigateToTransactionHub: () => void;
  navigateToSettings: () => void;
}) => (
  <View>
    <View style={styles.accountHeader}>
      <View style={styles.accountInfo}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
          <AccountHeader account={account} />
          <View style={{ flex: 1 }} />
          <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
            <AccountStatusIcons account={account} iconSize={14} />
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
      <ViewOnlyIcon account={account} iconSize={20} />

      {account.exists_on_chain !== false && (
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
        )}

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
);

export interface AccountItemProps {
  accountId: string;
  profileName: string;
  isActive?: boolean;
  onSetActive?: (accountId: string) => void;
  compact?: boolean;
  isSwitching?: boolean;
}

export const AccountItem = memo(
  ({
    accountId,
    profileName,
    isActive,
    onSetActive,
    compact = false,
    isSwitching = false,
  }: AccountItemProps) => {
    // Reactively get account data from the store
    const account = useSelector(() => {
      const profiles = appConfig.profiles.get();
      const profile = profiles[profileName];
      if (!profile?.accounts) return null;
      const foundAccount =
        profile.accounts.find((acc) => acc.id === accountId) || null;

      return foundAccount;
    });

    // Early return if account not found
    if (!account) {
      return null;
    }

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
        await retryAccountBalance(account.id);
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
      if (!isActive && onSetActive) {
        onSetActive(account.id);
      } else {
        navigateToAccountDetails();
      }
    };

    const getAccessibilityLabel = () => {
      const parts = [`Account ${account.nickname}`];
      if (isActive) parts.push("(active)");
      if (isSwitching) parts.push("(switching)");
      if (account.exists_on_chain === false) parts.push("(not found on chain)");
      if (account.last_error)
        parts.push("(data may be outdated - long press to retry)");
      if (account.is_v8_authorized === false) parts.push("(not v8 authorized)");
      if (account.v8_migrated === false) parts.push("(not migrated)");
      return parts.join(" ");
    };

    const containerStyles = [
      styles.listItem,
      compact
        ? styles.accountItemContainerCompact
        : styles.accountItemContainer,
      isActive && styles.accountItemActive,
      compact && styles.compactAccountItem,
      isSwitching && { opacity: 0.6 },
      {
        padding: 0,
        paddingHorizontal: 0,
        paddingVertical: 0,
      },
    ];

    return (
      <TouchableOpacity
        key={account.id}
        style={containerStyles}
        accessible={true}
        accessibilityLabel={getAccessibilityLabel()}
        onPress={handlePress}
        onLongPress={account.last_error ? handleRetryBalance : undefined}
        disabled={isSwitching}
      >
        <View
          style={{
            position: "relative",
            flexDirection: "row",
            overflow: "hidden",
          }}
        >
          <View
            style={{
              position: "absolute",
              left: 0,
              top: 0,
              bottom: 0,
              zIndex: 0,
            }}
          >
            <Identicon
              address={account.account_address}
              style={{ height: "100%" }}
            />
          </View>

          <View
            style={{
              flex: 1,
              marginLeft: 16,
              padding: compact ? 4 : 16,
            }}
          >
            {compact ? (
              <CompactAccountView account={account} />
            ) : (
              <FullAccountView
                account={account}
                isActive={isActive}
                navigateToTransactionHub={navigateToTransactionHub}
                navigateToSettings={navigateToSettings}
              />
            )}
          </View>
        </View>
      </TouchableOpacity>
    );
  },
);

AccountItem.displayName = "AccountItem";
