import React, { memo, useCallback } from "react";
import { View, Text } from "react-native";
import { styles } from "../../styles/styles";
import { useSecureStorage } from "../../hooks/use-secure-storage";
import { RevealStatusUI } from "../reveal/RevealStatusUI";
import { PinInputModal } from "../pin-input/PinInputModal";
import { observer } from "@legendapp/state/react";
import { formatWaitingPeriod } from "../../util/reveal-controller";

interface SecretRevealProps {
  accountId: string;
  accountName?: string;
}

export const SecretReveal = memo(
  observer(({ accountId, accountName }: SecretRevealProps) => {
    const {
      storedValue,
      isLoading,
      handleScheduleReveal,
      handleExecuteReveal,
      handleCancelReveal,
      clearRevealedValue,
      pinModalVisible,
      handlePinModalClose,
      handlePinAction,
      currentAction,
      revealStatus,
    } = useSecureStorage(accountId);

    // Get purpose for pin modal
    const getPinPurpose = useCallback(() => {
      switch (currentAction) {
        case "schedule_reveal":
          return "schedule_reveal";
        case "execute_reveal":
          return "execute_reveal";
        default:
          return "retrieve";
      }
    }, [currentAction]);

    return (
      <View>
        <Text style={styles.label}>Reveal Secure Data</Text>
        <Text style={styles.description}>
          This screen allows you to securely reveal your recovery mnemonic. You
          must first schedule a reveal and wait {formatWaitingPeriod()} before
          you can access the data. Once revealed, the data will automatically
          hide after 30 seconds.
        </Text>

        <RevealStatusUI
          accountId={accountId}
          accountName={accountName}
          revealStatus={revealStatus}
          storedValue={storedValue}
          isLoading={isLoading}
          onScheduleReveal={handleScheduleReveal}
          onExecuteReveal={handleExecuteReveal}
          onCancelReveal={handleCancelReveal}
          onClearRevealedValue={clearRevealedValue}
        />

        {/* PIN Input Modal */}
        <PinInputModal
          visible={pinModalVisible}
          onClose={handlePinModalClose}
          onPinAction={handlePinAction}
          purpose={getPinPurpose()}
        />
      </View>
    );
  }),
);

SecretReveal.displayName = "SecretReveal";
