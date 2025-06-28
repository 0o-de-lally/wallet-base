import React, { useState, useEffect } from "react";
import { View, Text, FlatList, ActivityIndicator } from "react-native";
import { styles } from "../../styles/styles";
import { getLibraClient } from "../../util/libra-client";
import type { TransactionResponse } from "@aptos-labs/ts-sdk";

interface HistoricalTransactionsProps {
  accountAddress: string;
}

interface TransactionItem {
  hash: string;
  type: string;
  version: string;
  timestamp: string;
  success: boolean;
  // Add more fields as needed from TransactionResponse
}

export function HistoricalTransactions({
  accountAddress
}: HistoricalTransactionsProps) {
  const [transactions, setTransactions] = useState<TransactionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
          offset: 0   // Start from the most recent
        }
      });

      console.log("Raw transaction response:", response);

      // Transform the response to our display format
      const transformedTransactions: TransactionItem[] = response.map((tx: TransactionResponse) => {
        // Handle different transaction types - be more careful with type checking
        let version = 'N/A';
        let timestamp = 'N/A';
        let success = false;

        // Check if this is a committed transaction
        if ('version' in tx && tx.version !== undefined) {
          version = tx.version.toString();
        }

        if ('timestamp' in tx && tx.timestamp !== undefined) {
          timestamp = new Date(parseInt(tx.timestamp) / 1000).toLocaleString();
        }

        if ('success' in tx && tx.success !== undefined) {
          success = tx.success;
        }

        return {
          hash: tx.hash,
          type: tx.type,
          version,
          timestamp,
          success,
        };
      });

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
      setError(err instanceof Error ? err.message : "Failed to fetch transactions");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (accountAddress) {
      fetchTransactions();
    }
  }, [accountAddress]);

  const renderTransaction = ({ item }: { item: TransactionItem }) => (
    <View style={styles.listItem}>
      <View style={styles.transactionHeader}>
        <Text style={styles.transactionHash} numberOfLines={1} ellipsizeMode="middle">
          {item.hash}
        </Text>
        <Text style={[
          styles.transactionStatus,
          { color: item.success ? '#4CAF50' : '#F44336' }
        ]}>
          {item.success ? '✓' : '✗'}
        </Text>
      </View>
      <View style={styles.transactionDetails}>
        <Text style={styles.transactionDetailText}>Type: {item.type}</Text>
        <Text style={styles.transactionDetailText}>Version: {item.version}</Text>
        <Text style={styles.transactionDetailText}>Time: {item.timestamp}</Text>
      </View>
    </View>
  );

  const renderEmptyComponent = () => (
    <View style={styles.emptyState}>
      <Text style={styles.emptyStateText}>No transactions found</Text>
    </View>
  );

  if (loading) {
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
        <Text
          style={styles.retryText}
          onPress={fetchTransactions}
        >
          Tap to retry
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.sectionContainer}>
      <Text style={styles.sectionTitle}>Recent Transactions</Text>
      <FlatList
        data={transactions}
        renderItem={renderTransaction}
        keyExtractor={(item) => item.hash}
        ListEmptyComponent={renderEmptyComponent}
        showsVerticalScrollIndicator={false}
        style={styles.transactionsList}
      />
    </View>
  );
}
