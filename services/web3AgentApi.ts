/**
 * HeySalad Web3 Agent API Client
 * Provides integration with the HeySalad Web3 Agent for shopping, payments, and AI chat
 * Base URL: https://heysalad-web3-agent.heysalad-o.workers.dev
 * 
 * Requirements: 6.1, 6.2, 6.3, 6.4
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { Linking } from 'react-native';
import { logger } from '@/utils/logger';

// =============================================================================
// Configuration
// =============================================================================

const BASE_URL = 'https://heysalad-web3-agent.heysalad-o.workers.dev';
const AUTH_TOKEN_KEY = 'web3_agent_token';
const WALLET_ADDRESS_KEY = 'web3_agent_wallet';

// =============================================================================
// Types
// =============================================================================

export type SupportedChain = 'bnb' | 'avalanche';
export type ShoppingStore = 'tesco' | 'sainsburys' | 'asda' | 'ocado';
export type PaymentStatus = 'pending' | 'completed' | 'failed' | 'expired';
export type SessionStatus = 'in_progress' | 'completed' | 'failed' | 'paused';
export type Intent = 'shopping' | 'payment' | 'blockchain' | 'contract' | 'unknown';

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}

// Auth Types
export interface AuthChallenge {
  message: string;
  expiresAt: number;
}

export interface AuthSession {
  token: string;
  expiresAt: number;
}

export interface SessionInfo {
  walletAddress: string;
  createdAt: number;
  expiresAt: number;
}

// Payment Types
export interface PaymentRequest {
  id: string;
  amount: string;
  amountFormatted: string;
  asset: string;
  recipient: string;
  chain: SupportedChain;
  description: string;
  status: PaymentStatus;
  transactionHash?: string;
  payerAddress?: string;
  createdAt: number;
  expiresAt: number;
  completedAt?: number;
  qrCode: {
    deepLink: string;
    walletConnectUri: string;
    dataUrl: string;
  };
}

export interface CreatePaymentParams {
  amount: number;
  description: string;
  chain?: SupportedChain;
  metadata?: Record<string, unknown>;
}

export interface PaymentProof {
  transactionHash: string;
  signature: string;
  timestamp: number;
}

export interface PaymentVerificationResult {
  paymentId: string;
  status: string;
  transactionHash?: string;
  message?: string;
}

// Shopping Types
export interface ItemPreferences {
  brand?: string;
  organic?: boolean;
  dietary?: ('vegetarian' | 'vegan' | 'gluten-free' | 'dairy-free')[];
  maxPrice?: number;
}

export interface ShoppingItem {
  name: string;
  quantity: number;
  preferences?: ItemPreferences;
}

export interface CartItem {
  productId: string;
  name: string;
  quantity: number;
  price: number;
  imageUrl?: string;
  brand?: string;
}

export interface SubstituteItem {
  originalItem: string;
  substitute: CartItem;
  reason: string;
  matchScore: number;
}

export interface Address {
  line1: string;
  line2?: string;
  city: string;
  postcode: string;
  country: string;
}

export interface ShoppingParams {
  userId: string;
  store: ShoppingStore;
  items: ShoppingItem[];
  deliveryAddress: Address;
  budgetLimit?: number;
  allowSubstitutes: boolean;
}

export interface ShoppingResult {
  sessionId: string;
  itemsAdded: CartItem[];
  itemsUnavailable: string[];
  substitutes: SubstituteItem[];
  cartTotal: number;
  deliveryFee: number;
  paymentLink: string;
}

export interface ShoppingSession {
  id: string;
  userId: string;
  store: ShoppingStore;
  status: SessionStatus;
  cartItems: CartItem[];
  itemsUnavailable: string[];
  substitutes: SubstituteItem[];
  cartTotal: number;
  deliveryFee: number;
  paymentLink?: string;
  lastCheckpoint: string;
  errorMessage?: string;
  createdAt: number;
  updatedAt: number;
}

// Chat Types
export interface ChatParams {
  message: string;
  userId?: string;
  sessionId?: string;
}

export interface ChatAction {
  type: 'payment' | 'shopping' | 'info';
  data: unknown;
}

export interface ChatResponse {
  message: string;
  intent: Intent;
  confidence: number;
  entities?: {
    items?: ShoppingItem[];
    store?: ShoppingStore;
    amount?: number;
    currency?: string;
    recipient?: string;
    chain?: SupportedChain;
  };
  action?: ChatAction;
  needsClarification?: boolean;
  clarification?: {
    questions: string[];
    suggestedIntent?: Intent;
  };
}

// Agent Types
export interface AgentCapabilities {
  shopping: boolean;
  payments: boolean;
  aiChat: boolean;
  contractGeneration: boolean;
  supportedChains: SupportedChain[];
  supportedStores: ShoppingStore[];
}

export interface AgentInfo {
  registered: boolean;
  address?: string;
  publicKey?: string;
  capabilities: AgentCapabilities;
  registeredAt?: number;
  updatedAt?: number;
  registrationTx?: string;
  message?: string;
}

// =============================================================================
// Token Management
// =============================================================================

async function getAuthToken(): Promise<string | null> {
  try {
    return await AsyncStorage.getItem(AUTH_TOKEN_KEY);
  } catch (error) {
    logger.error('[Web3AgentApi] Error getting auth token:', error);
    return null;
  }
}

async function setAuthToken(token: string): Promise<void> {
  try {
    await AsyncStorage.setItem(AUTH_TOKEN_KEY, token);
  } catch (error) {
    logger.error('[Web3AgentApi] Error setting auth token:', error);
  }
}

async function clearAuthToken(): Promise<void> {
  try {
    await AsyncStorage.removeItem(AUTH_TOKEN_KEY);
    await AsyncStorage.removeItem(WALLET_ADDRESS_KEY);
  } catch (error) {
    logger.error('[Web3AgentApi] Error clearing auth token:', error);
  }
}

async function setWalletAddress(address: string): Promise<void> {
  try {
    await AsyncStorage.setItem(WALLET_ADDRESS_KEY, address);
  } catch (error) {
    logger.error('[Web3AgentApi] Error setting wallet address:', error);
  }
}

export async function getStoredWalletAddress(): Promise<string | null> {
  try {
    return await AsyncStorage.getItem(WALLET_ADDRESS_KEY);
  } catch (error) {
    logger.error('[Web3AgentApi] Error getting wallet address:', error);
    return null;
  }
}

// =============================================================================
// HTTP Client
// =============================================================================

async function request<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  try {
    const token = await getAuthToken();
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
    };

    // Merge additional headers from options
    if (options.headers) {
      const optHeaders = options.headers as Record<string, string>;
      Object.assign(headers, optHeaders);
    }

    const url = `${BASE_URL}${endpoint}`;
    logger.log(`[Web3AgentApi] ${options.method || 'GET'} ${endpoint}`);

    const response = await fetch(url, {
      ...options,
      headers,
    });

    const data = (await response.json()) as ApiResponse<T>;

    if (!response.ok) {
      logger.error(`[Web3AgentApi] Request failed: ${response.status}`, data);
      return {
        success: false,
        error: data.error || `Request failed with status ${response.status}`,
      };
    }

    return data as ApiResponse<T>;
  } catch (error) {
    logger.error('[Web3AgentApi] Request error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    };
  }
}

// =============================================================================
// Authentication API - Requirements 6.1
// =============================================================================

/**
 * Request authentication challenge for wallet signature
 */
