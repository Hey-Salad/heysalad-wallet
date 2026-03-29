// services/adapters/MidnightServiceAdapter.ts
// Adapter for Midnight Network - Privacy-preserving ZK blockchain
// Implements private transactions where amounts are hidden using zero-knowledge proofs

import {
  BlockchainService,
  BlockchainAccount,
  TransactionParams,
  TransactionResult,
  PrivateTransactionParams,
  PrivateTransactionResult,
  ProofVerificationResult,
} from '@/types/blockchain';
import { getNetwork } from '@/config/networks';

// Midnight uses different address format than TRON
const MIDNIGHT_ADDRESS_REGEX = /^midnight1[a-z0-9]{38,}$/i;

export default class MidnightServiceAdapter implements BlockchainService {
  private networkId: string;
  private baseUrl: string;
  private explorerBase: string;
  private isTestnet: boolean;

  constructor(networkId: string) {
    this.networkId = networkId;
    const network = getNetwork(networkId);
    this.baseUrl = network.rpcUrl;
    this.explorerBase = network.explorerUrl;
    this.isTestnet = network.environment === 'testnet';
    
    console.log(`[MidnightAdapter] Initialized for ${networkId}`, {
      rpcUrl: this.baseUrl,
      isTestnet: this.isTestnet,
    });
  }

  /**
   * Check if this service supports private transactions
   */
  supportsPrivateTransactions(): boolean {
    return true;
  }

