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
  // Get accounts from Legend state for the specific profile
  const accounts = useSelector(() => {
    const profiles = appConfig.profiles.get();
    const profile = profiles[profileName];
    return profile?.accounts || [];
  });

  console.log("AccountTotals received accounts:", accounts.length);
  console.log(
    "Account balances:",
    accounts.map((acc) => ({
      id: acc.id,
      unlocked: acc.balance_unlocked,
      total: acc.balance_total,
    })),
  );

  if (accounts.length === 0) {
    return null;
  }

  const totalUnlocked = accounts.reduce(
    (sum, account) => sum + (account.balance_unlocked || 0),
    0,
  );

  const totalBalance = accounts.reduce(
    (sum, account) => sum + (account.balance_total || 0),
    0,
  );

  console.log(
    "Calculated totals - Unlocked:",
    totalUnlocked,
    "Total:",
    totalBalance,
  );

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
          {formatLibraAmount(totalUnlocked)}
        </Text>
      </View>

      <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
        <Text style={styles.balanceText}>Total Balance:</Text>
        <Text style={styles.balanceText}>
          {formatLibraAmount(totalBalance)}
        </Text>
      </View>
    </View>
  );
});

AccountTotals.displayName = "AccountTotals";
