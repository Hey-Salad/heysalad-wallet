// providers/WalletProviderV2.tsx
// Production-grade wallet provider using service architecture

import { useCallback, useEffect, useMemo, useState } from "react";
import createContextHook from "@nkzw/create-context-hook";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useQueryClient } from "@tanstack/react-query";

// Import our services
import * as CryptoService from "@/services/CryptoService";
import * as TronService from "@/services/TronService";
import * as BiometricService from "@/services/BiometricService";
import { useNetwork } from "@/providers/NetworkProvider";
import { getBlockchainService } from "@/services/BlockchainFactory";

const STORAGE_KEY = "heysalad_wallet_v2";

export type WalletState = {
  address: string;
  balance: number;
  tronBalance: number;
  tokenBalance: number;
  transactions: any[];
  iouRequests: any[];
  onboarding: {
    hasCompletedOnboarding: boolean;
    walletSetupComplete: boolean;
    firstLaunch: boolean;
  };
  isSetup: boolean;
  needsSetup: boolean;
  biometricEnabled: boolean;
  biometricAvailable: boolean;
};

const defaultWallet: WalletState = {
  address: "",
  balance: 0,
  tronBalance: 0,
  tokenBalance: 0,
  transactions: [],
  iouRequests: [],
  onboarding: {
    hasCompletedOnboarding: false,
    walletSetupComplete: false,
    firstLaunch: true,
  },
  isSetup: false,
  needsSetup: true,
  biometricEnabled: false,
  biometricAvailable: false,
};

/**
 * Load wallet from storage
 */
async function loadWallet(): Promise<WalletState> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);

    if (!raw) {
      console.log('[WalletProviderV2] No wallet found in storage');
      return { ...defaultWallet, needsSetup: true };
    }

    const parsed = JSON.parse(raw) as Partial<WalletState>;
    console.log('[WalletProviderV2] Loaded wallet from storage:', parsed.address);

    const merged: WalletState = {
      ...defaultWallet,
      ...parsed,
      needsSetup: !parsed.isSetup || !parsed.address,
      address: parsed.address ?? defaultWallet.address,
      balance: parsed.balance ?? parsed.tronBalance ?? defaultWallet.balance,
      tronBalance: parsed.tronBalance ?? parsed.balance ?? defaultWallet.tronBalance,
    };

    return merged;
  } catch (error) {
    console.error("[WalletProviderV2] Failed to load wallet:", error);
    return { ...defaultWallet, needsSetup: true };
  }
}

/**
 * Save wallet to storage
 */
async function saveWallet(wallet: WalletState): Promise<void> {
  try {
    // Don't save sensitive data to AsyncStorage
    const safeWallet = { ...wallet };
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(safeWallet));
    console.log('[WalletProviderV2] Wallet saved to storage');
  } catch (error) {
    console.error('[WalletProviderV2] Failed to save wallet:', error);
  }
}

