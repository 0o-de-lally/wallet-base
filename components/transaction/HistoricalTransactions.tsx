import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  FlatList,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { styles } from "../../styles/styles";
import { getLibraClient } from "../../util/libra-client";
import { LIBRA_SCALE_FACTOR } from "../../util/constants";
import { formatTimestamp, formatCurrency } from "../../util/format-utils";
import type { TransactionResponse } from "@aptos-labs/ts-sdk";

export interface HistoricalTransactionsProps {
  accountAddress: string;
  showTitle?: boolean; // Optional prop to show/hide the title
}

interface TransactionItem {
  hash: string;
  shortHash: string;
  version: string;
  timestamp: string;
  timestampMs: number; // Raw timestamp for reliable sorting
  formattedDate: string;
  success: boolean;
  gasFee: string;
  payloadFunction: string;
  payloadArguments: string[];
  vmStatus: string;
  // Add more fields as needed from TransactionResponse
}

export const HistoricalTransactions: React.FC<HistoricalTransactionsProps> = ({
  accountId,
  accountAddress,
  showTitle = true,
}) => {
  const [transactions, setTransactions] = useState<TransactionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const fetchTransactions = async () => {
    try {
      setLoading(true);
      setError(null);

      console.log("Fetching transactions for account:", accountAddress);
      const client = getLibraClient();

      // Query the last 10 transactions for this account
      // Since LibraClient extends Aptos, we can call getAccountTransactions directly
      const response = await client.getAccountTransactions({
        accountAddress: accountAddress,
        options: {
          limit: 10, // Limit to last 10 transactions
          offset: 0, // Start from the most recent
        },
      });

      console.log("Raw transaction response:", response);

      // Transform the response to our display format
      const transformedTransactions: TransactionItem[] = response.map(
        (tx: TransactionResponse) => {
          // Handle different transaction types - be more careful with type checking
          let version = "N/A";
          let timestamp = "N/A";
          let timestampMs = 0;
          let formattedDate = "N/A";
          let success = false;
          let gasFee = "N/A";
          let payloadFunction = "N/A";
          let payloadArguments: string[] = [];
          let vmStatus = "N/A";

          // Check if this is a committed transaction
          if ("version" in tx && tx.version !== undefined) {
            const versionNumber = parseInt(tx.version);
            version = versionNumber.toLocaleString();
          }

          if ("timestamp" in tx && tx.timestamp !== undefined) {
            timestampMs = parseInt(tx.timestamp) / 1000;
            timestamp = formatTimestamp(timestampMs);

            // Create a more compact date for the header with conditional year
            const date = new Date(timestampMs);
            const currentYear = new Date().getFullYear();
            const transactionYear = date.getFullYear();

            if (currentYear === transactionYear) {
              // Same year - show only month, day and time
              formattedDate =
                date.toLocaleDateString(undefined, {
                  month: "short",
                  day: "numeric",
                }) +
                " " +
                date.toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                });
            } else {
              // Different year - include the year
              formattedDate =
                date.toLocaleDateString(undefined, {
                  year: "numeric",
                  month: "short",
                  day: "numeric",
                }) +
                " " +
                date.toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                });
            }
          }

          // Create shortened hash (first 4 characters after 0x)
          const shortHash = tx.hash.startsWith("0x")
            ? tx.hash.slice(0, 6)
            : tx.hash.slice(0, 4);

          if ("success" in tx && tx.success !== undefined) {
            success = tx.success;
          }

          // Calculate gas fee: gas_unit_price * gas_used / LIBRA_SCALE_FACTOR
          if (
            "gas_unit_price" in tx &&
            "gas_used" in tx &&
            tx.gas_unit_price !== undefined &&
            tx.gas_used !== undefined
          ) {
            const gasUnitPrice = parseInt(tx.gas_unit_price);
            const gasUsed = parseInt(tx.gas_used);
            const totalGasFee = gasUnitPrice * gasUsed;
            const scaledGasFee = totalGasFee / LIBRA_SCALE_FACTOR;
            gasFee = formatCurrency(scaledGasFee, 2) + " LBR";
          }

          // Extract payload function and arguments
          if ("payload" in tx && tx.payload !== undefined) {
            const payload = tx.payload as {
              function?: string;
              arguments?: unknown[];
              [key: string]: unknown;
            };
            if (payload.function) {
              payloadFunction = payload.function;
            }
            if (payload.arguments && Array.isArray(payload.arguments)) {
              payloadArguments = payload.arguments.map((arg: unknown) =>
                typeof arg === "string" ? arg : JSON.stringify(arg),
              );
            }
          }

          // Extract VM status
          if ("vm_status" in tx && tx.vm_status !== undefined) {
            vmStatus = tx.vm_status as string;
          }

          return {
            hash: tx.hash,
            shortHash,
            version,
            timestamp,
            timestampMs,
            formattedDate,
            success,
            gasFee,
            payloadFunction,
            payloadArguments,
            vmStatus,
          };
        },
      );

      // Sort transactions in reverse chronological order (newest first)
      const sortedTransactions = transformedTransactions.sort((a, b) => {
        // Use raw timestamp for reliable sorting
        return b.timestampMs - a.timestampMs; // Newest first
      });

      console.log("Transformed and sorted transactions:", sortedTransactions);
      setTransactions(sortedTransactions);
    } catch (err) {
      console.error("Error fetching transactions:", err);
      setError(
        err instanceof Error ? err.message : "Failed to fetch transactions",
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (accountAddress) {
      fetchTransactions();
    }
  }, [accountAddress]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchTransactions();
  };

  const renderTransaction = ({ item }: { item: TransactionItem }) => (
    <View style={styles.listItem}>
      <View style={styles.transactionHeader}>
        <Text style={styles.transactionDate}>{item.formattedDate}</Text>
        <View style={styles.transactionStatusContainer}>
          {item.success ? (
            <Ionicons name="checkmark-circle" size={20} color="#4CAF50" />
          ) : (
            <View style={styles.failureContainer}>
              <Ionicons name="close-circle" size={20} color="#F44336" />
              <Text style={[styles.vmStatusText, { color: "#F44336" }]}>
                {item.vmStatus}
              </Text>
            </View>
          )}
        </View>
      </View>
      <View style={styles.transactionDetails}>
        {/* Function and Arguments Section - moved to top */}
        <View style={styles.functionSection}>
          <Text style={styles.transactionDetailText}>
            Function: {item.payloadFunction}
          </Text>
          {item.payloadArguments.length > 0 && (
            <View style={styles.argumentsContainer}>
              <Text style={styles.transactionDetailText}>Arguments:</Text>
              {item.payloadArguments.map((arg, index) => (
                <Text
                  key={index}
                  style={[styles.transactionDetailText, styles.argumentText]}
                  numberOfLines={2}
                  ellipsizeMode="tail"
                >
                  [{index}]: {arg}
                </Text>
              ))}
            </View>
          )}
        </View>

        {/* Transaction Details Section */}
        <Text style={styles.transactionDetailText}>Hash: {item.shortHash}</Text>
        <Text style={styles.transactionDetailText}>
          Version: {item.version}
        </Text>
        <Text style={styles.transactionDetailText}>Gas Fee: {item.gasFee}</Text>
      </View>
    </View>
  );

  const renderEmptyComponent = () => (
    <View style={styles.emptyState}>
      <Text style={styles.emptyStateText}>No transactions found</Text>
    </View>
  );

  const renderHeader = () =>
    showTitle ? (
      <Text style={styles.sectionTitle}>Recent Transactions</Text>
    ) : null;

  if (loading && !refreshing) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" />
        <Text style={styles.loadingText}>Loading transactions...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Error: {error}</Text>
        <Text style={styles.retryText} onPress={fetchTransactions}>
          Tap to retry
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.transactionsList}>
      <FlatList
        data={transactions}
        renderItem={renderTransaction}
        keyExtractor={(item) => item.hash}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={renderEmptyComponent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        contentContainerStyle={{ paddingHorizontal: 16 }}
      />
    </View>
  );
};
