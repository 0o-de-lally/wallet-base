import "buffer"; // Ensure Buffer is available globally
import React, { useState, useCallback, memo } from "react";
import { View, Text, ScrollView, Alert } from "react-native";
import { ActionButton } from "../common/ActionButton";
import { styles } from "../../styles/styles";
import { generateMnemonic, LibraWallet } from "open-libra-sdk/dist/browser/index.js";

interface MnemonicGeneratorProps {
  onClear?: () => void;
}

const MnemonicGenerator = memo(({ onClear }: MnemonicGeneratorProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const [mnemonic, setMnemonic] = useState<string | null>(null);
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const generateMnemonicPhrase = useCallback(async () => {
    const startTime = performance.now();
    console.log("Starting mnemonic generation process...");

    setIsLoading(true);
    setError(null);

    try {
      // Step 1: UI delay for better UX
      const delayStart = performance.now();
      await new Promise(resolve => setTimeout(resolve, 500));
      const delayEnd = performance.now();
      console.log(`UI delay: ${(delayEnd - delayStart).toFixed(2)}ms`);

      // Step 2: Generate mnemonic
      const mnemonicStart = performance.now();
      console.log("Generating mnemonic phrase...");
      const newMnemonic = generateMnemonic();
      const mnemonicEnd = performance.now();
      console.log(`Mnemonic generated in: ${(mnemonicEnd - mnemonicStart).toFixed(2)}ms`);
      console.log(`Mnemonic length: ${newMnemonic.split(' ').length} words`);

      setMnemonic(newMnemonic);

      // Step 3: Create wallet from mnemonic
      const walletStart = performance.now();
      console.log("Creating wallet from mnemonic...");
      const wallet = LibraWallet.fromMnemonic(newMnemonic);
      const walletEnd = performance.now();
      console.log(`Wallet created in: ${(walletEnd - walletStart).toFixed(2)}ms`);

      // Step 4: Generate address
      const addressStart = performance.now();
      console.log("Generating wallet address...");
      const address = wallet.getAddress().toStringLong();
      const addressEnd = performance.now();
      console.log(`Address generated in: ${(addressEnd - addressStart).toFixed(2)}ms`);
      console.log(`Address: ${address}`);

      setWalletAddress(address);

      const totalTime = performance.now() - startTime;
      console.log(`Total process completed in: ${totalTime.toFixed(2)}ms`);
      console.log(`Breakdown: Delay=${(delayEnd - delayStart).toFixed(2)}ms, Mnemonic=${(mnemonicEnd - mnemonicStart).toFixed(2)}ms, Wallet=${(walletEnd - walletStart).toFixed(2)}ms, Address=${(addressEnd - addressStart).toFixed(2)}ms`);

      Alert.alert(
        "Success",
        `Mnemonic generated successfully!\nAddress: ${address.substring(0, 20)}...`,
        [{ text: "OK" }],
      );
    } catch (err) {
      const errorTime = performance.now() - startTime;
      console.error(`Error after ${errorTime.toFixed(2)}ms:`, err);
      const errorMessage =
        err instanceof Error ? err.message : "Unknown error occurred";
      console.error("Error generating mnemonic:", err);
      setError(errorMessage);

      Alert.alert("Error", `Failed to generate mnemonic: ${errorMessage}`, [
        { text: "OK" },
      ]);
    } finally {
      const finalTime = performance.now() - startTime;
      console.log(`Process finished, setting loading to false after: ${finalTime.toFixed(2)}ms`);
      setIsLoading(false);
    }
  }, []);

  const clearResults = useCallback(() => {
    setMnemonic(null);
    setWalletAddress(null);
    setError(null);
    onClear?.();
  }, [onClear]);

  return (
    <View>
      <ActionButton
        text="Generate Mnemonic"
        onPress={generateMnemonicPhrase}
        isLoading={isLoading}
        disabled={isLoading}
        accessibilityLabel="Generate new wallet mnemonic"
        accessibilityHint="Creates a new BIP39 mnemonic phrase for wallet creation"
      />

      {(mnemonic || error) && (
        <ActionButton
          text="Clear Mnemonic"
          onPress={clearResults}
          disabled={isLoading}
          style={{ marginTop: 10 }}
          accessibilityLabel="Clear mnemonic results"
        />
      )}

      {/* Error Section */}
      {error && (
        <View style={[styles.inputContainer, { marginTop: 20 }]}>
          <Text style={styles.label}>Mnemonic Error:</Text>
          <ScrollView
            style={[
              styles.input,
              { height: 100, paddingHorizontal: 12, paddingVertical: 8 },
            ]}
            showsVerticalScrollIndicator={true}
          >
            <Text style={[styles.errorText, { fontSize: 12 }]}>
              {error}
            </Text>
          </ScrollView>
        </View>
      )}

      {/* Mnemonic Section */}
      {mnemonic && (
        <View style={[styles.inputContainer, { marginTop: 20 }]}>
          <Text style={styles.label}>Generated Mnemonic:</Text>
          <ScrollView
            style={[
              styles.input,
              { height: 160, paddingHorizontal: 12, paddingVertical: 8 },
            ]}
            showsVerticalScrollIndicator={true}
          >
            <Text
              style={[
                styles.resultValue,
                {
                  fontSize: 12,
                  marginBottom: 10,
                  backgroundColor: "#2a2a2a",
                  padding: 10,
                  borderRadius: 5,
                  fontFamily: "monospace"
                },
              ]}
            >
              {mnemonic}
            </Text>
            {walletAddress && (
              <View style={{ marginBottom: 10 }}>
                <Text
                  style={[
                    styles.resultValue,
                    {
                      fontSize: 10,
                      fontWeight: "bold",
                      marginBottom: 5,
                      color: "#a5d6b7",
                    },
                  ]}
                >
                  Wallet Address:
                </Text>
                <Text
                  style={[
                    styles.resultValue,
                    {
                      fontSize: 11,
                      backgroundColor: "#1a1a1a",
                      padding: 8,
                      borderRadius: 3,
                      fontFamily: "monospace",
                      color: "#e0e0e0",
                    },
                  ]}
                >
                  {walletAddress}
                </Text>
              </View>
            )}
            <Text
              style={[
                styles.resultValue,
                {
                  fontSize: 10,
                  fontStyle: "italic",
                  color: "#888",
                },
              ]}
            >
              ⚠️ Store this mnemonic securely. Anyone with access to it can control your wallet.
            </Text>
          </ScrollView>
        </View>
      )}
    </View>
  );
});

MnemonicGenerator.displayName = "MnemonicGenerator";

export default MnemonicGenerator;
