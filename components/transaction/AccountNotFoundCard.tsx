import React from "react";
import { View, Text } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { CopyButton } from "../common/CopyButton";
import { styles, colors } from "../../styles/styles";

export interface AccountNotFoundCardProps {
  accountAddress: string;
}

export const AccountNotFoundCard: React.FC<AccountNotFoundCardProps> = ({
  accountAddress,
}) => {
  return (
    <View style={[styles.listItem, { marginBottom: 16 }]}>
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          gap: 12,
          marginBottom: 16,
        }}
      >
        <Ionicons name="globe-outline" size={24} color={colors.textSecondary} />
        <Text style={[styles.sectionTitle, { flex: 1 }]}>
          Account Not Found on Chain
        </Text>
      </View>

      <Text style={[styles.resultValue, { marginBottom: 16 }]}>
        This account address does not exist on the blockchain yet. To activate
        this account, someone needs to send coins to it.
      </Text>

      <View
        style={{
          backgroundColor: colors.cardBg,
          padding: 12,
          borderRadius: 8,
          borderWidth: 1,
          borderColor: colors.border,
        }}
      >
        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 4,
          }}
        >
          <Text style={styles.resultLabel}>Account Address:</Text>
          <CopyButton
            text={accountAddress}
            label="Copy"
            variant="icon"
            size="small"
            accessibilityLabel="Copy account address"
            accessibilityHint="Copy the account address to clipboard"
          />
        </View>

        <Text style={[styles.resultValue, { fontFamily: "monospace" }]}>
          {accountAddress}
        </Text>
      </View>
    </View>
  );
};
