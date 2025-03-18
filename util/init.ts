import { LibraClient, LibraWallet, Network } from "open-libra-sdk";
import '@/util/polyfills';

export let wallet: LibraWallet;
export let client: LibraClient;


export async function initWallet(mnem: string): Promise<LibraWallet> {
  try {
    wallet = LibraWallet.fromMnemonic(mnem);
    return wallet;
  } catch (error) {
    console.error('Failed to initialize wallet:', error);
    throw error;
  }
}

export async function initClient(network: Network, fullnode: string): Promise<LibraClient> {
  try {
    client = new LibraClient(network, fullnode);
    return client;
  } catch (error) {
    console.error('Failed to initialize wallet:', error);
    throw error;
  }
}
