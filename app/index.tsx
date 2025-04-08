import React, { useEffect, useState } from "react";
import { View, ActivityIndicator, StatusBar } from "react-native";
import { styles } from "../styles/styles";
import { observer } from "@legendapp/state/react";
import { initializeApp } from "../util/initialize-app";
import { Stack } from "expo-router";
import Wallets from "@/components/profile/Wallets";
import { ActionButton } from "@/components/common/ActionButton";
import { router } from "expo-router";
import {
  startBalanceChecker,
  stopBalanceChecker,
} from "@/util/balance-fetcher";

const HomeScreen = observer(() => {
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    const init = async () => {
      await initializeApp();
      setIsInitialized(true);

      // Start the balance checker after initialization
      startBalanceChecker();
    };
    init();

    // Clean up when component unmounts
    return () => {
      stopBalanceChecker();
    };
  }, []);

  const navigateToProfiles = () => {
    router.push("/profiles");
  };

  const navigateToCreateAccount = () => {
    router.push("/create-account");
  };

  const navigateToPinManagement = () => {
    router.push("/pin");
  };

  if (!isInitialized) {
    return (
      <View
        style={[
          styles.root,
          { justifyContent: "center", alignItems: "center" },
        ]}
      >
        <ActivityIndicator size="large" color="#94c2f3" />
      </View>
    );
  }

  return (
    <>
      <Stack.Screen
        options={{
          title: "My Wallets",
          headerLargeTitle: true,
        }}
      />
      <View style={styles.root}>
        <StatusBar backgroundColor={styles.root.backgroundColor} />

        {/* Button Menu - Vertical Layout */}
        <View style={[styles.buttonContainer, { flexDirection: "column" }]}>
          <ActionButton
            text="Manage Profiles"
            onPress={navigateToProfiles}
            style={[styles.button, { marginBottom: 10 }]}
            accessibilityLabel="Manage wallet profiles"
          />
          <ActionButton
            text="Add Account"
            onPress={navigateToCreateAccount}
            style={[styles.button, { marginBottom: 10 }]}
            accessibilityLabel="Create a new account"
          />
          <ActionButton
            text="PIN Settings"
            onPress={navigateToPinManagement}
            style={styles.button}
            accessibilityLabel="Manage PIN settings"
          />
        </View>

        <Wallets />
      </View>
    </>
  );
});

export default HomeScreen;
