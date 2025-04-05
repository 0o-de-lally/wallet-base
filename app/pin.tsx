import React from "react";
import { StatusBar, View } from "react-native";
import { styles } from "../styles/styles";
import { observer } from "@legendapp/state/react";
import EnterPinScreen from "../components/pin-input/PinManagement";

export default observer(function PinScreen() {
  return (
    <View style={[styles.root]}>
      {/* TODO: should not duplicate this */}
      <StatusBar backgroundColor={styles.root.backgroundColor} />
      <EnterPinScreen />
    </View>
  );
});
