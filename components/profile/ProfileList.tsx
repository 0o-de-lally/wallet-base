import React from "react";
import { View, Text, TouchableOpacity, Alert } from "react-native";
import { styles } from "../../styles/styles";
import { setActiveProfile, appConfig } from "../../util/app-config-store";
import type { Profile } from "../../util/app-config-store";

interface ProfileListProps {
  profiles: Record<string, Profile>;
  activeProfileName: string | null;
  selectedProfileName: string | null;
  onSelectProfile: (profileName: string) => void;
}

const ProfileList = ({
  profiles,
  activeProfileName,
  selectedProfileName,
  onSelectProfile,
}: ProfileListProps) => {
  const profileNames = Object.keys(profiles);

  const handleMakeActive = (profileName: string) => {
    setActiveProfile(profileName);
  };

  const handleDeleteProfile = (profileName: string) => {
    Alert.alert(
      "Delete Profile",
      `Are you sure you want to delete the profile "${profileName}"? This cannot be undone.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          onPress: () => {
            // The issue is with how we're trying to delete the profile
            // We need to use the observable state properly

            // First get the current profiles
            const currentProfiles = appConfig.profiles.get();

            // Create a new object without the profile to delete
            const updatedProfiles = Object.keys(currentProfiles)
              .filter((name) => name !== profileName)
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
            if (activeProfileName === profileName) {
              const remainingProfiles = Object.keys(updatedProfiles);
              if (remainingProfiles.length > 0) {
                appConfig.activeProfile.set(remainingProfiles[0]);
              } else {
                appConfig.activeProfile.set(null);
              }
            }

            // If the deleted profile was selected, reset selection
            if (selectedProfileName === profileName) {
              onSelectProfile(activeProfileName || "");
            }
          },
          style: "destructive",
        },
      ],
    );
  };

  if (profileNames.length === 0) {
    return (
      <View style={styles.resultContainer}>
        <Text style={styles.resultValue}>
          No profiles found. Create one to get started.
        </Text>
      </View>
    );
  }

  return (
    <View>
      {profileNames.map((profileName) => {
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
              <TouchableOpacity
                style={[
                  styles.button,
                  { paddingVertical: 8, paddingHorizontal: 12 },
                ]}
                onPress={() => onSelectProfile(profileName)}
              >
                <Text style={[styles.buttonText, { fontSize: 14 }]}>
                  {isSelected ? "Selected" : "Select"}
                </Text>
              </TouchableOpacity>

              {!isActive && (
                <TouchableOpacity
                  style={[
                    styles.button,
                    {
                      paddingVertical: 8,
                      paddingHorizontal: 12,
                      backgroundColor: "#a5d6b7",
                    },
                  ]}
                  onPress={() => handleMakeActive(profileName)}
                >
                  <Text style={[styles.buttonText, { fontSize: 14 }]}>
                    Make Active
                  </Text>
                </TouchableOpacity>
              )}

              <TouchableOpacity
                style={[
                  styles.button,
                  styles.dangerButton,
                  { paddingVertical: 8, paddingHorizontal: 12 },
                ]}
                onPress={() => handleDeleteProfile(profileName)}
              >
                <Text style={[styles.dangerButtonText, { fontSize: 14 }]}>
                  Delete
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        );
      })}
    </View>
  );
};

export default ProfileList;
