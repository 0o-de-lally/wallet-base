import React, { useState, useCallback } from "react";
import { View, Text, Alert } from "react-native";
import { useRouter } from "expo-router";
import { generateMnemonic, LibraWallet, Network } from "open-libra-sdk";
import { GeneratedMnemonicDisplay } from "./GeneratedMnemonicDisplay";
import { AccountDetailsForm } from "./AccountDetailsForm";
import { ActionButton } from "../common/ActionButton";
import { createAccount } from "../../util/account-utils";
import { useSecureStorage } from "../../hooks/use-secure-storage";
import { PinInputModal } from "../pin-input/PinInputModal";
import { getLibraClientUrl } from "../../util/libra-client";
import { styles } from "../../styles/styles";

type CreationStep = "generate" | "details";

interface NewAccountWizardProps {
  onComplete?: () => void;
}

export const NewAccountWizard: React.FC<NewAccountWizardProps> = ({
  onComplete,
}) => {
  const [currentStep, setCurrentStep] = useState<CreationStep>("generate");
  const [mnemonic, setMnemonic] = useState<string>("");
  const [derivedAddress, setDerivedAddress] = useState<string>("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pinModalVisible, setPinModalVisible] = useState(false);
  const [pendingAccountData, setPendingAccountData] = useState<{
    profileName: string;
    nickname: string;
  } | null>(null);

  const router = useRouter();
  const secureStorage = useSecureStorage();

  const generateNewMnemonic = useCallback(async () => {
    setIsGenerating(true);
    setError(null);
    
    // Immediately clear existing mnemonic and address to show progress
    setMnemonic("");
    setDerivedAddress("");

    try {
      await new Promise(resolve => setTimeout(resolve, 500)); // UX delay
      
      // Generate mnemonic
      const newMnemonic = generateMnemonic();
      console.log("Generated mnemonic");
      
      // Immediately derive wallet and address from the new mnemonic
      const wallet = LibraWallet.fromMnemonic(
        newMnemonic,
        Network.MAINNET,
        getLibraClientUrl(),
      );

      const address = wallet.getAddress();
      const addressString = address.toStringLong();
      
      console.log("Derived address:", addressString);
      
      // Set both mnemonic and derived address
      setMnemonic(newMnemonic);
      setDerivedAddress(addressString);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to generate mnemonic and derive address";
      setError(errorMessage);
      Alert.alert("Error", errorMessage);
    } finally {
      setIsGenerating(false);
    }
  }, []);

  const handleContinueToDetails = useCallback(() => {
    if (mnemonic && derivedAddress) {
      setCurrentStep("details");
    }
  }, [mnemonic, derivedAddress]);

  const handleAccountDetails = useCallback(async (profileName: string, nickname: string) => {
    setPendingAccountData({ profileName, nickname });
    setPinModalVisible(true);
  }, []);

  const handlePinSubmit = useCallback(async (_pin: string) => {
    if (!pendingAccountData || !mnemonic || !derivedAddress) return;

    console.log("Creating account...");
    console.log("Expected address:", derivedAddress);

    setIsCreating(true);
    setError(null);

    try {
      // Create wallet from mnemonic to get address - use the exact same mnemonic
      const wallet = LibraWallet.fromMnemonic(
        mnemonic,
        Network.MAINNET,
        getLibraClientUrl(),
      );

      const address = wallet.getAddress();
      const newAddressString = address.toStringLong();
      
      console.log("Wallet created with address:", newAddressString);
      console.log("Addresses match:", newAddressString === derivedAddress);

      // Verify the address matches what we derived earlier
      if (newAddressString !== derivedAddress) {
        throw new Error("Address mismatch - wallet derivation inconsistent");
      }

      // Create account in profile
      const result = await createAccount(
        pendingAccountData.profileName,
        address,
        pendingAccountData.nickname
      );

      if (!result.success) {
        throw new Error(result.error || "Failed to create account");
      }

      // Store mnemonic securely using the secure storage hook
      if (result.account?.id) {
        console.log("Storing mnemonic for account:", result.account.id);
        secureStorage.handleSaveWithValue(result.account.id, mnemonic);
      }

      // Show success notification and navigate back to main page
      Alert.alert(
        "Account Created", 
        `New account${pendingAccountData.nickname ? ` "${pendingAccountData.nickname}"` : ""} has been created successfully.`,
        [{ text: "OK" }]
      );

      // Close modal and navigate back
      setPinModalVisible(false);
      setPendingAccountData(null);
      
      // Navigate back to main page and call onComplete
      router.push("/");
      onComplete?.();
    } catch (err) {
      console.error("Error creating account:", err);
      const errorMessage = err instanceof Error ? err.message : "Failed to create account";
      setError(errorMessage);
      Alert.alert("Error", errorMessage);
    } finally {
      setIsCreating(false);
      setPinModalVisible(false);
      setPendingAccountData(null);
    }
  }, [pendingAccountData, mnemonic, derivedAddress, secureStorage, router, onComplete]);

  return (
    <View style={{ flex: 1 }}>
      {currentStep === "generate" && (
        <View>
          {!mnemonic && !isGenerating && (
            <View style={{ marginTop: 20 }}>
              <ActionButton
                text="Generate Recovery Phrase"
                onPress={generateNewMnemonic}
                disabled={isGenerating}
              />
            </View>
          )}
          {isGenerating && (
            <View style={{ marginTop: 20 }}>
              <ActionButton
                text="Generating..."
                onPress={() => {}}
                disabled={true}
                isLoading={true}
              />
            </View>
          )}
          {mnemonic && !isGenerating && (
            <GeneratedMnemonicDisplay
              mnemonic={mnemonic}
              onRegenerate={generateNewMnemonic}
              isLoading={isGenerating}
            />
          )}
          {derivedAddress && !isGenerating && (
            <View style={{ marginTop: 20 }}>
              <View style={styles.inputContainer}>
                <Text style={styles.label}>Derived Address</Text>
                <View style={styles.input}>
                  <Text style={[styles.description, { fontFamily: "monospace", fontSize: 12 }]}>
                    {derivedAddress}
                  </Text>
                </View>
              </View>
            </View>
          )}
          {mnemonic && derivedAddress && !isGenerating && (
            <View style={{ marginTop: 20 }}>
              <ActionButton
                text="Continue"
                onPress={handleContinueToDetails}
                disabled={isGenerating}
              />
            </View>
          )}
        </View>
      )}

      {currentStep === "details" && (
        <AccountDetailsForm
          onConfirm={handleAccountDetails}
          isLoading={isCreating}
          error={error}
        />
      )}

      <PinInputModal
        visible={pinModalVisible}
        onClose={() => {
          setPinModalVisible(false);
          setPendingAccountData(null);
        }}
        purpose="save"
        onPinAction={handlePinSubmit}
        actionTitle="Enter PIN"
        actionSubtitle="Enter your PIN to securely store the recovery phrase"
        autoCloseOnSuccess={false}
      />
    </View>
  );
};
