import React, { useState } from "react";
import { View, Text, ScrollView, TouchableOpacity, Alert } from "react-native";
import { observer } from "@legendapp/state/react";
import { styles } from "../../styles/styles";
import { appConfig } from "../../util/app-config-store";
import ProfileList from "./ProfileList";
import CreateProfileForm from "./CreateProfileForm";
import AccountList from "./AccountList";
import AddAccountForm from "./AddAccountForm";

const ProfileManagement = observer(() => {
  const [selectedProfileName, setSelectedProfileName] = useState<string | null>(
    null,
  );
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showAddAccountForm, setShowAddAccountForm] = useState(false);

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
    Alert.alert(
      "Delete All Profiles",
      "This action will delete all profiles and cannot be undone. Continue?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete All",
          onPress: () => {
            appConfig.profiles.set({});
            appConfig.activeProfile.set(null);
            setSelectedProfileName(null);
          },
          style: "destructive",
        },
      ],
    );
  };

  const toggleCreateForm = () => {
    setShowCreateForm(!showCreateForm);
    setShowAddAccountForm(false);
  };

  const toggleAddAccountForm = () => {
    setShowAddAccountForm(!showAddAccountForm);
    setShowCreateForm(false);
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
          />
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
    </ScrollView>
  );
});

export default ProfileManagement;
