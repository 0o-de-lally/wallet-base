import "buffer"; // Ensure Buffer is available globally
import React, { useState, useCallback, memo } from "react";
import { View, Text, ScrollView, Alert } from "react-native";
import { ActionButton } from "../common/ActionButton";
import { SectionContainer } from "../common/SectionContainer";
import { styles } from "../../styles/styles";
import { LibraClient } from "open-libra-sdk/dist/browser/index.js";
import type { LedgerInfo } from "open-libra-sdk/dist/browser/index.js";

const LibraSDKTest = memo(() => {
  const [isLoading, setIsLoading] = useState(false);
  const [ledgerInfo, setLedgerInfo] = useState<LedgerInfo | null>(null);
  const [error, setError] = useState<string | null>(null);

  const testLedgerInfo = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    setLedgerInfo(null);

    try {
      // Create client for mainnet (as shown in the documentation)
      const client = new LibraClient();

      console.log("Fetching ledger info from Libra blockchain...");

      // Get ledger info
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
  }, []);

  const clearResults = useCallback(() => {
    setLedgerInfo(null);
    setError(null);
  }, []);
  return (
    <SectionContainer title="Open-Libra SDK Test">
      <View>
        <Text style={styles.description}>
          Test the Open-Libra SDK by fetching basic ledger information from the
          blockchain.
        </Text>

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
              text="Clear Results"
              onPress={clearResults}
              disabled={isLoading}
              style={{ marginTop: 10 }}
              accessibilityLabel="Clear test results"
            />
          )}
        </View>

        {/* Results Section */}
        {(ledgerInfo || error) && (
          <View style={[styles.inputContainer, { marginTop: 20 }]}>
            <Text style={styles.label}>Results:</Text>
            <ScrollView
              style={[
                styles.input,
                { height: 200, paddingHorizontal: 12, paddingVertical: 8 },
              ]}
              showsVerticalScrollIndicator={true}
            >
              {error && (
                <View style={{ marginBottom: 10 }}>
                  <Text
                    style={[
                      styles.errorText,
                      { fontSize: 14, fontWeight: "bold" },
                    ]}
                  >
                    Error:
                  </Text>
                  <Text
                    style={[styles.errorText, { fontSize: 12, marginTop: 5 }]}
                  >
                    {error}
                  </Text>
                </View>
              )}

              {ledgerInfo && (
                <View>
                  <Text
                    style={[
                      styles.resultLabel,
                      {
                        fontSize: 14,
                        fontWeight: "bold",
                        marginBottom: 10,
                        color: "#a5d6b7",
                      },
                    ]}
                  >
                    Ledger Information:
                  </Text>
                  <Text
                    style={[
                      styles.resultValue,
                      { fontSize: 12, marginBottom: 5 },
                    ]}
                  >
                    <Text style={{ fontWeight: "bold" }}>Block Height:</Text>{" "}
                    {ledgerInfo.block_height}
                  </Text>
                  <Text
                    style={[
                      styles.resultValue,
                      { fontSize: 12, marginBottom: 5 },
                    ]}
                  >
                    <Text style={{ fontWeight: "bold" }}>Chain ID:</Text>{" "}
                    {ledgerInfo.chain_id}
                  </Text>
                  <Text
                    style={[
                      styles.resultValue,
                      { fontSize: 12, marginBottom: 5 },
                    ]}
                  >
                    <Text style={{ fontWeight: "bold" }}>Epoch:</Text>{" "}
                    {ledgerInfo.epoch}
                  </Text>
                  <Text
                    style={[
                      styles.resultValue,
                      { fontSize: 12, marginBottom: 5 },
                    ]}
                  >
                    <Text style={{ fontWeight: "bold" }}>Ledger Version:</Text>{" "}
                    {ledgerInfo.ledger_version}
                  </Text>
                  <Text
                    style={[
                      styles.resultValue,
                      { fontSize: 12, marginBottom: 5 },
                    ]}
                  >
                    <Text style={{ fontWeight: "bold" }}>
                      Ledger Timestamp:
                    </Text>{" "}
                    {ledgerInfo.ledger_timestamp}
                  </Text>
                  <Text
                    style={[
                      styles.resultValue,
                      { fontSize: 12, marginBottom: 5 },
                    ]}
                  >
                    <Text style={{ fontWeight: "bold" }}>
                      Oldest Block Height:
                    </Text>{" "}
                    {ledgerInfo.oldest_block_height}
                  </Text>
                  <Text
                    style={[
                      styles.resultValue,
                      { fontSize: 12, marginBottom: 5 },
                    ]}
                  >
                    <Text style={{ fontWeight: "bold" }}>
                      Oldest Ledger Version:
                    </Text>{" "}
                    {ledgerInfo.oldest_ledger_version}
                  </Text>
                </View>
              )}
            </ScrollView>
          </View>
        )}
      </View>
    </SectionContainer>
  );
});

LibraSDKTest.displayName = "LibraSDKTest";

export default LibraSDKTest;
