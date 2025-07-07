import React, { useCallback, memo, useState, useRef } from "react";
import { View, Text, Animated, ActivityIndicator } from "react-native";
import { namedColors } from "../../styles/styles";
import type { AccountState } from "../../util/app-config-store";
import { AccountItem } from "./AccountItem";
import { router } from "expo-router";
import { AccountEmptyState } from "./AccountEmptyState";
import { styles } from "../../styles/styles";
import { shortenAddress } from "../../util/format-utils";

interface AccountListProps {
  profileName: string;
  accounts: AccountState[];
  activeAccountId: string | null;
  onSetActiveAccount?: (accountId: string) => void;
}

const AccountList = memo(
  ({
    profileName,
    accounts,
    activeAccountId,
    onSetActiveAccount,
  }: AccountListProps) => {
    const [switchingToAccountId, setSwitchingToAccountId] = useState<
      string | null
    >(null);
    const fadeAnim = useRef(new Animated.Value(0)).current;
    // Navigation to create account screen
    const navigateToCreateAccount = useCallback(() => {
      router.push("/create-account");
    }, []);

    // Enhanced account switching with feedback
    const handleSetActiveAccount = useCallback(
      (accountId: string) => {
        if (!onSetActiveAccount) return;

        // Set switching state and animate in
        setSwitchingToAccountId(accountId);
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300, // Slightly longer fade in
          useNativeDriver: true,
        }).start();

        // Keep the feedback visible for longer (2 seconds total)
        setTimeout(() => {
          // Animate out
          Animated.timing(fadeAnim, {
            toValue: 0,
            duration: 300, // Slightly longer fade out
            useNativeDriver: true,
          }).start(() => {
            onSetActiveAccount(accountId);
            setSwitchingToAccountId(null);
          });
        }, 1400); // Show feedback for 1.4 seconds + 0.3s fade in + 0.3s fade out = 2 seconds total
      },
      [onSetActiveAccount, fadeAnim],
    );

    // Get the account being switched to for display purposes
    const switchingToAccount = switchingToAccountId
      ? accounts.find((acc) => acc.id === switchingToAccountId)
      : null;

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
        {switchingToAccount && (
          <Animated.View
            style={[
              styles.switchingContainer,
              {
                opacity: fadeAnim,
                transform: [
                  {
                    translateY: fadeAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [-10, 0],
                    }),
                  },
                ],
              },
            ]}
          >
            <ActivityIndicator
              size="small"
              color={namedColors.blue}
              style={styles.switchingActivityIndicator}
            />
            <Text style={[styles.resultValue, styles.switchingText]}>
              Switching to{" "}
              {switchingToAccount.nickname ||
                shortenAddress(switchingToAccount.account_address, 4, 4)}
            </Text>
          </Animated.View>
        )}
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
              accountId={account.id}
              profileName={profileName}
              isActive={account.id === activeAccountId}
              onSetActive={handleSetActiveAccount}
              compact={account.id !== activeAccountId}
              isSwitching={account.id === switchingToAccountId}
            />
          ))}

        {accounts.length === 0 && renderAccountActions()}
      </View>
    );
  },
);

AccountList.displayName = "AccountList";

export default AccountList;
