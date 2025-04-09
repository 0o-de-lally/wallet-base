import React from "react";
import { View, Text, StyleSheet, ActivityIndicator } from "react-native";
import { useBlockchainVitals } from "@/hooks/useBlockchainVitals";

type VitalsProps = {
  networkName: string;
};

const Vitals: React.FC<VitalsProps> = ({ networkName }) => {
  const { vitals, loading, error } = useBlockchainVitals(networkName);

  if (loading) {
    return (
      <View style={styles.container} accessible={true} accessibilityLabel="Loading blockchain vitals">
        <ActivityIndicator size="small" color="#6200ee" />
        <Text style={styles.loadingText}>Loading blockchain vitals...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.container} accessible={true} accessibilityLabel="Error loading blockchain vitals">
        <Text style={styles.errorText}>Error loading blockchain vitals</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Blockchain Vitals</Text>
      <View style={styles.infoRow}>
        <Text style={styles.label}>Network:</Text>
        <Text style={styles.value}>{networkName}</Text>
      </View>
      <View style={styles.infoRow}>
        <Text style={styles.label}>Block Height:</Text>
        <Text style={styles.value}>{vitals?.blockHeight || 'Unknown'}</Text>
      </View>
      <View style={styles.infoRow}>
        <Text style={styles.label}>Epoch:</Text>
        <Text style={styles.value}>{vitals?.epoch || 'Unknown'}</Text>
      </View>
      <View style={styles.infoRow}>
        <Text style={styles.label}>Last Updated:</Text>
        <Text style={styles.value}>
          {vitals?.lastUpdate ? new Date(vitals.lastUpdate).toLocaleTimeString() : 'Never'}
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: "#f5f5f5",
    borderRadius: 8,
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 12,
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: "500",
    color: "#555",
  },
  value: {
    fontSize: 14,
    fontWeight: "600",
  },
  loadingText: {
    marginTop: 8,
    color: "#666",
  },
  errorText: {
    color: "red",
  },
});

export default Vitals;
