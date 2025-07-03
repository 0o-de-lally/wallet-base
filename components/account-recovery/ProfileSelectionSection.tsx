import React from "react";
import { Text } from "react-native";
import { styles } from "../../styles/styles";
import Dropdown from "../common/Dropdown";

interface ProfileSelectionSectionProps {
  error: string | null;
  selectedProfile: string;
  profileNames: string[];
  hasMultipleProfiles: boolean;
  onProfileSelect: (profile: string) => void;
}

export const ProfileSelectionSection: React.FC<
  ProfileSelectionSectionProps
> = ({
  error,
  selectedProfile,
  profileNames,
  hasMultipleProfiles,
  onProfileSelect,
}) => {
  if (!hasMultipleProfiles) {
    return null;
  }

  return (
    <>
      {error && <Text style={styles.errorText}>{error}</Text>}

      <Dropdown
        label="Profile"
        value={selectedProfile}
        options={profileNames}
        onSelect={onProfileSelect}
        placeholder="Select a profile"
      />
    </>
  );
};
