import React from "react";
import { View, Text } from "react-native";
import { CopyButton } from "../common/CopyButton";
import { styles } from "../../styles/styles";

export const ClipboardTestComponent: React.FC = () => {
  const testMnemonic =
    "abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about";
  const testAddress = "0x1234567890abcdef1234567890abcdef12345678";

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Clipboard Test</Text>

      <View style={styles.inputContainer}>
        <Text style={styles.label}>Test Mnemonic</Text>
        <Text style={styles.description}>{testMnemonic}</Text>
        <CopyButton
          text={testMnemonic}
          label="Copy Mnemonic"
          variant="primary"
        />
      </View>

      <View style={styles.inputContainer}>
        <Text style={styles.label}>Test Address</Text>
        <Text style={styles.description}>{testAddress}</Text>
        <CopyButton
          text={testAddress}
          label="Copy Address"
          variant="secondary"
        />
      </View>

      <View style={styles.inputContainer}>
        <Text style={styles.label}>Icon Only</Text>
        <CopyButton text="Hello World" variant="icon" size="small" />
      </View>
    </View>
  );
};
