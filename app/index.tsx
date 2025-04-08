import React, { useEffect, useState } from "react";
import { View, ActivityIndicator, StatusBar } from "react-native";
import { styles } from "../styles/styles";
import { observer } from "@legendapp/state/react";
import { initializeApp } from "../util/initialize-app";
import { Stack } from "expo-router";
import Wallets from "@/components/profile/Wallets";

const HomeScreen = observer(() => {
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    const init = async () => {
      await initializeApp();
      setIsInitialized(true);
    };

    init();
  }, []);

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
        <Wallets />
      </View>
    </>
  );
});

export default HomeScreen;
