import { useState, useEffect } from "react";
import { blockchainVitalsStore, BlockchainVitals, fetchBlockchainVitals } from "@/util/blockchain-vitals";
import { globalClient } from "@/util/libra-client";

export function useBlockchainVitals(networkName: string) {
  const [vitals, setVitals] = useState<BlockchainVitals | null>(
    blockchainVitalsStore[networkName] || null
  );
  const [loading, setLoading] = useState(!blockchainVitalsStore[networkName]);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    // Immediately try to fetch fresh data when the component mounts
    // or when the network name changes
    const fetchData = async () => {
      try {
        setLoading(true);
        await fetchBlockchainVitals(globalClient, networkName);
      } catch (fetchError) {
        console.error(`Error fetching blockchain vitals: ${fetchError}`);
        // Don't set error state here, let the interval handle that
      }
    };

    fetchData();

    // Check for updates in the store every second
    const interval = setInterval(() => {
      const currentVitals = blockchainVitalsStore[networkName];

      if (currentVitals) {
        setVitals(currentVitals);
        setLoading(false);
      } else if (loading && !currentVitals) {
        // If we've been loading for more than 10 seconds without data, show an error
        if (Date.now() - (vitals?.lastUpdate || Date.now()) > 10000) {
          setError(new Error("Timeout fetching blockchain vitals"));
          setLoading(false);
        }
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [networkName, loading, vitals]);

  return { vitals, loading, error };
}
