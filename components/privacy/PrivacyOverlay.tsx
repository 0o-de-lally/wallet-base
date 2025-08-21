/**
 * Privacy Overlay Component
 *
 * Provides a blur overlay that activates when the app goes to background,
 * protecting sensitive content from being visible in app switcher previews.
 *
 * Security Features:
 * - Automatic activation on app state change (active -> background/inactive)
 * - Blur overlay using expo-blur for content obfuscation
 * - Configurable blur intensity and tint
 * - Zero-delay activation for immediate privacy protection
 * - Wallet-themed privacy message
 */

import React, { memo } from "react";
import { StyleSheet, View, Text } from "react-native";
import { BlurView } from "expo-blur";
import { Ionicons } from "@expo/vector-icons";
import { useSensitiveScreenProtection } from "../../hooks/use-app-state-protection";
import { colors } from "../../styles/styles";

interface PrivacyOverlayProps {
  /** Whether to show privacy overlay (overrides app state detection) */
  forceShow?: boolean;
  /** Custom privacy message */
  message?: string;
  /** Blur intensity (0-100) */
  intensity?: number;
  /** Blur tint */
  tint?: "light" | "dark" | "default";
}

/**
 * Privacy overlay component that hides sensitive content when app is backgrounded
 */
export const PrivacyOverlay = memo(
  ({
    forceShow = false,
    message = "Open wallet to continue",
    intensity = 100,
    tint = "dark",
  }: PrivacyOverlayProps) => {
    const { shouldShowPrivacyOverlay } =
      useSensitiveScreenProtection("PrivacyOverlay");

    // Show overlay if forced or if app state indicates it should be shown
    const isVisible = forceShow || shouldShowPrivacyOverlay;

    if (!isVisible) {
      return null;
    }

    return (
      <View style={StyleSheet.absoluteFill}>
        <BlurView
          style={StyleSheet.absoluteFill}
          intensity={intensity}
          tint={tint}
        >
          <View style={overlayStyles.container}>
            <View style={overlayStyles.contentContainer}>
              <Ionicons
                name="shield-checkmark"
                size={48}
                color={colors.primary}
                style={overlayStyles.icon}
              />
              <Text style={overlayStyles.title}>Wallet Protected</Text>
              <Text style={overlayStyles.message}>{message}</Text>
            </View>
          </View>
        </BlurView>
      </View>
    );
  },
);

PrivacyOverlay.displayName = "PrivacyOverlay";

const overlayStyles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.7)", // Stronger overlay for better visibility when blur doesn't work
  },
  contentContainer: {
    alignItems: "center",
    padding: 32,
    backgroundColor: "rgba(26, 26, 31, 0.8)", // Semi-transparent background matching app theme
    borderRadius: 16,
    marginHorizontal: 32,
  },
  icon: {
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: "600",
    color: "#ffffff",
    marginBottom: 8,
    textAlign: "center",
  },
  message: {
    fontSize: 14,
    color: "#cccccc",
    textAlign: "center",
    lineHeight: 20,
  },
});

/**
 * Lightweight privacy overlay for financial screens
 * Less aggressive styling but still provides protection
 */
export const LightPrivacyOverlay = memo(
  ({
    forceShow = false,
    message = "Wallet protected while away",
    intensity = 80,
    tint = "dark" as const,
  }: PrivacyOverlayProps) => {
    return (
      <PrivacyOverlay
        forceShow={forceShow}
        message={message}
        intensity={intensity}
        tint={tint}
      />
    );
  },
);

LightPrivacyOverlay.displayName = "LightPrivacyOverlay";
