import React from "react";
import { Text } from "react-native";
import { styles } from "../../styles/styles";
import Dropdown from "../common/Dropdown";
import { RecoveryState, RecoveryActions } from "./types";

interface ProfileSelectionSectionProps {
  state: RecoveryState;
  actions: RecoveryActions;
  profileNames: string[];
  hasMultipleProfiles: boolean;
}

export const ProfileSelectionSection: React.FC<ProfileSelectionSectionProps> = ({
  state,
  actions,
  profileNames,
  hasMultipleProfiles,
}) => {
  const handleProfileSelect = (profile: string) => {
    actions.setSelectedProfile(profile);
    actions.setError(null);
  };

  if (!hasMultipleProfiles) {
    return null;
  }

  return (
    <>
      {state.error && <Text style={styles.errorText}>{state.error}</Text>}
      
      <Dropdown
        label="Profile"
        value={state.selectedProfile}
        options={profileNames}
        onSelect={handleProfileSelect}
        placeholder="Select a profile"
      />
    </>
  );
};
