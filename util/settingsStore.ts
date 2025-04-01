import { observable } from "@legendapp/state";
import { persistObservable } from "@legendapp/state/persist";
import { configureObservablePersistence } from "@legendapp/state/persist";
import { ObservablePersistAsyncStorage } from "@legendapp/state/persist-plugins/async-storage";

/**
 * Defines the structure of the application configuration.
 */
export type AppConfig = {
  theme: {
    backgroundColor: string;
    primaryColor: string;
    textColor: string;
  };
  // Add other config sections as needed
};

/**
 * Default configuration values for the application.
 */
const defaultConfig: AppConfig = {
  theme: {
    backgroundColor: "#86f7ff",
    primaryColor: "#11aaee",
    textColor: "#000000",
  },
};

/**
 * Initializes the persistent settings framework.
 * Should be called once at application startup.
 */
export function initializeSettings(): void {
  configureObservablePersistence({
    // Use AsyncStorage for React Native
    pluginLocal: ObservablePersistAsyncStorage,
  });
}

/**
 * Observable application configuration state.
 * Can be subscribed to for reactive UI updates.
 */
export const appConfig = observable<AppConfig>(defaultConfig);

/**
 * Sets up persistence for the application configuration.
 * This enables config to survive app restarts.
 */
persistObservable(appConfig, {
  local: "app-config", // Storage key
});
