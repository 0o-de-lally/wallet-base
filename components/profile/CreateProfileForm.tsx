import React, { useState, useEffect, memo } from "react";
import { View, Text, TouchableOpacity, Modal, FlatList } from "react-native";
import { styles } from "../../styles/styles";
import {
  createProfile,
  NetworkType,
  NetworkTypeEnum,
} from "../../util/app-config-store";
import { appConfig } from "../../util/app-config-store";
import ConfirmationModal from "../modal/ConfirmationModal";
import { FormInput } from "../common/FormInput";
import { SectionContainer } from "../common/SectionContainer";
import { ActionButton } from "../common/ActionButton";

interface CreateProfileFormProps {
  onComplete: () => void;
}

const CreateProfileForm = memo(({ onComplete }: CreateProfileFormProps) => {
  // Check if this is the first profile being created
  const isFirstProfile = Object.keys(appConfig.profiles.get()).length === 0;

  const [profileName, setProfileName] = useState(
    isFirstProfile ? "mainnet" : "",
  );
  const [networkName, setNetworkName] = useState("");
  const [networkType, setNetworkType] = useState<NetworkTypeEnum>(
    NetworkTypeEnum.MAINNET,
  );
  const [error, setError] = useState<string | null>(null);
  const [customNetwork, setCustomNetwork] = useState(false);
  const [showNetworkDropdown, setShowNetworkDropdown] = useState(false);

  // Modal states
  const [successModalVisible, setSuccessModalVisible] = useState(false);

  // Set the network name when network type changes
  useEffect(() => {
    if (networkType !== NetworkTypeEnum.CUSTOM) {
      setNetworkName(networkType);
    } else if (
      networkName === NetworkTypeEnum.MAINNET ||
      networkName === NetworkTypeEnum.TESTING ||
      networkName === NetworkTypeEnum.TESTNET
    ) {
      setNetworkName(""); // Clear the name if switching to custom from a pre-defined type
    }

    setCustomNetwork(networkType === NetworkTypeEnum.CUSTOM);
  }, [networkType]);

  const handleCreateProfile = () => {
    // Validate inputs
    if (!profileName.trim()) {
      setError("Profile name is required");
      return;
    }

    if (!networkName.trim() && networkType === NetworkTypeEnum.CUSTOM) {
      setError("Network name is required");
      return;
    }

    // Create network configuration
    const network: NetworkType = {
      network_name:
        networkType === NetworkTypeEnum.CUSTOM ? networkName : networkType,
      network_type: networkType,
    };

    // Create profile
    const success = createProfile(profileName, network);

    if (success) {
      setSuccessModalVisible(true);
    } else {
      setError(`Profile "${profileName}" already exists.`);
    }
  };

  const handleSuccess = () => {
    setSuccessModalVisible(false);
    setProfileName("");
    setNetworkName("");
    setNetworkType(NetworkTypeEnum.MAINNET);
    setError(null);
    onComplete();
  };

  // Custom dropdown selector component for network type
  const renderNetworkTypeItem = ({ item }: { item: NetworkTypeEnum }) => (
    <TouchableOpacity
      style={[
        styles.resultContainer,
        { marginVertical: 4, padding: 12 },
        networkType === item && { backgroundColor: "#2c3040" },
      ]}
      onPress={() => {
        setNetworkType(item);
        setShowNetworkDropdown(false);
      }}
      accessible={true}
      accessibilityRole="menuitem"
      accessibilityLabel={`Select ${item} network type`}
    >
      <Text style={styles.resultValue}>{item}</Text>
    </TouchableOpacity>
  );

  return (
    <SectionContainer title="Create New Profile">
      {error && <Text style={styles.errorText}>{error}</Text>}

      <FormInput
        label="Profile Name:"
        value={profileName}
        onChangeText={setProfileName}
        placeholder="Enter profile name"
      />

      <View style={styles.inputContainer}>
        <Text style={styles.label}>Network Type:</Text>
        <TouchableOpacity
          style={[styles.input, { paddingVertical: 12, paddingHorizontal: 10 }]}
          onPress={() => setShowNetworkDropdown(true)}
          accessible={true}
          accessibilityRole="button"
          accessibilityLabel="Select network type"
        >
          <Text style={{ color: styles.resultValue.color }}>{networkType}</Text>
        </TouchableOpacity>

        {/* Network Type Dropdown Modal */}
        <Modal
          visible={showNetworkDropdown}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setShowNetworkDropdown(false)}
          accessible={true}
          accessibilityViewIsModal={true}
          accessibilityLabel="Select network type"
        >
          <View style={styles.modalOverlay}>
            <View style={[styles.modalContent, { width: "80%" }]}>
              <Text style={styles.modalTitle}>Select Network Type</Text>
              <FlatList
                data={Object.values(NetworkTypeEnum)}
                renderItem={renderNetworkTypeItem}
                keyExtractor={(item) => item}
                style={{ maxHeight: 300 }}
                accessible={true}
                accessibilityRole="menu"
              />
              <ActionButton
                text="Close"
                onPress={() => setShowNetworkDropdown(false)}
                style={{ marginTop: 15 }}
                accessibilityLabel="Close network selection"
              />
            </View>
          </View>
        </Modal>
      </View>

      {customNetwork && (
        <FormInput
          label="Custom Network Name:"
          value={networkName}
          onChangeText={setNetworkName}
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
