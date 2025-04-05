import React, { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, Alert } from "react-native";
import { styles } from "../../styles/styles";
import { createProfile } from "../../util/app-config-store";
import type { NetworkType } from "../../util/app-config-store";

interface CreateProfileFormProps {
  onComplete: () => void;
}

const CreateProfileForm = ({ onComplete }: CreateProfileFormProps) => {
  const [profileName, setProfileName] = useState("");
  const [networkName, setNetworkName] = useState("");
  const [error, setError] = useState<string | null>(null);

  const handleCreateProfile = () => {
    // Validate inputs
    if (!profileName.trim()) {
      setError("Profile name is required");
      return;
    }

    if (!networkName.trim()) {
      setError("Network name is required");
      return;
    }

    // Create network configuration
    const network: NetworkType = {
      network_name: networkName,
    };

    // Create profile
    const success = createProfile(profileName, network);

    if (success) {
      Alert.alert("Success", `Profile "${profileName}" created successfully.`);
      setProfileName("");
      setNetworkName("");
      setError(null);
      onComplete();
    } else {
      setError(`Profile "${profileName}" already exists.`);
    }
  };

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
        <Text style={styles.label}>Network Name:</Text>
        <TextInput
          style={styles.input}
          value={networkName}
          onChangeText={setNetworkName}
          placeholder="Enter network name (e.g., Mainnet, Testnet)"
          placeholderTextColor={styles.inputPlaceholder.color}
        />
      </View>

      <TouchableOpacity style={styles.button} onPress={handleCreateProfile}>
        <Text style={styles.buttonText}>Create Profile</Text>
      </TouchableOpacity>
    </View>
  );
};

export default CreateProfileForm;
