import React, { memo, useCallback } from "react";
import { PinInputModal } from "../../pin-input/PinInputModal";

interface PinModalHandlerProps {
  visible: boolean;
  onClose: () => void;
  onPinAction: (pin: string) => Promise<void>;
  currentAction:
    | "save"
    | "retrieve"
    | "delete"
    | "schedule_reveal"
    | "execute_reveal"
    | "clear_all"
    | null;
  operationType?: "transfer" | "v8_rejoin" | null;
}

export const PinModalHandler = memo(
  ({
    visible,
    onClose,
    onPinAction,
    currentAction,
    operationType,
  }: PinModalHandlerProps) => {
    const getModalTitle = () => {
      switch (operationType) {
        case "transfer":
          return "Authorize Transfer";
        case "v8_rejoin":
          return "Authorize V8 RE-JOIN";
        default:
          return "Verify PIN";
      }
    };

    const getModalSubtitle = () => {
      switch (operationType) {
        case "transfer":
          return "Enter your PIN to access private key for transfer signing";
        case "v8_rejoin":
          return "Enter your PIN to access private key for V8 migration transaction";
        default:
          return "Enter your PIN to access private key for transaction signing";
      }
    };

    // Wrapper to ensure async behavior
    const handlePinAction = useCallback(
      async (pin: string) => {
        await onPinAction(pin);
      },
      [onPinAction],
    );

    return (
      <PinInputModal
        visible={visible}
        onClose={onClose}
        onPinAction={handlePinAction}
        purpose={currentAction || "execute_reveal"}
        actionTitle={getModalTitle()}
        actionSubtitle={getModalSubtitle()}
      />
    );
  },
);

PinModalHandler.displayName = "PinModalHandler";
