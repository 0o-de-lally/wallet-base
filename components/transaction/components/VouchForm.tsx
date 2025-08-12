import React, { useState, useCallback, memo, useEffect } from "react";
import { View, Text, TouchableOpacity } from "react-native";
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
  refreshKey?: number; // Add optional refresh key to force data reload
}

export const VouchForm = memo(
  ({
    account,
    onRequestMnemonic,
    isLoading,
    onClearForm,
    isV8Authorized = true,
    refreshKey,
  }: VouchFormProps) => {
    const [recipientAddress, setRecipientAddress] = useState("");
    const [vouchError, setVouchError] = useState<string | null>(null);
    const [vouchInfo, setVouchInfo] = useState<VouchInfo | null>(null);
    const [loadingVouchInfo, setLoadingVouchInfo] = useState(false);
    const [showReceivedVouches, setShowReceivedVouches] = useState(false);
    const [showGivenVouches, setShowGivenVouches] = useState(false);

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
        console.log("VouchForm received data:", {
          received_count: data.received_vouches.length,
          given_count: data.given_vouches.length,
          data,
        });
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

    // Refresh when refreshKey changes (after successful transaction)
    useEffect(() => {
      if (refreshKey !== undefined) {
        loadVouchInfo();
      }
    }, [refreshKey, loadVouchInfo]);

    // Refresh vouch info when not loading (after successful transaction)
    // This will trigger whenever isLoading changes from true to false
    useEffect(() => {
      if (!isLoading) {
        // Small delay to ensure transaction has been processed on chain
        const refreshTimer = setTimeout(() => {
          loadVouchInfo();
        }, 1000);

        return () => clearTimeout(refreshTimer);
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

    // Check for duplicate vouch warning (separate from validation)
    const getDuplicateVouchWarning = useCallback(() => {
      if (!recipientAddress.trim() || !vouchInfo?.given_vouches) {
        return null;
      }

      const inputAddress = recipientAddress.trim().toLowerCase();
      const isAlreadyVouched = vouchInfo.given_vouches.some(
        (addr) => addr.toLowerCase() === inputAddress,
      );

      if (isAlreadyVouched) {
        return "You have already vouched for this address. You can still submit to vouch again if needed.";
      }

      return null;
    }, [recipientAddress, vouchInfo?.given_vouches]);

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
      <SectionContainer title="Vouch">
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
              <TouchableOpacity
                onPress={() => setShowReceivedVouches(!showReceivedVouches)}
                style={{ marginBottom: 8 }}
                accessibilityRole="button"
                accessibilityLabel={`${showReceivedVouches ? "Hide" : "Show"} received vouches list`}
              >
                <Text style={styles.resultValue}>
                  Received Vouches: {vouchInfo.received_vouches.length}
                </Text>
              </TouchableOpacity>
              {showReceivedVouches && vouchInfo.received_vouches.length > 0 && (
                <View style={{ marginTop: 4, marginBottom: 8 }}>
                  {vouchInfo.received_vouches
                    .slice(0, 10)
                    .map((addr, index) => (
                      <Text
                        key={index}
                        style={[
                          styles.description,
                          { fontSize: 12, marginLeft: 16 },
                        ]}
                      >
                        • {shortenAddress(addr)}
                      </Text>
                    ))}
                  {vouchInfo.received_vouches.length > 10 && (
                    <Text
                      style={[
                        styles.description,
                        { fontSize: 12, marginLeft: 16 },
                      ]}
                    >
                      ... and {vouchInfo.received_vouches.length - 10} more
                    </Text>
                  )}
                </View>
              )}
              <TouchableOpacity
                onPress={() => setShowGivenVouches(!showGivenVouches)}
                style={{ marginBottom: 8 }}
                accessibilityRole="button"
                accessibilityLabel={`${showGivenVouches ? "Hide" : "Show"} given vouches list`}
              >
                <Text style={styles.resultValue}>
                  Given Vouches: {vouchInfo.given_vouches.length}
                </Text>
              </TouchableOpacity>
              {showGivenVouches && vouchInfo.given_vouches.length > 0 && (
                <View style={{ marginTop: 4, marginBottom: 8 }}>
                  {vouchInfo.given_vouches.slice(0, 10).map((addr, index) => (
                    <Text
                      key={index}
                      style={[
                        styles.description,
                        { fontSize: 12, marginLeft: 16 },
                      ]}
                    >
                      • {shortenAddress(addr)}
                    </Text>
                  ))}
                  {vouchInfo.given_vouches.length > 10 && (
                    <Text
                      style={[
                        styles.description,
                        { fontSize: 12, marginLeft: 16 },
                      ]}
                    >
                      ... and {vouchInfo.given_vouches.length - 10} more
                    </Text>
                  )}
                </View>
              )}
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

        {/* Show duplicate vouch warning */}
        {getDuplicateVouchWarning() && (
          <View
            style={[
              styles.inputContainer,
              {
                backgroundColor: "#fff3cd",
                borderColor: "#ffeaa7",
                borderWidth: 1,
                borderRadius: 8,
              },
            ]}
          >
            <Text
              style={[styles.description, { color: "#856404", fontSize: 13 }]}
            >
              {getDuplicateVouchWarning()}
            </Text>
          </View>
        )}

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
