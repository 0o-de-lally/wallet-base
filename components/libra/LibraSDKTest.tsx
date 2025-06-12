import "buffer"; // Ensure Buffer is available globally
import React, { useState, useCallback, memo } from "react";
import { View, Text, ScrollView, Alert } from "react-native";
import { ActionButton } from "../common/ActionButton";
import { SectionContainer } from "../common/SectionContainer";
import { styles } from "../../styles/styles";
import type { LedgerInfo } from "open-libra-sdk";
import MnemonicGenerator from "./MnemonicGenerator";
import { useLibraClient } from "../../context/LibraClientContext";

const LibraSDKTest = memo(() => {
  // Get LibraClient from context
  const { client, currentNetwork, isInitializing } = useLibraClient();

  const [isLoading, setIsLoading] = useState(false);
  const [ledgerInfo, setLedgerInfo] = useState<LedgerInfo | null>(null);
  const [error, setError] = useState<string | null>(null);

  const testLedgerInfo = useCallback(async () => {
    if (!client) {
      setError("LibraClient not available");
      return;
    }

    setIsLoading(true);
    setError(null);
    setLedgerInfo(null);

    try {
      console.log("Fetching ledger info from Libra blockchain...");

      // Get ledger info using client from context
      const info = await client.getLedgerInfo();

      console.log("Ledger info received:", info);
      console.log("Block height:", info.block_height);

      setLedgerInfo(info);

      Alert.alert(
        "Success",
        `Successfully fetched ledger info!\nBlock height: ${info.block_height}`,
        [{ text: "OK" }],
      );
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Unknown error occurred";
      console.error("Error fetching ledger info:", err);
      setError(errorMessage);

      Alert.alert("Error", `Failed to fetch ledger info: ${errorMessage}`, [
        { text: "OK" },
      ]);
    } finally {
      setIsLoading(false);
    }
  }, [client]);

  const clearResults = useCallback(() => {
    setLedgerInfo(null);
    setError(null);
  }, []);

  // Show loading state while client is initializing
  if (isInitializing) {
    return (
      <SectionContainer title="Open-Libra SDK Test">
        <View>
          <Text style={styles.description}>Initializing LibraClient...</Text>
        </View>
      </SectionContainer>
    );
  }

  // Show error if client is not available
  if (!client) {
    return (
      <SectionContainer title="Open-Libra SDK Test">
        <View>
          <Text style={styles.errorText}>
            LibraClient is not available. Please check your network
            configuration.
          </Text>
        </View>
      </SectionContainer>
    );
  }

  return (
    <SectionContainer title="Open-Libra SDK Test">
      <View>
        <Text style={styles.description}>
          Test the Open-Libra SDK by fetching basic ledger information from the
          blockchain and generating wallet mnemonics.
        </Text>

        {currentNetwork && (
          <Text
            style={[styles.description, { marginTop: 10, fontStyle: "italic" }]}
          >
            Current Network: {currentNetwork.network_name} (
            {currentNetwork.network_type})
          </Text>
        )}

        <View style={styles.buttonContainer}>
          <ActionButton
            text="Fetch Ledger Info"
            onPress={testLedgerInfo}
            isLoading={isLoading}
            disabled={isLoading}
            accessibilityLabel="Fetch ledger information from Libra blockchain"
            accessibilityHint="Connects to the Libra blockchain and retrieves current ledger status"
          />

          {(ledgerInfo || error) && (
            <ActionButton
              text="Clear Ledger Results"
              onPress={clearResults}
              disabled={isLoading}
              style={{ marginTop: 10 }}
              accessibilityLabel="Clear ledger test results"
            />
          )}
        </View>

        {/* Mnemonic Generator Component */}
        <View style={{ marginTop: 20 }}>
          <MnemonicGenerator />
        </View>

        {/* Error Section */}
        {error && (
          <View style={[styles.inputContainer, { marginTop: 20 }]}>
            <Text style={styles.label}>Ledger Error:</Text>
            <ScrollView
              style={[
                styles.input,
                { height: 100, paddingHorizontal: 12, paddingVertical: 8 },
              ]}
              showsVerticalScrollIndicator={true}
            >
              <Text style={[styles.errorText, { fontSize: 12 }]}>{error}</Text>
            </ScrollView>
          </View>
        )}

        {/* Ledger Info Section */}
        {ledgerInfo && (
          <View style={[styles.inputContainer, { marginTop: 20 }]}>
            <Text style={styles.label}>Ledger Information:</Text>
            <ScrollView
              style={[
                styles.input,
                { height: 200, paddingHorizontal: 12, paddingVertical: 8 },
              ]}
              showsVerticalScrollIndicator={true}
            >
              <Text
                style={[styles.resultValue, { fontSize: 12, marginBottom: 5 }]}
              >
                <Text style={{ fontWeight: "bold" }}>Block Height:</Text>{" "}
                {ledgerInfo.block_height}
              </Text>
              <Text
                style={[styles.resultValue, { fontSize: 12, marginBottom: 5 }]}
              >
                <Text style={{ fontWeight: "bold" }}>Chain ID:</Text>{" "}
                {ledgerInfo.chain_id}
              </Text>
              <Text
                style={[styles.resultValue, { fontSize: 12, marginBottom: 5 }]}
              >
                <Text style={{ fontWeight: "bold" }}>Epoch:</Text>{" "}
                {ledgerInfo.epoch}
              </Text>
              <Text
                style={[styles.resultValue, { fontSize: 12, marginBottom: 5 }]}
              >
                <Text style={{ fontWeight: "bold" }}>Ledger Version:</Text>{" "}
                {ledgerInfo.ledger_version}
              </Text>
              <Text
                style={[styles.resultValue, { fontSize: 12, marginBottom: 5 }]}
              >
                <Text style={{ fontWeight: "bold" }}>Ledger Timestamp:</Text>{" "}
                {ledgerInfo.ledger_timestamp}
              </Text>
              <Text
                style={[styles.resultValue, { fontSize: 12, marginBottom: 5 }]}
              >
                <Text style={{ fontWeight: "bold" }}>Oldest Block Height:</Text>{" "}
                {ledgerInfo.oldest_block_height}
              </Text>
              <Text
                style={[styles.resultValue, { fontSize: 12, marginBottom: 5 }]}
              >
                <Text style={{ fontWeight: "bold" }}>
                  Oldest Ledger Version:
                </Text>{" "}
                {ledgerInfo.oldest_ledger_version}
              </Text>
            </ScrollView>
          </View>
        )}
      </View>
    </SectionContainer>
  );
});

LibraSDKTest.displayName = "LibraSDKTest";

export default LibraSDKTest;
