import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import { styles } from "../styles/styles";
import { ActionButton } from "../components/common/ActionButton";
import { formatTimestamp, formatLibraAmount } from "../util/format-utils";
import { Ionicons } from "@expo/vector-icons";
import { getLibraClient } from "../util/libra-client";
import { appConfig, type AccountState } from "../util/app-config-store";
import type { TransactionResponse } from "@aptos-labs/ts-sdk";

// Real transaction data structure from blockchain
interface Transaction {
  id: string;
  type: "sent" | "received" | "other";
  amount?: number;
  timestamp: number;
  status: "confirmed" | "pending" | "failed";
  hash: string;
  to?: string;
  from?: string;
  version: string;
  txType: string;
}

export default function TransactionsScreen() {
  const { profileName, accountNickname, accountId } = useLocalSearchParams<{
    accountId: string;
    profileName: string;
    accountNickname: string;
  }>();

  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [account, setAccount] = useState<AccountState | null>(null);

  // Get account data
  useEffect(() => {
    if (accountId && profileName) {
      const profiles = appConfig.profiles.get();
      const profile = profiles[profileName];
      if (profile) {
        const foundAccount = profile.accounts.find(
          (acc) => acc.id === accountId,
        );
        setAccount(foundAccount || null);
      }
    }
  }, [accountId, profileName]);

  // Fetch real transaction data from blockchain
  const loadTransactions = async (refresh = false) => {
    if (!account?.account_address) return;
    
    if (refresh) setIsRefreshing(true);
    else setIsLoading(true);

    try {
      console.log("Fetching transactions for account:", account.account_address);
      const client = getLibraClient();

      // Query transactions for this account (increased limit to show more)
      const response = await client.getAccountTransactions({
        accountAddress: account.account_address,
        options: {
          limit: 50, // Show more transactions in the dedicated screen
          offset: 0
        }
      });

      console.log("Raw transaction response:", response);

      // Transform blockchain data to UI format
      const transformedTransactions: Transaction[] = response.map((tx: TransactionResponse, index: number) => {
        let version = 'N/A';
        let timestamp = Date.now();
        let success = true;

        // Extract data from transaction response
        if ('version' in tx && tx.version !== undefined) {
          version = tx.version.toString();
        }
        
        if ('timestamp' in tx && tx.timestamp !== undefined) {
          timestamp = parseInt(tx.timestamp) / 1000; // Convert to milliseconds
        }
        
        if ('success' in tx && tx.success !== undefined) {
          success = tx.success;
        }

        return {
          id: tx.hash || `tx-${index}`,
          type: "other", // We'll improve this detection later
          timestamp,
          status: success ? "confirmed" : "failed",
          hash: tx.hash,
          version,
          txType: tx.type || 'unknown'
        };
      });

      console.log("Transformed transactions:", transformedTransactions);
      setTransactions(transformedTransactions);
    } catch (error) {
      console.error("Failed to load transactions:", error);
      setTransactions([]); // Clear transactions on error
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    if (account) {
      loadTransactions();
    }
  }, [account]);

  const onRefresh = () => {
    loadTransactions(true);
  };

  const renderTransaction = (transaction: Transaction) => {
    const isIncoming = transaction.type === "received";
    const statusColor = {
      confirmed: "#a5d6b7",
      pending: "#f5d76e",
      failed: "#f5a9a9",
    }[transaction.status];

    // For blockchain transactions, we may not have amount data easily accessible
    // We'll show the transaction type and hash instead
    const displayAmount = transaction.amount ? formatLibraAmount(transaction.amount) : "N/A";

    return (
      <View
        key={transaction.id}
        style={[styles.resultContainer, { marginBottom: 12 }]}
      >
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            marginBottom: 8,
          }}
        >
          <Ionicons
            name={
              transaction.type === "received" 
                ? "arrow-down-circle" 
                : transaction.type === "sent"
                ? "arrow-up-circle"
                : "swap-horizontal"
            }
            size={24}
            color={
              transaction.type === "received" 
                ? "#a5d6b7" 
                : transaction.type === "sent"
                ? "#f5a9a9"
                : "#888"
            }
            style={{ marginRight: 12 }}
          />
          <View style={{ flex: 1 }}>
            <Text style={styles.resultLabel}>
              {transaction.type === "received" 
                ? "Received" 
                : transaction.type === "sent"
                ? "Sent"
                : transaction.txType || "Transaction"
              }
            </Text>
            <Text
              style={[styles.resultValue, { fontSize: 18, fontWeight: "600" }]}
            >
              {transaction.amount ? (
                `${isIncoming ? "+" : "-"}${displayAmount}`
              ) : (
                `Version ${transaction.version}`
              )}
            </Text>
          </View>
          <View
            style={{
              paddingHorizontal: 8,
              paddingVertical: 4,
              backgroundColor: statusColor,
              borderRadius: 4,
            }}
          >
            <Text style={{ color: "#000", fontSize: 12, fontWeight: "600" }}>
              {transaction.status.toUpperCase()}
            </Text>
          </View>
        </View>

        {(transaction.from || transaction.to) && (
          <Text style={styles.resultValue}>
            {isIncoming ? "From" : "To"}:{" "}
            {isIncoming ? transaction.from : transaction.to}
          </Text>
        )}

        <Text style={[styles.resultValue, { fontSize: 12, color: "#888" }]}>
          Hash: {transaction.hash}
        </Text>

        <Text style={styles.lastUpdatedText}>
          {formatTimestamp(transaction.timestamp)}
        </Text>
      </View>
    );
  };

  return (
    <View style={styles.safeAreaView}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} />
        }
      >
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            marginBottom: 24,
          }}
        >
          <ActionButton
            text="← Back"
            onPress={() => router.back()}
            size="small"
            style={{ marginRight: 16 }}
          />
          <View style={{ flex: 1 }}>
            <Text style={styles.title}>Transactions</Text>
            <Text style={styles.sectionTitle}>
              {accountNickname} • {profileName}
            </Text>
          </View>
        </View>

        {isLoading ? (
          <View style={{ alignItems: "center", marginTop: 40 }}>
            <ActivityIndicator size="large" />
            <Text style={[styles.resultValue, { marginTop: 16 }]}>
              Loading transactions...
            </Text>
          </View>
        ) : transactions.length === 0 ? (
          <View style={{ alignItems: "center", marginTop: 40 }}>
            <Ionicons name="receipt-outline" size={64} color="#888" />
            <Text style={[styles.title, { marginTop: 16, fontSize: 18 }]}>
              No Transactions
            </Text>
            <Text
              style={[
                styles.resultValue,
                { textAlign: "center", marginTop: 8 },
              ]}
            >
              Your transaction history will appear here once you start sending
              or receiving funds.
            </Text>
          </View>
        ) : (
          <View>{transactions.map(renderTransaction)}</View>
        )}
      </ScrollView>
    </View>
  );
}
