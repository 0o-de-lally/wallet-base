import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  Modal,
  FlatList,
} from "react-native";
import { styles } from "../../styles/styles";
import {
  createProfile,
  NetworkType,
  NetworkTypeEnum,
} from "../../util/app-config-store";
import { appConfig } from "../../util/app-config-store";

interface CreateProfileFormProps {
  onComplete: () => void;
}

const CreateProfileForm = ({ onComplete }: CreateProfileFormProps) => {
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
      Alert.alert("Success", `Profile "${profileName}" created successfully.`);
      setProfileName("");
      setNetworkName("");
      setNetworkType(NetworkTypeEnum.MAINNET);
      setError(null);
      onComplete();
    } else {
      setError(`Profile "${profileName}" already exists.`);
    }
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
    >
      <Text style={styles.resultValue}>{item}</Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Create New Profile</Text>

      {error && <Text style={styles.errorText}>{error}</Text>}

      <View style={styles.inputContainer}>
        <Text style={styles.label}>Profile Name:</Text>
        <TextInput
          style={styles.input}
          value={profileName}
          onChangeText={setProfileName}
          placeholder="Enter profile name"
          placeholderTextColor={styles.inputPlaceholder.color}
        />
      </View>

      <View style={styles.inputContainer}>
        <Text style={styles.label}>Network Type:</Text>
        <TouchableOpacity
          style={[styles.input, { paddingVertical: 12, paddingHorizontal: 10 }]}
          onPress={() => setShowNetworkDropdown(true)}
        >
          <Text style={{ color: styles.resultValue.color }}>{networkType}</Text>
        </TouchableOpacity>

        {/* Network Type Dropdown Modal */}
        <Modal
          visible={showNetworkDropdown}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setShowNetworkDropdown(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={[styles.modalContent, { width: "80%" }]}>
              <Text style={styles.modalTitle}>Select Network Type</Text>
              <FlatList
                data={Object.values(NetworkTypeEnum)}
                renderItem={renderNetworkTypeItem}
                keyExtractor={(item) => item}
                style={{ maxHeight: 300 }}
              />
              <TouchableOpacity
                style={[styles.button, { marginTop: 15 }]}
                onPress={() => setShowNetworkDropdown(false)}
              >
                <Text style={styles.buttonText}>Close</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      </View>

      {customNetwork && (
        <View style={styles.inputContainer}>
          <Text style={styles.label}>Custom Network Name:</Text>
          <TextInput
            style={styles.input}
            value={networkName}
            onChangeText={setNetworkName}
            placeholder="Enter custom network name"
            placeholderTextColor={styles.inputPlaceholder.color}
          />
        </View>
      )}

      <TouchableOpacity style={styles.button} onPress={handleCreateProfile}>
        <Text style={styles.buttonText}>Create Profile</Text>
      </TouchableOpacity>
    </View>
  );
};

export default CreateProfileForm;
