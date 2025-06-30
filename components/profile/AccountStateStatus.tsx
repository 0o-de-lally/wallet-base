import React from "react";
import { View, Text } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { styles } from "../../styles/styles";
import type { AccountState } from "../../util/app-config-store";

export interface AccountStateStatusProps {
  account: AccountState;
}

export const AccountStateStatus: React.FC<AccountStateStatusProps> = ({
  account,
}) => {
  const getV8AuthStatus = () => {
    if (account.is_v8_authorized === undefined) {
      return {
        text: "V8 Authorization: Checking...",
        color: "#888",
        icon: "time-outline" as const,
      };
    }
    if (account.is_v8_authorized === false) {
      return {
        text: "V8 Authorization: Not Authorized",
        color: "#ff3b30",
        icon: "shield-outline" as const,
      };
    }
    return {
      text: "V8 Authorization: Authorized",
      color: "#4cd964",
      icon: "shield-checkmark-outline" as const,
    };
  };

  const getMigrationStatus = () => {
    if (account.v8_migrated === undefined) {
      return {
        text: "Migration Status: Checking...",
        color: "#888",
        icon: "time-outline" as const,
      };
    }
    if (account.v8_migrated === false) {
      return {
        text: "Migration Status: Not Migrated",
        color: "#ff9500",
        icon: "swap-horizontal-outline" as const,
      };
    }
    return {
      text: "Migration Status: Migrated",
      color: "#4cd964",
      icon: "checkmark-circle-outline" as const,
    };
  };

  const v8AuthStatus = getV8AuthStatus();
  const migrationStatus = getMigrationStatus();

  return (
    <View style={[styles.listItem, { marginBottom: 16 }]}>
      <Text style={styles.sectionTitle}>Account Status</Text>

      {/* V8 Status Information */}
      <View style={{ gap: 12, marginTop: 16 }}>
        {/* V8 Authorization Status */}
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: 8,
          }}
        >
          <Ionicons
            name={v8AuthStatus.icon}
            size={18}
            color={v8AuthStatus.color}
          />
          <Text style={[styles.resultValue, { color: v8AuthStatus.color }]}>
            {v8AuthStatus.text}
          </Text>
        </View>

        {/* Migration Status */}
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: 8,
          }}
        >
          <Ionicons
            name={migrationStatus.icon}
            size={18}
            color={migrationStatus.color}
          />
          <Text style={[styles.resultValue, { color: migrationStatus.color }]}>
            {migrationStatus.text}
          </Text>
        </View>
      </View>

      {/* Warning messages for issues */}
      {(account.is_v8_authorized === false ||
        account.v8_migrated === false) && (
        <View
          style={{
            marginTop: 16,
            padding: 12,
            backgroundColor: "rgba(245, 169, 169, 0.1)", // Subtle danger background
            borderRadius: 8,
            borderWidth: 1,
            borderColor: "#f5a9a9", // Using the app's danger color
          }}
        >
          <Text
            style={[styles.resultValue, { color: "#f5a9a9", fontSize: 14 }]}
          >
            {account.is_v8_authorized === false && account.v8_migrated === false
              ? "Account requires both V8 authorization and migration to access all features."
              : account.is_v8_authorized === false
                ? "Account requires V8 authorization to access all features."
                : "Account requires migration to access all features."}
          </Text>
        </View>
      )}
    </View>
  );
};
