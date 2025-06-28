import React, { useState, useEffect } from "react";
import { View, Text, FlatList, ActivityIndicator, Alert } from "react-native";
import { styles } from "../../styles/styles";
import { getLibraClient } from "../../util/libra-client";
import type { TransactionResponse } from "@aptos-labs/ts-sdk";

interface HistoricalTransactionsProps {
  accountId: string;
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
  accountId,
  accountAddress
}: HistoricalTransactionsProps) {
  const [transactions, setTransactions] = useState<TransactionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTransactions = async () => {
    try {
      setLoading(true);
      setError(null);

      const client = getLibraClient();

      // Query the last 10 transactions for this account
      const response = await client.getAccountTransactions({
        accountAddress: accountAddress,
        options: {
          limit: 10, // Limit to last 10 transactions
          offset: 0   // Start from the most recent
        }
      });

      // Transform the response to our display format
      const transformedTransactions: TransactionItem[] = response.map((tx: TransactionResponse) => {
        // Handle different transaction types
        const version = 'version' in tx ? tx.version.toString() : 'N/A';
        const timestamp = 'timestamp' in tx ? tx.timestamp : 'N/A';
        const success = 'success' in tx ? tx.success : false;

        return {
          hash: tx.hash,
          type: tx.type,
          version,
          timestamp,
          success,
        };
      });

      setTransactions(transformedTransactions);
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
