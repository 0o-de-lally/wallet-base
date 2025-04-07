import React, { memo, useState, useEffect, useRef, useCallback } from "react";
import { Text, View, ActivityIndicator } from "react-native";
import { styles } from "../../styles/styles";
import { ActionButton } from "../common/ActionButton";

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

export const RevealStatusUI = memo(
  ({
    revealStatus,
    storedValue,
    isLoading,
    disabled = false,
    onScheduleReveal,
    onExecuteReveal,
    onCancelReveal,
    onClearRevealedValue,
  }: RevealStatusUIProps) => {
    const [waitTimeDisplay, setWaitTimeDisplay] = useState("");
    const [expiryTimeDisplay, setExpiryTimeDisplay] = useState("");
    const [hideCountdown, setHideCountdown] = useState<number>(
      AUTO_HIDE_DELAY_MS / 1000,
    );
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

    const updateTimerDisplays = useCallback(() => {
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
        setExpiryTimeDisplay(
          `${minutes}:${seconds.toString().padStart(2, "0")}`,
        );
      } else {
        setExpiryTimeDisplay("Expired");
      }
    }, [revealStatus]);

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
              // Auto-hide the value when timer reaches zero
              if (onClearRevealedValue) {
                onClearRevealedValue();
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
    }, [storedValue, onClearRevealedValue]);

    const renderActionButton = useCallback(() => {
      // Only show schedule button if there's no active reveal process
      // OR after a value has been successfully revealed
      if (storedValue !== null) {
        // Return null instead of showing the "Schedule New Reveal" button
        return null;
      }

      // If no reveal is scheduled yet, show the initial schedule button
      if (!revealStatus || !revealStatus.isScheduled) {
        return (
          <View style={{ alignItems: "center", marginBottom: 20 }}>
            <ActionButton
              text="Schedule Reveal"
              onPress={onScheduleReveal}
              disabled={isLoading || disabled}
              accessibilityLabel="Schedule reveal of secured data"
              accessibilityHint="Starts the reveal process with a waiting period"
            />
          </View>
        );
      }

      // In "expired" state, show schedule again button
      if (revealStatus.isExpired) {
        return (
          <View style={{ alignItems: "center", marginBottom: 20 }}>
            <ActionButton
              text="Reveal Expired - Schedule Again"
              onPress={onScheduleReveal}
              disabled={isLoading}
              isDestructive={true}
              accessibilityLabel="Schedule reveal again"
              accessibilityHint="Previous reveal window expired, schedule a new one"
            />
          </View>
        );
      }

      // During waiting or available periods, don't show any action button
      // (the buttons will be in the status section)
      return null;
    }, [revealStatus, storedValue, isLoading, disabled, onScheduleReveal]);

    const renderRevealedValue = useCallback(() => {
      if (storedValue === null) return null;

      return (
        <View
          style={[
            styles.resultContainer,
            { marginTop: 20, borderWidth: 2, borderColor: "#94c2f3" },
          ]}
          accessible={true}
          accessibilityLabel="Revealed secure value"
          accessibilityHint={`Auto-hiding in ${hideCountdown} seconds`}
        >
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <Text style={styles.resultLabel}>Successfully Revealed Value:</Text>
            <ActionButton
              text="Hide"
              onPress={onClearRevealedValue}
              size="small"
              style={{ backgroundColor: "transparent", borderWidth: 0 }}
              textStyle={{ color: styles.dangerButtonText.color }}
              accessibilityLabel="Hide revealed value"
            />
          </View>
          <Text style={styles.resultValue} selectable={true}>
            {storedValue}
          </Text>
          <Text style={{ color: "#666", marginTop: 10, textAlign: "center" }}>
            Auto-hiding in {hideCountdown} seconds
          </Text>
        </View>
      );
    }, [storedValue, hideCountdown, onClearRevealedValue]);

    const renderRevealStatus = useCallback(() => {
      if (!revealStatus || !revealStatus.isScheduled) return null;

      return (
        <View
          style={styles.resultContainer}
          accessible={true}
          accessibilityLabel={`Reveal status: ${
            !revealStatus.isAvailable && !revealStatus.isExpired
              ? "Waiting period"
              : revealStatus.isAvailable
                ? "Ready to reveal"
                : "Expired"
          }`}
        >
          <Text style={styles.resultLabel}>Reveal Status:</Text>

          {/* Waiting period active */}
          {!revealStatus.isAvailable && !revealStatus.isExpired && (
            <>
              <Text style={styles.resultValue}>
                Scheduled - Waiting period: {waitTimeDisplay}
              </Text>
              <View style={{ alignItems: "center", marginTop: 15 }}>
                <ActionButton
                  text="Cancel Reveal"
                  onPress={onCancelReveal}
                  disabled={isLoading}
                  style={styles.cancelButton}
                  textStyle={styles.cancelButtonText}
                  accessibilityLabel="Cancel reveal process"
                />
              </View>
            </>
          )}

          {/* Ready to reveal */}
          {revealStatus.isAvailable && !revealStatus.isExpired && (
            <>
              <Text style={styles.resultValue}>
                Ready to reveal! Available for: {expiryTimeDisplay}
              </Text>
              <View style={{ alignItems: "center", marginTop: 15 }}>
                <ActionButton
                  text="Reveal Now"
                  onPress={onExecuteReveal}
                  disabled={isLoading}
                  style={{ backgroundColor: "#a5d6b7", marginBottom: 10 }}
                  accessibilityLabel="Execute the reveal now"
                  accessibilityHint="Shows your secured data on screen"
                />
                <ActionButton
                  text="Cancel Reveal"
                  onPress={onCancelReveal}
                  disabled={isLoading}
                  style={styles.cancelButton}
                  textStyle={styles.cancelButtonText}
                  accessibilityLabel="Cancel reveal process"
                />
              </View>
            </>
          )}

          {/* Expired state */}
          {revealStatus.isExpired && (
            <Text
              style={[
                styles.resultValue,
                { color: styles.dangerButtonText.color },
              ]}
            >
              Reveal expired. Please schedule again.
            </Text>
          )}
        </View>
      );
    }, [
      revealStatus,
      waitTimeDisplay,
      expiryTimeDisplay,
      isLoading,
      onCancelReveal,
      onExecuteReveal,
    ]);

    const renderLoader = useCallback(() => {
      if (!isLoading) return null;

      return (
        <View
          style={{ alignItems: "center", marginVertical: 20 }}
          accessible={true}
          accessibilityLabel="Loading, please wait"
          accessibilityRole="progressbar"
        >
          <ActivityIndicator size="large" color="#94c2f3" />
          <Text style={{ color: styles.label.color, marginTop: 10 }}>
            Processing request...
          </Text>
        </View>
      );
    }, [isLoading]);

    return (
      <View style={{ flex: 1, alignItems: "stretch" }}>
        {renderActionButton()}
        {renderRevealedValue()}
        {renderRevealStatus()}
        {renderLoader()}
      </View>
    );
  },
);

RevealStatusUI.displayName = "RevealStatusUI";
