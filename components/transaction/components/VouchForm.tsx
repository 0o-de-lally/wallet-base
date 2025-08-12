import React, { useState, useCallback, memo, useEffect } from "react";
import { View, Text } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { styles } from "../../../styles/styles";
import { SectionContainer } from "../../common/SectionContainer";
import { FormInput } from "../../common/FormInput";
import { ActionButton } from "../../common/ActionButton";
import { addressFromString, type AccountAddress } from "open-libra-sdk";
import { shortenAddress } from "../../../util/format-utils";
import { getLibraClient } from "../../../util/libra-client";
import {
  fetchAccountVouchData,
  type VouchData as VouchInfo,
} from "../../../util/vouch-utils";
import type { AccountState } from "../../../util/app-config-store";

interface VouchData {
  recipient: AccountAddress;
}

interface VouchFormProps {
  account: AccountState;
  accountId: string;
  onRequestMnemonic: (operation: "vouch", data: VouchData) => void;
  showAlert: (title: string, message: string) => void;
  isLoading: boolean;
  onClearForm?: () => void;
  isV8Authorized?: boolean;
}

export const VouchForm = memo(
  ({
    account,
    onRequestMnemonic,
    isLoading,
    onClearForm,
    isV8Authorized = true,
  }: VouchFormProps) => {
    const [recipientAddress, setRecipientAddress] = useState("");
    const [vouchError, setVouchError] = useState<string | null>(null);
    const [vouchInfo, setVouchInfo] = useState<VouchInfo | null>(null);
    const [loadingVouchInfo, setLoadingVouchInfo] = useState(false);

    // Function to load vouch information
    const loadVouchInfo = useCallback(async () => {
      if (!account.account_address) return;

      setLoadingVouchInfo(true);
      try {
        const client = getLibraClient();
        const data = await fetchAccountVouchData(
          client,
          account.account_address,
        );
        setVouchInfo(data);
      } catch (error) {
        console.warn("Failed to load vouch info:", error);
      } finally {
        setLoadingVouchInfo(false);
      }
    }, [account.account_address]);

    // Load vouch information when component mounts and after transactions
    useEffect(() => {
      loadVouchInfo();
    }, [loadVouchInfo]);

    // Refresh vouch info when not loading (after successful transaction)
    useEffect(() => {
      if (!isLoading && vouchInfo) {
        loadVouchInfo();
      }
    }, [isLoading, loadVouchInfo]);

    // Handle form validation
    const validateVouchForm = useCallback(() => {
      if (!recipientAddress.trim()) {
        setVouchError("Please enter a recipient address");
        return false;
      }

      try {
        // Validate address format
        addressFromString(recipientAddress.trim());
      } catch {
        setVouchError("Invalid recipient address format");
        return false;
      }

      // Check if trying to vouch for self
      if (
        recipientAddress.trim().toLowerCase() ===
        account.account_address.toLowerCase()
      ) {
        setVouchError("You cannot vouch for yourself");
        return false;
      }

      return true;
    }, [recipientAddress, account.account_address]);

    // Handle vouch submission
    const handleVouchSubmit = useCallback(async () => {
      if (!validateVouchForm()) {
        return;
      }

      setVouchError(null);

      try {
        const recipient = addressFromString(recipientAddress.trim());
        const vouchData: VouchData = {
          recipient,
        };

        onRequestMnemonic("vouch", vouchData);
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : "Unknown error";
        setVouchError(`Failed to create vouch: ${errorMessage}`);
      }
    }, [validateVouchForm, recipientAddress, onRequestMnemonic]);

    // Clear form handler
    const clearForm = useCallback(() => {
      setRecipientAddress("");
      setVouchError(null);
      onClearForm?.();
    }, [onClearForm]);

    return (
      <SectionContainer title="Vouch for Account">
        {!isV8Authorized && (
          <View style={[styles.inputContainer, styles.warningContainer]}>
            <View style={styles.iconTextHeader}>
              <Ionicons name="warning-outline" size={20} color="#ff6b00" />
              <Text
                style={[
                  styles.label,
                  styles.iconTextLabel,
                  styles.iconTextLabelDanger,
                ]}
              >
                V8 Authorization Required
              </Text>
            </View>
            <Text style={styles.description}>
              Vouching functionality is disabled until V8 authorization is
              complete. Please complete the V8 authorization first.
            </Text>
          </View>
        )}

        <Text style={styles.description}>
          Vouch for another Founder account to help them with anti-bot
          verification. This is part of the V8 network migration process for
          Founder accounts.
        </Text>

        {/* Current Vouch Status */}
        <View style={[styles.inputContainer, { marginBottom: 16 }]}>
          <Text style={styles.label}>Current Vouch Status</Text>
          {loadingVouchInfo ? (
            <Text style={styles.resultValue}>Loading vouch information...</Text>
          ) : vouchInfo ? (
            <View>
              <Text style={styles.resultValue}>
                Received Vouches: {vouchInfo.received_vouches.length}
              </Text>
              {vouchInfo.received_vouches.length > 0 && (
                <View style={{ marginTop: 4 }}>
                  {vouchInfo.received_vouches.slice(0, 3).map((addr, index) => (
                    <Text
                      key={index}
                      style={[styles.description, { fontSize: 12 }]}
                    >
                      • {shortenAddress(addr)}
                    </Text>
                  ))}
                  {vouchInfo.received_vouches.length > 3 && (
                    <Text style={[styles.description, { fontSize: 12 }]}>
                      ... and {vouchInfo.received_vouches.length - 3} more
                    </Text>
                  )}
                </View>
              )}
              <Text style={styles.resultValue}>
                Given Vouches: {vouchInfo.given_vouches.length}
              </Text>
              {vouchInfo.error && (
                <Text style={[styles.errorText, { fontSize: 12 }]}>
                  {vouchInfo.error}
                </Text>
              )}
            </View>
          ) : (
            <Text style={styles.resultValue}>
              No vouch information available
            </Text>
          )}
        </View>

        <FormInput
          label="Recipient Address"
          value={recipientAddress}
          onChangeText={setRecipientAddress}
          placeholder="0x1234..."
          disabled={isLoading || !isV8Authorized}
        />

        {vouchError && (
          <View style={[styles.inputContainer]}>
            <Text style={styles.errorText}>{vouchError}</Text>
          </View>
        )}

        <View style={styles.buttonContainer}>
          <ActionButton
            text="Submit Vouch"
            onPress={handleVouchSubmit}
            isLoading={isLoading}
            disabled={isLoading || !isV8Authorized || !recipientAddress.trim()}
            accessibilityLabel="Submit vouch for the specified account"
          />
          <ActionButton
            text="Clear"
            onPress={clearForm}
            disabled={isLoading}
            accessibilityLabel="Clear the vouch form"
          />
        </View>

        {!account.is_key_stored && (
          <View style={[styles.inputContainer, styles.viewOnlyContainer]}>
            <View style={styles.iconTextHeader}>
              <Ionicons name="eye-outline" size={20} color="#ff9500" />
              <Text
                style={[
                  styles.label,
                  styles.iconTextLabel,
                  styles.iconTextLabelDanger,
                ]}
              >
                View-Only Account
              </Text>
            </View>
            <Text style={styles.description}>
              Vouching requires access to private keys. This view-only account
              cannot perform vouching. You&apos;ll need to import the private
              keys first.
            </Text>
          </View>
        )}
      </SectionContainer>
    );
  },
);

VouchForm.displayName = "VouchForm";
