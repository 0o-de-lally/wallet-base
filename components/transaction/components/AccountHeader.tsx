import React, { memo } from "react";
import { View, Text } from "react-native";
import { styles } from "../../../styles/styles";
import { SectionContainer } from "../../common/SectionContainer";
import { formatLibraAmount, shortenAddress } from "../../../util/format-utils";
import type { AccountState } from "../../../util/app-config-store";

interface AccountHeaderProps {
  account: AccountState;
}

export const AccountHeader = memo(({ account }: AccountHeaderProps) => {
  return (
    <SectionContainer title="Transaction Hub">
      <View style={styles.resultContainer}>
        <Text style={styles.resultLabel}>Account:</Text>
        <Text style={styles.resultValue}>
          {account.nickname} ({shortenAddress(account.account_address)})
        </Text>
        <Text style={[styles.resultValue, { marginTop: 8 }]}>
          Available Balance: {formatLibraAmount(account.balance_unlocked)}
        </Text>
        <Text style={styles.resultValue}>
          Total Balance: {formatLibraAmount(account.balance_total)}
        </Text>
      </View>
    </SectionContainer>
  );
});

AccountHeader.displayName = "AccountHeader";
