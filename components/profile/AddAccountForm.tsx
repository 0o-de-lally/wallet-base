import React, { useState, forwardRef, useImperativeHandle } from "react";
import { View, Text, Switch } from "react-native";
import { styles } from "../../styles/styles";
import { addAccountToProfile } from "../../util/app-config-store";
import type { AccountState } from "../../util/app-config-store";
import ConfirmationModal from "../modal/ConfirmationModal";
import { FormInput } from "../common/FormInput";
import { SectionContainer } from "../common/SectionContainer";
import { ActionButton } from "../common/ActionButton";

interface AddAccountFormProps {
  profileName: string;
  onComplete: () => void;
}

export interface AddAccountFormRef {
  resetForm: () => void;
}

const AddAccountForm = forwardRef<AddAccountFormRef, AddAccountFormProps>(
  ({ profileName, onComplete }, ref) => {
    const [accountAddress, setAccountAddress] = useState("");
    const [nickname, setNickname] = useState("");
    const [balanceLocked, setBalanceLocked] = useState("");
    const [balanceUnlocked, setBalanceUnlocked] = useState("");
    const [isKeyStored, setIsKeyStored] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // State for modals
    const [successModalVisible, setSuccessModalVisible] = useState(false);

    useImperativeHandle(
      ref,
      () => ({
        resetForm: () => {
          setAccountAddress("");
          setNickname("");
          setBalanceLocked("");
          setBalanceUnlocked("");
          setIsKeyStored(false);
          setError(null);
        },
      }),
      [],
    );

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
        setSuccessModalVisible(true);
      } else {
        setError(
          "Account already exists in this profile or profile doesn't exist.",
        );
      }
    };

    const handleSuccess = () => {
      setSuccessModalVisible(false);
      onComplete();
    };

    return (
      <SectionContainer title={`Add Account to ${profileName}`}>
        {error && <Text style={styles.errorText}>{error}</Text>}

        <FormInput
          label="Account Address:"
          value={accountAddress}
          onChangeText={setAccountAddress}
          placeholder="Enter account address"
        />

        <FormInput
          label="Nickname (optional):"
          value={nickname}
          onChangeText={setNickname}
          placeholder="Enter a friendly name"
        />

        <FormInput
          label="Locked Balance:"
          value={balanceLocked}
          onChangeText={setBalanceLocked}
          placeholder="Enter locked balance"
          keyboardType="numeric"
        />

        <FormInput
          label="Unlocked Balance:"
          value={balanceUnlocked}
          onChangeText={setBalanceUnlocked}
          placeholder="Enter unlocked balance"
          keyboardType="numeric"
        />

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
            accessible={true}
            accessibilityRole="switch"
            accessibilityLabel="Has stored private key"
            accessibilityState={{ checked: isKeyStored }}
          />
        </View>

        <ActionButton
          text="Add Account"
          onPress={handleAddAccount}
          accessibilityLabel="Add account"
          accessibilityHint={`Adds a new account to the ${profileName} profile`}
        />

        {/* Success Modal */}
        <ConfirmationModal
          visible={successModalVisible}
          title="Success"
          message={`Account added to "${profileName}" successfully.`}
          confirmText="OK"
          onConfirm={handleSuccess}
          onCancel={handleSuccess}
        />
      </SectionContainer>
    );
  },
);

AddAccountForm.displayName = "AddAccountForm";

export default AddAccountForm;
