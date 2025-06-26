import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
  RefreshControl,
} from "react-native";
import { observer } from "@legendapp/state/react";
import { Ionicons } from "@expo/vector-icons";
import { styles } from "../../styles/styles";
import { SectionContainer } from "../common/SectionContainer";
import { ActionButton } from "../common/ActionButton";
import {
  getErrorLogs,
  getErrorLogStats,
  clearErrorLogs,
  clearOldErrorLogs,
} from "../../util/error-utils";
import { formatTimestamp } from "../../util/format-utils";

interface ErrorLogsViewProps {
  onClose?: () => void;
}

/**
 * Developer view for visualizing error logs
 */
export const ErrorLogsView: React.FC<ErrorLogsViewProps> = observer(
  ({ onClose }) => {
    const [selectedLevel, setSelectedLevel] = useState<string | null>(null);
    const [selectedContext, setSelectedContext] = useState<string | null>(null);
    const [expandedLogs, setExpandedLogs] = useState<Set<string>>(new Set());
    const [refreshing, setRefreshing] = useState(false);

    const errorLogs = getErrorLogs();
    const stats = getErrorLogStats();

    // Filter logs based on selected filters
    const filteredLogs = errorLogs.filter((log) => {
      if (selectedLevel && log.level !== selectedLevel) return false;
      if (selectedContext && log.context !== selectedContext) return false;
      return true;
    });

    const toggleLogExpansion = (logId: string) => {
      const newExpanded = new Set(expandedLogs);
      if (newExpanded.has(logId)) {
        newExpanded.delete(logId);
      } else {
        newExpanded.add(logId);
      }
      setExpandedLogs(newExpanded);
    };

    const handleRefresh = async () => {
      setRefreshing(true);
      // Simulate refresh delay
      setTimeout(() => setRefreshing(false), 300);
    };

    const handleClearLogs = () => {
      Alert.alert(
        "Clear Error Logs",
        "Are you sure you want to clear all error logs?",
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "Clear All",
            style: "destructive",
            onPress: () => {
              clearErrorLogs();
              Alert.alert("Success", "All error logs have been cleared.");
            },
          },
        ],
      );
    };

    const handleClearOldLogs = () => {
      Alert.alert("Clear Old Logs", "Clear error logs older than 24 hours?", [
        { text: "Cancel", style: "cancel" },
        {
          text: "Clear Old",
          onPress: () => {
            clearOldErrorLogs();
            Alert.alert("Success", "Old error logs have been cleared.");
          },
        },
      ]);
    };

    const getLevelColor = (level: string) => {
      switch (level) {
        case "error":
          return "#FF6B6B";
        case "warn":
          return "#FFB84D";
        case "debug":
          return "#51CF66";
        default:
          return "#868E96";
      }
    };

    const getLevelIcon = (level: string) => {
      switch (level) {
        case "error":
          return "alert-circle";
        case "warn":
          return "warning";
        case "debug":
          return "information-circle";
        default:
          return "help-circle";
      }
    };

    return (
      <View style={{ flex: 1, backgroundColor: "#1a1a1a" }}>
        {/* Header */}
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            padding: 16,
            borderBottomWidth: 1,
            borderBottomColor: "#333",
          }}
        >
          <Text style={[styles.title, { flex: 1 }]}>Error Logs</Text>
          {onClose && (
            <TouchableOpacity onPress={onClose} style={{ padding: 8 }}>
              <Ionicons name="close" size={24} color="#fff" />
            </TouchableOpacity>
          )}
        </View>

        <ScrollView
          style={{ flex: 1 }}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
          }
        >
          {/* Statistics */}
          <SectionContainer title="Statistics">
            <View style={styles.resultContainer}>
              <Text style={styles.resultValue}>Total Logs: {stats.total}</Text>
              <Text style={styles.resultValue}>
                Errors: {stats.byLevel.error || 0} | Warnings:{" "}
                {stats.byLevel.warn || 0} | Debug: {stats.byLevel.debug || 0}
              </Text>
              {stats.newestTimestamp && (
                <Text style={styles.resultValue}>
                  Latest: {formatTimestamp(stats.newestTimestamp)}
                </Text>
              )}
              {stats.oldestTimestamp && (
                <Text style={styles.resultValue}>
                  Oldest: {formatTimestamp(stats.oldestTimestamp)}
                </Text>
              )}
            </View>
          </SectionContainer>

          {/* Controls */}
          <SectionContainer title="Controls">
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
              <ActionButton
                text="Clear All"
                onPress={handleClearLogs}
                style={{ flex: 1, minWidth: 120 }}
              />
              <ActionButton
                text="Clear Old"
                onPress={handleClearOldLogs}
                style={{ flex: 1, minWidth: 120 }}
              />
            </View>
          </SectionContainer>

          {/* Filters */}
          <SectionContainer title="Filters">
            <View style={{ marginBottom: 12 }}>
              <Text style={[styles.resultValue, { marginBottom: 8 }]}>
                Level:
              </Text>
              <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
                <TouchableOpacity
                  style={[
                    styles.filterButton,
                    !selectedLevel && styles.filterButtonActive,
                  ]}
                  onPress={() => setSelectedLevel(null)}
                >
                  <Text
                    style={[
                      styles.filterButtonText,
                      !selectedLevel && styles.filterButtonTextActive,
                    ]}
                  >
                    All
                  </Text>
                </TouchableOpacity>
                {["error", "warn", "debug"].map((level) => (
                  <TouchableOpacity
                    key={level}
                    style={[
                      styles.filterButton,
                      selectedLevel === level && styles.filterButtonActive,
                    ]}
                    onPress={() => setSelectedLevel(level)}
                  >
                    <Text
                      style={[
                        styles.filterButtonText,
                        selectedLevel === level &&
                          styles.filterButtonTextActive,
                      ]}
                    >
                      {level} ({stats.byLevel[level] || 0})
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View>
              <Text style={[styles.resultValue, { marginBottom: 8 }]}>
                Context:
              </Text>
              <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
                <TouchableOpacity
                  style={[
                    styles.filterButton,
                    !selectedContext && styles.filterButtonActive,
                  ]}
                  onPress={() => setSelectedContext(null)}
                >
                  <Text
                    style={[
                      styles.filterButtonText,
                      !selectedContext && styles.filterButtonTextActive,
                    ]}
                  >
                    All
                  </Text>
                </TouchableOpacity>
                {Object.entries(stats.byContext).map(([context, count]) => (
                  <TouchableOpacity
                    key={context}
                    style={[
                      styles.filterButton,
                      selectedContext === context && styles.filterButtonActive,
                    ]}
                    onPress={() => setSelectedContext(context)}
                  >
                    <Text
                      style={[
                        styles.filterButtonText,
                        selectedContext === context &&
                          styles.filterButtonTextActive,
                      ]}
                    >
                      {context} ({count})
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </SectionContainer>

          {/* Error Logs */}
          <SectionContainer title={`Logs (${filteredLogs.length})`}>
            {filteredLogs.length === 0 ? (
              <View style={styles.resultContainer}>
                <Text style={styles.resultValue}>No logs found</Text>
              </View>
            ) : (
              filteredLogs.map((log) => (
                <TouchableOpacity
                  key={log.id}
                  style={[
                    styles.resultContainer,
                    { marginBottom: 8, borderLeftWidth: 4 },
                    { borderLeftColor: getLevelColor(log.level) },
                  ]}
                  onPress={() => toggleLogExpansion(log.id)}
                >
                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      marginBottom: 4,
                    }}
                  >
                    <Ionicons
                      name={
                        getLevelIcon(log.level) as
                          | "alert-circle"
                          | "warning"
                          | "information-circle"
                      }
                      size={16}
                      color={getLevelColor(log.level)}
                      style={{ marginRight: 8 }}
                    />
                    <Text
                      style={[
                        styles.resultValue,
                        { color: getLevelColor(log.level), flex: 1 },
                      ]}
                    >
                      {log.level.toUpperCase()}
                    </Text>
                    <Text style={[styles.resultValue, { fontSize: 12 }]}>
                      {formatTimestamp(log.timestamp)}
                    </Text>
                  </View>

                  <Text style={[styles.resultValue, { marginBottom: 4 }]}>
                    Context: {log.context}
                  </Text>

                  <Text style={styles.resultValue}>{log.message}</Text>

                  {expandedLogs.has(log.id) && (
                    <View style={{ marginTop: 8 }}>
                      {log.stack && (
                        <View style={{ marginBottom: 8 }}>
                          <Text
                            style={[
                              styles.resultValue,
                              { fontSize: 12, fontWeight: "bold" },
                            ]}
                          >
                            Stack Trace:
                          </Text>
                          <Text
                            style={[
                              styles.resultValue,
                              {
                                fontSize: 10,
                                fontFamily: "monospace",
                                backgroundColor: "#222",
                                padding: 8,
                                marginTop: 4,
                              },
                            ]}
                          >
                            {log.stack}
                          </Text>
                        </View>
                      )}

                      {log.metadata && (
                        <View>
                          <Text
                            style={[
                              styles.resultValue,
                              { fontSize: 12, fontWeight: "bold" },
                            ]}
                          >
                            Metadata:
                          </Text>
                          <Text
                            style={[
                              styles.resultValue,
                              {
                                fontSize: 10,
                                fontFamily: "monospace",
                                backgroundColor: "#222",
                                padding: 8,
                                marginTop: 4,
                              },
                            ]}
                          >
                            {JSON.stringify(log.metadata, null, 2)}
                          </Text>
                        </View>
                      )}
                    </View>
                  )}
                </TouchableOpacity>
              ))
            )}
          </SectionContainer>
        </ScrollView>
      </View>
    );
  },
);

ErrorLogsView.displayName = "ErrorLogsView";
