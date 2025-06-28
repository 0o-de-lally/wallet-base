import "buffer"; // Ensure Buffer is available globally
import { useCallback } from "react";
import { LibraWallet, Network, type AccountAddress } from "open-libra-sdk";
import { getLibraClientUrl } from "../../../util/libra-client";
import { formatLibraAmount, shortenAddress } from "../../../util/format-utils";
import { reportErrorAuto } from "../../../util/error-utils";
import type { AccountState } from "../../../util/app-config-store";

interface TransferData {
  to: AccountAddress;
  amount: number;
}

interface TransactionExecutorProps {
  account: AccountState;
  accountId: string;
  showAlert: (title: string, message: string) => void;
  onTransferComplete?: () => void;
  onAdminTransactionComplete?: () => void;
}

export const useTransactionExecutor = ({
  account,
  accountId,
  showAlert,
  onTransferComplete,
  onAdminTransactionComplete,
}: TransactionExecutorProps) => {
  // Execute transfer transaction
  const executeTransfer = useCallback(
    async (
      mnemonic: string,
      transferData: TransferData,
      setIsLoading: (loading: boolean) => void,
      setError: (error: string | null) => void,
    ) => {
      if (!transferData || !account) {
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        // Create wallet from mnemonic
        const clientUrl = getLibraClientUrl();
        const wallet = LibraWallet.fromMnemonic(
          mnemonic.trim(),
          Network.MAINNET,
          clientUrl,
        );

        // Sync wallet state with blockchain
        await wallet.syncOnchain();

        // Convert amount to the proper scale (multiply by 1,000,000 for micro-units)
        const scaledAmount = Math.floor(transferData.amount * 1_000_000);

        // Build transfer transaction
        const tx = await wallet.buildTransferTx(transferData.to, scaledAmount);

        // Sign and submit transaction
        const result = await wallet.signSubmitWait(tx);

        if (result.success) {
          showAlert(
            "Transfer Successful",
            `Successfully sent ${formatLibraAmount(transferData.amount)} to ${shortenAddress(transferData.to.toStringLong())}\n\nTransaction Hash: ${result.hash?.substring(0, 20)}...`,
          );

          onTransferComplete?.();
        } else {
          const errorMsg = result.vm_status || "Transaction failed";
          setError(`Transaction failed: ${errorMsg}`);
          showAlert("Transfer Failed", `Transaction failed: ${errorMsg}`);
        }
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : "Unknown error";
        setError(`Transfer failed: ${errorMessage}`);
        showAlert("Transfer Failed", `Transfer failed: ${errorMessage}`);
        reportErrorAuto("TransactionExecutor.executeTransfer", error, {
          accountId,
          recipient: transferData.to.toStringLong(),
          amount: transferData.amount,
        });
      } finally {
        setIsLoading(false);
      }
    },
    [account, accountId, showAlert, onTransferComplete],
  );

  // Execute V8 RE-JOIN transaction
  const executeV8Rejoin = useCallback(
    async (
      mnemonic: string,
      setIsLoading: (loading: boolean) => void,
      setError: (error: string | null) => void,
    ) => {
      if (!account) {
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        // Create wallet from mnemonic
        const clientUrl = getLibraClientUrl();
        const wallet = LibraWallet.fromMnemonic(
          mnemonic.trim(),
          Network.MAINNET,
          clientUrl,
        );

        // Sync wallet state with blockchain
        await wallet.syncOnchain();

        // Build V8 RE-JOIN transaction using the entry function
        // 0x1::filo_migration::maybe_migrate takes no arguments
        const tx = await wallet.buildTransaction(
          "0x1::filo_migration::maybe_migrate",
          [], // No arguments required for this function
        );

        // Sign and submit transaction
        const result = await wallet.signSubmitWait(tx);

        if (result.success) {
          showAlert(
            "V8 RE-JOIN Successful",
            `V8 RE-JOIN transaction completed successfully!\n\nTransaction Hash: ${result.hash?.substring(0, 20)}...`,
          );

          onAdminTransactionComplete?.();
        } else {
          const errorMsg = result.vm_status || "Transaction failed";
          setError(`V8 RE-JOIN failed: ${errorMsg}`);
          showAlert("V8 RE-JOIN Failed", `Transaction failed: ${errorMsg}`);
        }
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : "Unknown error";
        setError(`V8 RE-JOIN failed: ${errorMessage}`);
        showAlert("V8 RE-JOIN Failed", `Transaction failed: ${errorMessage}`);
        reportErrorAuto("TransactionExecutor.executeV8Rejoin", error, {
          accountId,
        });
      } finally {
        setIsLoading(false);
      }
    },
    [account, accountId, showAlert, onAdminTransactionComplete],
  );

  return {
    executeTransfer,
    executeV8Rejoin,
  };
};
