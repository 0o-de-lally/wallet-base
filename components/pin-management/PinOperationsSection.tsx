import React from "react";
import { View } from "react-native";
import { styles } from "../../styles/styles";
import { SectionContainer } from "../common/SectionContainer";
import { ActionButton } from "../common/ActionButton";

interface PinOperationsSectionProps {
  pinExists: boolean;
  isLoading: boolean;
  showRotationProgress: boolean;
  onVerifyPin: () => void;
  onRotatePin: () => void;
  onCreatePin: () => void;
}

/**
 * Component that displays the main PIN operation buttons
 */
export const PinOperationsSection: React.FC<PinOperationsSectionProps> = ({
  pinExists,
  isLoading,
  showRotationProgress,
  onVerifyPin,
  onRotatePin,
  onCreatePin,
}) => {
  if (!pinExists) {
    return (
      <SectionContainer title="Create Password">
        <ActionButton
          text="Create New Password"
          onPress={onCreatePin}
          accessibilityHint="Create a new password for secure access"
        />
      </SectionContainer>
    );
  }

  return (
  <SectionContainer title="Password Operations">
      <View style={styles.buttonContainer}>
        <ActionButton
      text="Verify Password"
          onPress={onVerifyPin}
          disabled={isLoading || showRotationProgress}
      accessibilityHint="Verify your password is correct"
        />
        <ActionButton
      text="Change Password"
          onPress={onRotatePin}
          disabled={isLoading || showRotationProgress}
      accessibilityHint="Change your password"
        />
      </View>
    </SectionContainer>
  );
};
