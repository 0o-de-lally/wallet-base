import "buffer"; // Ensure Buffer is available globally
import React, { useState, useEffect, useCallback, memo } from "react";
import { ScrollView, Text } from "react-native";
import { styles } from "../../styles/styles";
import { useModal } from "../../context/ModalContext";
import { useTransactionPin } from "../../hooks/use-transaction-pin";
import { appConfig, type AccountState } from "../../util/app-config-store";
import { type AccountAddress } from "open-libra-sdk";
import {
  AccountHeader,
  TransferForm,
  AdminTransactions,
  TransactionPinModal,
  useTransactionExecutor,
} from "./components";

interface TransactionHubProps {
  accountId: string;
  profileName: string;
}

interface TransferData {
  to: AccountAddress;
  amount: number;
}

export const TransactionHub = memo(
  ({ accountId, profileName }: TransactionHubProps) => {
    const [account, setAccount] = useState<AccountState | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    // Transaction state
    const [isTransferLoading, setIsTransferLoading] = useState(false);
    const [isAdminLoading, setIsAdminLoading] = useState(false);

    // Operation state
    const [currentOperation, setCurrentOperation] = useState<
      "transfer" | "v8_rejoin" | null
    >(null);
    const [pendingTransferData, setPendingTransferData] =
      useState<TransferData | null>(null);

    const { showAlert } = useModal();

    // Transaction executor
    const { executeTransfer, executeV8Rejoin } = useTransactionExecutor({
      account: account!,
      accountId,
      showAlert,
      onTransferComplete: useCallback(() => {
        setPendingTransferData(null);
        setCurrentOperation(null);
      }, []),
      onAdminTransactionComplete: useCallback(() => {
        setCurrentOperation(null);
      }, []),
    });

    // Handle mnemonic retrieval for transactions
    const handleMnemonicRetrieved = useCallback((mnemonic: string) => {
      if (currentOperation === "transfer" && pendingTransferData) {
        executeTransfer(mnemonic, pendingTransferData, setIsTransferLoading, () => {});
      } else if (currentOperation === "v8_rejoin") {
        executeV8Rejoin(mnemonic, setIsAdminLoading, () => {});
      }
    }, [currentOperation, pendingTransferData, executeTransfer, executeV8Rejoin]);

    const {
      pinModalVisible,
      isLoading: isPinLoading,
      requestMnemonicWithPin,
      handlePinSubmit,
      closePinModal
    } = useTransactionPin({
      accountId,
      onMnemonicRetrieved: handleMnemonicRetrieved
    });

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

          const foundAccount = profile.accounts.find(
            (acc) => acc.id === accountId,
          );
          if (foundAccount) {
            setAccount(foundAccount);
          } else {
            console.error(
              `Account with ID '${accountId}' not found in profile '${profileName}'`,
            );
          }
        } catch (error) {
          console.error("Error loading account:", error);
        } finally {
          setIsLoading(false);
        }
      };

      loadAccount();
    }, [accountId, profileName]);

    // Handle mnemonic requests from components
    const handleRequestMnemonic = useCallback(
      (operation: "transfer" | "v8_rejoin", data?: TransferData) => {
        setCurrentOperation(operation);
        if (operation === "transfer" && data) {
          setPendingTransferData(data);
        }
        requestMnemonicWithPin();
      },
      [requestMnemonicWithPin],
    );

    // Clear all operations
    const handleClearAll = useCallback(() => {
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
        <AccountHeader account={account} />

        <TransferForm
          account={account}
          accountId={accountId}
          onRequestMnemonic={handleRequestMnemonic}
          showAlert={showAlert}
          isLoading={isTransferLoading}
          onClearForm={handleClearAll}
        />

        <AdminTransactions
          account={account}
          accountId={accountId}
          onRequestMnemonic={handleRequestMnemonic}
          showAlert={showAlert}
          isLoading={isAdminLoading}
        />

        <TransactionPinModal
          visible={pinModalVisible}
          onClose={closePinModal}
          onPinSubmit={handlePinSubmit}
          isLoading={isPinLoading}
          operationType={currentOperation}
        />
      </ScrollView>
    );
  },
);

TransactionHub.displayName = "TransactionHub";
