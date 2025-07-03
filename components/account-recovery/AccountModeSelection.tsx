import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { styles, colors } from "../../styles/styles";

export type AccountMode = "recover" | "generate";

interface AccountModeSelectionProps {
  selectedMode: AccountMode;
  onModeChange: (mode: AccountMode) => void;
}

export const AccountModeSelection: React.FC<AccountModeSelectionProps> = ({
  selectedMode,
  onModeChange,
}) => {
  const renderModeOption = (
    mode: AccountMode,
    title: string,
    description: string,
    icon: string,
  ) => {
    const isSelected = selectedMode === mode;
    
    return (
      <TouchableOpacity
        key={mode}
        style={[
          styles.inputContainer,
          {
            borderColor: isSelected ? colors.primary : colors.border,
            backgroundColor: isSelected ? colors.blueLight : colors.background,
            marginBottom: 12,
            padding: 16,
            borderWidth: 1,
            borderRadius: 3,
          },
        ]}
        onPress={() => onModeChange(mode)}
      >
        <View style={{ flexDirection: "row", alignItems: "center" }}>
          <Ionicons
            name={icon as any}
            size={24}
            color={isSelected ? colors.primary : colors.textPrimary}
            style={{ marginRight: 12 }}
          />
          <View style={{ flex: 1 }}>
            <Text
              style={[
                styles.label,
                {
                  color: isSelected ? colors.primary : colors.textPrimary,
                  fontSize: 16,
                  fontWeight: "600",
                },
              ]}
            >
              {title}
            </Text>
            <Text
              style={[
                styles.description,
                {
                  color: isSelected ? colors.primary : colors.textSecondary,
                  marginTop: 4,
                  marginBottom: 0,
                },
              ]}
            >
              {description}
            </Text>
          </View>
          {isSelected && (
            <Ionicons
              name="checkmark-circle"
              size={20}
              color={colors.primary}
            />
          )}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={{ marginBottom: 24 }}>
      <Text style={[styles.sectionTitle, { marginBottom: 16 }]}>
        Choose Account Setup Method
      </Text>
      
      {renderModeOption(
        "recover",
        "Recover Existing Account",
        "Use existing recovery words to restore your account",
        "key"
      )}
      
      {renderModeOption(
        "generate",
        "Generate New Account",
        "Create a new account with fresh recovery words",
        "add-circle"
      )}
    </View>
  );
};
