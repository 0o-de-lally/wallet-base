import React from "react";
import { View } from "react-native";
import { styles } from "../styles/styles";
import { appConfig } from "../util/settings-store";
import { observer } from "@legendapp/state/react";
import EnterPinScreen from "../components/pin-input/PinManagement";

export default observer(function PinScreen() {
  const backgroundColor = appConfig.theme.backgroundColor.get();

  return (
    <View style={[styles.root, { backgroundColor }]}>
      <EnterPinScreen />
    </View>
  );
});