export async function requestChallenge(
  walletAddress: string
): Promise<ApiResponse<AuthChallenge>> {
  logger.log('[Web3AgentApi] Requesting auth challenge');
  return request<AuthChallenge>('/api/auth/challenge', {
    method: 'POST',
    body: JSON.stringify({ walletAddress }),
  });
}

/**
 * Authenticate with signed message
 */
export async function authenticate(
  walletAddress: string,
  signature: string,
  message: string
): Promise<ApiResponse<AuthSession>> {
  logger.log('[Web3AgentApi] Authenticating wallet');
  
  const response = await request<AuthSession>('/api/auth/authenticate', {
    method: 'POST',
    body: JSON.stringify({ walletAddress, signature, message }),
  });

  if (response.success && response.data?.token) {
    await setAuthToken(response.data.token);
    await setWalletAddress(walletAddress);
  }

  return response;
}

/**
 * Verify current session
 */
export async function verifySession(): Promise<ApiResponse<SessionInfo>> {
  logger.log('[Web3AgentApi] Verifying session');
  return request<SessionInfo>('/api/auth/session');
}

/**
 * Logout and invalidate session
 */
export async function logout(): Promise<ApiResponse<{ message: string }>> {
  logger.log('[Web3AgentApi] Logging out');
  const response = await request<{ message: string }>('/api/auth/logout', {
    method: 'POST',
  });
  await clearAuthToken();
  return response;
}

