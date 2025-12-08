// providers/CircleWalletProvider.tsx
// Biometric-Secured Wallet Provider for React Native
// Uses Expo LocalAuthentication instead of WebAuthn for mobile compatibility

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Platform, Alert } from 'react-native';
import * as LocalAuthentication from 'expo-local-authentication';
import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useCloudflareAuth } from './CloudflareAuthProvider';
import { generatePrivateKey, privateKeyToAddress } from 'viem/accounts';
import { keccak256, toHex, fromHex } from 'viem';

const WALLET_METADATA_KEY = 'heysalad_circle_wallet';

interface BiometricWallet {
    address: string;
    walletId: string;
    blockchain: 'polygon' | 'base' | 'ethereum';
    createdAt: string;
}

interface CircleWalletContextType {
    wallet: BiometricWallet | null;
    isLoading: boolean;
    error: string | null;
    createPasskeyWallet: (username: string) => Promise<{ address: string }>;
    loadWalletFromCredential: () => Promise<void>;
    isInitialized: boolean;
    isBiometricAvailable: boolean;
}

const CircleWalletContext = createContext<CircleWalletContextType>({
    wallet: null,
    isLoading: false,
    error: null,
    createPasskeyWallet: async () => ({ address: '' }),
    loadWalletFromCredential: async () => {},
    isInitialized: false,
    isBiometricAvailable: false,
});

export const useCircleWallet = () => useContext(CircleWalletContext);

