import React, { useState, useEffect } from "react";
import { View, Text } from "react-native";
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

  return (
    <View style={styles.safeAreaView}>
      <View style={styles.container}>
        {/* Header section - fixed at top */}
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            marginBottom: 24,
            paddingHorizontal: 16,
            paddingTop: 16,
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
        {/* It will handle its own scrolling with FlatList */}
        {account && (
          <HistoricalTransactions accountAddress={account.account_address} />
        )}
      </View>
    </View>
  );
}
