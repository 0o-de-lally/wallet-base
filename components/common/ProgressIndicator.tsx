import React from "react";
import { View, Text, ActivityIndicator } from "react-native";
import { namedColors, styles } from "../../styles/styles";

interface ProgressIndicatorProps {
  text: string;
  accessibilityLabel?: string;
  accessibilityHint?: string;
}

export const ProgressIndicator: React.FC<ProgressIndicatorProps> = ({
  text,
  accessibilityLabel,
  accessibilityHint,
}) => {
  return (
    <View style={styles.inputContainer}>
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "flex-start",
          gap: 8,
        }}
        accessibilityLabel={accessibilityLabel}
        accessibilityHint={accessibilityHint}
      >
        <ActivityIndicator size="small" color={namedColors.blue} />
        <Text style={[styles.label]}>{text}</Text>
      </View>
    </View>
  );
};
