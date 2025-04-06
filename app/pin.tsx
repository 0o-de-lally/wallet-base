import React from "react";
import { StatusBar, View } from "react-native";
import { styles } from "../styles/styles";
import { observer } from "@legendapp/state/react";
import EnterPinScreen from "../components/pin-input/PinManagement";
import { ModalProvider } from "../context/ModalContext";

export default observer(function PinScreen() {
  return (
    <ModalProvider>
      <View style={[styles.root]}>
        <StatusBar backgroundColor={styles.root.backgroundColor} />
        <EnterPinScreen />
      </View>
    </ModalProvider>
  );
});
