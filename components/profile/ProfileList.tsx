import React, { useState, useCallback, memo } from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { styles } from "../../styles/styles";
import { appConfig } from "../../util/app-config-store";
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

    const [deleteModalVisible, setDeleteModalVisible] = useState(false);
    const [profileToDelete, setProfileToDelete] = useState<string | null>(null);
    const [expandedProfile, setExpandedProfile] = useState<string | null>(null);

    const toggleExpand = useCallback((profileName: string) => {
      setExpandedProfile((currentExpanded) =>
        currentExpanded === profileName ? null : profileName,
      );
    }, []);

    const handleMakeActive = useCallback((profileName: string) => {
      appConfig.activeProfile.set(profileName);
    }, []);

    const handleDeleteProfile = useCallback((profileName: string) => {
      setProfileToDelete(profileName);
      setDeleteModalVisible(true);
    }, []);

    const confirmDeleteProfile = useCallback(() => {
      if (!profileToDelete) return;

      const currentProfiles = appConfig.profiles.get();
      const updatedProfiles = Object.keys(currentProfiles)
        .filter((name) => name !== profileToDelete)
        .reduce(
          (obj, name) => {
            obj[name] = currentProfiles[name];
            return obj;
          },
          {} as Record<string, Profile>,
        );

      appConfig.profiles.set(updatedProfiles);

      if (activeProfileName === profileToDelete) {
        const remainingProfiles = Object.keys(updatedProfiles);
        if (remainingProfiles.length > 0) {
          appConfig.activeProfile.set(remainingProfiles[0]);
        } else {
          appConfig.activeProfile.set(null);
        }
      }

      if (selectedProfileName === profileToDelete) {
        onSelectProfile(activeProfileName || "");
      }

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
        const isExpanded = expandedProfile === profileName;

        return (
          <View
            key={profileName}
            style={[
              styles.resultContainer,
              { marginBottom: 15 },
              isActive && { borderColor: "#94c2f3", borderWidth: 2 },
              isSelected && { backgroundColor: "#2c3040" },
            ]}
          >
            <View style={styles.profileHeader}>
              <View style={styles.profileHeaderTop}>
                <View style={styles.profileTitleRow}>
                  <TouchableOpacity
                    onPress={() => handleMakeActive(profileName)}
                    style={styles.radioContainer}
                    disabled={isActive}
                    accessibilityRole="radio"
                    accessibilityState={{ checked: isActive }}
                    accessibilityLabel={`Make ${profileName} the active profile`}
                  >
                    <View
                      style={[
                        styles.radioButton,
                        isActive && styles.radioButtonActive,
                      ]}
                    >
                      {isActive && <View style={styles.radioButtonInner} />}
                    </View>
                  </TouchableOpacity>

                  <Text style={styles.profileName}>{profile.name}</Text>
                </View>

                <Text style={styles.accountCount}>
                  {profile.accounts.length} account(s)
                </Text>
              </View>

              <Text style={styles.networkInfo}>
                Network: {profile.network.network_name} (
                {profile.network.network_type})
              </Text>

              <TouchableOpacity
                onPress={() => toggleExpand(profileName)}
                style={styles.toggleButton}
                accessibilityRole="button"
                accessibilityState={{ expanded: isExpanded }}
                accessibilityLabel={`${
                  isExpanded ? "Hide" : "Show"
                } details for ${profileName}`}
              >
                <Text style={styles.toggleText}>
                  {isExpanded ? "Hide Details ▲" : "Show Details ▼"}
                </Text>
              </TouchableOpacity>
            </View>

            {isExpanded && (
              <View style={styles.expandedContent}>
                {profile.accounts.length > 0 ? (
                  <>
                    <Text style={styles.sectionTitle}>Accounts:</Text>
                    {profile.accounts.map((account, index) => (
                      <Text key={index} style={styles.accountItem}>
                        • {account.nickname || `Account ${index + 1}`}
                      </Text>
                    ))}
                  </>
                ) : (
                  <Text style={styles.noAccounts}>
                    No accounts in this profile.
                  </Text>
                )}
              </View>
            )}

            <View style={styles.actionButtonRow}>
              <ActionButton
                text={isSelected ? "Editing" : "Edit"}
                onPress={() => onSelectProfile(profileName)}
                size="small"
              />

              {!isActive && (
                <ActionButton
                  text="Set Active"
                  onPress={() => handleMakeActive(profileName)}
                  style={{ backgroundColor: "#a5d6b7" }}
                  size="small"
                />
              )}

              <ActionButton
                text="Delete"
                onPress={() => handleDeleteProfile(profileName)}
                isDestructive={true}
                size="small"
              />
            </View>
          </View>
        );
      },
      [
        profiles,
        activeProfileName,
        selectedProfileName,
        expandedProfile,
        onSelectProfile,
        handleMakeActive,
        handleDeleteProfile,
        toggleExpand,
      ],
    );

    return (
      <View>
        {renderEmptyState()}
        {profileNames.map(renderProfileItem)}

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
