import React, { useEffect, useState } from "react";
import { View, ActivityIndicator } from "react-native";
import { styles } from "../styles/styles";
import { observer } from "@legendapp/state/react";
import ProfileManagement from "../components/profile/ProfileManagement";
import { SetupGuard } from "../components/auth/SetupGuard";
import { initializeApp } from "../util/initialize-app";
import { Stack } from "expo-router";

const ProfilesScreen = observer(() => {
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
    <SetupGuard requiresPin={true} requiresAccount={false}>
      <Stack.Screen
        options={{
          title: "Profile Management",
          headerBackTitle: "Back",
        }}
      />
      <View style={styles.root}>
        <ProfileManagement />
      </View>
    </SetupGuard>
  );
});

export default ProfilesScreen;
