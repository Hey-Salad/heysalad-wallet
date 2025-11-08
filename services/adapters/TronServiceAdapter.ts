// services/adapters/TronServiceAdapter.ts
// Adapter to make TronService compatible with BlockchainService interface

import { BlockchainService, BlockchainAccount, TransactionParams, TransactionResult } from '@/types/blockchain';
import { getNetwork } from '@/config/networks';
import { signTransactionHash } from '../CryptoService';

export default class TronServiceAdapter implements BlockchainService {
  private networkId: string;
  private baseUrl: string;
  private apiKey: string | undefined;
  private explorerBase: string;

  constructor(networkId: string) {
    this.networkId = networkId;
    const network = getNetwork(networkId);

    // Use environment variable if available, otherwise use config
    this.baseUrl = process.env.EXPO_PUBLIC_TRONGRID_URL || network.rpcUrl;
    this.apiKey = process.env.EXPO_PUBLIC_TRONGRID_API_KEY;
    this.explorerBase = network.explorerUrl;
  }

  private getHeaders(): Record<string, string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (this.apiKey) {
      headers['TRON-PRO-API-KEY'] = this.apiKey;
    }
    return headers;
  }

  async getAccount(address: string): Promise<BlockchainAccount> {
    try {
      console.log('[TronAdapter] Fetching account:', address);
      const response = await fetch(`${this.baseUrl}/v1/accounts/${address}`, {
        method: 'GET',
        headers: this.getHeaders(),
      });

      // 400 means account doesn't exist yet (new address)
      if (response.status === 400) {
        console.log('[TronAdapter] Account not activated yet');
        return {
          address,
          balance: 0,
          balanceRaw: '0',
        };
      }

      if (!response.ok) {
        throw new Error(`Failed to fetch account: ${response.status}`);
      }

      const data = await response.json();

      if (data.success && data.data?.length > 0) {
        const accountData = data.data[0];
        const balanceSun = accountData.balance || 0;
        const balanceTrx = balanceSun / 1_000_000;

        return {
          address,
          balance: balanceTrx,
          balanceRaw: balanceSun.toString(),
        };
      }

      return {
        address,
        balance: 0,
        balanceRaw: '0',
      };
    } catch (error) {
      console.error('[TronAdapter] Failed to fetch account:', error);
      return {
        address,
        balance: 0,
        balanceRaw: '0',
      };
    }
  }

  async getBalance(address: string): Promise<number> {
    const account = await this.getAccount(address);
    return account.balance;
  }

  validateAddress(address: string): boolean {
    return (
      typeof address === 'string' &&
      address.length === 34 &&
      address.startsWith('T') &&
      /^[A-Za-z1-9]+$/.test(address)
    );
  }

  async createTransaction(params: TransactionParams): Promise<any> {
    const { from, to, amount } = params;
    const amountSun = Math.floor(amount * 1_000_000);

    const response = await fetch(`${this.baseUrl}/wallet/createtransaction`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({
        owner_address: from,
        to_address: to,
        amount: amountSun,
        visible: true,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to create transaction: ${response.status}`);
    }

    const transaction = await response.json();

    if (!transaction.txID || !transaction.raw_data_hex) {
      throw new Error(transaction.Error || 'Invalid transaction response');
    }

    return transaction;
  }

  signTransaction(transaction: any, privateKey: string): string {
    return signTransactionHash(transaction.txID, privateKey);
  }

  async broadcastTransaction(signedTransaction: any): Promise<TransactionResult> {
    try {
      const response = await fetch(`${this.baseUrl}/wallet/broadcasttransaction`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify(signedTransaction),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Broadcast failed: ${response.status}`);
      }

      const result = await response.json();
      const txid = result.txid || signedTransaction.txID;
      const success = result.result === true;

      return {
        success,
        txid,
        explorerUrl: this.getExplorerUrl(txid),
        error: success ? undefined : (result.message || 'Broadcast failed'),
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

  getExplorerUrl(txid: string): string {
    return `${this.explorerBase}/#/transaction/${txid}`;
  }

  async estimateFee(params: TransactionParams): Promise<number> {
    // TRON typically has very low fees, often free for basic transfers
    // Could call /wallet/gettransactionsign to get actual fee
    return 0; // Free for basic TRX transfers with bandwidth
  }
}
