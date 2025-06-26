import React, { memo } from "react";
import {
  TouchableOpacity,
  Text,
  ActivityIndicator,
  StyleProp,
  ViewStyle,
  TextStyle,
} from "react-native";
import { styles } from "../../styles/styles";

interface ActionButtonProps {
  onPress: () => void;
  text: string;
  isLoading?: boolean;
  disabled?: boolean;
  isDestructive?: boolean;
  variant?: "primary" | "secondary" | "auth" | "reset" | "danger";
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
  accessibilityLabel?: string;
  accessibilityHint?: string;
  size?: "small" | "medium" | "large";
}

export const ActionButton = memo(
  ({
    onPress,
    text,
    isLoading = false,
    disabled = false,
    isDestructive = false,
    variant = "primary",
    style,
    textStyle,
    accessibilityLabel,
    accessibilityHint,
    size = "medium",
  }: ActionButtonProps) => {
    const sizeStyles = {
      small: { paddingVertical: 8, paddingHorizontal: 12 },
      medium: {},
      large: { paddingVertical: 14, paddingHorizontal: 24 },
    };

    const textSizeStyles = {
      small: { fontSize: 14 },
      medium: {},
      large: { fontSize: 18 },
    };

    // Get variant styles
    const getVariantStyles = () => {
      if (isDestructive || variant === "danger") {
        return styles.dangerButton;
      }

      switch (variant) {
        case "secondary":
          return styles.secondaryButton;
        case "auth":
          return styles.authButton;
        case "reset":
          return styles.resetButton;
        case "primary":
        default:
          return styles.primaryButton;
      }
    };

    const getVariantTextStyles = () => {
      if (isDestructive || variant === "danger") {
        return styles.dangerButtonText;
      }

      switch (variant) {
        case "secondary":
          return styles.secondaryButtonText;
        case "auth":
          return styles.authButtonText;
        case "reset":
          return styles.resetButtonText;
        case "primary":
        default:
          return styles.buttonText;
      }
    };

    return (
      <TouchableOpacity
        style={[
          styles.button,
          getVariantStyles(),
          disabled && styles.disabledButton,
          sizeStyles[size],
          style,
        ]}
        onPress={onPress}
        disabled={isLoading || disabled}
        accessible={true}
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel || text}
        accessibilityHint={accessibilityHint}
        accessibilityState={{ disabled: isLoading || disabled }}
      >
        {isLoading ? (
          <ActivityIndicator color="white" size="small" />
        ) : (
          <Text
            style={[getVariantTextStyles(), textSizeStyles[size], textStyle]}
          >
            {text}
          </Text>
        )}
      </TouchableOpacity>
    );
  },
);

ActionButton.displayName = "ActionButton";
