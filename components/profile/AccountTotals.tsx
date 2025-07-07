import React, { memo } from "react";
import { View, Text } from "react-native";
import { useSelector } from "@legendapp/state/react";
import { styles } from "../../styles/styles";
import { formatLibraAmount } from "../../util/format-utils";
import { appConfig } from "../../util/app-config-store";

interface AccountTotalsProps {
  profileName: string;
}

export const AccountTotals = memo(({ profileName }: AccountTotalsProps) => {
  // Get account balance totals from Legend state, tracking specific balance properties
  const balanceTotals = useSelector(() => {
    const profiles = appConfig.profiles.get();
    const profile = profiles[profileName];
    const accounts = profile?.accounts || [];
    
    // Return an object with the calculated totals to ensure reactivity
    // when individual account balances change
    const totalUnlocked = accounts.reduce(
      (sum, account) => sum + (account.balance_unlocked || 0),
      0,
    );

    const totalBalance = accounts.reduce(
      (sum, account) => sum + (account.balance_total || 0),
      0,
    );

    return {
      accountCount: accounts.length,
      totalUnlocked,
      totalBalance,
      // Include a timestamp of the last update to ensure reactivity
      lastUpdate: Math.max(...accounts.map(acc => acc.last_update || 0), 0)
    };
  });

  if (balanceTotals.accountCount === 0) {
    return null;
  }

  return (
    <View style={{ marginTop: 20 }}>
      {/* Table-like layout for aligned values */}
      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          marginBottom: 4,
        }}
      >
        <Text style={[styles.balanceText, styles.balancePrimary]}>
          Total Unlocked:
        </Text>
        <Text style={[styles.balanceText, styles.balancePrimary]}>
          {formatLibraAmount(balanceTotals.totalUnlocked)}
        </Text>
      </View>

      <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
        <Text style={styles.balanceText}>Total Balance:</Text>
        <Text style={styles.balanceText}>
          {formatLibraAmount(balanceTotals.totalBalance)}
        </Text>
      </View>
    </View>
  );
});

AccountTotals.displayName = "AccountTotals";
