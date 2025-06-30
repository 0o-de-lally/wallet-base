import React, { useState, useCallback } from "react";
import { View, Text, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { observer } from "@legendapp/state/react";
import { useRouter } from "expo-router";
import { styles } from "../../styles/styles";
import { SectionContainer } from "../common/SectionContainer";
import { ActionButton } from "../common/ActionButton";
import { appConfig, getProfileForAccount } from "../../util/app-config-store";
import { hasMultipleProfiles } from "../../util/user-state";
import Dropdown from "../common/Dropdown";
import { useModal } from "../../context/ModalContext";
import {
  getLibraClientConfig,
  isLibraClientInitialized,
} from "../../util/libra-client";

interface SettingsProps {
  onProfileChange?: () => void;
}

export const Settings: React.FC<SettingsProps> = observer(({ onProfileChange }) => {
  const router = useRouter();
  const [showProfileSwitcher, setShowProfileSwitcher] = useState(false);
  const { showAlert } = useModal();

  // Get current app state
  const profiles = appConfig.profiles.get();
  const activeAccountId = appConfig.activeAccountId.get();

  // Get current profile info
  const currentProfileName = activeAccountId
    ? getProfileForAccount(activeAccountId)
    : null;
  const currentProfile = currentProfileName
    ? profiles[currentProfileName]
    : null;
  const profileNames = Object.keys(profiles);
  const hasMultipleProfilesAvailable = hasMultipleProfiles();

  const navigateToScreen = useCallback(
    (screen: string) => {
      router.navigate(
        screen as
          | `/profiles`
          | `/create-account`
          | `/recover-account`
          | `/pin`
          | `/libra-test`,
      );
    },
    [router],
  );

  const handleProfileSwitch = useCallback(
    (profileName: string) => {
      if (profileName === currentProfileName) return;

      const targetProfile = profiles[profileName];
      if (targetProfile && targetProfile.accounts.length > 0) {
        // Set the first account in the target profile as active
        appConfig.activeAccountId.set(targetProfile.accounts[0].id);
        setShowProfileSwitcher(false);
        onProfileChange?.();
      }
    },
    [currentProfileName, profiles, onProfileChange],
  );

  const toggleProfileSwitcher = useCallback(() => {
    setShowProfileSwitcher((prev) => !prev);
  }, []);

  return (
    <SafeAreaView style={styles.safeAreaView} edges={["top", "left", "right"]}>
      <ScrollView
        style={styles.containerWithHeader}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Current Profile & Account Info */}
        {currentProfile && (
          <SectionContainer title="Active Profile">
            <View style={styles.resultContainer}>
              <Text style={styles.resultLabel}>
                Profile: {currentProfile.name}
              </Text>
              <Text style={styles.resultValue}>
                Network: {currentProfile.network.network_name} (
                {currentProfile.network.network_type})
              </Text>
              <Text style={styles.resultValue}>
                {currentProfile.accounts.length} account(s)
              </Text>
            </View>

            {hasMultipleProfilesAvailable && (
              <ActionButton
                text={
                  showProfileSwitcher
                    ? "Cancel Profile Switch"
                    : "Switch Profile"
                }
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
            text="Manage Profiles"
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
            text="Change PIN"
            onPress={() => navigateToScreen("/pin")}
            accessibilityLabel="Change your transaction PIN"
          />
        </SectionContainer>

        {/* Developer Options */}
        <SectionContainer title="Developer Options">
          <ActionButton
            text="Test Libra SDK"
            onPress={() => navigateToScreen("/libra-test")}
            style={{ marginTop: 0 }}
            accessibilityLabel="Test Libra SDK integration"
          />
          <ActionButton
            text="Show LibraClient Config"
            onPress={() => {
              if (isLibraClientInitialized()) {
                const config = getLibraClientConfig();
                showAlert(
                  "LibraClient Configuration",
                  `Network: ${config.network}\nURL: ${config.url}\nStatus: Initialized`,
                );
              } else {
                showAlert(
                  "LibraClient Configuration",
                  "Status: Not initialized\nNote: Will be auto-initialized on first use",
                );
              }
            }}
            style={{ marginTop: 10 }}
            accessibilityLabel="Show current LibraClient configuration"
          />
        </SectionContainer>
      </ScrollView>
    </SafeAreaView>
  );
});

Settings.displayName = "Settings";
