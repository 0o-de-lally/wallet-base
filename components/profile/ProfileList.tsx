import React, { useState, useCallback, memo } from "react";
import { View, Text, TouchableOpacity } from "react-native";
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

    // Simpler expanded state tracking
    const [expandedProfile, setExpandedProfile] = useState<string | null>(null);

    const toggleExpand = useCallback((profileName: string) => {
      setExpandedProfile((currentExpanded) =>
        currentExpanded === profileName ? null : profileName
      );
    }, []);

    const handleMakeActive = useCallback((profileName: string) => {
      // Direct approach to set active profile
      appConfig.activeProfile.set(profileName);
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
          {} as Record<string, Profile>
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
            {/* Simple header with radio button */}
            <View style={{ padding: 10 }}>
              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: 8,
                }}
              >
                <View style={{ flexDirection: "row", alignItems: "center" }}>
                  {/* Simple radio button with good tap target */}
                  <TouchableOpacity
                    onPress={() => handleMakeActive(profileName)}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    style={{ marginRight: 12 }}
                    disabled={isActive}
                  >
                    <View
                      style={{
                        width: 20,
                        height: 20,
                        borderRadius: 10,
                        borderWidth: 2,
                        borderColor: isActive ? "#94c2f3" : "#fff",
                        justifyContent: "center",
                        alignItems: "center",
                      }}
                    >
                      {isActive && (
                        <View
                          style={{
                            width: 12,
                            height: 12,
                            borderRadius: 6,
                            backgroundColor: "#94c2f3",
                          }}
                        />
                      )}
                    </View>
                  </TouchableOpacity>

                  <Text style={[styles.resultLabel, { fontSize: 16 }]}>
                    {profile.name}
                  </Text>
                </View>

                <Text style={styles.resultValue}>
                  {profile.accounts.length} account(s)
                </Text>
              </View>

              <Text style={[styles.resultValue, { fontSize: 12 }]}>
                Network: {profile.network.network_name} (
                {profile.network.network_type})
              </Text>

              {/* Simple toggle button */}
              <TouchableOpacity
                onPress={() => toggleExpand(profileName)}
                style={{
                  alignSelf: "center",
                  marginTop: 8,
                  padding: 5,
                  backgroundColor: "#3a3f55",
                  borderRadius: 4,
                }}
              >
                <Text style={{ color: "#fff" }}>
                  {isExpanded ? "Hide Details ▲" : "Show Details ▼"}
                </Text>
              </TouchableOpacity>
            </View>

            {/* Simple expanded content */}
            {isExpanded && (
              <View
                style={{
                  padding: 10,
                  backgroundColor: "#262935",
                  borderTopWidth: 1,
                  borderTopColor: "#3a3f55",
                }}
              >
                {profile.accounts.length > 0 ? (
                  <>
                    <Text
                      style={[styles.resultLabel, { marginBottom: 8 }]}
                    >
                      Accounts:
                    </Text>
                    {profile.accounts.map((account, index) => (
                      <Text key={index} style={styles.resultValue}>
                        • {account.nickname || `Account ${index + 1}`}
                      </Text>
                    ))}
                  </>
                ) : (
                  <Text style={styles.resultValue}>
                    No accounts in this profile.
                  </Text>
                )}
              </View>
            )}

            {/* Action buttons in a simple row */}
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                padding: 10,
                borderTopWidth: 1,
                borderTopColor: "#3a3f55",
              }}
            >
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
      ]
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
  }
);

ProfileList.displayName = "ProfileList";

export default ProfileList;
