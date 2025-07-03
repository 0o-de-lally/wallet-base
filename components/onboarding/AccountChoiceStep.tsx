import React, { useState } from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { styles, colors } from "../../styles/styles";
import { SectionContainer } from "../common/SectionContainer";
import { ActionButton } from "../common/ActionButton";

interface AccountChoiceStepProps {
  onAccountChoice: (choice: "create" | "recover") => void;
  onResetApp: () => void;
}

export const AccountChoiceStep: React.FC<AccountChoiceStepProps> = ({
  onAccountChoice,
  onResetApp,
}) => {
  const [selectedChoice, setSelectedChoice] = useState<
    "create" | "recover" | null
  >(null);

  const renderChoiceOption = (
    choice: "create" | "recover",
    title: string,
    description: string,
    icon: string,
  ) => {
    const isSelected = selectedChoice === choice;

    return (
      <TouchableOpacity
        key={choice}
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
        onPress={() => {
          setSelectedChoice(choice);
          onAccountChoice(choice);
        }}
      >
        <View style={{ flexDirection: "row", alignItems: "center" }}>
          <Ionicons
            name={icon as keyof typeof Ionicons.glyphMap}
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
    <SectionContainer>
      <Text style={[styles.resultValue, { marginBottom: 24 }]}>
        Great! Your PIN is set up. Now let&apos;s add your first account:
      </Text>

      {renderChoiceOption(
        "recover",
        "Create/Add Signing Account",
        "Create or recover an account to sign transactions",
        "key",
      )}

      {renderChoiceOption(
        "create",
        "Add View-Only Account",
        "Observe account activity without signing transactions",
        "eye-outline",
      )}

      <Text
        style={[
          styles.resultValue,
          { marginTop: 15, fontSize: 12, fontStyle: "italic" },
        ]}
      >
        You can always add more accounts later from the main menu.
      </Text>

      <Text
        style={[
          styles.resultValue,
          {
            marginTop: 30,
            fontSize: 12,
            fontStyle: "italic",
            textAlign: "center",
          },
        ]}
      >
        Need to start completely over?
      </Text>

      <ActionButton
        text="Reset All Data"
        variant="reset"
        onPress={onResetApp}
        style={styles.buttonSpacingTight}
        size="small"
        accessibilityLabel="Reset all app data and start fresh"
      />
    </SectionContainer>
  );
};
