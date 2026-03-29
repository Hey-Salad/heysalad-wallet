// providers/CloudflareAuthProvider.tsx
// Cloudflare-based authentication provider using heysalad-oauth
import React, { createContext, useContext, useEffect, useState, useRef, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Linking from 'expo-linking';

const OAUTH_BASE_URL = 'https://oauth.heysalad.app';
const AUTH_TOKEN_KEY = 'heysalad_jwt_token';
const USER_KEY = 'heysalad_user';

export interface CloudflareUser {
  id: string;
  email?: string;
  phone?: string;
  tier: 'free' | 'pro' | 'max';
  created_at?: string;
  updated_at?: string;
}

interface ValidateResponse {
  valid: boolean;
  user?: CloudflareUser;
  message?: string;
}

interface MagicLinkResponse {
  success: boolean;
  message?: string;
}

interface CloudflareAuthContextType {
  user: CloudflareUser | null;
  token: string | null;
  loading: boolean;
  error: string | null;
  signInWithMagicLink: (email: string, redirectUrl?: string) => Promise<{ success: boolean; error?: string }>;
  signOut: () => Promise<void>;
  validateToken: () => Promise<boolean>;
  clearError: () => void;
}

const CloudflareAuthContext = createContext<CloudflareAuthContextType | undefined>(undefined);

export function CloudflareAuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<CloudflareUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const isMounted = useRef(true);

  const clearError = useCallback(() => {
    if (isMounted.current) {
      setError(null);
    }
  }, []);

  /**
   * Store auth data in AsyncStorage
   */
  const persistAuth = useCallback(async (authToken: string, authUser: CloudflareUser) => {
    try {
      await AsyncStorage.setItem(AUTH_TOKEN_KEY, authToken);
      await AsyncStorage.setItem(USER_KEY, JSON.stringify(authUser));
    } catch (e) {
      console.error('[CloudflareAuth] Error persisting auth:', e);
    }
  }, []);

  /**
   * Clear auth data from AsyncStorage
   */
  const clearAuth = useCallback(async () => {
    try {
      await AsyncStorage.multiRemove([AUTH_TOKEN_KEY, USER_KEY]);
    } catch (e) {
      console.error('[CloudflareAuth] Error clearing auth:', e);
    }
  }, []);

  /**
   * Validate JWT token with heysalad-oauth
   */
  const validateToken = useCallback(async (): Promise<boolean> => {
    const storedToken = await AsyncStorage.getItem(AUTH_TOKEN_KEY);
    if (!storedToken) {
      return false;
    }

    try {
      console.log('[CloudflareAuth] Validating token...');
      const response = await fetch(`${OAUTH_BASE_URL}/api/auth/validate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${storedToken}`,
        },
      });

      const data = (await response.json()) as ValidateResponse;

      if (data.valid && data.user) {
        console.log('[CloudflareAuth] Token valid, user:', data.user.id);
        if (isMounted.current) {
          setToken(storedToken);
          setUser(data.user);
        }
        return true;
      } else {
        console.log('[CloudflareAuth] Token invalid');
        await clearAuth();
        if (isMounted.current) {
          setToken(null);
          setUser(null);
        }
        return false;
      }
    } catch (e) {
      console.error('[CloudflareAuth] Token validation error:', e);
      return false;
    }
  }, [clearAuth]);

  /**
   * Send magic link email via heysalad-oauth
   */
  const signInWithMagicLink = useCallback(async (
    email: string,
    redirectUrl: string = 'heysalad://auth/callback'
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      console.log('[CloudflareAuth] Sending magic link to:', email);
      
      const response = await fetch(`${OAUTH_BASE_URL}/api/auth/send-magic-link`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, redirectUrl }),
      });

      const data = (await response.json()) as MagicLinkResponse;

      if (data.success) {
        console.log('[CloudflareAuth] Magic link sent successfully');
        return { success: true };
      } else {
        console.error('[CloudflareAuth] Magic link error:', data.message);
        return { success: false, error: data.message || 'Failed to send magic link' };
      }
    } catch (e) {
      console.error('[CloudflareAuth] Magic link exception:', e);
      return { success: false, error: 'Network error. Please check your connection.' };
    }
  }, []);

  /**
   * Sign out and clear all auth data
   */
  const signOut = useCallback(async () => {
    console.log('[CloudflareAuth] Signing out');
    await clearAuth();
    if (isMounted.current) {
      setUser(null);
      setToken(null);
      setError(null);
    }
  }, [clearAuth]);

  /**
   * Handle deep link callback with JWT token
   */
  const handleDeepLink = useCallback(async (url: string) => {
    console.log('[CloudflareAuth] Deep link received:', url);

    // heysalad-oauth returns token as query param: heysalad://auth/callback?token=xxx
    const urlObj = new URL(url);
    const tokenParam = urlObj.searchParams.get('token');

    if (tokenParam) {
      console.log('[CloudflareAuth] Token found in deep link');
      
      // Validate the token immediately
      try {
        const response = await fetch(`${OAUTH_BASE_URL}/api/auth/validate`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${tokenParam}`,
          },
        });

        const data = (await response.json()) as ValidateResponse;

        if (data.valid && data.user) {
          console.log('[CloudflareAuth] Token validated, user:', data.user.id);
          await persistAuth(tokenParam, data.user);
          if (isMounted.current) {
            setToken(tokenParam);
            setUser(data.user);
          }
        } else {
          console.error('[CloudflareAuth] Token from deep link is invalid');
          if (isMounted.current) {
            setError('Authentication failed. Please try again.');
          }
        }
      } catch (e) {
        console.error('[CloudflareAuth] Error validating deep link token:', e);
        if (isMounted.current) {
          setError('Authentication error. Please try again.');
        }
      }
    }
  }, [persistAuth]);

  // Initialize auth state on mount
  useEffect(() => {
    isMounted.current = true;

    const initAuth = async () => {
      console.log('[CloudflareAuth] Initializing...');
      
      try {
        // Try to restore session from storage
        const storedToken = await AsyncStorage.getItem(AUTH_TOKEN_KEY);
        const storedUser = await AsyncStorage.getItem(USER_KEY);

        if (storedToken && storedUser) {
          console.log('[CloudflareAuth] Found stored session, validating...');
          const isValid = await validateToken();
          
          if (!isValid) {
            console.log('[CloudflareAuth] Stored token invalid, clearing');
            await clearAuth();
          }
        } else {
          console.log('[CloudflareAuth] No stored session');
        }
      } catch (e) {
        console.error('[CloudflareAuth] Init error:', e);
      } finally {
        if (isMounted.current) {
          setLoading(false);
        }
      }
    };

    initAuth();

    // Listen for deep links
    const subscription = Linking.addEventListener('url', (event) => {
      handleDeepLink(event.url);
    });

    // Check initial URL (app opened from deep link)
    Linking.getInitialURL().then((url) => {
      if (url) {
        handleDeepLink(url);
      }
    });

    return () => {
      isMounted.current = false;
      subscription.remove();
    };
  }, [validateToken, clearAuth, handleDeepLink]);

  const value = {
    user,
    token,
    loading,
    error,
    signInWithMagicLink,
    signOut,
    validateToken,
    clearError,
  };

  return (
    <CloudflareAuthContext.Provider value={value}>
      {children}
    </CloudflareAuthContext.Provider>
  );
}

export function useCloudflareAuth() {
  const context = useContext(CloudflareAuthContext);
  if (context === undefined) {
    throw new Error('useCloudflareAuth must be used within a CloudflareAuthProvider');
  }
  return context;
}
