// services/cloudflareClient.ts
// API client for HeySalad Cloudflare services integration

import AsyncStorage from '@react-native-async-storage/async-storage';
import { logger } from '@/utils/logger';

const CLOUDFLARE_BASE_URLS = {
  cryptoOnramp: 'https://crypto-onramp.heysalad-o.workers.dev',
  oauth: 'https://oauth.heysalad.app',
  pay: 'https://heysalad-pay.heysalad-o.workers.dev',
  kyc: 'https://heysalad-kyc.heysalad-o.workers.dev',
  walletApi: 'https://heysalad-wallet-api.heysalad-o.workers.dev',
} as const;

const AUTH_TOKEN_KEY = 'heysalad_jwt_token';

interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
}

interface OnrampSessionRequest {
  customerEmail: string;
  customerName?: string;
  walletAddress: string;
  destinationCurrency?: string;
  destinationNetwork?: string;
  sourceAmount?: string;
  sourceCurrency?: string;
}

interface OnrampSessionResponse {
  sessionId: string;
  clientSecret: string;
  publishableKey: string;
  livemode: boolean;
}

interface TransactionNotification {
  email: string;
  transactionType: 'send' | 'receive' | 'swap' | 'onramp';
  amount: string;
  currency: string;
  txHash: string;
  network: string;
}

/**
 * Get stored JWT authentication token
 */
async function getAuthToken(): Promise<string | null> {
  try {
    return await AsyncStorage.getItem(AUTH_TOKEN_KEY);
  } catch (error) {
    logger.error('[CloudflareClient] Error getting auth token:', error);
    return null;
  }
}

/**
 * Store JWT authentication token
 */
export async function setAuthToken(token: string): Promise<void> {
  try {
    await AsyncStorage.setItem(AUTH_TOKEN_KEY, token);
  } catch (error) {
    logger.error('[CloudflareClient] Error setting auth token:', error);
  }
}

/**
 * Clear JWT authentication token
 */
export async function clearAuthToken(): Promise<void> {
  try {
    await AsyncStorage.removeItem(AUTH_TOKEN_KEY);
  } catch (error) {
    logger.error('[CloudflareClient] Error clearing auth token:', error);
  }
}

/**
 * Make authenticated API request to Cloudflare services
 */
