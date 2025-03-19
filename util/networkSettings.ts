import { Network } from 'open-libra-sdk';
import { NetworkConfig } from '../types/networkTypes';
import { observable } from '@legendapp/state';
import { ObservablePersistMMKV } from '@legendapp/state/persist-plugins/mmkv';
import { syncObservable } from '@legendapp/state/sync';
import { initClient } from './init';

export const MAINNET_CONFIG: NetworkConfig = {
  type: Network.MAINNET,
  rpcUrl: 'https://rpc.scan.openlibra.world/v1',
  chainId: 1
};

export const TESTNET_CONFIG: NetworkConfig = {
  type: Network.TESTNET,
  rpcUrl: 'https://testnet.openlibra.io/v1',
  chainId: 2
};

export const LOCAL_CONFIG: NetworkConfig = {
  type: Network.LOCAL,
  rpcUrl: 'http://127.0.0.1:8380',
  chainId: 2
};

// Create an observable store
export const networkStore$ = observable({
  activeNetwork: MAINNET_CONFIG,
  lastUpdated: new Date().toISOString()
});

// Configure persistence
syncObservable(networkStore$, {
  persist: {
    name: 'network-store',
    plugin: ObservablePersistMMKV
  }
});

export function generateConfig(type: Network): NetworkConfig {
  switch (type) {
    case Network.MAINNET:
      return MAINNET_CONFIG;
    case Network.TESTNET:
      return TESTNET_CONFIG;
    case Network.LOCAL:
      return LOCAL_CONFIG;
    default:
      return MAINNET_CONFIG;
  }
}

export function updateNetwork(type: Network): void {
  networkStore$.activeNetwork.set(generateConfig(type));
  networkStore$.lastUpdated.set(new Date().toISOString());
  let cfg = generateConfig(type);
  initClient(type, cfg.rpcUrl);
}
