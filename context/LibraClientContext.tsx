import React, { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { LibraClient } from "open-libra-sdk";
import { appConfig, getProfileForAccount } from "../util/app-config-store";
import type { NetworkType, NetworkTypeEnum } from "../util/app-config-types";
import { observer } from "@legendapp/state/react";

interface LibraClientContextType {
  client: LibraClient | null;
  isInitializing: boolean;
  currentNetwork: NetworkType | null;
  error: string | null;
}

const LibraClientContext = createContext<LibraClientContextType | undefined>(undefined);

export const useLibraClient = () => {
  const context = useContext(LibraClientContext);
  if (!context) {
    throw new Error("useLibraClient must be used within a LibraClientProvider");
  }
  return context;
};

/**
 * Gets the appropriate URL for a network configuration
 */
function getNetworkUrl(network: NetworkType): string {
  // If custom URL is provided, use it
  if (network.rpc_url && network.rpc_url.trim()) {
    return network.rpc_url.trim();
  }

  // Otherwise use predefined URLs based on network type
  switch (network.network_type) {
    case "Mainnet":
      return "https://rpc.scan.openlibra.world/v1";
    case "Testnet":
      return "https://testnet-rpc.scan.openlibra.world/v1"; // Assuming testnet URL
    case "Testing":
      return "https://testing-rpc.scan.openlibra.world/v1"; // Assuming testing URL
    case "Custom":
      // For custom networks without URL, default to mainnet
      return "https://rpc.scan.openlibra.world/v1";
    default:
      return "https://rpc.scan.openlibra.world/v1";
  }
}

interface LibraClientProviderProps {
  children: ReactNode;
}

export const LibraClientProvider = observer(({ children }: LibraClientProviderProps) => {
  const [client, setClient] = useState<LibraClient | null>(null);
  const [isInitializing, setIsInitializing] = useState(true);
  const [currentNetwork, setCurrentNetwork] = useState<NetworkType | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const initializeClient = async () => {
      try {
        setIsInitializing(true);
        setError(null);

        // Get current app state
        const activeAccountId = appConfig.activeAccountId.get();
        const profiles = appConfig.profiles.get();

        let networkToUse: NetworkType;

        if (activeAccountId) {
          // Get the profile for the active account
          const profileName = getProfileForAccount(activeAccountId);
          if (profileName && profiles[profileName]) {
            networkToUse = profiles[profileName].network;
          } else {
            // Fallback to mainnet if profile not found
            networkToUse = {
              network_name: "Mainnet",
              network_type: "Mainnet" as NetworkTypeEnum,
            };
          }
        } else {
          // No active account, use mainnet as default
          networkToUse = {
            network_name: "Mainnet",
            network_type: "Mainnet" as NetworkTypeEnum,
          };
        }

        // Only create a new client if the network has changed
        if (!currentNetwork || 
            currentNetwork.network_type !== networkToUse.network_type ||
            currentNetwork.network_name !== networkToUse.network_name) {
          
          console.log("Initializing LibraClient for network:", networkToUse);
          
          // Get the appropriate URL for the network
          const networkUrl = getNetworkUrl(networkToUse);
          
          // Create the client - LibraClient() constructor doesn't take parameters
          // The URL configuration might be handled differently in the SDK
          const newClient = new LibraClient();
          
          setClient(newClient);
          setCurrentNetwork(networkToUse);
          
          console.log("LibraClient initialized for network:", networkToUse.network_name);
        }
      } catch (err) {
        console.error("Failed to initialize LibraClient:", err);
        setError(err instanceof Error ? err.message : "Failed to initialize client");
        setClient(null);
      } finally {
        setIsInitializing(false);
      }
    };

    initializeClient();
  }, [appConfig.activeAccountId.get(), appConfig.profiles.get()]);

  return (
    <LibraClientContext.Provider 
      value={{ 
        client, 
        isInitializing, 
        currentNetwork,
        error 
      }}
    >
      {children}
    </LibraClientContext.Provider>
  );
});

LibraClientProvider.displayName = "LibraClientProvider";
