// services/TronService.ts
// Production-grade TRON blockchain operations

import { signTransactionHash } from './CryptoService';

export interface TronAccount {
  address: string;
  balance: number; // in TRX
  balanceSun: number; // in SUN (1 TRX = 1,000,000 SUN)
}

export interface TransactionResult {
  success: boolean;
  txid: string;
  explorerUrl: string;
  error?: string;
}

export interface CreateTransactionResponse {
  visible?: boolean;
  txID: string;
  raw_data: any;
  raw_data_hex: string;
}

const SUN_TO_TRX = 1_000_000;

/**
 * Get TronGrid configuration from environment
 */
function getTronGridConfig() {
  const baseUrl = process.env.EXPO_PUBLIC_TRONGRID_URL || 'https://nile.trongrid.io';
  const apiKey = process.env.EXPO_PUBLIC_TRONGRID_API_KEY;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (apiKey) {
    headers['TRON-PRO-API-KEY'] = apiKey;
  }

  const isTestnet = baseUrl.includes('nile') || baseUrl.includes('shasta');
  const explorerBase = isTestnet
    ? 'https://nile.tronscan.org/#/transaction/'
    : 'https://tronscan.org/#/transaction/';

  return { baseUrl, headers, explorerBase, isTestnet };
}

/**
 * Fetch account information from TRON network
 * @param address - TRON address
 * @returns Account information
 */
export async function getAccount(address: string): Promise<TronAccount> {
  try {
    console.log('[TronService] Fetching account:', address);
    const { baseUrl, headers } = getTronGridConfig();

    const response = await fetch(`${baseUrl}/v1/accounts/${address}`, {
      method: 'GET',
      headers,
    });

    // 400 means account doesn't exist yet (new address with no transactions)
    if (response.status === 400) {
      console.log('[TronService] Account not activated yet - needs to receive first transaction');
      return {
        address,
        balance: 0,
        balanceSun: 0,
      };
    }

    if (!response.ok) {
      throw new Error(`Failed to fetch account: ${response.status}`);
    }

    const data = await response.json();

    if (data.success && data.data?.length > 0) {
      const accountData = data.data[0];
      const balanceSun = accountData.balance || 0;
      const balanceTrx = balanceSun / SUN_TO_TRX;

      console.log('[TronService] Account fetched:', {
        address,
        balance: `${balanceTrx} TRX`,
        balanceSun: `${balanceSun} SUN`,
      });

      return {
        address,
        balance: balanceTrx,
        balanceSun,
      };
    }

    // Account not found or has no balance
    console.log('[TronService] Account not found or has zero balance');
    return {
      address,
      balance: 0,
      balanceSun: 0,
    };
  } catch (error) {
    console.error('[TronService] Failed to fetch account:', error);
    // Return 0 balance for new accounts instead of throwing
    console.log('[TronService] Returning 0 balance for new/inactive account');
    return {
      address,
      balance: 0,
      balanceSun: 0,
    };
  }
}

/**
 * Get account balance in TRX
 * @param address - TRON address
 * @returns Balance in TRX
 */
export async function getBalance(address: string): Promise<number> {
  try {
    const account = await getAccount(address);
    return account.balance;
  } catch (error) {
    console.error('[TronService] Failed to get balance:', error);
    return 0;
  }
}

/**
 * Create a transfer transaction
 * @param from - Sender address
 * @param to - Recipient address
 * @param amountTrx - Amount in TRX
 * @returns Transaction data
 */
async function createTransaction(
  from: string,
  to: string,
  amountTrx: number
): Promise<CreateTransactionResponse> {
  try {
    console.log('[TronService] Creating transaction:', {
      from,
      to,
      amount: `${amountTrx} TRX`,
    });

    const { baseUrl, headers } = getTronGridConfig();
    const amountSun = Math.floor(amountTrx * SUN_TO_TRX);

    const response = await fetch(`${baseUrl}/wallet/createtransaction`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        owner_address: from,
        to_address: to,
        amount: amountSun,
        visible: true,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[TronService] Create transaction failed:', response.status, errorText);
      throw new Error(`Failed to create transaction: ${response.status}`);
    }

    const transaction = await response.json();

    if (!transaction.txID || !transaction.raw_data_hex) {
      console.error('[TronService] Invalid transaction response:', transaction);
      throw new Error(transaction.Error || 'Invalid transaction response');
    }

    console.log('[TronService] Transaction created:', {
      txID: transaction.txID,
      hasRawData: !!transaction.raw_data,
    });

    return transaction;
  } catch (error) {
    console.error('[TronService] Failed to create transaction:', error);
    throw error;
  }
}

