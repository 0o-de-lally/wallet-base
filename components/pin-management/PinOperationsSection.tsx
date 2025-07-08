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
      <SectionContainer title="Create PIN">
        <ActionButton
          text="Create New PIN"
          onPress={onCreatePin}
          accessibilityHint="Create a new PIN for secure access"
        />
      </SectionContainer>
    );
  }

  return (
    <SectionContainer title="PIN Operations">
      <View style={styles.buttonContainer}>
        <ActionButton
          text="Verify PIN"
          onPress={onVerifyPin}
          disabled={isLoading || showRotationProgress}
          accessibilityHint="Verify your PIN is correct"
        />
        <ActionButton
          text="Rotate PIN"
          onPress={onRotatePin}
          disabled={isLoading || showRotationProgress}
          accessibilityHint="Change your PIN"
        />
      </View>
    </SectionContainer>
  );
};
