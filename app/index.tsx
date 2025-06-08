import React, { useEffect, useState, useCallback } from "react";
import { View, ActivityIndicator, Text, TouchableOpacity } from "react-native";
import { observer } from "@legendapp/state/react";
import { Stack } from "expo-router";
import { styles } from "../styles/styles";
import { initializeApp } from "@/util/initialize-app";
import { isFirstTimeUser, hasAccounts } from "@/util/user-state";
import { OnboardingWizard } from "@/components/onboarding/OnboardingWizard";
import { Menu } from "@/components/menu/Menu";
import AccountList from "@/components/profile/AccountList";
import { appConfig, getProfileForAccount } from "@/util/app-config-store";

// Main App component that combines the functionality
export default function App() {
  return (
    <View style={styles.root}>
      <Stack.Screen
        options={{
          title: "",
          headerBackTitle: "Back",
        }}
      />
      <AppContent />
    </View>
  );
}

// Content component with observer for reactive updates
const AppContent = observer(() => {
  const [isInitialized, setIsInitialized] = useState(false);
  const [isFirstTime, setIsFirstTime] = useState(false);
  const [showMenu, setShowMenu] = useState(false);

  // Initialize app and determine user state
  useEffect(() => {
    const initialize = async () => {
      try {
        await initializeApp();

        // Check if this is a first-time user
        const firstTime = await isFirstTimeUser();
        setIsFirstTime(firstTime);

        // If not first time, check if we should show menu or account list
        if (!firstTime) {
          const hasUserAccounts = hasAccounts();
          setShowMenu(!hasUserAccounts);
        }

        setIsInitialized(true);
      } catch (error) {
        console.error("Failed to initialize app:", error);
        setIsInitialized(true);
      }
    };

    initialize();
  }, []);

  const handleOnboardingComplete = useCallback(async () => {
    // Re-check user state after onboarding
    const firstTime = await isFirstTimeUser();
    setIsFirstTime(firstTime);

    // After onboarding, show account list if user has accounts
    const hasUserAccounts = hasAccounts();
    setShowMenu(!hasUserAccounts);
  }, []);

  const handleMenuProfileChange = useCallback(() => {
    // Force re-render when profile changes
    const hasUserAccounts = hasAccounts();
    // Only close menu if user now has accounts and menu was opened manually
    if (hasUserAccounts) {
      setShowMenu(false);
    }
  }, []);

  const handleMenuExit = useCallback(() => {
    // Only allow exiting if user has accounts to show
    const hasUserAccounts = hasAccounts();
    if (hasUserAccounts) {
      setShowMenu(false);
    }
  }, []);

  // Show loading state while initializing
  if (!isInitialized) {
    return (
      <View
        style={[
          styles.root,
          { justifyContent: "center", alignItems: "center" },
        ]}
      >
        <ActivityIndicator size="large" color="#94c2f3" />
        <Text style={[styles.resultValue, { marginTop: 10 }]}>
          Initializing wallet...
        </Text>
      </View>
    );
  }

  // Show onboarding wizard for first-time users
  if (isFirstTime) {
    return <OnboardingWizard onComplete={handleOnboardingComplete} />;
  }

  // Show menu if user has no accounts or wants to access menu
  if (showMenu) {
    return (
      <Menu onProfileChange={handleMenuProfileChange} onExit={handleMenuExit} />
    );
  }

  // Show account list for users with accounts
  return <SmartAccountList onShowMenu={() => setShowMenu(true)} />;
});

// Smart Account List component that shows accounts for the active profile
const SmartAccountList = observer(
  ({ onShowMenu }: { onShowMenu: () => void }) => {
    const activeAccountId = appConfig.activeAccountId.get();
    const profiles = appConfig.profiles.get();

    // Early return if profiles aren't loaded yet
    if (!profiles || Object.keys(profiles).length === 0) {
      return (
        <View style={styles.container}>
          <Text style={styles.title}>Loading...</Text>
          <Text style={styles.resultValue}>Loading account data...</Text>
        </View>
      );
    }

    // Get the active profile
    const activeProfileName = activeAccountId
      ? getProfileForAccount(activeAccountId)
      : null;
    const activeProfile = activeProfileName
      ? profiles[activeProfileName]
      : null;

    // If no active profile, fall back to first profile with accounts
    const fallbackProfile = Object.values(profiles).find(
      (profile) => profile?.accounts?.length > 0,
    );
    const displayProfile = activeProfile || fallbackProfile;

    if (
      !displayProfile ||
      !displayProfile.accounts ||
      displayProfile.accounts.length === 0
    ) {
      return (
        <View style={styles.container}>
          <Text style={styles.title}>No Accounts</Text>
          <Text style={styles.resultValue}>
            No accounts found. Use the menu to add accounts.
          </Text>
          <Menu onProfileChange={() => {}} onExit={undefined} />
        </View>
      );
    }

    return (
      <View style={styles.container}>
        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 20,
          }}
        >
          <Text style={styles.title}>{displayProfile.name}</Text>
          <TouchableOpacity
            style={styles.navButton}
            onPress={onShowMenu}
            accessible={true}
            accessibilityRole="button"
            accessibilityLabel="Open menu"
          >
            <Text style={styles.navButtonText}>Menu</Text>
          </TouchableOpacity>
        </View>

        <AccountList
          profileName={displayProfile.name}
          accounts={displayProfile.accounts}
          activeAccountId={activeAccountId}
          onSetActiveAccount={(accountId: string) => {
            appConfig.activeAccountId.set(accountId);
          }}
        />
      </View>
    );
  },
);
