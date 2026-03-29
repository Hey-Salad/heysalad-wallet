// providers/NetworkProvider.tsx
// Manages current blockchain network selection

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { DEFAULT_NETWORK_ID, getNetwork } from '@/config/networks';
import { NetworkConfig } from '@/types/blockchain';

const NETWORK_STORAGE_KEY = 'heysalad_network_v1';

interface NetworkContextType {
  networkId: string;
  network: NetworkConfig;
  switchNetwork: (networkId: string) => Promise<void>;
  isTestnet: boolean;
}

const NetworkContext = createContext<NetworkContextType | undefined>(undefined);

export function NetworkProvider({ children }: { children: ReactNode }) {
  const [networkId, setNetworkId] = useState<string>(DEFAULT_NETWORK_ID);
  const network = getNetwork(networkId);
  const isTestnet = network.environment === 'testnet' || network.environment === 'devnet';

  // Load saved network on mount
  useEffect(() => {
    loadNetwork();
  }, []);

  const loadNetwork = async () => {
    try {
      const saved = await AsyncStorage.getItem(NETWORK_STORAGE_KEY);
      if (saved) {
        console.log('[NetworkProvider] Loaded network:', saved);
        setNetworkId(saved);
      } else {
        console.log('[NetworkProvider] Using default network:', DEFAULT_NETWORK_ID);
      }
    } catch (error) {
      console.error('[NetworkProvider] Failed to load network:', error);
    }
  };

  const switchNetwork = async (newNetworkId: string) => {
    try {
      console.log('[NetworkProvider] Switching network to:', newNetworkId);

      // Validate network exists
      const newNetwork = getNetwork(newNetworkId);
      if (!newNetwork) {
        throw new Error(`Invalid network ID: ${newNetworkId}`);
      }

      // Save to storage
      await AsyncStorage.setItem(NETWORK_STORAGE_KEY, newNetworkId);

      // Update state
      setNetworkId(newNetworkId);

      console.log('[NetworkProvider] Network switched successfully');
    } catch (error) {
      console.error('[NetworkProvider] Failed to switch network:', error);
      throw error;
    }
  };

  return (
    <NetworkContext.Provider value={{ networkId, network, switchNetwork, isTestnet }}>
      {children}
    </NetworkContext.Provider>
  );
}

export function useNetwork() {
  const context = useContext(NetworkContext);
  if (!context) {
    throw new Error('useNetwork must be used within NetworkProvider');
  }
  return context;
}
