import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { ActionButton } from "../common/ActionButton";
import { colors } from "../../styles/styles";

interface AuthenticationViewProps {
  isLoading?: boolean;
  onAuthenticate: () => void;
  title?: string;
  subtitle?: string;
  buttonText?: string;
}

/**
 * Single authentication view component used throughout the app
 * Designed to be visible even when device authentication modals are overlaid
 */
export function AuthenticationView({
  isLoading = false,
  onAuthenticate,
  title = "Authentication Required",
  subtitle = "Please authenticate to access your wallet.",
  buttonText = "Authenticate",
}: AuthenticationViewProps) {
  if (isLoading) {
    return (
      <View style={styles.container}>
        <View style={styles.loadingContent}>
          <Text style={styles.loadingText}>Verifying device security...</Text>
          <Text style={styles.subText}>
            This may take a moment while we check your device&apos;s security
            settings.
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <View style={styles.iconContainer}>
          <Ionicons name="lock-closed" size={32} color={colors.primary} />
        </View>

        <Text style={styles.title}>{title}</Text>
        <Text style={styles.subtitle}>{subtitle}</Text>

        <View style={styles.infoContainer}>
          <Text style={styles.infoText}>
            Your wallet is protected by your device&apos;s security features.
            {"\n\n"}
            This authentication is separate from your wallet PIN and provides an
            additional layer of security.
          </Text>
        </View>

        <ActionButton
          text={buttonText}
          variant="auth"
          onPress={onAuthenticate}
          accessibilityLabel="Authenticate with device security"
          style={styles.authButton}
        />

        <Text style={styles.footerText}>
          If authentication fails, please check your device&apos;s security
          settings.
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
    // Ensure this view is always visible above device modals
    elevation: 1000,
    zIndex: 1000,
  },
  content: {
    maxWidth: 400,
    width: "100%",
    alignItems: "center",
  },
  loadingContent: {
    alignItems: "center",
    maxWidth: 300,
  },
  iconContainer: {
    marginBottom: 24,
    padding: 16,
    backgroundColor: colors.blueLight,
    borderRadius: 50,
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: colors.textPrimary,
    textAlign: "center",
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: "center",
    marginBottom: 24,
    lineHeight: 22,
  },
  loadingText: {
    fontSize: 18,
    fontWeight: "600",
    color: colors.textPrimary,
    textAlign: "center",
    marginBottom: 8,
  },
  subText: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: "center",
    lineHeight: 20,
  },
  infoContainer: {
    backgroundColor: colors.cardBg,
    padding: 16,
    borderRadius: 12,
    marginBottom: 32,
    borderWidth: 1,
    borderColor: colors.border,
  },
  infoText: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: "center",
    lineHeight: 20,
  },
  authButton: {
    minWidth: 200,
    marginBottom: 16,
  },
  footerText: {
    fontSize: 12,
    color: colors.textSecondary,
    textAlign: "center",
    fontStyle: "italic",
  },
});
