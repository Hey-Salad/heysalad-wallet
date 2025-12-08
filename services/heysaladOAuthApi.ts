/**
 * HeySalad OAuth API Service
 * Provides authentication via the HeySalad OAuth Cloudflare Worker
 * Base URL: https://oauth.heysalad.app
 */

const BASE_URL = 'https://oauth.heysalad.app';

// ============================================
// TYPES
// ============================================

export interface SendOTPRequest {
  phone: string;
}

export interface SendOTPResponse {
  success: boolean;
  message?: string;
}

export interface VerifyOTPRequest {
  phone: string;
  code: string;
}

export interface VerifyOTPResponse {
  success: boolean;
  token?: string;
  user?: {
    id: string;
    phone?: string;
    email?: string;
    tier?: string;
  };
  message?: string;
}

export interface SendMagicLinkRequest {
  email: string;
  redirectUrl?: string;
}

export interface ValidateTokenResponse {
  valid: boolean;
  user?: {
    id: string;
    phone?: string;
    email?: string;
    tier?: string;
  };
}

// ============================================
// HTTP CLIENT
// ============================================

async function request<T>(
  url: string,
  options: RequestInit = {}
): Promise<T> {
  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || `HTTP ${response.status}`);
    }

    return data;
  } catch (error) {
    console.error('[HeySaladOAuth] Request error:', error);
    throw error;
  }
}

// ============================================
// OTP AUTHENTICATION
// ============================================

/**
 * Send OTP to phone number (supports international numbers)
 */
export async function sendOTP(phone: string): Promise<SendOTPResponse> {
  return request<SendOTPResponse>(`${BASE_URL}/api/auth/send-otp`, {
    method: 'POST',
    body: JSON.stringify({ phone }),
  });
}

/**
 * Verify OTP code and receive JWT token
 */
export async function verifyOTP(phone: string, code: string): Promise<VerifyOTPResponse> {
  return request<VerifyOTPResponse>(`${BASE_URL}/api/auth/verify-otp`, {
    method: 'POST',
    body: JSON.stringify({ phone, code }),
  });
}

// ============================================
// MAGIC LINK AUTHENTICATION
// ============================================

/**
 * Send magic link to email
 */
export async function sendMagicLink(
  email: string,
  redirectUrl?: string
): Promise<SendOTPResponse> {
  return request<SendOTPResponse>(`${BASE_URL}/api/auth/send-magic-link`, {
    method: 'POST',
    body: JSON.stringify({ email, redirectUrl }),
  });
}

/**
 * Verify magic link token (optional - usually done by backend redirect)
 */
export async function verifyMagicLink(token: string): Promise<VerifyOTPResponse> {
  return request<VerifyOTPResponse>(`${BASE_URL}/api/auth/verify-magic-link`, {
    method: 'POST',
    body: JSON.stringify({ token }),
  });
}

// ============================================
// TOKEN VALIDATION
// ============================================

/**
 * Validate current JWT token
 */
export async function validateToken(token: string): Promise<ValidateTokenResponse> {
  return request<ValidateTokenResponse>(`${BASE_URL}/api/auth/validate`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
}

// ============================================
// HEALTH CHECK
// ============================================

/**
 * Check OAuth service health
 */
export async function healthCheck(): Promise<{ status: string; service: string }> {
  return request<{ status: string; service: string }>(`${BASE_URL}/health`);
}

// ============================================
// EXPORT AS NAMESPACE
// ============================================

export const heysaladOAuthApi = {
  sendOTP,
  verifyOTP,
  sendMagicLink,
  verifyMagicLink,
  validateToken,
  healthCheck,
};
