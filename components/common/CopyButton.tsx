import React, { memo, useState } from "react";
import { TouchableOpacity, Text, Alert } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as Clipboard from "expo-clipboard";
import { styles, colors } from "../../styles/styles";

interface CopyButtonProps {
  text: string;
  label?: string;
  variant?: "primary" | "secondary" | "icon";
  size?: "small" | "medium";
  disabled?: boolean;
  onCopySuccess?: () => void;
  onCopyError?: (error: string) => void;
  accessibilityLabel?: string;
  accessibilityHint?: string;
}

export const CopyButton = memo(
  ({
    text,
    label = "Copy",
    variant = "secondary",
    size = "medium",
    disabled = false,
    onCopySuccess,
    onCopyError,
    accessibilityLabel,
    accessibilityHint,
  }: CopyButtonProps) => {
    const [isCopying, setIsCopying] = useState(false);    const handleCopy = async () => {
      if (disabled || isCopying) return;

      setIsCopying(true);
      try {
        await Clipboard.setStringAsync(text);
        
        if (onCopySuccess) {
          onCopySuccess();
        }
        // Removed the default Alert.alert notification for a cleaner UX
      } catch (error) {
        const errorMessage = "Failed to copy to clipboard";
        if (onCopyError) {
          onCopyError(errorMessage);
        } else {
          Alert.alert("Error", errorMessage);
        }
        console.error("Copy error:", error);
      } finally {
        setIsCopying(false);
      }
    };

    const getButtonStyle = () => {
      switch (variant) {
        case "primary":
          return styles.primaryButton;
        case "icon":
          return styles.iconButton;
        case "secondary":
        default:
          return styles.secondaryButton;
      }
    };

    const getTextStyle = () => {
      switch (variant) {
        case "primary":
          return styles.primaryButtonText;
        case "icon":
          return { color: colors.textSecondary };
        case "secondary":
        default:
          return styles.secondaryButtonText;
      }
    };

    const getSizeStyle = () => {
      if (size === "small") {
        return { paddingVertical: 8, paddingHorizontal: 12 };
      }
      return {};
    };

    if (variant === "icon") {
      return (
        <TouchableOpacity
          style={[
            getButtonStyle(),
            getSizeStyle(),
            disabled && styles.disabledButton,
          ]}
          onPress={handleCopy}
          disabled={disabled || isCopying}
          accessible={true}
          accessibilityRole="button"
          accessibilityLabel={accessibilityLabel || `Copy ${label}`}
          accessibilityHint={accessibilityHint || `Copy ${label} to clipboard`}
        >
          <Ionicons
            name={isCopying ? "checkmark" : "copy"}
            size={size === "small" ? 16 : 20}
            color={disabled ? colors.disabledText : colors.textSecondary}
          />
        </TouchableOpacity>
      );
    }

    return (
      <TouchableOpacity
        style={[
          getButtonStyle(),
          getSizeStyle(),
          disabled && styles.disabledButton,
        ]}
        onPress={handleCopy}
        disabled={disabled || isCopying}
        accessible={true}
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel || `Copy ${label}`}
        accessibilityHint={accessibilityHint || `Copy ${label} to clipboard`}
      >
        <Ionicons
          name={isCopying ? "checkmark" : "copy"}
          size={16}
          color={disabled ? colors.disabledText : getTextStyle().color}
        />
        <Text style={[getTextStyle(), disabled && styles.disabledButtonText]}>
          {" "}
          {isCopying ? "Copied!" : label}
        </Text>
      </TouchableOpacity>
    );
  },
);

CopyButton.displayName = "CopyButton";