/**
 * Broadcast a signed transaction
 * @param signedTransaction - Transaction with signature
 * @returns Broadcast result
 */
async function broadcastTransaction(signedTransaction: any): Promise<any> {
  try {
    console.log('[TronService] Broadcasting transaction...');
    const { baseUrl, headers } = getTronGridConfig();

    const response = await fetch(`${baseUrl}/wallet/broadcasttransaction`, {
      method: 'POST',
      headers,
      body: JSON.stringify(signedTransaction),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[TronService] Broadcast failed:', response.status, errorText);
      throw new Error(`Failed to broadcast transaction: ${response.status}`);
    }

    const result = await response.json();
    console.log('[TronService] Broadcast result:', result);

    return result;
  } catch (error) {
    console.error('[TronService] Failed to broadcast transaction:', error);
    throw error;
  }
}

/**
 * Send TRX from one address to another
 * @param from - Sender address
 * @param to - Recipient address
 * @param amountTrx - Amount in TRX
 * @param privateKey - Private key for signing
 * @returns Transaction result
 */
export async function sendTrx(
  from: string,
  to: string,
  amountTrx: number,
  privateKey: string
): Promise<TransactionResult> {
  try {
    console.log('[TronService] Initiating TRX transfer:', {
      from,
      to,
      amount: amountTrx,
    });

    // Validate inputs
    if (amountTrx <= 0) {
      throw new Error('Amount must be greater than 0');
    }

    if (!from.startsWith('T') || !to.startsWith('T')) {
      throw new Error('Invalid TRON address format');
    }

    // Check balance
    const balance = await getBalance(from);
    if (balance < amountTrx) {
      throw new Error(`Insufficient balance. Available: ${balance.toFixed(2)} TRX, Required: ${amountTrx} TRX`);
    }

    // Step 1: Create transaction
    const transaction = await createTransaction(from, to, amountTrx);

    // Step 2: Sign transaction
    const signature = signTransactionHash(transaction.txID, privateKey);

    // Step 3: Add signature to transaction
    const signedTransaction = {
      ...transaction,
      signature: [signature],
    };

    console.log('[TronService] Transaction signed:', {
      txID: transaction.txID,
      signatureLength: signature.length,
    });

    // Step 4: Broadcast transaction
    const broadcastResult = await broadcastTransaction(signedTransaction);

    const { explorerBase } = getTronGridConfig();
    const txid = broadcastResult.txid || transaction.txID;
    const success = broadcastResult.result === true;

    if (!success && broadcastResult.code) {
      console.error('[TronService] Broadcast error:', broadcastResult.code, broadcastResult.message);

      // For signature errors, provide helpful message
      if (broadcastResult.code === 'SIGERROR') {
        return {
          success: false,
          txid,
          explorerUrl: `${explorerBase}${txid}`,
          error: 'Transaction signature verification failed. This may be a temporary issue.',
        };
      }

      return {
        success: false,
        txid,
        explorerUrl: `${explorerBase}${txid}`,
        error: broadcastResult.message || 'Transaction broadcast failed',
      };
    }

    console.log('[TronService] Transaction successful:', {
      txid,
      explorerUrl: `${explorerBase}${txid}`,
    });

    return {
      success: true,
      txid,
      explorerUrl: `${explorerBase}${txid}`,
    };
  } catch (error: any) {
    console.error('[TronService] Transaction failed:', error);
    return {
      success: false,
      txid: '',
      explorerUrl: '',
      error: error.message || 'Transaction failed',
    };
  }
}

/**
 * Get transaction details
 * @param txid - Transaction ID
 * @returns Transaction information
 */
export async function getTransaction(txid: string): Promise<any> {
  try {
    console.log('[TronService] Fetching transaction:', txid);
    const { baseUrl, headers } = getTronGridConfig();

    const response = await fetch(`${baseUrl}/wallet/gettransactionbyid`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ value: txid }),
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch transaction: ${response.status}`);
    }

    const transaction = await response.json();
    console.log('[TronService] Transaction fetched:', transaction);

    return transaction;
  } catch (error) {
    console.error('[TronService] Failed to fetch transaction:', error);
    throw error;
  }
}

/**
 * Validate TRON address format
 * @param address - Address to validate
 * @returns true if valid
 */
export function isValidTronAddress(address: string): boolean {
  return (
    typeof address === 'string' &&
    address.length === 34 &&
    address.startsWith('T') &&
    /^[A-Za-z1-9]+$/.test(address)
  );
}

export default {
  getAccount,
  getBalance,
  sendTrx,
  getTransaction,
  isValidTronAddress,
};
