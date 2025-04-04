import { observable } from "@legendapp/state";
import { persistObservable } from "@legendapp/state/persist";
import { configureObservablePersistence } from "@legendapp/state/persist";
import { ObservablePersistLocalStorage } from "@legendapp/state/persist-plugins/local-storage";
import { ObservablePersistMMKV } from "@legendapp/state/persist-plugins/mmkv";

const isMobile = (): boolean => {
  return typeof window !== "undefined" && typeof process === "object";
};
// Global configuration
if (isMobile()) {
  // Disable persistence for mobile devices
  configureObservablePersistence({
    pluginLocal: ObservablePersistMMKV,
  });
} else {
  // Enable persistence for web
  configureObservablePersistence({
    pluginLocal: ObservablePersistLocalStorage,
  });
}
configureObservablePersistence({
  pluginLocal: ObservablePersistLocalStorage,
});
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
