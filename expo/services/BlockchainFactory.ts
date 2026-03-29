// services/BlockchainFactory.ts
// Factory pattern for multi-chain support
// Add new blockchains here!

import { BlockchainService } from '@/types/blockchain';
import { getNetwork } from '@/config/networks';
import TronServiceAdapter from './adapters/TronServiceAdapter';
import MidnightServiceAdapter from './adapters/MidnightServiceAdapter';
// Future imports:
// import SolanaServiceAdapter from './adapters/SolanaServiceAdapter';
// import PolkadotServiceAdapter from './adapters/PolkadotServiceAdapter';
// import AvalancheServiceAdapter from './adapters/AvalancheServiceAdapter';

/**
 * Get blockchain service for a specific network
 * Automatically selects the right adapter based on blockchain type
 */
export function getBlockchainService(networkId: string): BlockchainService {
  const network = getNetwork(networkId);

  switch (network.blockchain) {
    case 'tron':
      return new TronServiceAdapter(networkId);

    case 'midnight':
      return new MidnightServiceAdapter(networkId);

    // Future blockchain support:
    // case 'solana':
    //   return new SolanaServiceAdapter(networkId);

    // case 'polkadot':
    //   return new PolkadotServiceAdapter(networkId);

    // case 'avalanche':
    //   return new AvalancheServiceAdapter(networkId);

    // case 'ethereum':
    // case 'polygon':
    //   return new EvmServiceAdapter(networkId);

    default:
      throw new Error(`Unsupported blockchain: ${network.blockchain}`);
  }
}

/**
 * Check if a blockchain is supported
 */
export function isBlockchainSupported(blockchain: string): boolean {
  const supportedChains = ['tron', 'midnight'];
  return supportedChains.includes(blockchain);
}

/**
 * Get list of all supported blockchains
 */
export function getSupportedBlockchains(): string[] {
  return ['tron', 'midnight']; // Will expand: ['tron', 'midnight', 'solana', 'polkadot', 'avalanche']
}

/**
 * Check if a network supports private transactions
 */
export function supportsPrivateTransactions(networkId: string): boolean {
  const network = getNetwork(networkId);
  return network.features.hasPrivateTransactions === true;
}
