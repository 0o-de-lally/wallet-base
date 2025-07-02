import React from "react";
import { View, Text } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { ActionButton } from "../common/ActionButton";
import { styles, colors } from "../../styles/styles";

interface AccountCreationSuccessProps {
  accountId: string;
  accountNickname: string;
  onContinue: () => void;
  onViewAccount: () => void;
}

export const AccountCreationSuccess: React.FC<AccountCreationSuccessProps> = ({
  accountId,
  accountNickname,
  onContinue,
  onViewAccount,
}) => {
  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <View style={styles.sectionContainer}>
          <Ionicons
            name="checkmark-circle"
            size={80}
            color={colors.success}
          />
        </View>

        <Text style={styles.title}>Account Created!</Text>

        <Text style={styles.description}>
          Your new account{accountNickname ? ` "${accountNickname}"` : ""} has been created successfully.
          Your recovery phrase has been encrypted and stored securely.
        </Text>

        <View style={styles.resultContainer}>
          <Text style={styles.label}>Account ID:</Text>
          <Text style={styles.description} numberOfLines={1} ellipsizeMode="middle">
            {accountId}
          </Text>
        </View>
      </View>

      <View style={styles.buttonContainer}>
        <ActionButton
          text="View Account"
          onPress={onViewAccount}
          variant="primary"
          style={{ marginBottom: 10 }}
        />

        <ActionButton
          text="Continue"
          onPress={onContinue}
          variant="secondary"
        />
      </View>
    </View>
  );
};