// =============================================================================
// Payment API - Requirements 6.3, 6.4
// =============================================================================

/**
 * Create a new payment request
 */
export async function createPayment(
  params: CreatePaymentParams
): Promise<ApiResponse<PaymentRequest>> {
  logger.log('[Web3AgentApi] Creating payment:', {
    amount: params.amount,
    chain: params.chain,
  });
  return request<PaymentRequest>('/api/payment/create', {
    method: 'POST',
    body: JSON.stringify(params),
  });
}

/**
 * Get payment request by ID
 */
export async function getPayment(
  paymentId: string
): Promise<ApiResponse<PaymentRequest>> {
  logger.log('[Web3AgentApi] Getting payment:', paymentId);
  return request<PaymentRequest>(`/api/payment/${paymentId}`);
}

/**
 * Verify a payment with proof
 */
export async function verifyPayment(
  paymentId: string,
  proof: PaymentProof
): Promise<ApiResponse<PaymentVerificationResult>> {
  logger.log('[Web3AgentApi] Verifying payment:', paymentId);
  return request<PaymentVerificationResult>('/api/payment/verify', {
    method: 'POST',
    body: JSON.stringify({ paymentId, proof }),
  });
}

/**
 * Open payment deep link in wallet
 * Requirements: 6.3
 */
export async function openPaymentDeepLink(deepLink: string): Promise<boolean> {
  try {
    const canOpen = await Linking.canOpenURL(deepLink);
    if (canOpen) {
      await Linking.openURL(deepLink);
      return true;
    }
    logger.warn('[Web3AgentApi] Cannot open deep link:', deepLink);
    return false;
  } catch (error) {
    logger.error('[Web3AgentApi] Error opening deep link:', error);
    return false;
  }
}

// =============================================================================
// Shopping API - Requirements 6.2
// =============================================================================

/**
 * Start autonomous shopping session
 */
export async function startShopping(
  params: ShoppingParams
): Promise<ApiResponse<ShoppingResult>> {
  logger.log('[Web3AgentApi] Starting shopping:', {
    store: params.store,
    itemCount: params.items.length,
  });
  return request<ShoppingResult>('/api/shop/start', {
    method: 'POST',
    body: JSON.stringify(params),
  });
}

/**
 * Get shopping session status
 */
export async function getShoppingSession(
  sessionId: string
): Promise<ApiResponse<ShoppingSession>> {
  logger.log('[Web3AgentApi] Getting shopping session:', sessionId);
  return request<ShoppingSession>(`/api/shop/status/${sessionId}`);
}

/**
 * Resume a paused shopping session
 */
export async function resumeShopping(
  sessionId: string
): Promise<ApiResponse<ShoppingResult>> {
  logger.log('[Web3AgentApi] Resuming shopping session:', sessionId);
  return request<ShoppingResult>(`/api/shop/resume/${sessionId}`, {
    method: 'POST',
  });
}

/**
 * Get user's shopping sessions
 */
