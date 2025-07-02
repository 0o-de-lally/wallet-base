import React, { useState, useCallback } from "react";
import { View, Alert } from "react-native";
import { useRouter } from "expo-router";
import { generateMnemonic, LibraWallet, Network } from "open-libra-sdk";
import { GeneratedMnemonicDisplay } from "./GeneratedMnemonicDisplay";
import { DerivedAddressDisplay } from "./DerivedAddressDisplay";
import { AccountDetailsForm } from "./AccountDetailsForm";
import { AccountCreationSuccess } from "./AccountCreationSuccess";
import { ActionButton } from "../common/ActionButton";
import { createAccount } from "../../util/account-utils";
import { useSecureStorage } from "../../hooks/use-secure-storage";
import { PinInputModal } from "../pin-input/PinInputModal";
import { getLibraClientUrl } from "../../util/libra-client";

type CreationStep = "generate" | "derive" | "details" | "success";

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
  const [isDerivingAddress, setIsDerivingAddress] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [newAccountId, setNewAccountId] = useState<string>("");
  const [accountNickname, setAccountNickname] = useState<string>("");
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

    try {
      await new Promise(resolve => setTimeout(resolve, 500)); // UX delay
      const newMnemonic = generateMnemonic();
      setMnemonic(newMnemonic);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to generate mnemonic";
      setError(errorMessage);
      Alert.alert("Error", errorMessage);
    } finally {
      setIsGenerating(false);
    }
  }, []);

  const handleMnemonicConfirm = useCallback(async () => {
    if (!mnemonic) return;
    
    setIsDerivingAddress(true);
    setError(null);

    try {
      // Add a small delay to ensure the loading state is visible
      await new Promise(resolve => setTimeout(resolve, 300));
      
      // Derive wallet and address from mnemonic
      const wallet = LibraWallet.fromMnemonic(
        mnemonic,
        Network.MAINNET,
        getLibraClientUrl(),
      );

      const address = wallet.getAddress();
      setDerivedAddress(address.toStringLong());
      setCurrentStep("derive");
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to derive address";
      setError(errorMessage);
      Alert.alert("Error", errorMessage);
    } finally {
      setIsDerivingAddress(false);
    }
  }, [mnemonic]);

  const handleAddressConfirm = useCallback(() => {
    if (derivedAddress) {
      setCurrentStep("details");
    }
  }, [derivedAddress]);

  const handleBackToGenerate = useCallback(() => {
    setCurrentStep("generate");
    setDerivedAddress("");
    setError(null);
  }, []);

  const handleAccountDetails = useCallback(async (profileName: string, nickname: string) => {
    setPendingAccountData({ profileName, nickname });
    setPinModalVisible(true);
  }, []);

  const handlePinSubmit = useCallback(async (_pin: string) => {
    if (!pendingAccountData || !mnemonic || !derivedAddress) return;

    setIsCreating(true);
    setError(null);

    try {
      // Create wallet from mnemonic to get address
      const wallet = LibraWallet.fromMnemonic(
        mnemonic,
        Network.MAINNET,
        getLibraClientUrl(),
      );

      const address = wallet.getAddress();

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
        secureStorage.handleSaveWithValue(result.account.id, mnemonic);
      }

      setNewAccountId(result.account?.id || "");
      setAccountNickname(pendingAccountData.nickname);
      setCurrentStep("success");
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to create account";
      setError(errorMessage);
      Alert.alert("Error", errorMessage);
    } finally {
      setIsCreating(false);
      setPinModalVisible(false);
      setPendingAccountData(null);
    }
  }, [pendingAccountData, mnemonic, derivedAddress, secureStorage]);

  const handleViewAccount = useCallback(() => {
    if (newAccountId) {
      router.push(`/account-details?accountId=${newAccountId}`);
    }
  }, [newAccountId, router]);

  const handleContinue = useCallback(() => {
    onComplete?.();
  }, [onComplete]);

  // Initialize with mnemonic generation
  React.useEffect(() => {
    generateNewMnemonic();
  }, [generateNewMnemonic]);

  return (
    <View style={{ flex: 1 }}>
      {currentStep === "generate" && (
        <View>
          {mnemonic && (
            <GeneratedMnemonicDisplay
              mnemonic={mnemonic}
              onRegenerate={generateNewMnemonic}
              isLoading={isGenerating}
            />
          )}
          {mnemonic && !isGenerating && (
            <View style={{ marginTop: 20 }}>
              <ActionButton
                text={isDerivingAddress ? "Initializing Wallet..." : "Continue"}
                onPress={handleMnemonicConfirm}
                disabled={isDerivingAddress}
                isLoading={isDerivingAddress}
              />
            </View>
          )}
        </View>
      )}

      {currentStep === "derive" && (
        <DerivedAddressDisplay
          address={derivedAddress}
          mnemonic={mnemonic}
          onConfirm={handleAddressConfirm}
          onBack={handleBackToGenerate}
          isLoading={isCreating}
        />
      )}

      {currentStep === "details" && (
        <AccountDetailsForm
          onConfirm={handleAccountDetails}
          isLoading={isCreating}
          error={error}
        />
      )}

      {currentStep === "success" && (
        <AccountCreationSuccess
          accountId={newAccountId}
          accountNickname={accountNickname}
          onViewAccount={handleViewAccount}
          onContinue={handleContinue}
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
      />
    </View>
  );
};
