import React from "react";
import { View, Text } from "react-native";
import { styles } from "../../styles/styles";
import type { AccountState } from "../../util/app-config-store";

interface AccountStateStatusProps {
  account: AccountState;
}

export function AccountStateStatus({ account }: AccountStateStatusProps) {
  return (
    <View style={styles.sectionContainer}>
      <Text style={styles.sectionTitle}>Account Status</Text>
      <View style={styles.resultContainer}>
        <View style={{ marginBottom: 12 }}>
          <Text style={styles.resultLabel}>Account ID:</Text>
          <Text style={styles.resultValue}>{account.id}</Text>
        </View>
        <View style={{ marginBottom: 12 }}>
          <Text style={styles.resultLabel}>Address:</Text>
          <Text style={styles.resultValue} numberOfLines={1} ellipsizeMode="middle">
            {account.account_address}
          </Text>
        </View>
        {account.nickname && (
          <View>
            <Text style={styles.resultLabel}>Nickname:</Text>
            <Text style={styles.resultValue}>{account.nickname}</Text>
          </View>
        )}
      </View>
    </View>
  );
}
