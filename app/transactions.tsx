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

// Mock transaction data structure - replace with actual API calls
interface Transaction {
  id: string;
  type: "sent" | "received";
  amount: number;
  timestamp: number;
  status: "confirmed" | "pending" | "failed";
  hash?: string;
  to?: string;
  from?: string;
}

export default function TransactionsScreen() {
  const { profileName, accountNickname } = useLocalSearchParams<{
    accountId: string;
    profileName: string;
    accountNickname: string;
  }>();

  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Mock data - replace with actual API calls
  const loadTransactions = async (refresh = false) => {
    if (refresh) setIsRefreshing(true);
    else setIsLoading(true);

    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Mock transaction data
      const mockTransactions: Transaction[] = [
        {
          id: "1",
          type: "received",
          amount: 100.5,
          timestamp: Date.now() - 3600000, // 1 hour ago
          status: "confirmed",
          from: "0x1234...5678",
          hash: "0xabcd...efgh",
        },
        {
          id: "2",
          type: "sent",
          amount: 25.75,
          timestamp: Date.now() - 86400000, // 1 day ago
          status: "confirmed",
          to: "0x9876...5432",
          hash: "0xijkl...mnop",
        },
        {
          id: "3",
          type: "sent",
          amount: 50.0,
          timestamp: Date.now() - 172800000, // 2 days ago
          status: "pending",
          to: "0xqrst...uvwx",
          hash: "0xyzab...cdef",
        },
      ];

      setTransactions(mockTransactions);
    } catch (error) {
      console.error("Failed to load transactions:", error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    loadTransactions();
  }, []);

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
            name={isIncoming ? "arrow-down-circle" : "arrow-up-circle"}
            size={24}
            color={isIncoming ? "#a5d6b7" : "#f5a9a9"}
            style={{ marginRight: 12 }}
          />
          <View style={{ flex: 1 }}>
            <Text style={styles.resultLabel}>
              {isIncoming ? "Received" : "Sent"}
            </Text>
            <Text
              style={[styles.resultValue, { fontSize: 18, fontWeight: "600" }]}
            >
              {isIncoming ? "+" : "-"}
              {formatLibraAmount(transaction.amount)}
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

        <Text style={styles.resultValue}>
          {isIncoming ? "From" : "To"}:{" "}
          {isIncoming ? transaction.from : transaction.to}
        </Text>

        {transaction.hash && (
          <Text style={[styles.resultValue, { fontSize: 12, color: "#888" }]}>
            Hash: {transaction.hash}
          </Text>
        )}

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