  /**
   * Get account information from Midnight network
   */
  async getAccount(address: string): Promise<BlockchainAccount> {
    try {
      console.log('[MidnightAdapter] Fetching account:', address);
      
      // Call Midnight RPC to get account balance
      const response = await fetch(`${this.baseUrl}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jsonrpc: '2.0',
          method: 'midnight_getBalance',
          params: [address],
          id: 1,
        }),
      });

      if (!response.ok) {
        console.log('[MidnightAdapter] Account not found or network error');
        return { address, balance: 0, balanceRaw: '0' };
      }

      const data = await response.json();
      
      if (data.result) {
        const balanceRaw = data.result;
        const balance = parseInt(balanceRaw, 16) / 1e8; // DUST has 8 decimals
        
        return {
          address,
          balance,
          balanceRaw: balanceRaw.toString(),
        };
      }

      return { address, balance: 0, balanceRaw: '0' };
    } catch (error) {
      console.error('[MidnightAdapter] Failed to fetch account:', error);
      return { address, balance: 0, balanceRaw: '0' };
    }
  }

  /**
   * Get balance in native token (DUST)
   */
  async getBalance(address: string): Promise<number> {
    const account = await this.getAccount(address);
    return account.balance;
  }

  /**
   * Validate Midnight address format
   */
  validateAddress(address: string): boolean {
    // Midnight addresses start with 'midnight1' followed by bech32 encoding
    // For testnet compatibility, also accept addresses starting with 'test1'
    if (this.isTestnet) {
      return /^(midnight1|test1)[a-z0-9]{38,}$/i.test(address);
    }
    return MIDNIGHT_ADDRESS_REGEX.test(address);
  }

  /**
   * Create a standard (non-private) transaction
   */
  async createTransaction(params: TransactionParams): Promise<any> {
    const { from, to, amount } = params;
    const amountRaw = Math.floor(amount * 1e8); // Convert to smallest unit

    console.log('[MidnightAdapter] Creating transaction:', { from, to, amount });

    const response = await fetch(`${this.baseUrl}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        method: 'midnight_createTransaction',
        params: [{
          from,
          to,
          amount: amountRaw,
          private: false,
        }],
        id: 1,
      }),
    });

    if (!response.ok) {
      throw new Error(`Failed to create transaction: ${response.status}`);
    }

    const data = await response.json();
    
    if (data.error) {
      throw new Error(data.error.message || 'Transaction creation failed');
    }

    return data.result;
  }

  /**
   * Sign transaction with private key
   */
  signTransaction(transaction: any, privateKey: string): string {
    // In production, this would use Midnight's cryptographic signing
    // For now, we'll create a placeholder signature
    console.log('[MidnightAdapter] Signing transaction');
    
    // The actual implementation would use @midnight-network/sdk
    // return midnightSdk.signTransaction(transaction, privateKey);
    
    return `sig_${transaction.txHash}_${Date.now()}`;
  }

  /**
   * Broadcast signed transaction to network
   */
  async broadcastTransaction(signedTransaction: any): Promise<TransactionResult> {
    try {
      console.log('[MidnightAdapter] Broadcasting transaction');

      const response = await fetch(`${this.baseUrl}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jsonrpc: '2.0',
          method: 'midnight_sendTransaction',
          params: [signedTransaction],
          id: 1,
        }),
      });

      if (!response.ok) {
        throw new Error(`Broadcast failed: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.error) {
        return {
          success: false,
          txid: '',
          explorerUrl: '',
          error: data.error.message,
        };
      }

      const txid = data.result.txHash;
      
      return {
        success: true,
        txid,
        explorerUrl: this.getExplorerUrl(txid),
      };
    } catch (error: any) {
      return {
        success: false,
        txid: '',
        explorerUrl: '',
        error: error.message,
      };
    }
  }

  /**
   * Send a PRIVATE transaction using zero-knowledge proofs
   * The amount is hidden from public view on the blockchain
   */
  async sendPrivateTransaction(params: PrivateTransactionParams): Promise<PrivateTransactionResult> {
    const { from, to, amount, privateKey, memo } = params;
    
    console.log('[MidnightAdapter] 🔒 Creating PRIVATE transaction:', {
      from: from.slice(0, 12) + '...',
      to: to.slice(0, 12) + '...',
      amount: 'HIDDEN', // Don't log the actual amount for privacy
    });

    try {
      // Step 1: Generate ZK proof that proves:
      // - Sender has sufficient balance
      // - Amount is positive
      // - Transaction is valid
      // WITHOUT revealing the actual amount
      
      const proofResponse = await fetch(`${this.baseUrl}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jsonrpc: '2.0',
          method: 'midnight_generatePrivateTransferProof',
          params: [{
            from,
            to,
            amount: Math.floor(amount * 1e8),
            memo: memo || '',
          }],
          id: 1,
        }),
      });

      if (!proofResponse.ok) {
        throw new Error('Failed to generate ZK proof');
      }

      const proofData = await proofResponse.json();
      
      if (proofData.error) {
        throw new Error(proofData.error.message || 'Proof generation failed');
      }

      const { proof, publicInputs } = proofData.result;

      // Step 2: Create the private transaction with the ZK proof
      const txResponse = await fetch(`${this.baseUrl}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jsonrpc: '2.0',
          method: 'midnight_sendPrivateTransaction',
          params: [{
            from,
            to,
            proof,
            publicInputs,
            signature: this.signPrivateTransaction(proof, privateKey),
          }],
          id: 2,
        }),
      });

      if (!txResponse.ok) {
        throw new Error('Failed to send private transaction');
      }

      const txData = await txResponse.json();
      
      if (txData.error) {
        throw new Error(txData.error.message || 'Private transaction failed');
      }

      const { txHash, proofHash } = txData.result;

      console.log('[MidnightAdapter] ✅ Private transaction sent:', {
        txHash: txHash.slice(0, 16) + '...',
        proofHash: proofHash.slice(0, 16) + '...',
      });

      return {
        success: true,
        txHash,
        proofHash,
        explorerUrl: `${this.explorerBase}/tx/${txHash}`,
      };
    } catch (error: any) {
      console.error('[MidnightAdapter] ❌ Private transaction failed:', error);
      return {
        success: false,
        txHash: '',
        proofHash: '',
        explorerUrl: '',
        error: error.message || 'Private transaction failed',
      };
    }
  }

  /**
   * Verify a ZK proof for a private transaction
   * Returns metadata about the transaction without revealing the amount
   */
  async verifyTransactionProof(proofHash: string): Promise<ProofVerificationResult> {
    try {
      console.log('[MidnightAdapter] Verifying proof:', proofHash.slice(0, 16) + '...');

      const response = await fetch(`${this.baseUrl}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jsonrpc: '2.0',
          method: 'midnight_verifyProof',
          params: [proofHash],
          id: 1,
        }),
      });

      if (!response.ok) {
        throw new Error('Proof verification request failed');
      }

      const data = await response.json();
      
      if (data.error) {
        return {
          valid: false,
          from: '',
          to: '',
          timestamp: 0,
          error: data.error.message,
        };
      }

      const { valid, from, to, timestamp } = data.result;

      return {
        valid,
        from,
        to,
        timestamp,
      };
    } catch (error: any) {
      return {
        valid: false,
        from: '',
        to: '',
        timestamp: 0,
        error: error.message,
      };
    }
  }

  /**
   * Sign a private transaction proof
   */
  private signPrivateTransaction(proof: string, privateKey: string): string {
    // In production, this would use Midnight's ZK-friendly signature scheme
    console.log('[MidnightAdapter] Signing private transaction proof');
    return `zk_sig_${proof.slice(0, 8)}_${Date.now()}`;
  }

  /**
   * Get explorer URL for a transaction
   */
  getExplorerUrl(txid: string): string {
    return `${this.explorerBase}/tx/${txid}`;
  }

  /**
   * Estimate transaction fee
   */
  async estimateFee(params: TransactionParams): Promise<number> {
    // Midnight has low fees, similar to other modern L1s
    // Private transactions cost slightly more due to ZK proof verification
    return 0.001; // 0.001 DUST
  }

  /**
   * Get transaction history (shows PRIVATE for amounts on private txs)
   */
  async getTransactions(address: string): Promise<any[]> {
    try {
      const response = await fetch(`${this.baseUrl}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jsonrpc: '2.0',
          method: 'midnight_getTransactions',
          params: [address, { limit: 50 }],
          id: 1,
        }),
      });

      if (!response.ok) {
        return [];
      }

      const data = await response.json();
      
      if (data.result) {
        return data.result.map((tx: any) => ({
          ...tx,
          // Hide amount for private transactions
          amount: tx.isPrivate ? 'PRIVATE' : tx.amount / 1e8,
          type: tx.isPrivate ? 'private_transfer' : 'transfer',
        }));
      }

      return [];
    } catch (error) {
      console.error('[MidnightAdapter] Failed to fetch transactions:', error);
      return [];
    }
  }
}
