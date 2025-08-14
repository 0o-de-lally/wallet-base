import React, { useEffect, useState } from "react";
import {
  View,
  ActivityIndicator,
  Text,
  TouchableOpacity,
  ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { observer } from "@legendapp/state/react";
import { Stack, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { styles, namedColors } from "../styles/styles";
import { initializeApp } from "@/util/initialize-app";
import { SetupGuard } from "@/components/auth/SetupGuard";
import AccountList from "@/components/profile/AccountList";
import { AccountTotals } from "@/components/profile/AccountTotals";
import { appConfig, getProfileForAccount } from "@/util/app-config-store";

// Main App component that combines the functionality
export default function App() {
  return (
    <View style={styles.root}>
      <Stack.Screen
        options={{
          title: "",
          headerShown: false,
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
  const router = useRouter();

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

  // Show loading state while initializing
  if (!isInitialized) {
    return (
      <View
        style={[
          styles.root,
          { justifyContent: "center", alignItems: "center" },
        ]}
      >
        <ActivityIndicator size="large" color={namedColors.blue} />
        <Text style={[styles.resultValue, { marginTop: 10 }]}>
          Initializing wallet...
        </Text>
      </View>
    );
  }

  // Use SetupGuard to ensure proper setup before showing main content
  return (
  <SetupGuard requiresPassword={true} requiresAccount={true}>
      <SmartAccountList onShowMenu={() => router.push("/settings")} />
    </SetupGuard>
  );
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
        </View>
      );
    }

    return (
      <SafeAreaView
        style={styles.safeAreaView}
        edges={["top", "left", "right"]}
      >
        <View style={styles.headerRow}>
          <Text
            style={styles.profileName}
            numberOfLines={1}
            ellipsizeMode="tail"
          >
            {displayProfile.name.toUpperCase()}
          </Text>
          <TouchableOpacity
            style={styles.menuIconButton}
            onPress={onShowMenu}
            accessible={true}
            accessibilityRole="button"
            accessibilityLabel="Open menu"
          >
            <Ionicons name="menu-outline" size={24} color="#c2c2cc" />
          </TouchableOpacity>
        </View>

        <ScrollView
          style={styles.containerWithHeader}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          <AccountList
            profileName={displayProfile.name}
            accounts={displayProfile.accounts}
            activeAccountId={activeAccountId}
            onSetActiveAccount={(accountId: string) => {
              appConfig.activeAccountId.set(accountId);
            }}
          />
        </ScrollView>

        {/* Fixed footer with account totals */}
        <View style={styles.bottomTotalsContainer}>
          <AccountTotals profileName={displayProfile.name} />
        </View>
      </SafeAreaView>
    );
  },
);
