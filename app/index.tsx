import React, { useEffect, useState, useCallback } from "react";
import { View, ActivityIndicator, Text, TouchableOpacity } from "react-native";
import { observer } from "@legendapp/state/react";
import { Stack } from "expo-router";
import { styles } from "../styles/styles";
import { initializeApp } from "@/util/initialize-app";
import { SetupGuard } from "@/components/auth/SetupGuard";
import { Menu } from "@/components/menu/Menu";
import AccountList from "@/components/profile/AccountList";
import { appConfig, getProfileForAccount } from "@/util/app-config-store";
import { getLibraClient } from "@/util/libra-client";

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
  const [showMenu, setShowMenu] = useState(false);

  // Initialize app
  useEffect(() => {
    const initialize = async () => {
      try {
        await initializeApp();
        setIsInitialized(true);
      } catch (error) {
        console.error("Failed to initialize app:", error);
        setIsInitialized(true);
      }
    };

    initialize();
  }, []);

  const handleMenuProfileChange = useCallback(() => {
    // Force re-render when profile changes
    setShowMenu(false);
  }, []);

  const handleMenuExit = useCallback(() => {
    setShowMenu(false);
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

  // Use SetupGuard to ensure proper setup before showing main content
  return (
    <SetupGuard requiresPin={true} requiresAccount={true}>
      {showMenu ? (
        <Menu
          onProfileChange={handleMenuProfileChange}
          onExit={handleMenuExit}
        />
      ) : (
        <SmartAccountList onShowMenu={() => setShowMenu(true)} />
      )}
    </SetupGuard>
  );
});

// Smart Account List component that shows accounts for the active profile
const SmartAccountList = observer(
  ({ onShowMenu }: { onShowMenu: () => void }) => {
    const activeAccountId = appConfig.activeAccountId.get();
    const profiles = appConfig.profiles.get();

    // Get the global LibraClient instance
    const client = getLibraClient();

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
          client={client}
        />
      </View>
    );
  },
);
