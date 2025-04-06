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

    return (
      <TouchableOpacity
        style={[
          styles.button,
          isDestructive && styles.dangerButton,
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
            style={[
              isDestructive ? styles.dangerButtonText : styles.buttonText,
              textSizeStyles[size],
              textStyle,
            ]}
          >
            {text}
          </Text>
        )}
      </TouchableOpacity>
    );
  },
);

ActionButton.displayName = "ActionButton";
