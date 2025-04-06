import React, { useState, useEffect, useRef } from "react";
import { Text, View, TextInput, TouchableOpacity, ActivityIndicator } from "react-native";
import { styles } from "../../styles/styles";
import ConfirmationModal from "../modal/ConfirmationModal";
import { checkRevealStatus } from "../../util/secure-store";

// Configuration for auto-hiding revealed values (should match the value in useSecureStorage)
const AUTO_HIDE_DELAY_MS = 30 * 1000; // 30 seconds

interface SecureStorageFormProps {
  value: string;
  onValueChange: (text: string) => void;
  onSave: () => void;
  onRetrieve: () => void;
  onScheduleReveal: () => void;
  onExecuteReveal: () => void;
  onCancelReveal: () => void;
  onDelete: () => void;
  onClearAll?: () => void;
  isLoading: boolean;
  disabled?: boolean;
  revealStatus: {
    isScheduled: boolean;
    isAvailable: boolean;
    isExpired: boolean;
    waitTimeRemaining: number;
    expiresIn: number;
  } | null;
  storedValue: string | null;
  onClearRevealedValue?: () => void; // Add option to manually clear revealed value
}

export function SecureStorageForm({
  value,
  onValueChange,
  onSave,
  onRetrieve,
  onScheduleReveal,
  onExecuteReveal,
  onCancelReveal,
  onDelete,
  onClearAll,
  isLoading,
  disabled = false,
  revealStatus,
  storedValue,
  onClearRevealedValue,
}: SecureStorageFormProps) {
  const [clearAllModalVisible, setClearAllModalVisible] = useState(false);
  const [waitTimeDisplay, setWaitTimeDisplay] = useState("");
  const [expiryTimeDisplay, setExpiryTimeDisplay] = useState("");
  const [hideCountdown, setHideCountdown] = useState<number>(AUTO_HIDE_DELAY_MS / 1000);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const hideTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Update timer display
  useEffect(() => {
    // Clear any existing timer
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    // If we have an active reveal schedule, start a timer to update the countdown
    if (revealStatus && revealStatus.isScheduled) {
      // Initial update
      updateTimerDisplays();

      // Setup interval to update every second
      timerRef.current = setInterval(updateTimerDisplays, 1000);
    }

    // Cleanup on unmount
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [revealStatus]);

  const updateTimerDisplays = () => {
    if (!revealStatus) return;

    if (revealStatus.waitTimeRemaining > 0) {
      const seconds = Math.ceil(revealStatus.waitTimeRemaining / 1000);
      setWaitTimeDisplay(`${seconds} seconds`);
    } else {
      setWaitTimeDisplay("Ready");
    }

    if (revealStatus.expiresIn > 0) {
      const minutes = Math.floor(revealStatus.expiresIn / 60000);
      const seconds = Math.ceil((revealStatus.expiresIn % 60000) / 1000);
      setExpiryTimeDisplay(`${minutes}:${seconds.toString().padStart(2, '0')}`);
    } else {
      setExpiryTimeDisplay("Expired");
    }
  };

  // Setup timer for countdown to auto-hide
  useEffect(() => {
    // Clear any existing timer
    if (hideTimerRef.current) {
      clearInterval(hideTimerRef.current);
      hideTimerRef.current = null;
    }

    // If a value is revealed, start the countdown
    if (storedValue !== null) {
      setHideCountdown(AUTO_HIDE_DELAY_MS / 1000);

      hideTimerRef.current = setInterval(() => {
        setHideCountdown((prev) => {
          if (prev <= 1) {
            // Clean up when reaching zero
            if (hideTimerRef.current) {
              clearInterval(hideTimerRef.current);
              hideTimerRef.current = null;
            }
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    // Cleanup
    return () => {
      if (hideTimerRef.current) {
        clearInterval(hideTimerRef.current);
      }
    };
  }, [storedValue]);

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

  const renderRetrieveButton = () => {
    // If a value has been successfully revealed, show this special state
    if (storedValue !== null) {
      // When a value is revealed, show a schedule button for retrieving another value
      return (
        <TouchableOpacity
          style={[styles.button, { backgroundColor: '#6ba5d9' }]}
          onPress={onScheduleReveal}
          disabled={isLoading || disabled}
        >
          <Text style={styles.buttonText}>Schedule New Reveal</Text>
        </TouchableOpacity>
      );
    }

    if (!revealStatus || !revealStatus.isScheduled) {
      // No reveal scheduled - show normal retrieve button
      return (
        <TouchableOpacity
          style={[styles.button, disabled && styles.disabledButton]}
          onPress={onScheduleReveal}
          disabled={isLoading || disabled}
        >
          <Text style={styles.buttonText}>Schedule Reveal</Text>
        </TouchableOpacity>
      );
    }

    if (revealStatus.isScheduled && !revealStatus.isAvailable && !revealStatus.isExpired) {
      // Waiting period active
      return (
        <View>
          <TouchableOpacity
            style={[styles.button, styles.disabledButton]}
            disabled={true}
          >
            <Text style={styles.buttonText}>Waiting... {waitTimeDisplay}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.button, styles.cancelButton, { marginTop: 10 }]}
            onPress={onCancelReveal}
            disabled={isLoading}
          >
            <Text style={styles.cancelButtonText}>Cancel Reveal</Text>
          </TouchableOpacity>
        </View>
      );
    }

    if (revealStatus.isAvailable && !revealStatus.isExpired) {
      // Reveal is available
      return (
        <View>
          <TouchableOpacity
            style={[styles.button, { backgroundColor: '#a5d6b7' }]}
            onPress={onExecuteReveal}
            disabled={isLoading}
          >
            <Text style={styles.buttonText}>Reveal Now</Text>
          </TouchableOpacity>
          <Text style={{ textAlign: 'center', marginTop: 5, color: styles.label.color }}>
            Expires in: {expiryTimeDisplay}
          </Text>
          <TouchableOpacity
            style={[styles.button, styles.cancelButton, { marginTop: 10 }]}
            onPress={onCancelReveal}
            disabled={isLoading}
          >
            <Text style={styles.cancelButtonText}>Cancel Reveal</Text>
          </TouchableOpacity>
        </View>
      );
    }

    if (revealStatus.isExpired) {
      // Reveal expired
      return (
        <TouchableOpacity
          style={[styles.button, styles.dangerButton]}
          onPress={onScheduleReveal}
          disabled={isLoading}
        >
          <Text style={styles.dangerButtonText}>Reveal Expired - Schedule Again</Text>
        </TouchableOpacity>
      );
    }

    // Fallback
    return (
      <TouchableOpacity
        style={[styles.button, disabled && styles.disabledButton]}
        onPress={onScheduleReveal}
        disabled={isLoading || disabled}
      >
        <Text style={styles.buttonText}>Schedule Reveal</Text>
      </TouchableOpacity>
    );
  };

  return (
    <>
      <View style={styles.inputContainer}>
        <Text style={styles.label}>Private Value:</Text>
        <TextInput
          style={[styles.input, disabled && styles.disabledInput]}
          value={value}
          onChangeText={onValueChange}
          placeholder="Enter sensitive value to store"
          placeholderTextColor={styles.inputPlaceholder.color}
          multiline={true}
          numberOfLines={3}
          editable={!disabled}
        />
      </View>

      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={[styles.button, disabled && styles.disabledButton]}
          onPress={onSave}
          disabled={isLoading || disabled}
        >
          <Text style={styles.buttonText}>Save</Text>
        </TouchableOpacity>

        {renderRetrieveButton()}

        <TouchableOpacity
          style={[styles.button, disabled && styles.disabledButton]}
          onPress={onDelete}
          disabled={isLoading || disabled}
        >
          <Text style={styles.buttonText}>Delete</Text>
        </TouchableOpacity>
      </View>

      {/* Display the revealed value with auto-hide countdown */}
      {storedValue !== null && (
        <View style={[styles.resultContainer, { marginTop: 20, borderWidth: 2, borderColor: '#94c2f3' }]}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <Text style={styles.resultLabel}>Successfully Revealed Value:</Text>
            <TouchableOpacity onPress={onClearRevealedValue}>
              <Text style={{ color: styles.dangerButtonText.color }}>
                Hide
              </Text>
            </TouchableOpacity>
          </View>
          <Text style={styles.resultValue}>{storedValue}</Text>
          <Text style={{ color: '#666', marginTop: 10, textAlign: 'center' }}>
            Auto-hiding in {hideCountdown} seconds
          </Text>
        </View>
      )}

      {revealStatus && revealStatus.isScheduled && (
        <View style={styles.resultContainer}>
          <Text style={styles.resultLabel}>Reveal Status:</Text>
          {!revealStatus.isAvailable && !revealStatus.isExpired && (
            <Text style={styles.resultValue}>Scheduled - Waiting period: {waitTimeDisplay}</Text>
          )}
          {revealStatus.isAvailable && !revealStatus.isExpired && (
            <Text style={styles.resultValue}>
              Ready to reveal! Available for: {expiryTimeDisplay}
            </Text>
          )}
          {revealStatus.isExpired && (
            <Text style={[styles.resultValue, { color: styles.dangerButtonText.color }]}>
              Reveal expired. Please schedule again.
            </Text>
          )}
        </View>
      )}

      {isLoading && (
        <View style={{ alignItems: 'center', marginVertical: 20 }}>
          <ActivityIndicator size="large" color="#94c2f3" />
          <Text style={{ color: styles.label.color, marginTop: 10 }}>
            Processing request...
          </Text>
        </View>
      )}

      {onClearAll && (
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
      )}

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
