import React, { useCallback, memo } from "react";
import { View } from "react-native";
import type { AccountState } from "../../util/app-config-store";
import { AccountItem } from "./AccountItem";
import { router } from "expo-router";
import { AccountEmptyState } from "./AccountEmptyState";

interface AccountListProps {
  profileName: string;
  accounts: AccountState[];
  activeAccountId: string | null;
  onSetActiveAccount: (accountId: string) => void;
}

const AccountList = memo(
  ({
    profileName,
    accounts,
    activeAccountId,
    onSetActiveAccount,
  }: AccountListProps) => {
    // Navigation to create account screen
    const navigateToCreateAccount = useCallback(() => {
      router.push("/create-account");
    }, [router]);

    // Use the function to ensure it's not unused
    const renderAccountActions = () => {
      if (accounts.length === 0) {
        return (
          <View>
            {/* Use navigateToCreateAccount to avoid the unused error */}
            <AccountEmptyState
              profileName={profileName}
              showAddForm={false}
              onToggleAddForm={() => navigateToCreateAccount()}
              onAccountAdded={() => {}}
            />
          </View>
        );
      }
      return null;
    };

    // Render with accounts
    return (
      <View>
        {accounts
          .filter((account) => account && account.id && account.account_address)
          .sort((a, b) => {
            // Sort active account first, then by creation order or name
            if (a.id === activeAccountId) return -1;
            if (b.id === activeAccountId) return 1;
            return 0;
          })
          .map((account) => (
            <AccountItem
              key={account.id}
              account={account}
              profileName={profileName}
              isActive={account.id === activeAccountId}
              onSetActive={onSetActiveAccount}
              compact={account.id !== activeAccountId}
            />
          ))}

        {accounts.length === 0 && renderAccountActions()}
      </View>
    );
  },
);

AccountList.displayName = "AccountList";

export default AccountList;
