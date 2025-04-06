import { configureObservablePersistence, persistObservable } from "@legendapp/state/persist";
import { appConfig, maybeInitializeDefaultProfile } from "./app-config-store";
import { ObservablePersistMMKV } from "@legendapp/state/persist-plugins/mmkv";
import { ObservablePersistLocalStorage } from "@legendapp/state/persist-plugins/local-storage";
import { observable } from "@legendapp/state";

const isMobile = (): boolean => {
  return typeof window !== "undefined" && typeof process === "object";
};

/**
 * Initializes the application by ensuring the configuration is properly loaded.
 * This function should be called once when the application starts.
 */
export async function initializeApp() {
  /**
   * Observable application configuration state.
   * Can be subscribed to for reactive UI updates.
   */
  // Global configuration
  if (isMobile()) {
    // Persistence for mobile devices
    configureObservablePersistence({
      pluginLocal: ObservablePersistMMKV,
    });
  } else {
    // Enable persistence for web
    configureObservablePersistence({
      pluginLocal: ObservablePersistLocalStorage,
    });
  }

  /**
   * Sets up persistence for the application configuration.
   * This enables config to survive app restarts.
   */
  persistObservable(appConfig, {
    local: "app-config", // Storage key
  });

  try {
    // Wait for persistence to load (allow some time for hydration)
    await new Promise(resolve => setTimeout(resolve, 100));

    // Check if we have any profiles after persistence has loaded
    const profiles = appConfig.profiles.get();
    const profileCount = Object.keys(profiles).length;

    console.log(`Initializing app with ${profileCount} existing profiles`);

    // Only initialize a default profile if we truly have no profiles
    if (profileCount === 0) {
      // Log the state before initialization
      console.log('Before initialization:', JSON.stringify(appConfig.get()));

      maybeInitializeDefaultProfile();

      // Log the state after initialization
      console.log('After initialization:', JSON.stringify(appConfig.get()));
    }

    return true;
  } catch (error) {
    console.error("Failed to initialize app:", error);
    return false;
  }
}
