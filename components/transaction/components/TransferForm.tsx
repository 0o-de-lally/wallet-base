import "buffer"; // Ensure Buffer is available globally
import React, { useState, useCallback, memo } from "react";
import { View, Text } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { styles, colors } from "../../../styles/styles";
import { SectionContainer } from "../../common/SectionContainer";
import { ActionButton } from "../../common/ActionButton";
import { FormInput } from "../../common/FormInput";
import { addressFromString, type AccountAddress } from "open-libra-sdk";
import { formatLibraAmount } from "../../../util/format-utils";
import { reportErrorAuto } from "../../../util/error-utils";
import type { AccountState } from "../../../util/app-config-store";

interface TransferFormProps {
  account: AccountState;
  accountId: string;
  onRequestMnemonic: (
    operation: "transfer",
    data: { to: AccountAddress; amount: number },
  ) => void;
  showAlert: (title: string, message: string) => void;
  isLoading: boolean;
  onClearForm?: () => void;
}

export const TransferForm = memo(
  ({
    account,
    accountId,
    onRequestMnemonic,
    showAlert,
    isLoading,
    onClearForm,
  }: TransferFormProps) => {
    const [recipientAddress, setRecipientAddress] = useState("");
    const [amount, setAmount] = useState("");
    const [transactionError, setTransactionError] = useState<string | null>(
      null,
    );

    // Handle form validation
    const validateTransferForm = useCallback(() => {
      if (!recipientAddress.trim()) {
        setTransactionError("Please enter a recipient address");
        return false;
      }

      if (!amount.trim()) {
        setTransactionError("Please enter an amount");
        return false;
      }

      const numAmount = parseFloat(amount);
      if (isNaN(numAmount) || numAmount <= 0) {
        setTransactionError("Please enter a valid amount greater than 0");
        return false;
      }

      // Check if sender has enough balance
      if (account && numAmount > account.balance_unlocked) {
        setTransactionError(
          `Insufficient funds. Available: ${formatLibraAmount(account.balance_unlocked)}`,
        );
        return false;
      }

      try {
        // Validate address format
        addressFromString(recipientAddress.trim());
      } catch {
        setTransactionError("Invalid recipient address format");
        return false;
      }

      return true;
    }, [recipientAddress, amount, account]);

    // Handle transfer initiation
    const handleTransfer = useCallback(async () => {
      if (!validateTransferForm() || !account) {
        return;
      }

      setTransactionError(null);

      try {
        const recipientAddr = addressFromString(recipientAddress.trim());
        const transferAmount = parseFloat(amount);

        // Check if account has stored keys
        if (!account.is_key_stored) {
          showAlert(
            "No Private Key",
            "This account doesn't have a stored private key. You can only view transactions for this account.",
          );
          return;
        }

        // Request mnemonic reveal to get private key
        onRequestMnemonic("transfer", {
          to: recipientAddr,
          amount: transferAmount,
        });
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : "Unknown error";
        setTransactionError(errorMessage);
        reportErrorAuto("TransferForm.handleTransfer", error, { accountId });
      }
    }, [
      validateTransferForm,
      account,
      recipientAddress,
      amount,
      accountId,
      onRequestMnemonic,
      showAlert,
    ]);

    // Clear form handler
    const clearForm = useCallback(() => {
      setRecipientAddress("");
      setAmount("");
      setTransactionError(null);
      onClearForm?.();
    }, [onClearForm]);

    return (
      <SectionContainer title="Send Transfer">
        <Text style={styles.description}>
          Send Libra tokens to another account. Make sure you have the correct
          recipient address.
        </Text>

        <View style={[styles.inputContainer, { marginBottom: 16 }]}>
          <Text style={styles.label}>Available Balance</Text>
          <Text style={styles.resultValue}>
            {formatLibraAmount(account.balance_unlocked)} LBR
          </Text>
        </View>

        <FormInput
          label="Recipient Address"
          value={recipientAddress}
          onChangeText={setRecipientAddress}
          placeholder="0x1234..."
          disabled={isLoading}
        />

        <FormInput
          label="Amount"
          value={amount}
          onChangeText={setAmount}
          placeholder="0.00"
          keyboardType="numeric"
          disabled={isLoading}
        />

        {transactionError && (
          <View style={[styles.inputContainer]}>
            <Text style={styles.errorText}>{transactionError}</Text>
          </View>
        )}

        <View style={styles.buttonContainer}>
          <ActionButton
            text="Send Transfer"
            onPress={handleTransfer}
            isLoading={isLoading}
            disabled={isLoading || !account.is_key_stored}
            accessibilityLabel="Send transfer to recipient"
          />

          <ActionButton
            text="Clear Form"
            onPress={clearForm}
            variant="secondary"
            disabled={isLoading}
            accessibilityLabel="Clear transfer form"
          />
        </View>

        {!account.is_key_stored && (
          <View style={[styles.inputContainer, { marginTop: 16 }]}>
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                marginBottom: 8,
              }}
            >
              <Ionicons name="eye-outline" size={20} color={colors.danger} />
              <Text
                style={[styles.label, { marginLeft: 8, color: colors.danger }]}
              >
                View-Only Account
              </Text>
            </View>
            <Text style={styles.description}>
              This account doesn&apos;t have stored private keys. You can view
              balances and transactions, but cannot send transfers.
            </Text>
          </View>
        )}
      </SectionContainer>
    );
  },
);

TransferForm.displayName = "TransferForm";
