import React from "react";
import { View, Text } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { styles, colors } from "../../styles/styles";
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
        color: colors.textSecondary,
        icon: "time-outline" as const,
      };
    }
    if (account.is_v8_authorized === false) {
      return {
        text: "V8 Authorization: Not Authorized",
        color: colors.red,
        icon: "shield-outline" as const,
      };
    }
    return {
      text: "V8 Authorization: Authorized",
      color: colors.green,
      icon: "shield-checkmark-outline" as const,
    };
  };

  const getMigrationStatus = () => {
    if (account.v8_migrated === undefined) {
      return {
        text: "Migration Status: Checking...",
        color: colors.textSecondary,
        icon: "time-outline" as const,
      };
    }
    if (account.v8_migrated === false) {
      return {
        text: "Migration Status: Not Migrated",
        color: colors.red,
        icon: "swap-horizontal-outline" as const,
      };
    }
    return {
      text: "Migration Status: Migrated",
      color: colors.green,
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
            backgroundColor: colors.redLight,
            borderRadius: 8,
            borderWidth: 1,
            borderColor: colors.red,
          }}
        >
          <Text
            style={[styles.resultValue, { color: colors.red, fontSize: 14 }]}
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
