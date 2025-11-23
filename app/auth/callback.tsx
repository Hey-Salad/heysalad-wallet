// app/auth/callback.tsx
import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import * as Linking from 'expo-linking';
import { useSupabase } from '@/providers/SupabaseProvider';
import Colors from '@/constants/colors';

export default function AuthCallback() {
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('Signing you in...');
  const { supabase } = useSupabase();
  const router = useRouter();

  useEffect(() => {
    const handleCallback = async () => {
      try {
        console.log('[AuthCallback] Processing magic link callback');

        // Get the full URL with fragments using Linking
        const url = await Linking.getInitialURL();
        console.log('[AuthCallback] Full URL:', url);

        // If no URL, this screen was likely navigated to directly (not via deep link)
        // Just redirect back to sign-in immediately without showing error
        if (!url || !url.includes('auth/callback')) {
          console.log('[AuthCallback] No magic link URL found, redirecting to sign-in');
          router.replace('/sign-in');
          return;
        }

        // Parse the URL to extract tokens from the fragment
        const urlObj = new URL(url);
        let access_token = urlObj.searchParams.get('access_token');
        let refresh_token = urlObj.searchParams.get('refresh_token');

        // If not in query params, check the hash/fragment
        if (!access_token && urlObj.hash) {
          const hashParams = new URLSearchParams(urlObj.hash.substring(1));
          access_token = hashParams.get('access_token');
          refresh_token = hashParams.get('refresh_token');
        }

        console.log('[AuthCallback] Extracted tokens:', {
          hasAccessToken: !!access_token,
          hasRefreshToken: !!refresh_token
        });

        if (!access_token || !refresh_token) {
          console.error('[AuthCallback] Missing tokens after parsing');
          setStatus('error');
          setMessage('Invalid magic link. Please try again.');
          setTimeout(() => router.replace('/sign-in'), 2000);
          return;
        }

        console.log('[AuthCallback] Setting session with tokens');

        // Set the session with the tokens
        const { data, error } = await supabase.auth.setSession({
          access_token,
          refresh_token,
        });

        if (error) {
          console.error('[AuthCallback] Error setting session:', error);
          setStatus('error');
          setMessage('Failed to sign in. Please try again.');
          setTimeout(() => router.replace('/sign-in'), 2000);
          return;
        }

        console.log('[AuthCallback] Session set successfully');
        setStatus('success');
        setMessage('Successfully signed in!');

        // Check if user has a profile
        if (data.user) {
          const { data: profile } = await supabase
            .from('profiles')
            .select()
            .eq('auth_user_id', data.user.id)
            .single();

          setTimeout(() => {
            if (!profile) {
              console.log('[AuthCallback] No profile found, going to onboarding');
              router.replace('/onboarding-profile');
            } else {
              console.log('[AuthCallback] Profile exists, going to main app');
              router.replace('/(tabs)/(wallet)' as any);
            }
          }, 1000);
        }
      } catch (error) {
        console.error('[AuthCallback] Exception:', error);
        setStatus('error');
        setMessage('An error occurred. Please try again.');
        setTimeout(() => router.replace('/sign-in'), 2000);
      }
    };

    handleCallback();
  }, [supabase, router]);

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        {status === 'loading' && (
          <ActivityIndicator size="large" color={Colors.brand.ink} />
        )}
        {status === 'success' && (
          <Text style={styles.successIcon}>✓</Text>
        )}
        {status === 'error' && (
          <Text style={styles.errorIcon}>✗</Text>
        )}
        <Text style={[
          styles.message,
          status === 'error' && styles.errorMessage
        ]}>
          {message}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.brand.white,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  successIcon: {
    fontSize: 64,
    color: '#10B981',
    marginBottom: 16,
  },
  errorIcon: {
    fontSize: 64,
    color: '#EF4444',
    marginBottom: 16,
  },
  message: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.brand.ink,
    textAlign: 'center',
  },
  errorMessage: {
    color: '#EF4444',
  },
});
