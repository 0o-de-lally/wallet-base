import React, { useState, useEffect, useRef } from "react";
import { Text, View, TouchableOpacity, ActivityIndicator } from "react-native";
import { styles } from "../../styles/styles";

// Configuration for auto-hiding revealed values
const AUTO_HIDE_DELAY_MS = 30 * 1000; // 30 seconds

interface RevealStatusUIProps {
  revealStatus: {
    isScheduled: boolean;
    isAvailable: boolean;
    isExpired: boolean;
    waitTimeRemaining: number;
    expiresIn: number;
  } | null;
  storedValue: string | null;
  isLoading: boolean;
  disabled?: boolean;
  onScheduleReveal: () => void;
  onExecuteReveal: () => void;
  onCancelReveal: () => void;
  onClearRevealedValue?: () => void;
}

export function RevealStatusUI({
  revealStatus,
  storedValue,
  isLoading,
  disabled = false,
  onScheduleReveal,
  onExecuteReveal,
  onCancelReveal,
  onClearRevealedValue,
}: RevealStatusUIProps) {
  const [waitTimeDisplay, setWaitTimeDisplay] = useState("");
  const [expiryTimeDisplay, setExpiryTimeDisplay] = useState("");
  const [hideCountdown, setHideCountdown] = useState<number>(AUTO_HIDE_DELAY_MS / 1000);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const hideTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Update timer display for reveal scheduling
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

  // Setup timer for countdown to auto-hide revealed value
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

  const renderRevealedValue = () => {
    if (storedValue === null) return null;

    return (
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
    );
  };

  const renderRevealStatus = () => {
    if (!revealStatus || !revealStatus.isScheduled) return null;

    return (
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
    );
  };

  return (
    <>
      {renderRetrieveButton()}
      {renderRevealedValue()}
      {renderRevealStatus()}

      {isLoading && (
        <View style={{ alignItems: 'center', marginVertical: 20 }}>
          <ActivityIndicator size="large" color="#94c2f3" />
          <Text style={{ color: styles.label.color, marginTop: 10 }}>
            Processing request...
          </Text>
        </View>
      )}
    </>
  );
}
