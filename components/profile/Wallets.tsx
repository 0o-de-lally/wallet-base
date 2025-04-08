import React, { useMemo } from "react";
import { View, Text, ScrollView } from "react-native";
import { styles } from "../../styles/styles";
import {
  appConfig,
  getProfileForAccount,
  setActiveAccount,
} from "../../util/app-config-store";
import { observer } from "@legendapp/state/react";
import AccountList from "./AccountList";
import { SectionContainer } from "../common/SectionContainer";
import { getNetworkDisplayName } from "../../util/libra-client";

/**
 * Wallets component that displays all profiles and their accounts
 */
const Wallets: React.FC = observer(() => {
  // Get all profiles and active account from global state
  const profiles = appConfig.profiles.get() || [];
  const activeAccountId = appConfig.activeAccountId.get();

  // Find which profile contains the active account
  const activeProfileName = useMemo(() => {
    if (!activeAccountId) return null;
    return getProfileForAccount(activeAccountId);
  }, [activeAccountId, profiles]);

  // Handler to set an account as active
  const handleSetActiveAccount = (accountId: string) => {
    setActiveAccount(accountId);
  };

  // Handle accounts updated for each profile
  const handleAccountsUpdated = (profileName: string) => () => {
    // No need to do anything since the observer will detect changes
    console.log(`Accounts updated for profile: ${profileName}`);
  };

  // Ensure profiles are properly initialized before rendering
  const safeProfiles = useMemo(() => {
    if (!profiles || !Array.isArray(profiles)) return [];
    return profiles.filter(profile => profile && typeof profile === 'object');
  }, [profiles]);

  return (
    <ScrollView
      style={styles.container}
      accessible={true}
      accessibilityLabel="Wallets view showing all accounts"
    >
      <Text style={styles.title}>My Wallets</Text>

      {(!safeProfiles || safeProfiles.length === 0) ? (
        <View style={styles.resultContainer}>
          <Text style={styles.resultValue}>
            No profiles exist yet. Go to Profile Management to create your first
            profile.
          </Text>
        </View>
      ) : (
        safeProfiles.map((profile) => (
          <SectionContainer
            key={profile.name}
            title={`${profile.name} ${activeProfileName === profile.name ? "(Active)" : ""}`}
          >
            <Text style={styles.networkInfo}>
              Network: {getNetworkDisplayName(profile)}
            </Text>

            <AccountList
              profileName={profile.name}
              accounts={profile.accounts}
              onAccountsUpdated={handleAccountsUpdated(profile.name)}
              activeAccountId={activeAccountId}
              onSetActiveAccount={handleSetActiveAccount}
            />
          </SectionContainer>
        ))
      )}
    </ScrollView>
  );
});

Wallets.displayName = "Wallets";

export default Wallets;
