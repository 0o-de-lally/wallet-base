import React, { useState, useCallback, memo } from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
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
            <View style={localStyles.profileHeader}>
              <View style={localStyles.profileHeaderTop}>
                <View style={localStyles.profileTitleRow}>
                  <TouchableOpacity
                    onPress={() => handleMakeActive(profileName)}
                    style={localStyles.radioContainer}
                    disabled={isActive}
                    accessibilityRole="radio"
                    accessibilityState={{ checked: isActive }}
                    accessibilityLabel={`Make ${profileName} the active profile`}
                  >
                    <View
                      style={[
                        localStyles.radio,
                        isActive && localStyles.radioActive,
                      ]}
                    >
                      {isActive && <View style={localStyles.radioInner} />}
                    </View>
                  </TouchableOpacity>

                  <Text style={localStyles.profileName}>{profile.name}</Text>
                </View>

                <Text style={localStyles.accountCount}>
                  {profile.accounts.length} account(s)
                </Text>
              </View>

              <Text style={localStyles.networkInfo}>
                Network: {profile.network.network_name} (
                {profile.network.network_type})
              </Text>

              <TouchableOpacity
                onPress={() => toggleExpand(profileName)}
                style={localStyles.toggleButton}
                accessibilityRole="button"
                accessibilityState={{ expanded: isExpanded }}
                accessibilityLabel={`${
                  isExpanded ? "Hide" : "Show"
                } details for ${profileName}`}
              >
                <Text style={localStyles.toggleText}>
                  {isExpanded ? "Hide Details ▲" : "Show Details ▼"}
                </Text>
              </TouchableOpacity>
            </View>

            {isExpanded && (
              <View style={localStyles.expandedContent}>
                {profile.accounts.length > 0 ? (
                  <>
                    <Text style={localStyles.sectionTitle}>Accounts:</Text>
                    {profile.accounts.map((account, index) => (
                      <Text key={index} style={localStyles.accountItem}>
                        • {account.nickname || `Account ${index + 1}`}
                      </Text>
                    ))}
                  </>
                ) : (
                  <Text style={localStyles.noAccounts}>
                    No accounts in this profile.
                  </Text>
                )}
              </View>
            )}

            <View style={localStyles.actionButtonRow}>
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

const localStyles = StyleSheet.create({
  profileHeader: {
    padding: 12,
  },
  profileHeaderTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  profileTitleRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  radioContainer: {
    marginRight: 10,
    padding: 4,
  },
  radio: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 2,
    borderColor: "#ddd",
    justifyContent: "center",
    alignItems: "center",
  },
  radioActive: {
    borderColor: "#94c2f3",
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#94c2f3",
  },
  profileName: {
    fontSize: 16,
    fontWeight: "500",
    color: "#fff",
  },
  accountCount: {
    fontSize: 13,
    color: "#ddd",
  },
  networkInfo: {
    fontSize: 13,
    color: "#bbb",
    marginBottom: 10,
  },
  toggleButton: {
    alignSelf: "center",
    paddingVertical: 6,
    paddingHorizontal: 12,
    backgroundColor: "#3a3f55",
    borderRadius: 4,
  },
  toggleText: {
    color: "#fff",
    fontSize: 13,
  },
  expandedContent: {
    padding: 12,
    backgroundColor: "#262935",
    borderTopWidth: 1,
    borderTopColor: "#3a3f55",
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: "500",
    color: "#fff",
    marginBottom: 8,
  },
  accountItem: {
    fontSize: 14,
    color: "#ddd",
    marginLeft: 8,
    marginBottom: 4,
  },
  noAccounts: {
    fontSize: 14,
    color: "#bbb",
    fontStyle: "italic",
  },
  actionButtonRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    padding: 12,
    borderTopWidth: 1,
    borderTopColor: "#3a3f55",
  },
});

ProfileList.displayName = "ProfileList";

export default ProfileList;
