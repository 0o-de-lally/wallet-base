import React, { useState, useEffect } from "react";
import { View, Text, ScrollView, RefreshControl } from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import { styles } from "../styles/styles";
import { ActionButton } from "../components/common/ActionButton";
import { HistoricalTransactions } from "../components/transaction/HistoricalTransactions";
import { appConfig, type AccountState } from "../util/app-config-store";

export default function TransactionsScreen() {
  const { profileName, accountNickname, accountId } = useLocalSearchParams<{
    accountId: string;
    profileName: string;
    accountNickname: string;
  }>();

  const [isRefreshing, setIsRefreshing] = useState(false);
  const [account, setAccount] = useState<AccountState | null>(null);

  // Get account data
  useEffect(() => {
    if (accountId && profileName) {
      const profiles = appConfig.profiles.get();
      const profile = profiles[profileName];
      if (profile) {
        const foundAccount = profile.accounts.find(
          (acc) => acc.id === accountId,
        );
        setAccount(foundAccount || null);
      }
    }
  }, [accountId, profileName]);

  const onRefresh = async () => {
    setIsRefreshing(true);
    // The HistoricalTransactions component will handle its own refresh
    setTimeout(() => setIsRefreshing(false), 1000);
  };

  return (
    <View style={styles.safeAreaView}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} />
        }
      >
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            marginBottom: 24,
          }}
        >
          <ActionButton
            text="← Back"
            onPress={() => router.back()}
            size="small"
            style={{ marginRight: 16 }}
          />
          <View style={{ flex: 1 }}>
            <Text style={styles.title}>Transactions</Text>
            <Text style={styles.sectionTitle}>
              {accountNickname} • {profileName}
            </Text>
          </View>
        </View>

        {/* Use the HistoricalTransactions component to display transactions */}
        {account && (
          <HistoricalTransactions accountAddress={account.account_address} />
        )}
      </ScrollView>
    </View>
  );
}
