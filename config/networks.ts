// config/networks.ts
// Blockchain network configurations
// Easy to add new chains here!

import { NetworkConfig } from '@/types/blockchain';

export const NETWORKS: Record<string, NetworkConfig> = {
  // TRON Networks
  'tron-mainnet': {
    id: 'tron-mainnet',
    name: 'TRON Mainnet',
    blockchain: 'tron',
    environment: 'mainnet',
    rpcUrl: 'https://api.trongrid.io',
    explorerUrl: 'https://tronscan.org',
    nativeToken: {
      symbol: 'TRX',
      name: 'TRON',
      decimals: 6,
    },
    features: {
      hasTokens: true,
      hasNFTs: true,
      hasStaking: true,
    },
  },
  'tron-testnet': {
    id: 'tron-testnet',
    name: 'TRON Nile Testnet',
    blockchain: 'tron',
    environment: 'testnet',
    rpcUrl: 'https://nile.trongrid.io',
    explorerUrl: 'https://nile.tronscan.org',
    nativeToken: {
      symbol: 'TRX',
      name: 'TRON',
      decimals: 6,
    },
    features: {
      hasTokens: true,
      hasNFTs: true,
      hasStaking: false,
    },
  },

  // Solana Networks (Future)
  'solana-mainnet': {
    id: 'solana-mainnet',
    name: 'Solana Mainnet',
    blockchain: 'solana',
    environment: 'mainnet',
    rpcUrl: 'https://api.mainnet-beta.solana.com',
    explorerUrl: 'https://explorer.solana.com',
    nativeToken: {
      symbol: 'SOL',
      name: 'Solana',
      decimals: 9,
    },
    features: {
      hasTokens: true,
      hasNFTs: true,
      hasStaking: true,
    },
  },
  'solana-devnet': {
    id: 'solana-devnet',
    name: 'Solana Devnet',
    blockchain: 'solana',
    environment: 'devnet',
    rpcUrl: 'https://api.devnet.solana.com',
    explorerUrl: 'https://explorer.solana.com',
    nativeToken: {
      symbol: 'SOL',
      name: 'Solana',
      decimals: 9,
    },
    features: {
      hasTokens: true,
      hasNFTs: true,
      hasStaking: false,
    },
  },

  // Polkadot Networks (Future)
  'polkadot-mainnet': {
    id: 'polkadot-mainnet',
    name: 'Polkadot',
    blockchain: 'polkadot',
    environment: 'mainnet',
    rpcUrl: 'wss://rpc.polkadot.io',
    explorerUrl: 'https://polkadot.subscan.io',
    nativeToken: {
      symbol: 'DOT',
      name: 'Polkadot',
      decimals: 10,
    },
    features: {
      hasTokens: true,
      hasNFTs: true,
      hasStaking: true,
    },
  },
  'polkadot-testnet': {
    id: 'polkadot-testnet',
    name: 'Westend Testnet',
    blockchain: 'polkadot',
    environment: 'testnet',
    rpcUrl: 'wss://westend-rpc.polkadot.io',
    explorerUrl: 'https://westend.subscan.io',
    nativeToken: {
      symbol: 'WND',
      name: 'Westend',
      decimals: 12,
    },
    features: {
      hasTokens: true,
      hasNFTs: false,
      hasStaking: true,
    },
  },

  // Avalanche Networks (Future)
  'avalanche-mainnet': {
    id: 'avalanche-mainnet',
    name: 'Avalanche C-Chain',
    blockchain: 'avalanche',
    environment: 'mainnet',
    rpcUrl: 'https://api.avax.network/ext/bc/C/rpc',
    explorerUrl: 'https://snowtrace.io',
    nativeToken: {
      symbol: 'AVAX',
      name: 'Avalanche',
      decimals: 18,
    },
    features: {
      hasTokens: true,
      hasNFTs: true,
      hasStaking: true,
    },
  },
  'avalanche-testnet': {
    id: 'avalanche-testnet',
    name: 'Avalanche Fuji Testnet',
    blockchain: 'avalanche',
    environment: 'testnet',
    rpcUrl: 'https://api.avax-test.network/ext/bc/C/rpc',
    explorerUrl: 'https://testnet.snowtrace.io',
    nativeToken: {
      symbol: 'AVAX',
      name: 'Avalanche',
      decimals: 18,
    },
    features: {
      hasTokens: true,
      hasNFTs: true,
      hasStaking: false,
    },
  },
};

// Default network for new users
export const DEFAULT_NETWORK_ID = 'tron-testnet';

// Get network by ID
export function getNetwork(networkId: string): NetworkConfig {
  return NETWORKS[networkId] || NETWORKS[DEFAULT_NETWORK_ID];
}

// Get all networks for a blockchain
export function getNetworksByBlockchain(blockchain: string): NetworkConfig[] {
  return Object.values(NETWORKS).filter(n => n.blockchain === blockchain);
}

// Check if network is testnet
export function isTestnet(networkId: string): boolean {
  const network = getNetwork(networkId);
  return network.environment === 'testnet' || network.environment === 'devnet';
}

// Get mainnet equivalent of a testnet
export function getMainnetNetwork(testnetId: string): NetworkConfig | null {
  const testnet = getNetwork(testnetId);
  const mainnet = Object.values(NETWORKS).find(
    n => n.blockchain === testnet.blockchain && n.environment === 'mainnet'
  );
  return mainnet || null;
}
