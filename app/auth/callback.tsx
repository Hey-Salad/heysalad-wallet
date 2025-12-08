// app/auth/callback.tsx
// Handles magic link callback from heysalad-oauth
import React, { useEffect, useState, useRef } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import * as Linking from 'expo-linking';
import { useCloudflareAuth } from '@/providers/CloudflareAuthProvider';
import Colors from '@/constants/colors';

export default function AuthCallback() {
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('Signing you in...');
  const { user, validateToken } = useCloudflareAuth();
  const router = useRouter();
  const params = useLocalSearchParams();
  const hasAttempted = useRef(false);

  // If user is already set from CloudflareAuthProvider's deep link handler
  useEffect(() => {
    if (user && !hasAttempted.current) {
      hasAttempted.current = true;
      handleSuccessfulAuth();
    }
  }, [user]);

  useEffect(() => {
    if (hasAttempted.current) return;

    const handleCallback = async () => {
      try {
        console.log('[AuthCallback] Processing magic link callback');
        console.log('[AuthCallback] Params:', params);

        // Check if token is in URL params (heysalad-oauth returns ?token=xxx)
        const tokenFromParams = params.token as string | undefined;
        
        if (tokenFromParams) {
          console.log('[AuthCallback] Token found in params');
          hasAttempted.current = true;
          
          // The CloudflareAuthProvider will handle token validation via deep link
          // Just wait for user to be set
          const isValid = await validateToken();
          
          if (isValid) {
            await handleSuccessfulAuth();
          } else {
            setStatus('error');
            setMessage('Invalid or expired link. Please try again.');
            setTimeout(() => router.replace('/sign-in'), 2000);
          }
          return;
        }

        // Try to get URL from Linking (fallback)
        let url = await Linking.getInitialURL();
        console.log('[AuthCallback] Initial URL:', url);

        if (!url) {
          // Wait for URL event
          const urlPromise = new Promise<string | null>((resolve) => {
            const subscription = Linking.addEventListener('url', (event) => {
              console.log('[AuthCallback] URL event:', event.url);
              subscription.remove();
              resolve(event.url);
            });
            setTimeout(() => {
              subscription.remove();
              resolve(null);
            }, 5000);
          });
          url = await urlPromise;
        }

        if (url) {
          console.log('[AuthCallback] Processing URL:', url);
          
          // heysalad-oauth returns token as query param
          const urlObj = new URL(url);
          const tokenFromUrl = urlObj.searchParams.get('token');

          if (tokenFromUrl) {
            console.log('[AuthCallback] Token found in URL');
            hasAttempted.current = true;
            
            // CloudflareAuthProvider handles this via deep link listener
            // Wait a moment for it to process
            await new Promise(resolve => setTimeout(resolve, 500));
            
            if (user) {
              await handleSuccessfulAuth();
            } else {
              const isValid = await validateToken();
              if (isValid) {
                await handleSuccessfulAuth();
              } else {
                setStatus('error');
                setMessage('Authentication failed. Please try again.');
                setTimeout(() => router.replace('/sign-in'), 2000);
              }
            }
            return;
          }
        }

        // No token found
        if (!hasAttempted.current) {
          hasAttempted.current = true;
          console.error('[AuthCallback] No token found');
          setStatus('error');
          setMessage('Invalid magic link. Please try signing in again.');
          setTimeout(() => router.replace('/sign-in'), 3000);
        }
      } catch (error) {
        console.error('[AuthCallback] Exception:', error);
        if (!hasAttempted.current) {
          hasAttempted.current = true;
          setStatus('error');
          setMessage('An error occurred. Please try again.');
          setTimeout(() => router.replace('/sign-in'), 2000);
        }
      }
    };

    const timer = setTimeout(handleCallback, 100);
    return () => clearTimeout(timer);
  }, [params, validateToken, router, user]);

  const handleSuccessfulAuth = async () => {
    setStatus('success');
    setMessage('Successfully signed in!');
    console.log('[AuthCallback] Auth successful, redirecting...');

    // For now, always go to onboarding-profile
    // The profile screen will check if profile exists and redirect accordingly
    setTimeout(() => {
      router.replace('/onboarding-profile');
    }, 1000);
  };

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
