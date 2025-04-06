import React, { useState, useCallback, memo } from "react";
import { View, Text } from "react-native";
import { styles } from "../../styles/styles";
import { setActiveProfile, appConfig } from "../../util/app-config-store";
import type { Profile } from "../../util/app-config-store";
import ConfirmationModal from "../modal/ConfirmationModal";
import { ActionButton } from "../common/ActionButton";

interface ProfileListProps {
  profiles: Record<string, Profile>;
  activeProfileName: string | null;
  selectedProfileName: string | null;
  onSelectProfile: (profileName: string) => void;
}

const ProfileList = memo(
  ({
    profiles,
    activeProfileName,
    selectedProfileName,
    onSelectProfile,
  }: ProfileListProps) => {
    const profileNames = Object.keys(profiles);

    // State for confirmation modals
    const [deleteModalVisible, setDeleteModalVisible] = useState(false);
    const [profileToDelete, setProfileToDelete] = useState<string | null>(null);

    const handleMakeActive = useCallback((profileName: string) => {
      setActiveProfile(profileName);
    }, []);

    const handleDeleteProfile = useCallback((profileName: string) => {
      setProfileToDelete(profileName);
      setDeleteModalVisible(true);
    }, []);

    const confirmDeleteProfile = useCallback(() => {
      if (!profileToDelete) return;

      // Get the current profiles
      const currentProfiles = appConfig.profiles.get();

      // Create a new object without the profile to delete
      const updatedProfiles = Object.keys(currentProfiles)
        .filter((name) => name !== profileToDelete)
        .reduce(
          (obj, name) => {
            obj[name] = currentProfiles[name];
            return obj;
          },
          {} as Record<string, Profile>,
        );

      // Update the profiles
      appConfig.profiles.set(updatedProfiles);

      // If the deleted profile was active, reset active profile
      if (activeProfileName === profileToDelete) {
        const remainingProfiles = Object.keys(updatedProfiles);
        if (remainingProfiles.length > 0) {
          appConfig.activeProfile.set(remainingProfiles[0]);
        } else {
          appConfig.activeProfile.set(null);
        }
      }

      // If the deleted profile was selected, reset selection
      if (selectedProfileName === profileToDelete) {
        onSelectProfile(activeProfileName || "");
      }

      // Close modal
      setDeleteModalVisible(false);
      setProfileToDelete(null);
    }, [
      profileToDelete,
      activeProfileName,
      selectedProfileName,
      onSelectProfile,
    ]);

    const renderEmptyState = useCallback(() => {
      if (profileNames.length > 0) return null;

      return (
        <View
          style={styles.resultContainer}
          accessible={true}
          accessibilityLabel="No profiles found"
        >
          <Text style={styles.resultValue}>
            No profiles found. Create one to get started.
          </Text>
        </View>
      );
    }, [profileNames.length]);

    const renderProfileItem = useCallback(
      (profileName: string) => {
        const profile = profiles[profileName];
        const isActive = profileName === activeProfileName;
        const isSelected = profileName === selectedProfileName;

        return (
          <View
            key={profileName}
            style={[
              styles.resultContainer,
              { marginBottom: 10 },
              isActive && { borderColor: "#94c2f3", borderWidth: 2 },
              isSelected && { backgroundColor: "#2c3040" },
            ]}
            accessible={true}
            accessibilityLabel={`Profile ${profileName}${isActive ? ", active" : ""}${isSelected ? ", selected" : ""}`}
          >
            <View
              style={{ flexDirection: "row", justifyContent: "space-between" }}
            >
              <Text style={styles.resultLabel}>
                {isActive ? "✓ " : ""}
                {profile.name}
              </Text>
              <Text style={[styles.resultValue, { fontSize: 12 }]}>
                {profile.accounts.length} account(s)
              </Text>
            </View>
            <Text style={[styles.resultValue, { fontSize: 12 }]}>
              Network: {profile.network.network_name} (
              {profile.network.network_type})
            </Text>

            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                marginTop: 10,
              }}
            >
              <ActionButton
                text={isSelected ? "Editing" : "Edit Profile"}
                onPress={() => onSelectProfile(profileName)}
                size="small"
                accessibilityLabel={`${isSelected ? "Currently editing" : "Edit"} profile ${profileName}`}
              />

              {!isActive && (
                <ActionButton
                  text="Make Active"
                  onPress={() => handleMakeActive(profileName)}
                  style={{ backgroundColor: "#a5d6b7" }}
                  size="small"
                  accessibilityLabel={`Make ${profileName} the active profile`}
                />
              )}

              <ActionButton
                text="Delete"
                onPress={() => handleDeleteProfile(profileName)}
                isDestructive={true}
                size="small"
                accessibilityLabel={`Delete profile ${profileName}`}
              />
            </View>
          </View>
        );
      },
      [
        profiles,
        activeProfileName,
        selectedProfileName,
        onSelectProfile,
        handleMakeActive,
        handleDeleteProfile,
      ],
    );

    return (
      <View>
        {renderEmptyState()}
        {profileNames.map(renderProfileItem)}

        {/* Delete Profile Confirmation Modal */}
        <ConfirmationModal
          visible={deleteModalVisible}
          title="Delete Profile"
          message={`Are you sure you want to delete the profile "${profileToDelete}"? This cannot be undone.`}
          confirmText="Delete"
          onConfirm={confirmDeleteProfile}
          onCancel={() => setDeleteModalVisible(false)}
          isDestructive={true}
        />
      </View>
    );
  },
);

ProfileList.displayName = "ProfileList";

export default ProfileList;
