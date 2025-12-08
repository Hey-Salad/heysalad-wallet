// providers/SupabaseProvider.tsx
import 'react-native-url-polyfill/auto'; // MUST be imported before @supabase/supabase-js
import React, { createContext, useContext, useEffect, useState, useRef, useCallback } from 'react';
import { createClient, SupabaseClient, User, Session } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Linking from 'expo-linking';
import { classifyNetworkError, NetworkError } from '@/utils/networkError';
import { withTimeout, withRetry, DEFAULT_RETRY_CONFIG, RetryConfig } from '@/utils/retry';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!;

console.log('[SupabaseProvider] Initializing with URL:', supabaseUrl ? 'SET' : 'MISSING');
console.log('[SupabaseProvider] Anon key:', supabaseAnonKey ? 'SET' : 'MISSING');

// Create Supabase client with AsyncStorage for React Native
const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

interface Profile {
  auth_user_id: string;
  username: string;
  email?: string;
  phone?: string;
  created_at: string;
  updated_at: string;
}

interface SupabaseContextType {
  supabase: SupabaseClient;
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  loading: boolean;
  lastError: NetworkError | null;
  consecutiveTimeouts: number;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  clearError: () => void;
}

const SupabaseContext = createContext<SupabaseContextType | undefined>(undefined);

