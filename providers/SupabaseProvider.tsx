// providers/SupabaseProvider.tsx
import React, { createContext, useContext, useEffect, useState } from 'react';
import { createClient, SupabaseClient, User, Session } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';

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
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const SupabaseContext = createContext<SupabaseContextType | undefined>(undefined);

export function SupabaseProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  // Fetch user profile from database with timeout
  const fetchProfile = async (userId: string) => {
    try {
      console.log('[SupabaseProvider] Fetching profile for user:', userId);

      // Query profile directly (no timeout - let Supabase handle it)
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('auth_user_id', userId)
        .single();

      if (error) {
        // If profile doesn't exist (PGRST116), that's expected for new users
        if (error.code === 'PGRST116') {
          console.log('[SupabaseProvider] No profile found - user needs to create one');
        } else {
          // Log detailed error info to help debug
          console.error('[SupabaseProvider] Error fetching profile:', {
            message: error.message,
            code: error.code,
            details: error.details,
            hint: error.hint,
          });
        }
        return null;
      }

      console.log('[SupabaseProvider] Profile fetched successfully:', data?.username);
      return data as Profile;
    } catch (error: any) {
      console.error('[SupabaseProvider] Exception fetching profile:', error?.message || error);
      return null;
    }
  };

  const refreshProfile = async () => {
    if (user) {
      const profileData = await fetchProfile(user.id);
      setProfile(profileData);
    }
  };

  const signOut = async () => {
    console.log('[SupabaseProvider] Signing out');
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setProfile(null);
  };

  useEffect(() => {
    console.log('[SupabaseProvider] useEffect starting...');

    // Safety timeout - if loading takes more than 20 seconds, force it to complete
    const safetyTimeout = setTimeout(() => {
      console.error('[SupabaseProvider] ⚠️ Safety timeout triggered! Forcing loading to false.');
      setLoading(false);
    }, 20000);

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        console.log('[SupabaseProvider] Auth state changed:', _event, session?.user?.id);

        // Don't process INITIAL_SESSION since we handle it below
        if (_event === 'INITIAL_SESSION') {
          console.log('[SupabaseProvider] Skipping INITIAL_SESSION in listener');
          return;
        }

        setSession(session);
        setUser(session?.user ?? null);

        if (session?.user) {
          const profileData = await fetchProfile(session.user.id);
          setProfile(profileData);
          console.log('[SupabaseProvider] Profile updated after auth change:', profileData?.username || 'null');
        } else {
          setProfile(null);
          console.log('[SupabaseProvider] Profile cleared (no user)');
        }
      }
    );

    // Get initial session with timeout
    const initSession = async () => {
      try {
        console.log('[SupabaseProvider] Calling getSession...');
        const { data: { session }, error } = await supabase.auth.getSession();

        if (error) {
          console.error('[SupabaseProvider] Error getting session:', error);
          clearTimeout(safetyTimeout);
          setLoading(false);
          return;
        }

        // Clear timeout immediately after getSession succeeds
        // Don't wait for profile fetch to complete
        clearTimeout(safetyTimeout);
        console.log('[SupabaseProvider] Initial session:', session?.user?.id || 'none');

        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false); // Set loading false before fetching profile

        // Fetch profile in background (don't block on it)
        if (session?.user) {
          fetchProfile(session.user.id).then((profileData) => {
            setProfile(profileData);
            console.log('[SupabaseProvider] Initial profile set:', profileData?.username || 'null');
          });
        }

        console.log('[SupabaseProvider] Loading complete');
      } catch (error) {
        console.error('[SupabaseProvider] Exception in initSession:', error);
        clearTimeout(safetyTimeout);
        setLoading(false);
      }
    };

    initSession();

    // Cleanup function
    return () => {
      clearTimeout(safetyTimeout);
      subscription.unsubscribe();
    };
  }, []);

  const value = {
    supabase,
    user,
    session,
    profile,
    loading,
    signOut,
    refreshProfile,
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
