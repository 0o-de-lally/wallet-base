import React from "react";
import { Text } from "react-native";
import { styles } from "../../styles/styles";
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
  return (
    <SectionContainer title="Account Setup">
      <Text style={styles.resultValue}>
        Great! Your PIN is set up. Now let&apos;s add your first account:
      </Text>

      <ActionButton
        text="Create New Account"
        onPress={() => onAccountChoice("create")}
        style={styles.buttonSpacingDefault}
        accessibilityLabel="Create a new account"
      />

      <ActionButton
        text="Recover Existing Account"
        onPress={() => onAccountChoice("recover")}
        style={styles.buttonSpacingSmall}
        accessibilityLabel="Recover an existing account"
      />

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