async function makeRequest<T>(
  url: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  try {
    const token = await getAuthToken();
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` }),
      ...options.headers,
    };

    const response = await fetch(url, {
      ...options,
      headers,
    });

    const data = await response.json();

    if (!response.ok) {
      logger.error(`[CloudflareClient] Request failed: ${response.status}`, data);
      return {
        success: false,
        error: data.error || `Request failed with status ${response.status}`,
      };
    }

    return {
      success: true,
      data,
    };
  } catch (error) {
    logger.error('[CloudflareClient] Request error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    };
  }
}

// ============================================
// CRYPTO ONRAMP API
// ============================================

export async function createOnrampSession(
  params: OnrampSessionRequest
): Promise<ApiResponse<OnrampSessionResponse>> {
  logger.log('[CloudflareClient] Creating onramp session:', {
    currency: params.destinationCurrency,
    network: params.destinationNetwork,
  });

  return makeRequest<OnrampSessionResponse>(
    `${CLOUDFLARE_BASE_URLS.cryptoOnramp}/api/create-onramp-session`,
    {
      method: 'POST',
      body: JSON.stringify(params),
    }
  );
}

export async function getOnrampSessionStatus(
  sessionId: string
): Promise<ApiResponse<any>> {
  logger.log('[CloudflareClient] Getting onramp session status:', sessionId);

  return makeRequest(
    `${CLOUDFLARE_BASE_URLS.cryptoOnramp}/api/session/${sessionId}`
  );
}

export async function getOnrampConfig(): Promise<ApiResponse<{
  supportedCurrencies: string[];
  supportedNetworks: string[];
  supportedFiatCurrencies: string[];
}>> {
  logger.log('[CloudflareClient] Getting onramp config');

  return makeRequest(
    `${CLOUDFLARE_BASE_URLS.cryptoOnramp}/api/config`
  );
}

// ============================================
// OAUTH API
// ============================================

export async function sendOTP(
  contactInfo: string,
  type: 'phone' | 'email' = 'phone'
): Promise<ApiResponse<{ success: boolean }>> {
  logger.log('[CloudflareClient] Sending OTP to:', type);

  return makeRequest(
    `${CLOUDFLARE_BASE_URLS.oauth}/api/otp/send`,
    {
      method: 'POST',
      body: JSON.stringify({ [type]: contactInfo, type }),
    }
  );
}

export async function verifyOTP(
  contactInfo: string,
  otp: string,
  type: 'phone' | 'email' = 'phone'
): Promise<ApiResponse<{ token: string; user: any }>> {
  logger.log('[CloudflareClient] Verifying OTP');

  const response = await makeRequest<{ token: string; user: any }>(
    `${CLOUDFLARE_BASE_URLS.oauth}/api/otp/verify`,
    {
      method: 'POST',
      body: JSON.stringify({ [type]: contactInfo, otp, type }),
    }
  );

  if (response.success && response.data?.token) {
    await setAuthToken(response.data.token);
  }

  return response;
}

export async function validateToken(): Promise<ApiResponse<{ valid: boolean; user: any }>> {
  logger.log('[CloudflareClient] Validating token');

  return makeRequest(
    `${CLOUDFLARE_BASE_URLS.oauth}/api/validate`
  );
}

// ============================================
// WALLET API (NEW)
// ============================================

/**
 * Send transaction notification email
 */
export async function sendTransactionNotification(
  params: TransactionNotification
): Promise<ApiResponse<{ success: boolean }>> {
  logger.log('[CloudflareClient] Sending transaction notification');

  return makeRequest(
    `${CLOUDFLARE_BASE_URLS.walletApi}/api/notifications/transaction`,
    {
      method: 'POST',
      body: JSON.stringify(params),
    }
  );
}

/**
 * Send welcome email to new user
 */
export async function sendWelcomeEmail(
  email: string,
  name?: string
): Promise<ApiResponse<{ success: boolean }>> {
  logger.log('[CloudflareClient] Sending welcome email');

  return makeRequest(
    `${CLOUDFLARE_BASE_URLS.walletApi}/api/notifications/welcome`,
    {
      method: 'POST',
      body: JSON.stringify({ email, name }),
    }
  );
}

/**
 * Get TRON account info (protected route)
 */
export async function getTronAccountInfo(
  address: string
): Promise<ApiResponse<any>> {
  logger.log('[CloudflareClient] Getting TRON account info');

  return makeRequest(
    `${CLOUDFLARE_BASE_URLS.walletApi}/api/tron/account/${address}`
  );
}

/**
 * Get TRON transactions (protected route)
 */
export async function getTronTransactions(
  address: string,
  limit?: number
): Promise<ApiResponse<any>> {
  logger.log('[CloudflareClient] Getting TRON transactions');

  const params = new URLSearchParams();
  if (limit) params.set('limit', limit.toString());

  return makeRequest(
    `${CLOUDFLARE_BASE_URLS.walletApi}/api/tron/transactions/${address}?${params}`
  );
}

/**
 * Get user profile (protected route)
 */
export async function getUserProfile(): Promise<ApiResponse<any>> {
  logger.log('[CloudflareClient] Getting user profile');

  return makeRequest(
    `${CLOUDFLARE_BASE_URLS.walletApi}/api/users/profile`
  );
}

/**
 * Update user profile (protected route)
 */
export async function updateUserProfile(
  data: { name?: string; email?: string; notificationPreferences?: any }
): Promise<ApiResponse<any>> {
  logger.log('[CloudflareClient] Updating user profile');

  return makeRequest(
    `${CLOUDFLARE_BASE_URLS.walletApi}/api/users/profile`,
    {
      method: 'PUT',
      body: JSON.stringify(data),
    }
  );
}

/**
 * Get transaction history (protected route)
 */
export async function getTransactionHistory(
  params?: { limit?: number; offset?: number; type?: string }
): Promise<ApiResponse<any>> {
  logger.log('[CloudflareClient] Getting transaction history');

  const searchParams = new URLSearchParams();
  if (params?.limit) searchParams.set('limit', params.limit.toString());
  if (params?.offset) searchParams.set('offset', params.offset.toString());
  if (params?.type) searchParams.set('type', params.type);

  return makeRequest(
    `${CLOUDFLARE_BASE_URLS.walletApi}/api/transactions?${searchParams}`
  );
}

// ============================================
// HEALTH CHECKS
// ============================================

export async function checkOnrampHealth(): Promise<ApiResponse<{ status: string }>> {
  return makeRequest(
    `${CLOUDFLARE_BASE_URLS.cryptoOnramp}/health`
  );
}

export async function checkWalletApiHealth(): Promise<ApiResponse<{ status: string }>> {
  return makeRequest(
    `${CLOUDFLARE_BASE_URLS.walletApi}/health`
  );
}

// ============================================
// EXPORT
// ============================================

export const CloudflareAPI = {
  // Auth
  sendOTP,
  verifyOTP,
  validateToken,
  setAuthToken,
  clearAuthToken,
  getAuthToken,

  // Crypto Onramp
  createOnrampSession,
  getOnrampSessionStatus,
  getOnrampConfig,
  checkOnrampHealth,

  // Wallet API
  sendTransactionNotification,
  sendWelcomeEmail,
  getTronAccountInfo,
  getTronTransactions,
  getUserProfile,
  updateUserProfile,
  getTransactionHistory,
  checkWalletApiHealth,
};
