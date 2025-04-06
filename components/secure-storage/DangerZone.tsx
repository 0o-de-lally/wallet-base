import React, { memo, useState } from "react";
import { Text, View } from "react-native";
import { styles } from "../../styles/styles";
import ConfirmationModal from "../modal/ConfirmationModal";
import { ActionButton } from "../common/ActionButton";

interface DangerZoneProps {
  onClearAll?: () => void;
  isLoading: boolean;
  disabled?: boolean;
}

export const DangerZone = memo(
  ({ onClearAll, isLoading, disabled = false }: DangerZoneProps) => {
    const [clearAllModalVisible, setClearAllModalVisible] = useState(false);

    const handleClearAll = () => {
      if (!onClearAll) return;
      setClearAllModalVisible(true);
    };

    const confirmClearAll = () => {
      if (onClearAll) {
        onClearAll();
      }
      setClearAllModalVisible(false);
    };

    if (!onClearAll) {
      return null;
    }

    return (
      <>
        <View style={styles.dangerZone}>
          <Text style={styles.dangerTitle}>Danger Zone</Text>
          <ActionButton
            text="Clear All Secure Storage"
            onPress={handleClearAll}
            disabled={isLoading || disabled}
            isDestructive={true}
            accessibilityLabel="Clear all secure storage"
            accessibilityHint="This will permanently delete all secure data"
          />
        </View>

        <ConfirmationModal
          visible={clearAllModalVisible}
          title="Clear All Secure Storage"
          message="This will delete ALL secure data and cannot be undone. Continue?"
          confirmText="Clear All"
          onConfirm={confirmClearAll}
          onCancel={() => setClearAllModalVisible(false)}
          isDestructive={true}
        />
      </>
    );
  },
);

DangerZone.displayName = "DangerZone";
