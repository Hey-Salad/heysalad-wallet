// types/blockchain.ts
// Multi-chain blockchain type definitions
// Supports: TRON, Solana, Polkadot, Avalanche, and more

export type BlockchainNetwork =
  | 'tron'
  | 'solana'
  | 'polkadot'
  | 'avalanche'
  | 'ethereum'
  | 'polygon'
  | 'base';

export type NetworkEnvironment = 'mainnet' | 'testnet' | 'devnet';

export interface NetworkConfig {
  id: string;
  name: string;
  blockchain: BlockchainNetwork;
  environment: NetworkEnvironment;
  rpcUrl: string;
  explorerUrl: string;
  nativeToken: {
    symbol: string;
    name: string;
    decimals: number;
  };
  features: {
    hasTokens: boolean;
    hasNFTs: boolean;
    hasStaking: boolean;
  };
}

export interface BlockchainAccount {
  address: string;
  balance: number; // in native token
  balanceRaw: string; // raw balance string
  tokens?: TokenBalance[];
}

export interface TokenBalance {
  contractAddress: string;
  symbol: string;
  name: string;
  balance: number;
  decimals: number;
  logo?: string;
}

export interface TransactionParams {
  from: string;
  to: string;
  amount: number;
  token?: string; // optional token contract address
  memo?: string;
}

export interface TransactionResult {
  success: boolean;
  txid: string;
  explorerUrl: string;
  error?: string;
}

export interface BlockchainService {
  // Account operations
  getAccount(address: string): Promise<BlockchainAccount>;
  getBalance(address: string): Promise<number>;
  validateAddress(address: string): boolean;

  // Transaction operations
  createTransaction(params: TransactionParams): Promise<any>;
  signTransaction(transaction: any, privateKey: string): string;
  broadcastTransaction(signedTransaction: any): Promise<TransactionResult>;

  // Utility
  getExplorerUrl(txid: string): string;
  estimateFee(params: TransactionParams): Promise<number>;
}
