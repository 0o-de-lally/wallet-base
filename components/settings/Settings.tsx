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

export const Settings: React.FC<SettingsProps> = observer(
  ({ onProfileChange }) => {
    const router = useRouter();
    const [showProfileSwitcher, setShowProfileSwitcher] = useState(false);
    const { showAlert, showConfirmation } = useModal();

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
    const availableProfileNames = profileNames.filter(
      (name) => profiles[name].accounts && profiles[name].accounts.length > 0,
    );
    const hasMultipleProfilesAvailable = hasMultipleProfiles();

    const navigateToScreen = useCallback(
      (screen: string) => {
        router.navigate(
          screen as
            | `/profiles`
            | `/create-account`
            | `/recover-account`
            | `/pin`,
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
      <SafeAreaView
        style={styles.safeAreaView}
        edges={["top", "left", "right"]}
      >
        <ScrollView
          style={styles.containerWithHeader}
          contentContainerStyle={styles.scrollContent}
        >
          {/* Account Management */}
          <SectionContainer title="Account Management" style={styles.listItem}>
            {/* Active Profile Info moved here */}
            {currentProfile && (
              <View style={styles.listItem}>
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
                {hasMultipleProfilesAvailable &&
                  availableProfileNames.length > 1 && (
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
                      options={availableProfileNames}
                      onSelect={handleProfileSwitch}
                      placeholder="Select a profile"
                    />
                  </View>
                )}
              </View>
            )}
            <ActionButton
              text="Add Signing Account"
              onPress={() => navigateToScreen("/recover-account")}
              style={{ marginTop: 10 }}
              accessibilityLabel="Recover an existing account"
            />
            <ActionButton
              text="Add View-Only Account"
              onPress={() => navigateToScreen("/create-account")}
              style={{ marginTop: 10 }}
              accessibilityLabel="Add a new view-only account"
            />
            <ActionButton
              text="Manage Profiles"
              onPress={() => navigateToScreen("/profiles")}
              accessibilityLabel="View and manage accounts"
            />

          </SectionContainer>

          {/* Security */}
          <SectionContainer title="Security" style={styles.listItem}>
            <ActionButton
              text="Change PIN"
              onPress={() => navigateToScreen("/pin")}
              accessibilityLabel="Change your transaction PIN"
            />
          </SectionContainer>

          {/* Developer Options */}
          <SectionContainer title="Developer Options" style={styles.listItem}>
            <ActionButton
              text="Client Config"
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
            <ActionButton
              text="View Debug Logs"
              onPress={() => navigateToScreen("/error-logs")}
              style={{ marginTop: 10 }}
              accessibilityLabel="View debug and error logs"
            />
          </SectionContainer>

          {/* Danger Zone */}
          <SectionContainer title="Danger Zone" style={styles.listItem}>
            <ActionButton
              text="Clear All App Data"
              onPress={() => {
                showConfirmation(
                  "Reset App Data?",
                  "This will permanently delete all profiles, accounts, and PINs. This action cannot be undone.",
                  async () => {
                    try {
                      const { resetAppToFirstTimeUser } = await import(
                        "../../util/dev-utils"
                      );
                      await resetAppToFirstTimeUser();
                      showAlert(
                        "Data Cleared",
                        "All app data has been reset. You can now start fresh.",
                      );
                    } catch {
                      showAlert(
                        "Reset Failed",
                        "Failed to reset app data. Please try again.",
                      );
                    }
                  },
                  "Reset Everything",
                  true,
                );
              }}
              style={{ marginTop: 0 }}
              accessibilityLabel="Clear all app data and reset to first-time user state"
              isDestructive={true}
            />
          </SectionContainer>
        </ScrollView>
      </SafeAreaView>
    );
  },
);

Settings.displayName = "Settings";
