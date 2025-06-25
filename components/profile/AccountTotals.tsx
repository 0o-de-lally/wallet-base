import React, { memo } from "react";
import { View, Text } from "react-native";
import { styles } from "../../styles/styles";
import { formatCurrency } from "../../util/format-utils";
import type { AccountState } from "../../util/app-config-store";

interface AccountTotalsProps {
  accounts: AccountState[];
}

export const AccountTotals = memo(({ accounts }: AccountTotalsProps) => {
  console.log("AccountTotals received accounts:", accounts.length);
  console.log("Account balances:", accounts.map(acc => ({
    id: acc.id,
    unlocked: acc.balance_unlocked,
    total: acc.balance_total
  })));

  if (accounts.length === 0) {
    return null;
  }

  const totalUnlocked = accounts.reduce(
    (sum, account) => sum + (account.balance_unlocked || 0),
    0
  );

  const totalBalance = accounts.reduce(
    (sum, account) => sum + (account.balance_total || 0),
    0
  );

  console.log("Calculated totals - Unlocked:", totalUnlocked, "Total:", totalBalance);

  return (
    <View style={{ marginTop: 20 }}>
      <View style={{ height: 1, backgroundColor: '#444455', marginBottom: 12 }} />
      <Text style={[styles.balanceText, styles.balancePrimary]}>
        Total Unlocked: {formatCurrency(totalUnlocked)}
      </Text>
      <Text style={styles.balanceText}>
        Total Balance: {formatCurrency(totalBalance)}
      </Text>
    </View>
  );
});

AccountTotals.displayName = "AccountTotals";
