import React, { useState } from "react";
import { View, Text, ScrollView, TouchableOpacity } from "react-native";
import { observer } from "@legendapp/state/react";
import { styles } from "../../styles/styles";
import { appConfig } from "../../util/app-config-store";
import ProfileList from "./ProfileList";
import CreateProfileForm from "./CreateProfileForm";
import AccountList from "./AccountList";
import AddAccountForm from "./AddAccountForm";
import ConfirmationModal from "../modal/ConfirmationModal";

const ProfileManagement = observer(() => {
  const [selectedProfileName, setSelectedProfileName] = useState<string | null>(
    null,
  );
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showAddAccountForm, setShowAddAccountForm] = useState(false);
  const [deleteAllModalVisible, setDeleteAllModalVisible] = useState(false);

  // Get all profiles from the store
  const profiles = appConfig.profiles.get();
  const activeProfileName = appConfig.activeProfile.get();

  // Get the currently selected profile, or the active profile if none selected
  const selectedProfile = selectedProfileName
    ? profiles[selectedProfileName]
    : activeProfileName
      ? profiles[activeProfileName]
      : null;

  const handleSelectProfile = (profileName: string) => {
    setSelectedProfileName(profileName);
    setShowCreateForm(false);
    setShowAddAccountForm(false);
  };

  const handleDeleteAllProfiles = () => {
    setDeleteAllModalVisible(true);
  };

  const confirmDeleteAllProfiles = () => {
    appConfig.profiles.set({});
    appConfig.activeProfile.set(null);
    setSelectedProfileName(null);
    setDeleteAllModalVisible(false);
  };

  const toggleCreateForm = () => {
    setShowCreateForm(!showCreateForm);
    setShowAddAccountForm(false);
  };

  const toggleAddAccountForm = () => {
    setShowAddAccountForm(!showAddAccountForm);
    setShowCreateForm(false);
  };

  // Add this new function to handle account updates
  const handleAccountsUpdated = () => {
    // Force a UI refresh by updating the selected profile
    if (selectedProfileName) {
      // This will trigger a re-render with the updated accounts
      setSelectedProfileName(selectedProfileName);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Profile Management</Text>

      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={[
            styles.button,
            showCreateForm && { backgroundColor: "#6BA5D9" },
          ]}
          onPress={toggleCreateForm}
        >
          <Text style={styles.buttonText}>
            {showCreateForm ? "Cancel" : "Create Profile"}
          </Text>
        </TouchableOpacity>

        {selectedProfile && (
          <TouchableOpacity
            style={[
              styles.button,
              showAddAccountForm && { backgroundColor: "#6BA5D9" },
            ]}
            onPress={toggleAddAccountForm}
          >
            <Text style={styles.buttonText}>
              {showAddAccountForm ? "Cancel" : "Add Account"}
            </Text>
          </TouchableOpacity>
        )}
      </View>

      {showCreateForm && (
        <CreateProfileForm onComplete={() => setShowCreateForm(false)} />
      )}

      {showAddAccountForm && selectedProfileName && (
        <AddAccountForm
          profileName={selectedProfileName}
          onComplete={() => setShowAddAccountForm(false)}
        />
      )}

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Your Profiles</Text>
        <ProfileList
          profiles={profiles}
          activeProfileName={activeProfileName}
          selectedProfileName={selectedProfileName}
          onSelectProfile={handleSelectProfile}
        />
      </View>

      {selectedProfile && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            {selectedProfile.name}&apos;s Accounts
          </Text>
          <AccountList
            profileName={selectedProfile.name}
            accounts={selectedProfile.accounts}
            onAccountsUpdated={handleAccountsUpdated}
          />
        </View>
      )}

      {!selectedProfile && Object.keys(profiles).length === 0 && (
        <View style={styles.resultContainer}>
          <Text style={styles.resultValue}>
            No profiles exist yet. Create your first profile to get started.
          </Text>
          <Text style={[styles.resultValue]}>
            Your first profile will default to &quot;mainnet&quot; with the
            Mainnet network type.
          </Text>
        </View>
      )}

      {Object.keys(profiles).length > 0 && (
        <View style={styles.dangerZone}>
          <Text style={styles.dangerTitle}>Danger Zone</Text>
          <TouchableOpacity
            style={[styles.button, styles.dangerButton]}
            onPress={handleDeleteAllProfiles}
          >
            <Text style={styles.dangerButtonText}>Delete All Profiles</Text>
          </TouchableOpacity>
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

export default ProfileManagement;
