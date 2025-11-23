// app/_layout.tsx
// Force re-render by adding a key to AppNavigator

// Import polyfills first
import '../polyfills';

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack, useRouter, useSegments } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import * as Linking from "expo-linking";
import React, { useCallback, useEffect } from "react";
import { View, Text } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { ErrorBoundary } from "@/components/ErrorBoundary";
// Now using V2 via compatibility shim in WalletProvider.tsx
import { WalletProvider, useWallet } from "@/providers/WalletProvider";
import { trpc, trpcClient } from "@/lib/trpc";
import { AuthProvider } from "@/providers/AuthProvider";
import { NetworkProvider } from "@/providers/NetworkProvider";
import { SecurityProvider, useSecurity } from "@/providers/SecurityProvider";
import { SupabaseProvider, useSupabase } from "@/providers/SupabaseProvider";
import LockScreen from "@/components/LockScreen";
import WalletSetup from "@/components/WalletSetup";
import OnboardingFlow from "@/components/OnboardingFlow";

const queryClient = new QueryClient();

// Simplified component that just provides the navigation structure
// Individual screens handle their own auth checks (like heysalad-cash)
function AppNavigator() {
  const { user, loading: supabaseLoading, supabase } = useSupabase();
  const router = useRouter();

  // Handle deep links for magic link authentication
  useEffect(() => {
    // Handle the initial URL if the app was opened via a deep link
    const handleInitialUrl = async () => {
      const url = await Linking.getInitialURL();
      if (url) {
        console.log('[DeepLink] Initial URL:', url);
        await handleDeepLink(url);
      }
    };

    // Handle deep links while the app is already open
    const handleDeepLink = async (url: string) => {
      console.log('[DeepLink] Handling URL:', url);

      // Check if this is a Supabase auth callback
      if (url.includes('auth/callback')) {
        try {
          // Supabase sends tokens in the URL fragment (after #), not as query params
          // Parse the fragment to extract tokens
          const urlObj = new URL(url);
          let access_token = urlObj.searchParams.get('access_token');
          let refresh_token = urlObj.searchParams.get('refresh_token');

          // If not in query params, check the hash/fragment
          if (!access_token && urlObj.hash) {
            const hashParams = new URLSearchParams(urlObj.hash.substring(1));
            access_token = hashParams.get('access_token');
            refresh_token = hashParams.get('refresh_token');
          }

          console.log('[DeepLink] Extracted tokens:', {
            hasAccessToken: !!access_token,
            hasRefreshToken: !!refresh_token
          });

          if (access_token && refresh_token) {
            console.log('[DeepLink] Setting session from magic link');

            // Set the session with the tokens from the URL
            const { data, error } = await supabase.auth.setSession({
              access_token,
              refresh_token,
            });

            if (error) {
              console.error('[DeepLink] Error setting session:', error);
              return;
            }

            console.log('[DeepLink] Session set successfully');

            // Check if user has a profile
            if (data.user) {
              const { data: profile } = await supabase
                .from('profiles')
                .select()
                .eq('auth_user_id', data.user.id)
                .single();

              if (!profile) {
                console.log('[DeepLink] No profile found, going to onboarding');
                router.replace('/onboarding-profile');
              } else {
                console.log('[DeepLink] Profile exists, going to main app');
                router.replace('/(tabs)/(wallet)' as any);
              }
            }
          }
        } catch (error) {
          console.error('[DeepLink] Error handling magic link:', error);
        }
      }
    };

    // Set up listener for deep links
    const subscription = Linking.addEventListener('url', ({ url }) => {
      handleDeepLink(url);
    });

    // Handle initial URL on mount
    handleInitialUrl();

    // Cleanup
    return () => {
      subscription.remove();
    };
  }, [supabase, router]);

  // Show loading while Supabase initializes
  if (supabaseLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#FFF' }}>
        <Text style={{ fontSize: 18, fontWeight: '600' }}>Loading...</Text>
        <Text style={{ fontSize: 12, color: '#666', marginTop: 8 }}>Initializing...</Text>
      </View>
    );
  }

  // Provide all screens - each screen will handle its own auth checks
  return (
    <Stack screenOptions={{ headerShown: false }}>
      {/* Auth screens */}
      <Stack.Screen name="sign-in" />
      <Stack.Screen name="verify-otp" />
      <Stack.Screen name="onboarding-profile" />

      {/* Main app */}
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="modal" options={{ presentation: "modal", title: "HeySalad®" }} />
    </Stack>
  );
}

export default function RootLayout() {
  useEffect(() => {
    (async () => {
      try {
        await SplashScreen.preventAutoHideAsync();
      } catch (e) {
        console.log("[Splash] preventAutoHideAsync error", e);
      }
    })();

    const fallback = setTimeout(() => {
      try {
        SplashScreen.hideAsync();
      } catch (e) {
        console.log("[Splash] fallback hide error", e);
      }
    }, 2000);

    return () => clearTimeout(fallback);
  }, []);

  const onReady = useCallback(() => {
    try {
      SplashScreen.hideAsync();
    } catch (e) {
      console.log("[Splash] hideAsync error", e);
    }
  }, []);

  return (
    <trpc.Provider client={trpcClient} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>
        <SupabaseProvider>
          <AuthProvider>
            <NetworkProvider>
              <SecurityProvider>
                <WalletProvider>
                  <GestureHandlerRootView style={{ flex: 1 }} onLayout={onReady}>
                    <ErrorBoundary>
                      <AppNavigator />
                    </ErrorBoundary>
                  </GestureHandlerRootView>
                </WalletProvider>
              </SecurityProvider>
            </NetworkProvider>
          </AuthProvider>
        </SupabaseProvider>
      </QueryClientProvider>
    </trpc.Provider>
  );
}