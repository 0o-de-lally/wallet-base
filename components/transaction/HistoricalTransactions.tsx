import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  FlatList,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { styles } from "../../styles/styles";
import { getLibraClient } from "../../util/libra-client";
import type { TransactionResponse } from "@aptos-labs/ts-sdk";

interface HistoricalTransactionsProps {
  accountAddress: string;
  showTitle?: boolean; // Optional prop to show/hide the title
}

interface TransactionItem {
  hash: string;
  type: string;
  version: string;
  timestamp: string;
  success: boolean;
  gasFee: string;
  payloadFunction: string;
  payloadArguments: string[];
  vmStatus: string;
  // Add more fields as needed from TransactionResponse
}

export function HistoricalTransactions({
  accountAddress,
  showTitle = true,
}: HistoricalTransactionsProps) {
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
          let success = false;
          let gasFee = "N/A";
          let payloadFunction = "N/A";
          let payloadArguments: string[] = [];
          let vmStatus = "N/A";

          // Check if this is a committed transaction
          if ("version" in tx && tx.version !== undefined) {
            version = tx.version.toString();
          }

          if ("timestamp" in tx && tx.timestamp !== undefined) {
            timestamp = new Date(
              parseInt(tx.timestamp) / 1000,
            ).toLocaleString();
          }

          if ("success" in tx && tx.success !== undefined) {
            success = tx.success;
          }

          // Calculate gas fee: gas_unit_price * gas_used
          if ("gas_unit_price" in tx && "gas_used" in tx && 
              tx.gas_unit_price !== undefined && tx.gas_used !== undefined) {
            const gasUnitPrice = parseInt(tx.gas_unit_price);
            const gasUsed = parseInt(tx.gas_used);
            const totalGasFee = gasUnitPrice * gasUsed;
            gasFee = totalGasFee.toLocaleString();
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
                typeof arg === 'string' ? arg : JSON.stringify(arg)
              );
            }
          }

          // Extract VM status
          if ("vm_status" in tx && tx.vm_status !== undefined) {
            vmStatus = tx.vm_status as string;
          }

          return {
            hash: tx.hash,
            type: tx.type,
            version,
            timestamp,
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
        // Convert timestamp strings back to numbers for comparison
        const timestampA = new Date(a.timestamp).getTime();
        const timestampB = new Date(b.timestamp).getTime();
        return timestampB - timestampA; // Newest first
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
        <Text
          style={styles.transactionHash}
          numberOfLines={1}
          ellipsizeMode="middle"
        >
          {item.hash}
        </Text>
        <View style={styles.transactionStatusContainer}>
          {item.success ? (
            <Text style={[styles.transactionStatus, { color: "#4CAF50" }]}>
              ✓
            </Text>
          ) : (
            <View>
              <Text style={[styles.transactionStatus, { color: "#F44336" }]}>
                ✗
              </Text>
              <Text style={[styles.vmStatusText, { color: "#F44336" }]}>
                {item.vmStatus}
              </Text>
            </View>
          )}
        </View>
      </View>
      <View style={styles.transactionDetails}>
        <Text style={styles.transactionDetailText}>Type: {item.type}</Text>
        <Text style={styles.transactionDetailText}>
          Version: {item.version}
        </Text>
        <Text style={styles.transactionDetailText}>Time: {item.timestamp}</Text>
        <Text style={styles.transactionDetailText}>
          Gas Fee: {item.gasFee} units
        </Text>
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
}
