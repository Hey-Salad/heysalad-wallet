// services/BiometricService.ts
// Production-grade biometric authentication and secure storage

import * as LocalAuthentication from 'expo-local-authentication';
import * as SecureStore from 'expo-secure-store';

const SECURE_KEY_STORAGE = 'heysalad_private_key_v1';

export interface BiometricCapabilities {
  hasHardware: boolean;
  isEnrolled: boolean;
  supportedTypes: LocalAuthentication.AuthenticationType[];
}

/**
 * Check device biometric capabilities
 * @returns Biometric capabilities
 */
export async function checkBiometricCapabilities(): Promise<BiometricCapabilities> {
  try {
    const hasHardware = await LocalAuthentication.hasHardwareAsync();
    const isEnrolled = await LocalAuthentication.isEnrolledAsync();
    const supportedTypes = await LocalAuthentication.supportedAuthenticationTypesAsync();

    console.log('[BiometricService] Capabilities:', {
      hasHardware,
      isEnrolled,
      supportedTypes: supportedTypes.map(type =>
        type === LocalAuthentication.AuthenticationType.FINGERPRINT
          ? 'Fingerprint'
          : type === LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION
          ? 'Face ID'
          : 'Iris'
      ),
    });

    return {
      hasHardware,
      isEnrolled,
      supportedTypes,
    };
  } catch (error) {
    console.error('[BiometricService] Failed to check capabilities:', error);
    return {
      hasHardware: false,
      isEnrolled: false,
      supportedTypes: [],
    };
  }
}

/**
 * Check if biometric authentication is available
 * @returns true if biometrics can be used
 */
export async function isBiometricAvailable(): Promise<boolean> {
  const { hasHardware, isEnrolled } = await checkBiometricCapabilities();
  return hasHardware && isEnrolled;
}

/**
 * Authenticate user with biometrics
 * @param reason - Reason to show to user
 * @param options - Authentication options
 * @returns true if authenticated successfully
 */
export async function authenticate(
  reason: string,
  options?: {
    cancelLabel?: string;
    fallbackLabel?: string;
    disableDeviceFallback?: boolean;
  }
): Promise<boolean> {
  try {
    console.log('[BiometricService] Requesting authentication:', reason);

    // Check if biometrics available
    const available = await isBiometricAvailable();
    if (!available) {
      console.log('[BiometricService] Biometrics not available, allowing operation');
      return true; // Allow operation if biometrics not available
    }

    // Authenticate
    const result = await LocalAuthentication.authenticateAsync({
      promptMessage: reason,
      cancelLabel: options?.cancelLabel || 'Cancel',
      fallbackLabel: options?.fallbackLabel || 'Use Passcode',
      disableDeviceFallback: options?.disableDeviceFallback || false,
    });

    console.log('[BiometricService] Authentication result:', {
      success: result.success,
      error: result.error,
    });

    return result.success;
  } catch (error) {
    console.error('[BiometricService] Authentication failed:', error);
    return false;
  }
}

/**
 * Store private key securely with biometric protection
 * @param privateKey - Private key to store
 * @param requireBiometric - Whether to require biometric authentication on retrieval
 * @returns true if stored successfully
 */
export async function storePrivateKey(
  privateKey: string,
  requireBiometric: boolean = true
): Promise<boolean> {
  try {
    console.log('[BiometricService] Storing private key securely...');

    const options: SecureStore.SecureStoreOptions = {};

    if (requireBiometric) {
      const available = await isBiometricAvailable();
      if (available) {
        options.requireAuthentication = true;
        options.authenticationPrompt = 'Authenticate to store your private key securely';
      } else {
        console.log('[BiometricService] Biometric not available, storing without biometric protection');
      }
    }

    await SecureStore.setItemAsync(SECURE_KEY_STORAGE, privateKey, options);

    console.log('[BiometricService] Private key stored successfully');
    return true;
  } catch (error) {
    console.error('[BiometricService] Failed to store private key:', error);

    // Fallback: Try without authentication requirement
    try {
      console.log('[BiometricService] Retrying without biometric protection...');
      await SecureStore.setItemAsync(SECURE_KEY_STORAGE, privateKey);
      console.log('[BiometricService] Private key stored without biometric protection');
      return true;
    } catch (fallbackError) {
      console.error('[BiometricService] Complete storage failure:', fallbackError);
      return false;
    }
  }
}

/**
 * Retrieve private key from secure storage
 * @param requireAuth - Whether to require authentication
 * @returns Private key or null if not found
 */
export async function getPrivateKey(requireAuth: boolean = true): Promise<string | null> {
  try {
    console.log('[BiometricService] Retrieving private key...');

    const options: SecureStore.SecureStoreOptions = {};

    if (requireAuth) {
      const available = await isBiometricAvailable();
      if (available) {
        options.requireAuthentication = true;
        options.authenticationPrompt = 'Authenticate to access your private key';
      }
    }

    const privateKey = await SecureStore.getItemAsync(SECURE_KEY_STORAGE, options);

    if (privateKey) {
      console.log('[BiometricService] Private key retrieved successfully');
    } else {
      console.log('[BiometricService] No private key found');
    }

    return privateKey;
  } catch (error) {
    console.error('[BiometricService] Failed to retrieve private key:', error);

    // Fallback: Try without authentication requirement
    try {
      console.log('[BiometricService] Retrying without biometric authentication...');
      const privateKey = await SecureStore.getItemAsync(SECURE_KEY_STORAGE);

      if (privateKey) {
        console.log('[BiometricService] Private key retrieved without biometric auth');
      }

      return privateKey;
    } catch (fallbackError) {
      console.error('[BiometricService] Complete retrieval failure:', fallbackError);
      return null;
    }
  }
}

/**
 * Delete private key from secure storage
 * @returns true if deleted successfully
 */
export async function deletePrivateKey(): Promise<boolean> {
  try {
    console.log('[BiometricService] Deleting private key...');
    await SecureStore.deleteItemAsync(SECURE_KEY_STORAGE);
    console.log('[BiometricService] Private key deleted successfully');
    return true;
  } catch (error) {
    console.error('[BiometricService] Failed to delete private key:', error);
    return false;
  }
}

/**
 * Check if private key exists in secure storage
 * @returns true if key exists
 */
export async function hasPrivateKey(): Promise<boolean> {
  try {
    const key = await SecureStore.getItemAsync(SECURE_KEY_STORAGE);
    return key !== null;
  } catch (error) {
    console.error('[BiometricService] Failed to check private key existence:', error);
    return false;
  }
}

/**
 * Authenticate and get private key in one operation
 * @param reason - Reason to show to user
 * @returns Private key or null if authentication failed
 */
export async function authenticateAndGetPrivateKey(reason: string): Promise<string | null> {
  try {
    // First authenticate
    const authenticated = await authenticate(reason);

    if (!authenticated) {
      console.log('[BiometricService] Authentication cancelled or failed');
      return null;
    }

    // Then retrieve key
    const privateKey = await getPrivateKey(false); // Already authenticated

    return privateKey;
  } catch (error) {
    console.error('[BiometricService] Failed to authenticate and get key:', error);
    return null;
  }
}

export default {
  checkBiometricCapabilities,
  isBiometricAvailable,
  authenticate,
  storePrivateKey,
  getPrivateKey,
  deletePrivateKey,
  hasPrivateKey,
  authenticateAndGetPrivateKey,
};
