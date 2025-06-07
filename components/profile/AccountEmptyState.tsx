import React, { memo } from "react";
import { View } from "react-native";
import { styles } from "../../styles/styles";
import { ActionButton } from "../common/ActionButton";
import AddAccountForm from "./AddAccountForm";

interface AccountEmptyStateProps {
  profileName: string;
  showAddForm: boolean;
  onToggleAddForm: () => void;
  onAccountAdded: () => void;
}

export const AccountEmptyState = memo(
  ({
    profileName,
    showAddForm,
    onToggleAddForm,
    onAccountAdded,
  }: AccountEmptyStateProps) => {
    return (
      <View style={styles.content}>
        <ActionButton
          text={showAddForm ? "Cancel" : "Add Account"}
          onPress={onToggleAddForm}
          accessibilityLabel={
            showAddForm ? "Cancel adding account" : "Add a new account"
          }
        />
        {showAddForm && (
          <AddAccountForm
            profileName={profileName}
            onComplete={onAccountAdded}
          />
        )}
      </View>
    );
  },
);

AccountEmptyState.displayName = "AccountEmptyState";

// PropTypes section removed - TypeScript interfaces provide type checking
// and PropTypes are redundant when using TypeScript correctly
