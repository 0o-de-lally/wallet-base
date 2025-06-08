
import React, { useState, useCallback } from "react";
import { View, Text, ScrollView } from "react-native";
import { observer } from "@legendapp/state/react";
import { useRouter } from "expo-router";
import { styles } from "../../styles/styles";
import { SectionContainer } from "../common/SectionContainer";
import { ActionButton } from "../common/ActionButton";
import { appConfig, getProfileForAccount } from "../../util/app-config-store";
import { hasMultipleProfiles } from "../../util/user-state";
import Dropdown from "../common/Dropdown";
import { resetAppToFirstTimeUser, logAppState } from "../../util/dev-utils";
import { useModal } from "../../context/ModalContext";

interface MenuProps {
  onProfileChange?: () => void;
}

/**
 * Main navigation menu for the wallet app
 * Shows when the user has completed onboarding
 */
export const Menu: React.FC<MenuProps> = observer(({ onProfileChange }) => {
  const router = useRouter();
  const [showProfileSwitcher, setShowProfileSwitcher] = useState(false);
  const { showAlert, showConfirmation } = useModal();

  // Get current app state
  const profiles = appConfig.profiles.get();
  const activeAccountId = appConfig.activeAccountId.get();

  // Get current profile info
  const currentProfileName = activeAccountId ? getProfileForAccount(activeAccountId) : null;
  const currentProfile = currentProfileName ? profiles[currentProfileName] : null;
  const profileNames = Object.keys(profiles);
  const hasMultipleProfilesAvailable = hasMultipleProfiles();

  const navigateToScreen = useCallback((screen: string) => {
    router.navigate(screen as any);
  }, [router]);

  const handleProfileSwitch = useCallback((profileName: string) => {
    if (profileName === currentProfileName) return;

    const targetProfile = profiles[profileName];
    if (targetProfile && targetProfile.accounts.length > 0) {
      // Set the first account in the target profile as active
      appConfig.activeAccountId.set(targetProfile.accounts[0].id);
      setShowProfileSwitcher(false);
      onProfileChange?.();
    }
  }, [currentProfileName, profiles, onProfileChange]);

  const toggleProfileSwitcher = useCallback(() => {
    setShowProfileSwitcher(prev => !prev);
  }, []);

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.scrollContent}
    >
      <Text style={styles.title}>Wallet Menu</Text>

      {/* Current Profile & Account Info */}
      {currentProfile && (
        <SectionContainer title="Active Profile">
          <View style={styles.resultContainer}>
            <Text style={styles.resultLabel}>Profile: {currentProfile.name}</Text>
            <Text style={styles.resultValue}>
              Network: {currentProfile.network.network_name} ({currentProfile.network.network_type})
            </Text>
            <Text style={styles.resultValue}>
              {currentProfile.accounts.length} account(s)
            </Text>
          </View>

          {hasMultipleProfilesAvailable && (
            <ActionButton
              text={showProfileSwitcher ? "Cancel Profile Switch" : "Switch Profile"}
              onPress={toggleProfileSwitcher}
              size="small"
              style={{ marginTop: 10 }}
              accessibilityLabel="Toggle profile switcher"
            />
          )}

          {showProfileSwitcher && (
            <View style={{ marginTop: 10 }}>
              <Dropdown
                label="Switch to Profile"
                value={currentProfileName || ""}
                options={profileNames}
                onSelect={handleProfileSwitch}
                placeholder="Select a profile"
              />
            </View>
          )}
        </SectionContainer>
      )}

      {/* Account Management */}
      <SectionContainer title="Account Management">
        <ActionButton
          text="View Accounts"
          onPress={() => navigateToScreen("/profiles")}
          accessibilityLabel="View and manage accounts"
        />
        <ActionButton
          text="Add Account"
          onPress={() => navigateToScreen("/create-account")}
          style={{ marginTop: 10 }}
          accessibilityLabel="Add a new account"
        />
        <ActionButton
          text="Recover Account"
          onPress={() => navigateToScreen("/recover-account")}
          style={{ marginTop: 10 }}
          accessibilityLabel="Recover an existing account"
        />
      </SectionContainer>

      {/* Security */}
      <SectionContainer title="Security">
        <ActionButton
          text="PIN Management"
          onPress={() => navigateToScreen("/pin")}
          accessibilityLabel="Manage your PIN"
        />
      </SectionContainer>

      {/* Developer Tools */}
      <SectionContainer title="Developer Tools">
        <ActionButton
          text="Libra SDK Test"
          onPress={() => navigateToScreen("/libra-test")}
          accessibilityLabel="Test Libra SDK functionality"
        />
        <ActionButton
          text="Reset App State"
          onPress={() => {
            showConfirmation(
              "Reset App State",
              "This will clear all profiles, accounts, and PIN data. Are you sure?",
              () => {
                resetAppToFirstTimeUser();
                showAlert("Success", "App state has been reset. You'll see the onboarding wizard on next refresh.");
              },
              "Reset",
              true
            );
          }}
          style={{ marginTop: 10 }}
          accessibilityLabel="Reset app to first-time user state"
        />
        <ActionButton
          text="Log App State"
          onPress={() => {
            logAppState();
            showAlert("Debug", "App state has been logged to console. Check your development tools.");
          }}
          style={{ marginTop: 10 }}
          accessibilityLabel="Log current app state to console"
        />
      </SectionContainer>

      {/* Info Section */}
      <SectionContainer title="Info">
        <View style={styles.resultContainer}>
          <Text style={styles.resultValue}>
            Total Profiles: {profileNames.length}
          </Text>
          <Text style={styles.resultValue}>
            Total Accounts: {Object.values(profiles).reduce((sum, profile) => sum + profile.accounts.length, 0)}
          </Text>
        </View>
      </SectionContainer>
    </ScrollView>
  );
});

Menu.displayName = "Menu";
