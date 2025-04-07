import React, { useState, forwardRef, useImperativeHandle } from "react";
import { Text } from "react-native";
import { styles } from "../../styles/styles";
import { addAccountToProfile } from "../../util/app-config-store";
import type { AccountState } from "../../util/app-config-store";
import ConfirmationModal from "../modal/ConfirmationModal";
import { FormInput } from "../common/FormInput";
import { SectionContainer } from "../common/SectionContainer";
import { ActionButton } from "../common/ActionButton";
import { getRandomBytesAsync } from "expo-crypto";
import { uint8ArrayToBase64 } from "../../util/crypto";

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
    const [error, setError] = useState<string | null>(null);

    // State for modals
    const [successModalVisible, setSuccessModalVisible] = useState(false);

    useImperativeHandle(
      ref,
      () => ({
        resetForm: () => {
          setAccountAddress("");
          setNickname("");
          setError(null);
        },
      }),
      [],
    );

    const handleAddAccount = async () => {
      // Validate inputs
      if (!accountAddress.trim()) {
        setError("Account address is required");
        return;
      }

      try {
        // Generate a random ID for the account using crypto secure random
        const randomBytes = await getRandomBytesAsync(16); // 16 bytes = 128 bits
        const accountId = uint8ArrayToBase64(randomBytes).replace(/[/+=]/g, ''); // Create URL-safe ID

        // Create account state
        const account: AccountState = {
          id: accountId, // Add generated ID to account
          account_address: accountAddress.trim(),
          nickname:
            nickname.trim() || accountAddress.trim().substring(0, 8) + "...",
          is_key_stored: false,
          balance_locked: 0,
          balance_unlocked: 0,
          last_update: Date.now(),
        };

        // Add account to profile
        const success = addAccountToProfile(profileName, account);

        if (success) {
          setSuccessModalVisible(true);
        } else {
          setError(
            "Account already exists in this profile or profile doesn't exist."
          );
        }
      } catch (error) {
        console.error("Failed to generate account ID:", error);
        setError("Failed to create account. Please try again.");
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
