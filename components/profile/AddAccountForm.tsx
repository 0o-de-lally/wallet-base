import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  Switch,
} from "react-native";
import { styles } from "../../styles/styles";
import { addAccountToProfile } from "../../util/app-config-store";
import type { AccountState } from "../../util/app-config-store";

interface AddAccountFormProps {
  profileName: string;
  onComplete: () => void;
}

const AddAccountForm = ({ profileName, onComplete }: AddAccountFormProps) => {
  const [accountAddress, setAccountAddress] = useState("");
  const [nickname, setNickname] = useState("");
  const [balanceLocked, setBalanceLocked] = useState("");
  const [balanceUnlocked, setBalanceUnlocked] = useState("");
  const [isKeyStored, setIsKeyStored] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAddAccount = () => {
    // Validate inputs
    if (!accountAddress.trim()) {
      setError("Account address is required");
      return;
    }

    // Create account state
    const account: AccountState = {
      account_address: accountAddress.trim(),
      nickname:
        nickname.trim() || accountAddress.trim().substring(0, 8) + "...",
      is_key_stored: isKeyStored,
      balance_locked: parseFloat(balanceLocked) || 0,
      balance_unlocked: parseFloat(balanceUnlocked) || 0,
      last_update: Date.now(),
    };

    // Add account to profile
    const success = addAccountToProfile(profileName, account);

    if (success) {
      Alert.alert("Success", `Account added to "${profileName}" successfully.`);
      // Reset form
      setAccountAddress("");
      setNickname("");
      setBalanceLocked("");
      setBalanceUnlocked("");
      setIsKeyStored(false);
      setError(null);
      onComplete();
    } else {
      setError(
        "Account already exists in this profile or profile doesn't exist.",
      );
    }
  };

  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Add Account to {profileName}</Text>

      {error && <Text style={styles.errorText}>{error}</Text>}

      <View style={styles.inputContainer}>
        <Text style={styles.label}>Account Address:</Text>
        <TextInput
          style={styles.input}
          value={accountAddress}
          onChangeText={setAccountAddress}
          placeholder="Enter account address"
          placeholderTextColor={styles.inputPlaceholder.color}
        />
      </View>

      <View style={styles.inputContainer}>
        <Text style={styles.label}>Nickname (optional):</Text>
        <TextInput
          style={styles.input}
          value={nickname}
          onChangeText={setNickname}
          placeholder="Enter a friendly name"
          placeholderTextColor={styles.inputPlaceholder.color}
        />
      </View>

      <View style={styles.inputContainer}>
        <Text style={styles.label}>Locked Balance:</Text>
        <TextInput
          style={styles.input}
          value={balanceLocked}
          onChangeText={setBalanceLocked}
          placeholder="Enter locked balance"
          placeholderTextColor={styles.inputPlaceholder.color}
          keyboardType="numeric"
        />
      </View>

      <View style={styles.inputContainer}>
        <Text style={styles.label}>Unlocked Balance:</Text>
        <TextInput
          style={styles.input}
          value={balanceUnlocked}
          onChangeText={setBalanceUnlocked}
          placeholder="Enter unlocked balance"
          placeholderTextColor={styles.inputPlaceholder.color}
          keyboardType="numeric"
        />
      </View>

      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 20,
        }}
      >
        <Text style={styles.label}>Has Stored Private Key:</Text>
        <Switch
          value={isKeyStored}
          onValueChange={setIsKeyStored}
          trackColor={{ false: "#444455", true: "#6BA5D9" }}
          thumbColor={isKeyStored ? "#94c2f3" : "#b3b8c3"}
        />
      </View>

      <TouchableOpacity style={styles.button} onPress={handleAddAccount}>
        <Text style={styles.buttonText}>Add Account</Text>
      </TouchableOpacity>
    </View>
  );
};

export default AddAccountForm;
