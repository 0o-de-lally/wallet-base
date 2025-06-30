import React, { memo, useState, useEffect, useRef, useCallback } from "react";
import { Text, View, ActivityIndicator } from "react-native";
import { styles, colors } from "../../styles/styles";
import { ActionButton } from "../common/ActionButton";

// Configuration for auto-hiding revealed values
const AUTO_HIDE_DELAY_MS = 30 * 1000; // 30 seconds

interface RevealStatusUIProps {
  accountId: string; // Account identifier
  accountName?: string; // Optional name for display purposes
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
  onScheduleReveal: (accountId: string) => void;
  onExecuteReveal: (accountId: string) => void;
  onCancelReveal: (accountId: string) => void;
  onClearRevealedValue?: () => void;
}

export const RevealStatusUI = memo(
  ({
    accountId,
    accountName,
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
    const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const hideTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

    // Create a safe handler for clearing revealed value
    const handleClearRevealedValue = useCallback(() => {
      if (onClearRevealedValue) {
        onClearRevealedValue();
      }
    }, [onClearRevealedValue]);

    // Create account-specific handlers
    const handleScheduleReveal = useCallback(() => {
      onScheduleReveal(accountId);
    }, [onScheduleReveal, accountId]);

    const handleExecuteReveal = useCallback(() => {
      onExecuteReveal(accountId);
    }, [onExecuteReveal, accountId]);

    const handleCancelReveal = useCallback(() => {
      onCancelReveal(accountId);
    }, [onCancelReveal, accountId]);

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
              handleClearRevealedValue();
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
    }, [storedValue, handleClearRevealedValue]);

    const renderActionButton = useCallback(() => {
      // If value is currently revealed, don't show the schedule button
      if (storedValue !== null) {
        return null;
      }

      // If no reveal is scheduled yet, show the initial schedule button
      if (!revealStatus || !revealStatus.isScheduled) {
        return (
          <ActionButton
            text={`Schedule Reveal`}
            onPress={handleScheduleReveal}
            disabled={isLoading || disabled}
            accessibilityLabel={`Schedule reveal of secured data for ${accountName || "account"}`}
            accessibilityHint="Starts the reveal process with a waiting period"
            style={[styles.button]}
          />
        );
      }

      // In "expired" state, show schedule again button
      if (revealStatus.isExpired) {
        return (
          <View style={{ alignItems: "center", marginBottom: 20 }}>
            <ActionButton
              text="Reveal Expired - Schedule Again"
              onPress={handleScheduleReveal}
              disabled={isLoading}
              isDestructive={true}
              accessibilityLabel="Schedule reveal again"
              accessibilityHint="Previous reveal window expired, schedule a new one"
              style={{ marginBottom: 10 }}
            />
          </View>
        );
      }
    }, [
      revealStatus,
      storedValue,
      isLoading,
      disabled,
      handleScheduleReveal,
      accountName,
    ]);

    const renderRevealedValue = useCallback(() => {
      if (storedValue === null) return null;

      return (
        <View
          style={[
            styles.resultContainer,
            { marginTop: 20, borderWidth: 2, borderColor: colors.primary },
          ]}
          accessible={true}
          accessibilityLabel={`Revealed secure value for ${accountName || "account"}`}
          accessibilityHint={`Auto-hiding in ${hideCountdown} seconds`}
        >
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <Text style={styles.resultLabel}>
              Successfully Revealed Value{" "}
              {accountName ? `for ${accountName}` : ""}:
            </Text>
            <ActionButton
              text="Hide"
              onPress={handleClearRevealedValue}
              size="small"
              style={{ backgroundColor: "transparent", borderWidth: 0 }}
              textStyle={{ color: styles.dangerButtonText.color }}
              accessibilityLabel="Hide revealed value"
            />
          </View>
          <Text style={styles.resultValue} selectable={true}>
            {storedValue}
          </Text>
          <Text
            style={{
              color: colors.textSecondary,
              marginTop: 10,
              textAlign: "center",
            }}
          >
            Auto-hiding in {hideCountdown} seconds
          </Text>
        </View>
      );
    }, [storedValue, hideCountdown, handleClearRevealedValue, accountName]);

    const renderRevealStatus = useCallback(() => {
      if (!revealStatus || !revealStatus.isScheduled) return null;

      return (
        <View
          style={styles.resultContainer}
          accessible={true}
          accessibilityLabel={`Reveal status for ${accountName || "account"}: ${
            !revealStatus.isAvailable && !revealStatus.isExpired
              ? "Waiting period"
              : revealStatus.isAvailable
                ? "Ready to reveal"
                : "Expired"
          }`}
        >
          <Text style={styles.resultLabel}>
            Reveal Status {accountName ? `for ${accountName}` : ""}:
          </Text>

          {/* Waiting period active */}
          {!revealStatus.isAvailable && !revealStatus.isExpired && (
            <>
              <Text style={styles.resultValue}>
                Scheduled - Waiting period: {waitTimeDisplay}
              </Text>
              <View style={{ alignItems: "center", marginTop: 15 }}>
                <ActionButton
                  text="Cancel Reveal"
                  onPress={handleCancelReveal}
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
                  onPress={handleExecuteReveal}
                  disabled={isLoading}
                  style={{ backgroundColor: colors.success, marginBottom: 10 }}
                  accessibilityLabel="Execute the reveal now"
                  accessibilityHint="Shows your secured data on screen"
                />
                <ActionButton
                  text="Cancel Reveal"
                  onPress={handleCancelReveal}
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
      handleCancelReveal,
      handleExecuteReveal,
      accountName,
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
