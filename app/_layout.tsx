// app/_layout.tsx
// Force re-render by adding a key to AppNavigator

// Import polyfills first
import '../polyfills';

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack, useRouter, useSegments } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import * as Linking from "expo-linking";
import React, { useCallback, useEffect } from "react";
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

// Component that checks authentication and wallet setup
function AppNavigator() {
  const { user, profile, loading: supabaseLoading } = useSupabase();
  const { wallet, completeOnboarding } = useWallet();
  const { isLocked } = useSecurity();
  const router = useRouter();
  const segments = useSegments();

  // Create a unique key based on wallet state to force re-renders
  const appKey = `${wallet.isSetup}-${wallet.onboarding.hasCompletedOnboarding}-${wallet.address}`;

  console.log('[AppNavigator] Current state:', {
    user: user?.id,
    profile: profile?.username,
    supabaseLoading,
    needsSetup: wallet.needsSetup,
    isSetup: wallet.isSetup,
    onboardingComplete: wallet.onboarding.hasCompletedOnboarding,
    address: wallet.address,
    isLocked,
    appKey
  });

  // Handle authentication routing
  useEffect(() => {
    if (supabaseLoading) return;

    const inAuthGroup = segments[0] === '(auth)' ||
                       segments[0] === 'sign-in' ||
                       segments[0] === 'sign-in-email' ||
                       segments[0] === 'sign-in-phone' ||
                       segments[0] === 'verify-otp' ||
                       segments[0] === 'verify-email' ||
                       segments[0] === 'verify-email-code' ||
                       segments[0] === 'onboarding-profile';

    console.log('[AppNavigator] Auth routing check:', {
      hasUser: !!user,
      hasProfile: !!profile,
      inAuthGroup,
      currentSegment: segments[0]
    });

    if (!user && !inAuthGroup) {
      // Not authenticated - go to sign in
      console.log('[AppNavigator] No user, redirecting to sign-in');
      router.replace('/sign-in');
    } else if (user && !profile) {
      // Authenticated but no profile - ALWAYS go to profile creation
      // (even if currently on an auth screen)
      console.log('[AppNavigator] User but no profile, redirecting to onboarding-profile');
      router.replace('/onboarding-profile');
    } else if (user && profile && inAuthGroup) {
      // Authenticated with profile but still on auth screen - go to main app
      console.log('[AppNavigator] User has profile but on auth screen, redirecting to wallet');
      router.replace('/(tabs)/(wallet)');
    }
  }, [user, profile, supabaseLoading, segments]);

  // Show loading while checking auth
  if (supabaseLoading) {
    return null; // Or a loading screen
  }

  // Not authenticated - show auth screens
  if (!user) {
    return (
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="sign-in" />
        <Stack.Screen name="sign-in-email" />
        <Stack.Screen name="sign-in-phone" />
        <Stack.Screen name="verify-otp" />
        <Stack.Screen name="verify-email" />
        <Stack.Screen name="verify-email-code" />
      </Stack>
    );
  }

  // Authenticated but no profile - show profile creation
  // Check explicitly for null/undefined since profile can be null from failed query
  if (!profile || profile === null) {
    console.log('[AppNavigator] Showing onboarding-profile (no profile found)');
    console.log('[AppNavigator] Profile value:', profile);
    return (
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="onboarding-profile" />
      </Stack>
    );
  }

  // SIMPLIFIED: If you have a profile, show the main app
  // We'll skip all the complex wallet setup checks for now
  console.log('[AppNavigator] ✅ User has profile, showing main app');
  console.log('[AppNavigator] Profile:', profile?.username);
  console.log('[AppNavigator] Wallet address:', wallet.address || 'NONE');
  
  // Check if user needs to select wallet type (new onboarding flow)
  if (!wallet.onboarding.hasSeenWalletTypeSelection && !wallet.address) {
    console.log('[AppNavigator] User needs to select wallet type');
    return (
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="onboarding-wallet-type" />
      </Stack>
    );
  }
  
  // Show lock screen if explicitly locked
  if (isLocked && wallet.address) {
    console.log('[AppNavigator] Wallet is locked, showing lock screen');
    return <LockScreen />;
  }

  // Show main app - SIMPLIFIED, no more checks
  console.log('[AppNavigator] 🎉 SHOWING MAIN APP 🎉');
  return (
    <Stack key={appKey} screenOptions={{ headerBackTitle: "Back" }}>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="modal" options={{ presentation: "modal", title: "HeySalad®" }} />
      <Stack.Screen name="onboarding-wallet-type" options={{ headerShown: false }} />
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