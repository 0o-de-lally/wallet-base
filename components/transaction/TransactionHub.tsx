import "buffer"; // Ensure Buffer is available globally
import React, { useState, useEffect, useCallback, memo } from "react";
import { View, Text, ScrollView } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { styles } from "../../styles/styles";
import { SectionContainer } from "../common/SectionContainer";
import { ActionButton } from "../common/ActionButton";
import { FormInput } from "../common/FormInput";
import { useModal } from "../../context/ModalContext";
import { useSecureStorage } from "../../hooks/use-secure-storage";
import { PinInputModal } from "../pin-input/PinInputModal";
import { appConfig, type AccountState } from "../../util/app-config-store";
import { 
  LibraWallet, 
  Network, 
  addressFromString, 
  type AccountAddress 
} from "open-libra-sdk";
import { getLibraClientUrl } from "../../util/libra-client";
import { formatLibraAmount, shortenAddress } from "../../util/format-utils";
import { reportErrorAuto } from "../../util/error-utils";

interface TransactionHubProps {
  accountId: string;
  profileName: string;
}

export const TransactionHub = memo(
  ({ accountId, profileName }: TransactionHubProps) => {
    const [account, setAccount] = useState<AccountState | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    
    // Transfer form state
    const [recipientAddress, setRecipientAddress] = useState("");
    const [amount, setAmount] = useState("");
    const [isTransactionLoading, setIsTransactionLoading] = useState(false);
    const [transactionError, setTransactionError] = useState<string | null>(null);
    
    // Admin transaction state
    const [isAdminTransactionLoading, setIsAdminTransactionLoading] = useState(false);
    const [adminTransactionError, setAdminTransactionError] = useState<string | null>(null);
    
    // PIN and secure storage for accessing private keys
    const [currentOperation, setCurrentOperation] = useState<"transfer" | "v8_rejoin" | null>(null);
    const [pendingTransferData, setPendingTransferData] = useState<{
      to: AccountAddress;
      amount: number;
    } | null>(null);

    const { showAlert } = useModal();
    const {
      storedValue: mnemonicValue,
      handleExecuteReveal,
      pinModalVisible: secureStoragePinVisible,
      handlePinModalClose: handleSecureStoragePinClose,
      handlePinAction: handleSecureStoragePinAction,
      currentAction: secureStorageAction,
    } = useSecureStorage(accountId);

    // Load account data
    useEffect(() => {
      const loadAccount = async () => {
        try {
          const profiles = appConfig.profiles.get();
          const profile = profiles[profileName];
          
          if (!profile) {
            console.error(`Profile '${profileName}' not found`);
            return;
          }

          const foundAccount = profile.accounts.find(acc => acc.id === accountId);
          if (foundAccount) {
            setAccount(foundAccount);
          } else {
            console.error(`Account with ID '${accountId}' not found in profile '${profileName}'`);
          }
        } catch (error) {
          console.error("Error loading account:", error);
        } finally {
          setIsLoading(false);
        }
      };

      loadAccount();
    }, [accountId, profileName]);

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
          `Insufficient funds. Available: ${formatLibraAmount(account.balance_unlocked)}`
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

        // Store transfer data for after PIN verification
        setPendingTransferData({
          to: recipientAddr,
          amount: transferAmount
        });

        // Check if account has stored keys
        if (!account.is_key_stored) {
          showAlert(
            "No Private Key", 
            "This account doesn't have a stored private key. You can only view transactions for this account."
          );
          return;
        }

        // Request mnemonic reveal to get private key
        setCurrentOperation("transfer");
        handleExecuteReveal(accountId);

      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Unknown error";
        setTransactionError(errorMessage);
        reportErrorAuto("TransactionHub.handleTransfer", error, { accountId });
      }
    }, [
      validateTransferForm, 
      account, 
      recipientAddress, 
      amount, 
      accountId, 
      handleExecuteReveal, 
      showAlert
    ]);

    // Execute transfer after PIN verification and mnemonic retrieval
    const executeTransfer = useCallback(async (mnemonic: string) => {
      if (!pendingTransferData || !account) {
        return;
      }

      setIsTransactionLoading(true);
      setTransactionError(null);

      try {
        // Create wallet from mnemonic
        const clientUrl = getLibraClientUrl();
        const wallet = LibraWallet.fromMnemonic(
          mnemonic.trim(),
          Network.MAINNET,
          clientUrl
        );

        // Sync wallet state with blockchain
        await wallet.syncOnchain();

        // Convert amount to the proper scale (multiply by 1,000,000 for micro-units)
        const scaledAmount = Math.floor(pendingTransferData.amount * 1_000_000);

        // Build transfer transaction
        const tx = await wallet.buildTransferTx(
          pendingTransferData.to,
          scaledAmount
        );

        // Sign and submit transaction
        const result = await wallet.signSubmitWait(tx);

        if (result.success) {
          showAlert(
            "Transfer Successful",
            `Successfully sent ${formatLibraAmount(pendingTransferData.amount)} to ${shortenAddress(pendingTransferData.to.toStringLong())}\n\nTransaction Hash: ${result.hash?.substring(0, 20)}...`
          );
          
          // Clear form
          setRecipientAddress("");
          setAmount("");
          setPendingTransferData(null);
          setCurrentOperation(null);
        } else {
          const errorMsg = result.vm_status || "Transaction failed";
          setTransactionError(`Transaction failed: ${errorMsg}`);
          showAlert("Transfer Failed", `Transaction failed: ${errorMsg}`);
        }

      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Unknown error";
        setTransactionError(`Transfer failed: ${errorMessage}`);
        showAlert("Transfer Failed", `Transfer failed: ${errorMessage}`);
        reportErrorAuto("TransactionHub.executeTransfer", error, { 
          accountId, 
          recipient: pendingTransferData.to.toStringLong(),
          amount: pendingTransferData.amount 
        });
      } finally {
        setIsTransactionLoading(false);
        setPendingTransferData(null);
        setCurrentOperation(null);
      }
    }, [pendingTransferData, account, accountId, showAlert]);

    // Handle V8 RE-JOIN transaction initiation
    const handleV8Rejoin = useCallback(async () => {
      if (!account) {
        return;
      }

      setAdminTransactionError(null);

      try {
        // Check if account has stored keys
        if (!account.is_key_stored) {
          showAlert(
            "No Private Key", 
            "This account doesn&apos;t have a stored private key. Admin transactions require access to private keys."
          );
          return;
        }

        // Request mnemonic reveal to get private key for admin transaction
        setCurrentOperation("v8_rejoin");
        handleExecuteReveal(accountId);

      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Unknown error";
        setAdminTransactionError(errorMessage);
        reportErrorAuto("TransactionHub.handleV8Rejoin", error, { accountId });
      }
    }, [account, accountId, handleExecuteReveal, showAlert]);

    // Execute V8 RE-JOIN transaction after PIN verification and mnemonic retrieval
    const executeV8Rejoin = useCallback(async (mnemonic: string) => {
      if (!account) {
        return;
      }

      setIsAdminTransactionLoading(true);
      setAdminTransactionError(null);

      try {
        // Create wallet from mnemonic
        const clientUrl = getLibraClientUrl();
        const wallet = LibraWallet.fromMnemonic(
          mnemonic.trim(),
          Network.MAINNET,
          clientUrl
        );

        // Sync wallet state with blockchain
        await wallet.syncOnchain();

        // Build V8 RE-JOIN transaction using the entry function
        // 0x1::filo_migration::maybe_migrate takes no arguments
        const tx = await wallet.buildTransaction(
          "0x1::filo_migration::maybe_migrate",
          [] // No arguments required for this function
        );

        // Sign and submit transaction
        const result = await wallet.signSubmitWait(tx);

        if (result.success) {
          showAlert(
            "V8 RE-JOIN Successful",
            `V8 RE-JOIN transaction completed successfully!\n\nTransaction Hash: ${result.hash?.substring(0, 20)}...`
          );
          
          setCurrentOperation(null);
        } else {
          const errorMsg = result.vm_status || "Transaction failed";
          setAdminTransactionError(`V8 RE-JOIN failed: ${errorMsg}`);
          showAlert("V8 RE-JOIN Failed", `Transaction failed: ${errorMsg}`);
        }

      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Unknown error";
        setAdminTransactionError(`V8 RE-JOIN failed: ${errorMessage}`);
        showAlert("V8 RE-JOIN Failed", `Transaction failed: ${errorMessage}`);
        reportErrorAuto("TransactionHub.executeV8Rejoin", error, { accountId });
      } finally {
        setIsAdminTransactionLoading(false);
        setCurrentOperation(null);
      }
    }, [account, accountId, showAlert]);

    // Handle when mnemonic is revealed
    useEffect(() => {
      if (mnemonicValue && currentOperation === "transfer") {
        executeTransfer(mnemonicValue);
      } else if (mnemonicValue && currentOperation === "v8_rejoin") {
        executeV8Rejoin(mnemonicValue);
      }
    }, [mnemonicValue, currentOperation, executeTransfer, executeV8Rejoin]);

    // Clear form handler
    const clearForm = useCallback(() => {
      setRecipientAddress("");
      setAmount("");
      setTransactionError(null);
      setAdminTransactionError(null);
      setPendingTransferData(null);
      setCurrentOperation(null);
    }, []);

    if (isLoading || !account) {
      return (
        <ScrollView 
          style={styles.container}
          contentContainerStyle={styles.scrollContent}
        >
          <Text style={styles.resultValue}>Loading account details...</Text>
        </ScrollView>
      );
    }

    return (
      <ScrollView 
        style={styles.container}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Account Info Header */}
        <SectionContainer title="Transaction Hub">
          <View style={styles.resultContainer}>
            <Text style={styles.resultLabel}>Account:</Text>
            <Text style={styles.resultValue}>
              {account.nickname} ({shortenAddress(account.account_address)})
            </Text>
            <Text style={[styles.resultValue, { marginTop: 8 }]}>
              Available Balance: {formatLibraAmount(account.balance_unlocked)}
            </Text>
            <Text style={styles.resultValue}>
              Total Balance: {formatLibraAmount(account.balance_total)}
            </Text>
          </View>
        </SectionContainer>

        {/* Transfer Section */}
        <SectionContainer title="Send Transfer">
          <Text style={styles.description}>
            Send Libra tokens to another account. Make sure you have the correct recipient address.
          </Text>

          <FormInput
            label="Recipient Address"
            value={recipientAddress}
            onChangeText={setRecipientAddress}
            placeholder="0x1234..."
            disabled={isTransactionLoading}
          />

          <FormInput
            label="Amount"
            value={amount}
            onChangeText={setAmount}
            placeholder="0.00"
            keyboardType="numeric"
            disabled={isTransactionLoading}
          />

          {transactionError && (
            <View style={[styles.inputContainer, { marginTop: 10 }]}>
              <Text style={styles.errorText}>{transactionError}</Text>
            </View>
          )}

          <View style={styles.buttonContainer}>
            <ActionButton
              text="Send Transfer"
              onPress={handleTransfer}
              isLoading={isTransactionLoading}
              disabled={isTransactionLoading || !account.is_key_stored}
              accessibilityLabel="Send transfer to recipient"
            />

            <ActionButton
              text="Clear Form"
              onPress={clearForm}
              variant="secondary"
              disabled={isTransactionLoading}
              style={{ marginTop: 10 }}
              accessibilityLabel="Clear transfer form"
            />
          </View>

          {!account.is_key_stored && (
            <View style={[styles.inputContainer, { marginTop: 16 }]}>
              <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 8 }}>
                <Ionicons name="eye-outline" size={20} color="#ff9500" />
                <Text style={[styles.label, { marginLeft: 8, color: "#ff9500" }]}>
                  View-Only Account
                </Text>
              </View>
              <Text style={styles.description}>
                This account doesn&apos;t have stored private keys. You can view balances and transactions, but cannot send transfers.
              </Text>
            </View>
          )}
        </SectionContainer>

        {/* Admin Transactions Section */}
        <SectionContainer title="Admin Transactions">
          <Text style={styles.description}>
            Administrative blockchain transactions for account management and network migration.
          </Text>
          
          <Text style={[styles.label, { marginTop: 16, marginBottom: 8 }]}>
            V8 Network RE-JOIN
          </Text>
          <Text style={styles.description}>
            Execute the V8 network migration transaction (0x1::filo_migration::maybe_migrate). 
            This will attempt to migrate your account to the V8 network if eligible.
          </Text>

          {adminTransactionError && (
            <View style={[styles.inputContainer, { marginTop: 10 }]}>
              <Text style={styles.errorText}>{adminTransactionError}</Text>
            </View>
          )}

          <View style={styles.buttonContainer}>
            <ActionButton
              text="Execute V8 RE-JOIN"
              onPress={handleV8Rejoin}
              isLoading={isAdminTransactionLoading}
              disabled={isAdminTransactionLoading || !account.is_key_stored}
              accessibilityLabel="Execute V8 network migration transaction"
            />

            <ActionButton
              text="Clear Errors"
              onPress={() => setAdminTransactionError(null)}
              variant="secondary"
              disabled={isAdminTransactionLoading || !adminTransactionError}
              style={{ marginTop: 10 }}
              accessibilityLabel="Clear admin transaction errors"
            />
          </View>

          {!account.is_key_stored && (
            <View style={[styles.inputContainer, { marginTop: 16 }]}>
              <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 8 }}>
                <Ionicons name="eye-outline" size={20} color="#ff9500" />
                <Text style={[styles.label, { marginLeft: 8, color: "#ff9500" }]}>
                  View-Only Account
                </Text>
              </View>
              <Text style={styles.description}>
                Admin transactions require access to private keys. This view-only account cannot execute transactions.
              </Text>
            </View>
          )}
        </SectionContainer>

        {/* PIN Modals */}
        <PinInputModal
          visible={secureStoragePinVisible}
          onClose={handleSecureStoragePinClose}
          onPinAction={handleSecureStoragePinAction}
          purpose={secureStorageAction || "execute_reveal"}
          actionTitle="Verify PIN"
          actionSubtitle="Enter your PIN to access private key for transaction signing"
        />
      </ScrollView>
    );
  }
);

TransactionHub.displayName = "TransactionHub";