export async function getUserShoppingSessions(
  userId: string,
  limit?: number
): Promise<ApiResponse<ShoppingSession[]>> {
  logger.log('[Web3AgentApi] Getting user sessions:', userId);
  const params = new URLSearchParams();
  if (limit) params.set('limit', limit.toString());
  return request<ShoppingSession[]>(
    `/api/shop/sessions/${userId}?${params}`
  );
}

// =============================================================================
// Chat API - Requirements 6.2
// =============================================================================

/**
 * Send chat message to AI agent
 */
export async function sendChatMessage(
  params: ChatParams
): Promise<ApiResponse<ChatResponse>> {
  logger.log('[Web3AgentApi] Sending chat message');
  return request<ChatResponse>('/api/chat', {
    method: 'POST',
    body: JSON.stringify(params),
  });
}

// =============================================================================
// Agent Info API
// =============================================================================

/**
 * Get agent capabilities and info
 */
export async function getAgentInfo(): Promise<ApiResponse<AgentInfo>> {
  logger.log('[Web3AgentApi] Getting agent info');
  return request<AgentInfo>('/api/agent/info');
}

/**
 * Health check
 */
export async function healthCheck(): Promise<ApiResponse<{ status: string; agent: string }>> {
  return request<{ status: string; agent: string }>('/health');
}

// =============================================================================
// Deep Link Handling - Requirements 6.3, 6.4
// =============================================================================

export interface PaymentDeepLinkParams {
  paymentId: string;
  amount?: string;
  chain?: SupportedChain;
  action: 'confirm' | 'cancel';
}

/**
 * Parse payment deep link URL
 * Format: heysalad://payment?id=xxx&action=confirm
 */
export function parsePaymentDeepLink(url: string): PaymentDeepLinkParams | null {
  try {
    const parsed = new URL(url);
    
    if (parsed.protocol !== 'heysalad:' || parsed.hostname !== 'payment') {
      return null;
    }

    const paymentId = parsed.searchParams.get('id');
    const action = parsed.searchParams.get('action') as 'confirm' | 'cancel';

    if (!paymentId || !action) {
      return null;
    }

    return {
      paymentId,
      amount: parsed.searchParams.get('amount') || undefined,
      chain: (parsed.searchParams.get('chain') as SupportedChain) || undefined,
      action,
    };
  } catch (error) {
    logger.error('[Web3AgentApi] Error parsing deep link:', error);
    return null;
  }
}

/**
 * Generate payment deep link for HeySalad Wallet
 */
export function generatePaymentDeepLink(
  paymentId: string,
  amount: string,
  chain: SupportedChain = 'bnb'
): string {
  const params = new URLSearchParams({
    id: paymentId,
    amount,
    chain,
    action: 'confirm',
  });
  return `heysalad://payment?${params}`;
}

/**
 * Set up deep link listener for payment callbacks
 * Requirements: 6.4
 */
export function setupPaymentDeepLinkListener(
  onPaymentCallback: (params: PaymentDeepLinkParams) => void
): () => void {
  const handleUrl = (event: { url: string }) => {
    const params = parsePaymentDeepLink(event.url);
    if (params) {
      logger.log('[Web3AgentApi] Payment deep link received:', params);
      onPaymentCallback(params);
    }
  };

  const subscription = Linking.addEventListener('url', handleUrl);

  // Check for initial URL (app opened via deep link)
  Linking.getInitialURL().then(url => {
    if (url) {
      handleUrl({ url });
    }
  });

  return () => {
    subscription.remove();
  };
}

// =============================================================================
// Export as namespace
// =============================================================================

export const web3AgentApi = {
  // Auth
  requestChallenge,
  authenticate,
  verifySession,
  logout,
  getStoredWalletAddress,
  
  // Payments
  createPayment,
  getPayment,
  verifyPayment,
  openPaymentDeepLink,
  
  // Shopping
  startShopping,
  getShoppingSession,
  resumeShopping,
  getUserShoppingSessions,
  
  // Chat
  sendChatMessage,
  
  // Agent
  getAgentInfo,
  healthCheck,
  
  // Deep Links
  parsePaymentDeepLink,
  generatePaymentDeepLink,
  setupPaymentDeepLinkListener,
};
