import React, { useState } from "react";
import { Text, View, TouchableOpacity } from "react-native";
import { styles } from "../../styles/styles";
import ConfirmationModal from "../modal/ConfirmationModal";

interface DangerZoneProps {
  onClearAll?: () => void;
  isLoading: boolean;
  disabled?: boolean;
}

export function DangerZone({
  onClearAll,
  isLoading,
  disabled = false,
}: DangerZoneProps) {
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
        <TouchableOpacity
          style={[
            styles.button,
            styles.dangerButton,
            disabled && styles.disabledButton,
          ]}
          onPress={handleClearAll}
          disabled={isLoading || disabled}
        >
          <Text style={styles.dangerButtonText}>
            Clear All Secure Storage
          </Text>
        </TouchableOpacity>
      </View>

      {/* Clear All Confirmation Modal */}
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
}