export function SupabaseProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastError, setLastError] = useState<NetworkError | null>(null);
  const [consecutiveTimeouts, setConsecutiveTimeouts] = useState(0);
  
  // Track if component is mounted to prevent state updates after unmount
  const isMounted = useRef(true);

  /**
   * Clears the last error state
   */
  const clearError = useCallback(() => {
    if (isMounted.current) {
      setLastError(null);
    }
  }, []);

  /**
   * Fetch user profile from database with timeout and retry
   * **Validates: Requirements 2.1, 2.2, 2.3, 2.5**
   */
  const fetchProfile = useCallback(async (userId: string): Promise<Profile | null> => {
    try {
      console.log('[SupabaseProvider] Fetching profile for user:', userId);
      const startTime = Date.now();

      // Use shorter timeout for profile fetch (5s) - it's a simple query
      const profileRetryConfig: RetryConfig = {
        ...DEFAULT_RETRY_CONFIG,
        timeout: 5000, // 5 seconds instead of 15
        maxRetries: 1, // Only 1 retry for profile fetch
      };

      const result = await withRetry(
        async () => {
          const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('auth_user_id', userId)
            .single();

          if (error) {
            // If profile doesn't exist (PGRST116), that's expected for new users
            if (error.code === 'PGRST116') {
              console.log('[SupabaseProvider] No profile found - user needs to create one');
              return null;
            }
            throw error;
          }

          return data as Profile;
        },
        profileRetryConfig,
        (attempt, error) => {
          console.log(`[SupabaseProvider] Profile fetch retry ${attempt}: ${error.type}`);
          if (error.type === 'timeout' && isMounted.current) {
            setConsecutiveTimeouts(prev => prev + 1);
          }
        }
      );

      const duration = Date.now() - startTime;
      console.log(`[SupabaseProvider] Profile fetched in ${duration}ms:`, result?.username || 'null');
      
      // Reset consecutive timeouts on success
      if (isMounted.current) {
        setConsecutiveTimeouts(0);
        setLastError(null);
      }
      
      return result;
    } catch (error) {
      const networkError = error as NetworkError;
      console.error('[SupabaseProvider] Error fetching profile:', {
        type: networkError.type,
        message: networkError.message,
      });
      
      if (isMounted.current) {
        setLastError(networkError);
        
        // Track consecutive timeouts
        if (networkError.type === 'timeout') {
          setConsecutiveTimeouts(prev => {
            const newCount = prev + 1;
            if (newCount >= 2) {
              console.warn('[SupabaseProvider] Multiple consecutive timeouts detected. Please check your network connection.');
            }
            return newCount;
          });
        }
      }
      
      return null;
    }
  }, []);

  const refreshProfile = useCallback(async () => {
    if (user) {
      const profileData = await fetchProfile(user.id);
      if (isMounted.current) {
        setProfile(profileData);
      }
    }
  }, [user, fetchProfile]);

  const signOut = useCallback(async () => {
    console.log('[SupabaseProvider] Signing out');
    await supabase.auth.signOut();
    if (isMounted.current) {
      setUser(null);
      setSession(null);
      setProfile(null);
      setLastError(null);
      setConsecutiveTimeouts(0);
    }
  }, []);

  useEffect(() => {
    console.log('[SupabaseProvider] useEffect starting...');
    isMounted.current = true;

    // Safety timeout - if loading takes more than 15 seconds, force it to complete
    // **Validates: Requirements 2.2, 2.4**
    const safetyTimeout = setTimeout(() => {
      console.error('[SupabaseProvider] ⚠️ Safety timeout (15s) triggered! Forcing loading to false.');
      console.error('[SupabaseProvider] This may indicate network issues or Supabase configuration problems.');
      if (isMounted.current) {
        setLoading(false);
        setLastError({
          type: 'timeout',
          message: 'Request timed out. Please try again.',
          retryable: true,
        });
        setConsecutiveTimeouts(prev => prev + 1);
      }
    }, 15000);

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        console.log('[SupabaseProvider] Auth state changed:', _event, session?.user?.id);

        // Don't process INITIAL_SESSION since we handle it below
        if (_event === 'INITIAL_SESSION') {
          console.log('[SupabaseProvider] Skipping INITIAL_SESSION in listener');
          return;
        }

        if (isMounted.current) {
          setSession(session);
          setUser(session?.user ?? null);
        }

        if (session?.user) {
          const profileData = await fetchProfile(session.user.id);
          if (isMounted.current) {
            setProfile(profileData);
          }
          console.log('[SupabaseProvider] Profile updated after auth change:', profileData?.username || 'null');
        } else {
          if (isMounted.current) {
            setProfile(null);
          }
          console.log('[SupabaseProvider] Profile cleared (no user)');
        }
      }
    );

    // Get initial session with timeout
    const initSession = async () => {
      try {
        console.log('[SupabaseProvider] Calling getSession...');
        const getSessionStart = Date.now();

        // Use withTimeout for getSession
        const { data: { session }, error } = await withTimeout(
          supabase.auth.getSession(),
          DEFAULT_RETRY_CONFIG.timeout
        );

        const getSessionDuration = Date.now() - getSessionStart;
        console.log(`[SupabaseProvider] getSession completed in ${getSessionDuration}ms`);

        if (error) {
          console.error('[SupabaseProvider] Error getting session:', error);
          const networkError = classifyNetworkError(error);
          
          if (isMounted.current) {
            setLastError(networkError);
          }

          clearTimeout(safetyTimeout);
          if (isMounted.current) {
            setLoading(false);
          }
          return;
        }

        // Clear timeout immediately after getSession succeeds
        clearTimeout(safetyTimeout);
        console.log('[SupabaseProvider] Initial session:', session?.user?.id || 'none');

        if (isMounted.current) {
          setSession(session);
          setUser(session?.user ?? null);
          setLoading(false);
          setConsecutiveTimeouts(0); // Reset on successful session
        }

        // Fetch profile in background (don't block on it)
        if (session?.user) {
          fetchProfile(session.user.id).then((profileData) => {
            if (isMounted.current) {
              setProfile(profileData);
            }
            console.log('[SupabaseProvider] Initial profile set:', profileData?.username || 'null');
          });
        }

        console.log('[SupabaseProvider] Loading complete');
      } catch (error) {
        console.error('[SupabaseProvider] Exception in initSession:', error);
        const networkError = classifyNetworkError(error);
        
        if (isMounted.current) {
          setLastError(networkError);
          
          if (networkError.type === 'timeout') {
            setConsecutiveTimeouts(prev => prev + 1);
          }
        }
        
        clearTimeout(safetyTimeout);
        if (isMounted.current) {
          setLoading(false);
        }
      }
    };

    initSession();

    // Handle deep links for magic link authentication
    const handleDeepLink = async (event: { url: string }) => {
      console.log('[SupabaseProvider] Deep link received:', event.url);
      
      const url = event.url;
      const hashIndex = url.indexOf('#');
      
      if (hashIndex !== -1) {
        const fragment = url.substring(hashIndex + 1);
        const params = new URLSearchParams(fragment);
        const accessToken = params.get('access_token');
        const refreshToken = params.get('refresh_token');

        if (accessToken && refreshToken) {
          console.log('[SupabaseProvider] Setting session from deep link');
          try {
            const { error } = await supabase.auth.setSession({
              access_token: accessToken,
              refresh_token: refreshToken,
            });
            
            if (error) {
              console.error('[SupabaseProvider] Error setting session from deep link:', error);
            } else {
              console.log('[SupabaseProvider] Session set successfully from deep link');
            }
          } catch (e) {
            console.error('[SupabaseProvider] Exception setting session:', e);
          }
        }
      }
    };

    // Listen for deep links
    const linkingSubscription = Linking.addEventListener('url', handleDeepLink);

    // Check initial URL (app opened from deep link)
    Linking.getInitialURL().then((url) => {
      if (url) {
        console.log('[SupabaseProvider] Initial URL found:', url);
        handleDeepLink({ url });
      }
    });

    // Cleanup function
    return () => {
      isMounted.current = false;
      clearTimeout(safetyTimeout);
      subscription.unsubscribe();
      linkingSubscription.remove();
    };
  }, [fetchProfile]);

  const value = {
    supabase,
    user,
    session,
    profile,
    loading,
    lastError,
    consecutiveTimeouts,
    signOut,
    refreshProfile,
    clearError,
  };

  return (
    <SupabaseContext.Provider value={value}>
      {children}
    </SupabaseContext.Provider>
  );
}

export function useSupabase() {
  const context = useContext(SupabaseContext);
  if (context === undefined) {
    throw new Error('useSupabase must be used within a SupabaseProvider');
  }
  return context;
}

// Export the supabase client for direct use
export { supabase };

// Re-export retry utilities for convenience
export { withTimeout, withRetry, DEFAULT_RETRY_CONFIG, type RetryConfig } from '@/utils/retry';
