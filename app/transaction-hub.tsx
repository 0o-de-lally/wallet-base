import React from "react";
import { View, Text } from "react-native";
import { Stack, useLocalSearchParams, router } from "expo-router";
import { styles } from "../styles/styles";
import { ActionButton } from "../components/common/ActionButton";
import { TransactionHub } from "../components/transaction/TransactionHub";
import { SetupGuard } from "../components/auth/SetupGuard";

export default function TransactionHubScreen() {
  const { accountId, profileName, accountNickname } = useLocalSearchParams<{
    accountId: string;
    profileName: string;
    accountNickname: string;
  }>();

  if (!accountId || !profileName) {
    return (
      <SetupGuard requiresPin={true} requiresAccount={true}>
        <View style={styles.root}>
          <Stack.Screen
            options={{
              title: "Transaction Hub",
              headerBackTitle: "Back",
            }}
          />
          <View style={styles.container}>
            <Text style={styles.errorText}>
              Missing account information. Please navigate back and try again.
            </Text>
            <ActionButton
              text="← Back"
              onPress={() => router.back()}
              size="small"
              style={{ marginTop: 16 }}
            />
          </View>
        </View>
      </SetupGuard>
    );
  }

  return (
    <SetupGuard requiresPin={true} requiresAccount={true}>
      <View style={styles.root}>
        <Stack.Screen
          options={{
            title: accountNickname ? `${accountNickname} - Transactions` : "Transaction Hub",
            headerBackTitle: "Back",
          }}
        />
        
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            marginBottom: 16,
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
        </View>

        <TransactionHub 
          accountId={accountId}
          profileName={profileName}
        />
      </View>
    </SetupGuard>
  );
}