export function CircleWalletProvider({ children }: { children: React.ReactNode }) {
    const { user } = useCloudflareAuth();
    const [wallet, setWallet] = useState<BiometricWallet | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [isInitialized, setIsInitialized] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isBiometricAvailable, setIsBiometricAvailable] = useState(false);

    // Check biometric availability
    useEffect(() => {
        const checkBiometrics = async () => {
            try {
                const compatible = await LocalAuthentication.hasHardwareAsync();
                const enrolled = await LocalAuthentication.isEnrolledAsync();
                setIsBiometricAvailable(compatible && enrolled);

                if (!compatible || !enrolled) {
                    console.warn('[CircleWallet] Biometrics not available');
                }
            } catch (error) {
                console.error('[CircleWallet] Error checking biometrics:', error);
                setIsBiometricAvailable(false);
            }
        };
        checkBiometrics();
    }, []);

    /**
     * Authenticate user with biometrics (Face ID/Touch ID)
     */
    const authenticateWithBiometrics = useCallback(async (promptMessage: string = 'Authenticate to continue'): Promise<boolean> => {
        try {
            const result = await LocalAuthentication.authenticateAsync({
                promptMessage,
                fallbackLabel: 'Use passcode',
                disableDeviceFallback: false,
            });

            return result.success;
        } catch (error) {
            console.error('[CircleWallet] Biometric auth error:', error);
            return false;
        }
    }, []);

    /**
     * Create a new biometric-secured wallet
     */
    const createPasskeyWallet = useCallback(async (username: string): Promise<{ address: string }> => {
        if (!user) {
            throw new Error('User not authenticated');
        }

        if (!isBiometricAvailable) {
            throw new Error('Biometric authentication not available on this device');
        }

        setIsLoading(true);
        setError(null);

        try {
            console.log('[CircleWallet] Creating biometric wallet for:', username);

            // Step 1: Authenticate with biometrics
            const authenticated = await authenticateWithBiometrics('Authenticate to create your wallet');
            if (!authenticated) {
                throw new Error('Biometric authentication failed');
            }

            console.log('[CircleWallet] Biometric authentication successful');

            // Step 2: Generate wallet private key
            const privateKey = generatePrivateKey();
            const walletAddress = privateKeyToAddress(privateKey).toLowerCase();

            console.log('[CircleWallet] Generated wallet address:', walletAddress);

            // Step 3: Store private key in Secure Enclave
            const secureKeyId = `biometric_wallet_${user.id}`;
            await SecureStore.setItemAsync(secureKeyId, privateKey, {
                keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
                requireAuthentication: true,
            });

            console.log('[CircleWallet] Private key stored in Secure Enclave');

            // Step 4: Create wallet metadata
            const walletMetadata = {
                userId: user.id,
                username,
                address: walletAddress,
                walletType: 'circle_passkey',
                isPrimary: true,
                createdAt: new Date().toISOString(),
            };

            // Step 5: Store wallet info in AsyncStorage (local storage)
            try {
                await AsyncStorage.setItem(WALLET_METADATA_KEY, JSON.stringify(walletMetadata));
                console.log('[CircleWallet] Wallet metadata stored locally');
            } catch (storageError) {
                console.error('[CircleWallet] Error storing wallet:', storageError);
                // Clean up secure store on failure
                await SecureStore.deleteItemAsync(secureKeyId);
                throw new Error('Failed to store wallet credentials');
            }

            // Set wallet in state
            const newWallet: BiometricWallet = {
                address: walletAddress,
                walletId: secureKeyId,
                blockchain: 'ethereum', // Default to Ethereum, can be changed
                createdAt: new Date().toISOString(),
            };

            setWallet(newWallet);

            return { address: walletAddress };
        } catch (error) {
            console.error('[CircleWallet] Error creating biometric wallet:', error);
            const errorMessage = error instanceof Error ? error.message : 'Failed to create biometric wallet';
            setError(errorMessage);
            throw error;
        } finally {
            setIsLoading(false);
        }
    }, [user, isBiometricAvailable, authenticateWithBiometrics]);

    /**
     * Load wallet from stored credential in AsyncStorage
     */
    const loadWalletFromCredential = useCallback(async () => {
        if (!user) {
            console.log('[CircleWallet] No user, skipping wallet load');
            setIsInitialized(true);
            return;
        }

        setIsLoading(true);
        setError(null);

        try {
            console.log('[CircleWallet] Loading wallet from local storage...');

            // Query wallet from AsyncStorage
            const walletJson = await AsyncStorage.getItem(WALLET_METADATA_KEY);

            if (!walletJson) {
                console.log('[CircleWallet] No passkey wallet found');
                setIsInitialized(true);
                return;
            }

            const walletData = JSON.parse(walletJson);

            // Verify wallet belongs to current user
            if (walletData.userId !== user.id) {
                console.log('[CircleWallet] Wallet belongs to different user');
                setIsInitialized(true);
                return;
            }

            console.log('[CircleWallet] Found wallet:', walletData.address);

            const secureKeyId = `biometric_wallet_${user.id}`;

            // Verify private key exists in Secure Enclave
            const hasKey = await SecureStore.getItemAsync(secureKeyId);
            if (!hasKey) {
                console.warn('[CircleWallet] Private key not found in Secure Enclave');
                setIsInitialized(true);
                return;
            }

            // Set wallet in state
            const loadedWallet: BiometricWallet = {
                address: walletData.address,
                walletId: secureKeyId,
                blockchain: walletData.blockchain || 'ethereum',
                createdAt: walletData.createdAt,
            };

            setWallet(loadedWallet);

            console.log('[CircleWallet] Wallet loaded successfully');
        } catch (error) {
            console.error('[CircleWallet] Error loading wallet:', error);
            setError(error instanceof Error ? error.message : 'Failed to load wallet');
        } finally {
            setIsLoading(false);
            setIsInitialized(true);
        }
    }, [user]);

    // Load wallet on mount when user is available
    useEffect(() => {
        if (user && !isInitialized) {
            loadWalletFromCredential();
        }
    }, [user, isInitialized, loadWalletFromCredential]);

    const value: CircleWalletContextType = {
        wallet,
        isLoading,
        error,
        createPasskeyWallet,
        loadWalletFromCredential,
        isInitialized,
        isBiometricAvailable,
    };

    return (
        <CircleWalletContext.Provider value={value}>
            {children}
        </CircleWalletContext.Provider>
    );
}
