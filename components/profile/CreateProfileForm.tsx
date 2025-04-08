import React, { useState, useEffect, memo } from "react";
import { Text } from "react-native";
import { styles } from "../../styles/styles";
import {
  createProfile,
} from "../../util/app-config-store";
import { appConfig } from "../../util/app-config-store";
import ConfirmationModal from "../modal/ConfirmationModal";
import { FormInput } from "../common/FormInput";
import { SectionContainer } from "../common/SectionContainer";
import { ActionButton } from "../common/ActionButton";
import Dropdown from "../common/Dropdown";
import { Network } from "open-libra-sdk";

interface CreateProfileFormProps {
  onComplete: () => void;
}

const CreateProfileForm = memo(({ onComplete }: CreateProfileFormProps) => {
  // Check if this is the first profile being created
  const isFirstProfile = Object.keys(appConfig.profiles).length === 0;

  const [profileName, setProfileName] = useState(
    isFirstProfile ? "mainnet" : "",
  );
  const [networkType, setNetworkType] = useState<Network>(Network.MAINNET);
  const [error, setError] = useState<string | null>(null);
  const [customNetwork, setCustomNetwork] = useState(false);
  const [customNetworkUrl, setCustomNetworkUrl] = useState<string>("");

  // Modal states
  const [successModalVisible, setSuccessModalVisible] = useState(false);

  // // Set the network name when network type changes
  // useEffect(() => {
  //   if (networkType !== NetworkTypeEnum.CUSsTOM) {
  //     setNetworkName(networkType);
  //   } else if (
  //     networkName === NetworkTypeEnum.MAINNET ||
  //     networkName === NetworkTypeEnum.TESTING ||
  //     networkName === NetworkTypeEnum.TESTNET
  //   ) {
  //     setNetworkName(""); // Clear the name if switching to custom from a pre-defined type
  //   }

  //   setCustomNetwork(networkType === NetworkTypeEnum.CUSTOM);
  // }, [networkType]);

  const handleCreateProfile = () => {
    // Validate inputs
    if (!profileName.trim()) {
      setError("Profile name is required");
      return;
    }

    // Create profile
    const success = createProfile(profileName, networkType);

    if (success) {
      setSuccessModalVisible(true);
    } else {
      setError(`Profile "${profileName}" already exists.`);
    }
  };

  const handleSuccess = () => {
    setSuccessModalVisible(false);
    setProfileName("");
    setError(null);
    onComplete();
  };

  return (
    <SectionContainer title="Create New Profile">
      {error && <Text style={styles.errorText}>{error}</Text>}

      <FormInput
        label="Profile Name:"
        value={profileName}
        onChangeText={setProfileName}
        placeholder="Enter profile name"
      />

      <Dropdown
        label="Network Type"
        value={networkType}
        options={Object.values(Network)}
        onSelect={setNetworkType}
      />

      {customNetwork && (
        <FormInput
          label="Custom Network URL:"
          value={customNetworkUrl}
          onChangeText={setCustomNetworkUrl}
          placeholder="Enter custom network name"
        />
      )}

      <ActionButton
        text="Create Profile"
        onPress={handleCreateProfile}
        accessibilityLabel="Create profile"
        accessibilityHint="Creates a new wallet profile with the specified settings"
      />

      {/* Success Modal */}
      <ConfirmationModal
        visible={successModalVisible}
        title="Success"
        message={`Profile "${profileName}" created successfully.`}
        confirmText="OK"
        onConfirm={handleSuccess}
        onCancel={handleSuccess}
      />
    </SectionContainer>
  );
});

CreateProfileForm.displayName = "CreateProfileForm";

export default CreateProfileForm;
