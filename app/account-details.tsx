import React, { useState, useEffect } from "react";
import { View, Text, ScrollView, RefreshControl } from "react-native";
import { useLocalSearchParams } from "expo-router";
import { styles } from "../styles/styles";
import { AccountStateStatus } from "../components/profile/AccountStateStatus";
import { HistoricalTransactions } from "../components/transaction/HistoricalTransactions";
import { appConfig, type AccountState } from "../util/app-config-store";
import { shortenAddress } from "../util/format-utils";

export default function AccountDetailsScreen() {
  const { accountId, profileName } = useLocalSearchParams<{
    accountId: string;
    profileName: string;
  }>();

  const [account, setAccount] = useState<AccountState | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Find the account by ID and observe changes
  useEffect(() => {
    if (accountId && profileName) {
      const updateAccount = () => {
        const profiles = appConfig.profiles.get();
        const profile = profiles[profileName];
        if (profile) {
          const foundAccount = profile.accounts.find(
            (acc) => acc.id === accountId,
          );
          setAccount(foundAccount || null);
        }
      };

      // Initial load
      updateAccount();

      // Subscribe to profile changes to get real-time updates
      const unsubscribe =
        appConfig.profiles[profileName].onChange(updateAccount);

      return unsubscribe;
    }
  }, [accountId, profileName]);

  const onRefresh = async () => {
    setIsRefreshing(true);
    // Add any refresh logic here (e.g., trigger account polling)
    setTimeout(() => setIsRefreshing(false), 1000);
  };

  const accountNickname = account?.nickname || "";

  return (
    <View style={styles.safeAreaView}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} />
        }
      >
        <View>
          <Text style={styles.sectionTitle}>
            {profileName} •{" "}
            {account
              ? shortenAddress(account.account_address, 4, 4)
              : "Loading..."}
            {` • ${accountNickname}`}
          </Text>
        </View>

        {/* Account Authorization Status */}
        {account && <AccountStateStatus account={account} />}

        {/* Historical Transactions */}
        {account && (
          <HistoricalTransactions
            accountId={account.id}
            accountAddress={account.account_address}
          />
        )}
      </ScrollView>
    </View>
  );
}
