import React, { useEffect, useState } from "react";
import { StatusBar, View, ActivityIndicator } from "react-native";
import { styles } from "../styles/styles";
import { observer } from "@legendapp/state/react";
import ProfileManagement from "../components/profile/ProfileManagement";
import { initializeApp } from "../util/initialize-app";

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
      <View style={[styles.root, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color="#94c2f3" />
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <StatusBar backgroundColor={styles.root.backgroundColor} />
      <ProfileManagement />
    </View>
  );
});

export default ProfilesScreen;
