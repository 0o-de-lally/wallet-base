import { observable } from '@legendapp/state';
import { persistObservable } from '@legendapp/state/persist';
import { configureObservablePersistence } from '@legendapp/state/persist';
import { ObservablePersistAsyncStorage } from '@legendapp/state/persist-plugins/async-storage';

// Define your app configuration type
export type AppConfig = {
  theme: {
    backgroundColor: string;
    primaryColor: string;
    textColor: string;
  };
  // Add other config sections as needed
};

// Default configuration
const defaultConfig: AppConfig = {
  theme: {
    backgroundColor: '#86f7ff',
    primaryColor: '#11aaee',
    textColor: '#000000',
  },
};

// Configure persistence globally (call this once at app startup)
export function initializeSettings() {
  configureObservablePersistence({
    // Use AsyncStorage for React Native
    pluginLocal: ObservablePersistAsyncStorage
  });
}

// Create the observable state
export const appConfig = observable<AppConfig>(defaultConfig);

// Set up persistence
persistObservable(appConfig, {
  local: 'app-config', // Storage key
});

// Utility to update the config
export function updateAppConfig(newConfig: Partial<AppConfig>) {
  appConfig.set(prev => ({
    ...prev,
    ...newConfig,
  }));
}
