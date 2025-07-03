import React from "react";
import { View, Text } from "react-native";
import { Ionicons } from "@expo/vector-icons";
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
        <Text style={[styles.resultLabel, { marginBottom: 4 }]}>
          Account Address:
        </Text>
        <Text style={[styles.resultValue, { fontFamily: "monospace" }]}>
          {accountAddress}
        </Text>
      </View>

      <View
        style={{
          marginTop: 16,
          padding: 12,
          backgroundColor: colors.cardBg,
          borderRadius: 8,
        }}
      >
        <Text style={[styles.resultValue, { fontSize: 14 }]}>
          💡 <Text style={{ fontWeight: "bold" }}>Tip:</Text> Share this address
          with someone to receive your first coins and activate the account.
        </Text>
      </View>
    </View>
  );
};