export const [WalletProviderV2, useWalletV2] = createContextHook(() => {
  const [wallet, setWallet] = useState<WalletState>(defaultWallet);
  const [isLoading, setIsLoading] = useState(false);
  const queryClient = useQueryClient();
  const { networkId } = useNetwork();

  // Initialize wallet on mount
  useEffect(() => {
    const initializeWallet = async () => {
      try {
        // Load wallet from storage
        const loaded = await loadWallet();

        // Check biometric availability
        const biometricAvailable = await BiometricService.isBiometricAvailable();

        // Check if private key exists in secure storage
        const hasKey = await BiometricService.hasPrivateKey();

        console.log('[WalletProviderV2] Wallet initialized:', {
          address: loaded.address,
          isSetup: loaded.isSetup,
          biometricAvailable,
          hasSecureKey: hasKey,
        });

        setWallet({
          ...loaded,
          biometricAvailable,
          biometricEnabled: hasKey,
        });
      } catch (error) {
        console.error('[WalletProviderV2] Failed to initialize wallet:', error);
      }
    };

    initializeWallet();
  }, []);

  /**
   * Refresh wallet balance from blockchain
   */
  const refreshBalance = useCallback(async () => {
    if (!wallet.address) {
      console.log('[WalletProviderV2] No address to refresh balance for');
      return;
    }

    try {
      console.log('[WalletProviderV2] Refreshing balance on network:', networkId);

      // Use network-aware blockchain service
      const blockchainService = getBlockchainService(networkId);
      const balance = await blockchainService.getBalance(wallet.address);

      console.log('[WalletProviderV2] Balance fetched:', balance, 'TRX on', networkId);

      setWallet((prev) => {
        const updated = {
          ...prev,
          balance,
          tronBalance: balance,
        };
        saveWallet(updated);
        return updated;
      });

      console.log('[WalletProviderV2] Balance updated in state');
    } catch (error) {
      console.error('[WalletProviderV2] Failed to refresh balance:', error);
      // Set balance to 0 on error to avoid showing stale data
      setWallet((prev) => ({
        ...prev,
        balance: 0,
        tronBalance: 0,
      }));
    }
  }, [wallet.address, networkId]);

  // Refresh balance when wallet address changes (initial load)
  useEffect(() => {
    if (wallet.address && wallet.isSetup && !wallet.needsSetup) {
      console.log('[WalletProviderV2] Initial balance refresh for:', wallet.address);
      refreshBalance();
    }
  }, [wallet.address, wallet.isSetup]);

  // Refresh balance when network changes
  useEffect(() => {
    if (wallet.address && wallet.isSetup && !wallet.needsSetup) {
      console.log('[WalletProviderV2] Network changed to:', networkId, '- refreshing balance');
      refreshBalance();
    }
  }, [networkId]);

  /**
   * Create a new wallet
   */
  const createWallet = useCallback(async (): Promise<{ address: string; privateKey: string }> => {
    try {
      console.log('[WalletProviderV2] Creating new wallet...');

      // Generate key pair with address
      const keyPair = await CryptoService.generateKeyPair();

      console.log('[WalletProviderV2] Wallet created:', {
        address: keyPair.address,
      });

      return {
        address: keyPair.address,
        privateKey: keyPair.privateKey,
      };
    } catch (error) {
      console.error('[WalletProviderV2] Failed to create wallet:', error);
      throw new Error('Failed to create wallet. Please try again.');
    }
  }, []);

  /**
   * Import wallet from private key
   */
  const importWallet = useCallback(async (privateKey: string): Promise<string> => {
    try {
      console.log('[WalletProviderV2] Importing wallet...');

      // Import and derive address
      const keyPair = await CryptoService.importFromPrivateKey(privateKey);

      console.log('[WalletProviderV2] Wallet imported:', {
        address: keyPair.address,
      });

      return keyPair.address;
    } catch (error) {
      console.error('[WalletProviderV2] Failed to import wallet:', error);
      throw error;
    }
  }, []);

  /**
   * Setup wallet with address and optionally store private key
   */
  const setupWallet = useCallback(
    async (address: string, privateKey?: string) => {
      try {
        console.log('[WalletProviderV2] Setting up wallet:', address);

        let biometricEnabled = false;

        // Store private key securely if provided
        if (privateKey) {
          const stored = await BiometricService.storePrivateKey(privateKey, true);
          biometricEnabled = stored;

          if (stored) {
            console.log('[WalletProviderV2] Private key stored with biometric protection');
          } else {
            console.log('[WalletProviderV2] Failed to store private key securely');
          }
        }

        // Update wallet state
        const newWallet: WalletState = {
          ...wallet,
          address,
          isSetup: true,
          needsSetup: false,
          biometricEnabled,
          onboarding: {
            ...wallet.onboarding,
            walletSetupComplete: true,
            firstLaunch: false,
          },
        };

        setWallet(newWallet);
        await saveWallet(newWallet);

        console.log('[WalletProviderV2] Wallet setup complete');

        // Fetch initial balance
        setTimeout(() => refreshBalance(), 1000);
      } catch (error) {
        console.error('[WalletProviderV2] Failed to setup wallet:', error);
        throw error;
      }
    },
    [wallet, refreshBalance]
  );

  /**
   * Complete onboarding process
   */
  const completeOnboarding = useCallback(async () => {
    try {
      console.log('[WalletProviderV2] Completing onboarding...');

      const updatedWallet: WalletState = {
        ...wallet,
        onboarding: {
          ...wallet.onboarding,
          hasCompletedOnboarding: true,
        },
      };

      setWallet(updatedWallet);
      await saveWallet(updatedWallet);

      console.log('[WalletProviderV2] Onboarding completed');
    } catch (error) {
      console.error('[WalletProviderV2] Failed to complete onboarding:', error);
    }
  }, [wallet]);

  /**
   * Reset wallet (delete all data)
   */
  const resetWallet = useCallback(async () => {
    try {
      console.log('[WalletProviderV2] Resetting wallet...');

      // Delete from AsyncStorage
      await AsyncStorage.removeItem(STORAGE_KEY);

      // Delete private key from secure storage
      await BiometricService.deletePrivateKey();

      // Reset state
      setWallet({ ...defaultWallet, needsSetup: true });

      console.log('[WalletProviderV2] Wallet reset complete');
    } catch (error) {
      console.error('[WalletProviderV2] Failed to reset wallet:', error);
    }
  }, []);

  /**
   * Send TRX to another address
   */
  const send = useCallback(
    async (toAddress: string, amountTrx: number) => {
      console.log('[WalletProviderV2] Send transaction initiated:', {
        toAddress,
        amountTrx,
        fromAddress: wallet.address,
        currentBalance: wallet.balance,
      });

      // Validate amount
      if (amountTrx <= 0) {
        throw new Error('Amount must be greater than 0');
      }

      // Validate balance
      if (amountTrx > wallet.balance) {
        throw new Error(
          `Insufficient balance. You have ${wallet.balance.toFixed(2)} TRX, trying to send ${amountTrx} TRX`
        );
      }

      // Validate address
      if (!TronService.isValidTronAddress(toAddress)) {
        throw new Error('Invalid recipient address');
      }

      setIsLoading(true);

      try {
        // Step 1: Authenticate with biometrics
        console.log('[WalletProviderV2] Step 1: Biometric authentication...');
        const authenticated = await BiometricService.authenticate(
          `Authorize transaction of ${amountTrx} TRX to ${toAddress.slice(0, 8)}...`,
          {
            cancelLabel: 'Cancel Transaction',
            fallbackLabel: 'Use Passcode',
          }
        );

        if (!authenticated) {
          throw new Error('Biometric authentication failed or cancelled');
        }

        console.log('[WalletProviderV2] ✅ Authentication successful');

        // Step 2: Retrieve private key
        console.log('[WalletProviderV2] Step 2: Retrieving private key...');
        const privateKey = await BiometricService.getPrivateKey(false); // Already authenticated

        if (!privateKey) {
          throw new Error('Failed to retrieve private key');
        }

        console.log('[WalletProviderV2] ✅ Private key retrieved');

        // Step 3: Send transaction
        console.log('[WalletProviderV2] Step 3: Sending transaction...');
        const result = await TronService.sendTrx(
          wallet.address,
          toAddress,
          amountTrx,
          privateKey
        );

        if (!result.success) {
          throw new Error(result.error || 'Transaction failed');
        }

        console.log('[WalletProviderV2] ✅ Transaction successful:', {
          txid: result.txid,
          explorerUrl: result.explorerUrl,
        });

        // Refresh balance after successful transaction
        setTimeout(() => refreshBalance(), 5000);

        return {
          result: true,
          txid: result.txid,
          explorerUrl: result.explorerUrl,
          success: true,
        };
      } catch (error: any) {
        console.error('[WalletProviderV2] ❌ Transaction failed:', error);
        throw error;
      } finally {
        setIsLoading(false);
      }
    },
    [wallet, refreshBalance]
  );

  /**
   * Add IOU request
   */
  const addIOU = useCallback(
    async (amount: number, description: string) => {
      try {
        const request = {
          id: Date.now().toString(),
          amount,
          description,
          status: 'pending',
          createdAt: new Date().toISOString(),
        };

        const updatedWallet = {
          ...wallet,
          iouRequests: [...wallet.iouRequests, request],
        };

        setWallet(updatedWallet);
        await saveWallet(updatedWallet);

        console.log('[WalletProviderV2] IOU request added');
      } catch (error) {
        console.error('[WalletProviderV2] Failed to add IOU:', error);
      }
    },
    [wallet]
  );

  /**
   * Settle IOU request
   */
  const settleIOU = useCallback(
    async (requestId: string) => {
      try {
        const updatedRequests = wallet.iouRequests.map((req) =>
          req.id === requestId ? { ...req, status: 'settled' } : req
        );

        const updatedWallet = {
          ...wallet,
          iouRequests: updatedRequests,
        };

        setWallet(updatedWallet);
        await saveWallet(updatedWallet);

        console.log('[WalletProviderV2] IOU settled:', requestId);
      } catch (error) {
        console.error('[WalletProviderV2] Failed to settle IOU:', error);
      }
    },
    [wallet]
  );

  const value = useMemo(
    () => ({
      wallet,
      refreshBalance,
      createWallet,
      importWallet,
      setupWallet,
      completeOnboarding,
      resetWallet,
      send,
      addIOU,
      settleIOU,
      isLoading,
    }),
    [
      wallet,
      refreshBalance,
      createWallet,
      importWallet,
      setupWallet,
      completeOnboarding,
      resetWallet,
      send,
      addIOU,
      settleIOU,
      isLoading,
    ]
  );

  return value;
});
