import React from "react";
import { View, Text, Modal, ActivityIndicator } from "react-native";
import { styles } from "../../styles/styles";
import { namedColors } from "../../styles/styles";
import type { PinRotationProgress } from "../../util/pin-rotation";

interface PinRotationProgressModalProps {
  visible: boolean;
  progress: PinRotationProgress;
  onClose?: () => void;
}

export const PinRotationProgressModal: React.FC<PinRotationProgressModalProps> = ({
  visible,
  progress,
  onClose,
}) => {
  const progressPercentage = progress.total > 0 
    ? Math.round((progress.completed / progress.total) * 100)
    : 0;

  const isComplete = progress.completed + progress.failed.length >= progress.total;

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
      accessible={true}
      accessibilityViewIsModal={true}
      accessibilityLabel="PIN rotation progress"
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>
            {isComplete ? "PIN Rotation Complete" : "Rotating PIN..."}
          </Text>
          
          <Text style={styles.modalSubtitle}>
            {isComplete 
              ? "Your PIN has been updated and data re-encrypted." 
              : "Please wait while we re-encrypt your account data with the new PIN."
            }
          </Text>

          {!isComplete && (
            <View style={{ alignItems: "center", marginVertical: 20 }}>
              <ActivityIndicator size="large" color={namedColors.blue} />
            </View>
          )}

          <View style={{ marginVertical: 20 }}>
            {/* Progress bar */}
            <View style={{
              height: 8,
              backgroundColor: namedColors.lightGray,
              borderRadius: 4,
              marginBottom: 12,
            }}>
              <View style={{
                height: "100%",
                backgroundColor: progress.failed.length > 0 ? namedColors.red : namedColors.blue,
                borderRadius: 4,
                width: `${progressPercentage}%`,
              }} />
            </View>

            {/* Progress text */}
            <Text style={[styles.description, { textAlign: "center" }]}>
              {progress.completed + progress.failed.length} of {progress.total} accounts processed ({progressPercentage}%)
            </Text>

            {/* Current account being processed */}
            {progress.current && !isComplete && (
              <Text style={[styles.description, { textAlign: "center", marginTop: 8, fontStyle: "italic" }]}>
                Processing: {progress.current}
              </Text>
            )}

            {/* Summary when complete */}
            {isComplete && (
              <View style={{ marginTop: 16 }}>
                <Text style={[styles.description, { textAlign: "center" }]}>
                  ✅ Successfully re-encrypted: {progress.completed} accounts
                </Text>
                
                {progress.failed.length > 0 && (
                  <Text style={[styles.description, { textAlign: "center", color: namedColors.red, marginTop: 8 }]}>
                    ⚠️ Failed to re-encrypt: {progress.failed.length} accounts
                  </Text>
                )}
              </View>
            )}
          </View>

          {/* Warning about failed accounts */}
          {isComplete && progress.failed.length > 0 && (
            <View style={{
              backgroundColor: namedColors.redOverlay,
              padding: 12,
              borderRadius: 8,
              marginTop: 12,
            }}>
              <Text style={[styles.description, { fontSize: 12 }]}>
                Some accounts could not be re-encrypted automatically. 
                You may need to re-enter and save their recovery phrases manually.
              </Text>
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
};
