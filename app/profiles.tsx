import React from "react";
import { StatusBar, View } from "react-native";
import { styles } from "../styles/styles";
import { observer } from "@legendapp/state/react";
import ProfileManagement from "../components/profile/ProfileManagement";

const ProfilesScreen = observer(() => {
  return (
    <View style={styles.root}>
      <StatusBar backgroundColor={styles.root.backgroundColor} />
      <ProfileManagement />
    </View>
  );
});

export default ProfilesScreen;
