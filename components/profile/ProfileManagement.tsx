import React, { useState, useCallback, useMemo } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  GestureResponderEvent,
} from "react-native";
import { observer } from "@legendapp/state/react";
import { styles } from "../../styles/styles";
import {
  appConfig,
  getProfileForAccount,
  setActiveAccount,
} from "../../util/app-config-store";
import CreateProfileForm from "./CreateProfileForm";
import AccountList from "./AccountList";
import ConfirmationModal from "../modal/ConfirmationModal";
import { SectionContainer } from "../common/SectionContainer";
import { ActionButton } from "../common/ActionButton";

const ProfileManagement: React.FC = observer(() => {
  const [selectedProfileName, setSelectedProfileName] = useState<string | null>(
    null,
  );
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [deleteAllModalVisible, setDeleteAllModalVisible] = useState(false);
  const [expandedProfile, setExpandedProfile] = useState<string | null>(null);

  // Get all profiles from the store
  const profiles = appConfig.profiles.get();
  const activeAccountId = appConfig.activeAccountId.get();

  // Find which profile contains the active account
  const activeProfileName = useMemo(() => {
    if (!activeAccountId) return null;

    return getProfileForAccount(activeAccountId);
  }, [activeAccountId, profiles]);

  // Get the currently selected profile, or the active profile if none selected
  const selectedProfile = selectedProfileName
    ? profiles[selectedProfileName]
    : activeProfileName
      ? profiles[activeProfileName]
      : null;

  const handleSelectProfile = useCallback((profileName: string) => {
    // Set the selected profile name first
    setSelectedProfileName(profileName);

    // Toggle the expanded state of the selected profile
    setExpandedProfile((prevProfile) =>
      prevProfile === profileName ? null : profileName,
    );
    setShowCreateForm(false);
  }, []);

  const handleSetActiveAccount = useCallback(
    (accountId: string, event?: GestureResponderEvent) => {
      // Prevent event propagation to avoid triggering profile selection
      if (event) {
        event.stopPropagation();
      }

      // Set the active account
      setActiveAccount(accountId);
    },
    [],
  );

  const handleDeleteAllProfiles = useCallback(() => {
    setDeleteAllModalVisible(true);
  }, []);

  const confirmDeleteAllProfiles = useCallback(() => {
    appConfig.profiles.set({});
    appConfig.activeAccountId.set(null);
    setSelectedProfileName(null);
    setDeleteAllModalVisible(false);
  }, []);

  const toggleCreateForm = useCallback(() => {
    setShowCreateForm((prev) => !prev);
  }, []);

  const handleAccountsUpdated = useCallback(() => {
    // No need to force re-render since this component is now an observer
    // The component will automatically re-render when appConfig state changes
  }, []);

  const renderProfileSections = useCallback(() => {
    return Object.entries(profiles).map(([profileName, profile]) => (
      <View key={profileName}>
        <TouchableOpacity
          style={[
            styles.profileItem,
            activeProfileName === profileName && styles.accountItemActive,
            selectedProfileName === profileName && styles.profileItemSelected,
          ]}
          onPress={() => handleSelectProfile(profileName)}
          activeOpacity={0.7}
          accessible={true}
          accessibilityRole="button"
          accessibilityLabel={`${profileName} profile ${activeProfileName === profileName ? "(contains active account)" : ""}`}
          accessibilityState={{ expanded: expandedProfile === profileName }}
        >
          <View style={styles.profileContentRow}>
            <View style={styles.profileTitleContainer}>
              <Text style={styles.profileName}>{profileName}</Text>
              {activeProfileName === profileName && (
                <View style={styles.activeProfileBadge}>
                  <Text style={styles.activeProfileBadgeText}>
                    Contains Active Account
                  </Text>
                </View>
              )}
            </View>

            <Text style={styles.profileAccountCountText}>
              {profile.accounts.length} account(s)
              {expandedProfile === profileName ? " ▲" : " ▼"}
            </Text>
          </View>

          <Text style={styles.profileNetworkText}>
            Network: {profile.network.network_name} (
            {profile.network.network_type})
          </Text>
        </TouchableOpacity>

        {expandedProfile === profileName && (
          <SectionContainer>
            <AccountList
              profileName={profileName}
              accounts={profile.accounts}
              activeAccountId={activeAccountId}
              onSetActiveAccount={handleSetActiveAccount}
            />
          </SectionContainer>
        )}
      </View>
    ));
  }, [
    profiles,
    activeProfileName,
    activeAccountId,
    selectedProfileName,
    expandedProfile,
    handleSelectProfile,
    handleSetActiveAccount,
    handleAccountsUpdated,
  ]);

  const renderEmptyState = useCallback(() => {
    if (selectedProfile || Object.keys(profiles).length > 0) return null;

    return (
      <View
        style={styles.resultContainer}
        accessible={true}
        accessibilityLabel="No profiles exist yet"
      >
        <Text style={styles.resultValue}>
          No profiles exist yet. Create your first profile to get started.
        </Text>
        <Text style={[styles.resultValue]}>
          Your first profile will default to &quot;mainnet&quot; with the
          Mainnet network type.
        </Text>
      </View>
    );
  }, [selectedProfile, profiles]);

  return (
    <ScrollView
      style={styles.container}
      accessible={true}
      accessibilityLabel="Profile management screen"
    >
      <Text style={styles.title}>Profile Management</Text>

      {/* Move the Create Profile button to the top and center it */}
      <View style={styles.container}>
        <ActionButton
          text={showCreateForm ? "Cancel" : "Create Profile"}
          onPress={toggleCreateForm}
          style={[styles.button, showCreateForm ? styles.disabledButton : {}]}
          accessibilityLabel={
            showCreateForm ? "Cancel creating profile" : "Create a new profile"
          }
        />
      </View>

      {showCreateForm && (
        <CreateProfileForm onComplete={() => setShowCreateForm(false)} />
      )}

      <SectionContainer title="Wallet Profiles">
        {renderProfileSections()}
      </SectionContainer>

      {renderEmptyState()}

      {Object.keys(profiles).length > 0 && (
        <View style={styles.dangerZone}>
          <Text style={styles.dangerTitle}>Danger Zone</Text>
          <ActionButton
            text="Delete All Profiles"
            onPress={handleDeleteAllProfiles}
            isDestructive={true}
            accessibilityLabel="Delete all profiles"
            accessibilityHint="This will remove all profiles and cannot be undone"
          />
        </View>
      )}

      {/* Delete All Profiles Confirmation Modal */}
      <ConfirmationModal
        visible={deleteAllModalVisible}
        title="Delete All Profiles"
        message="This action will delete all profiles and cannot be undone. Continue?"
        confirmText="Delete All"
        onConfirm={confirmDeleteAllProfiles}
        onCancel={() => setDeleteAllModalVisible(false)}
        isDestructive={true}
      />
    </ScrollView>
  );
});

ProfileManagement.displayName = "ProfileManagement";

export default ProfileManagement;
