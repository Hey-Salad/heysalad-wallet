// app/_layout.tsx
// Force re-render by adding a key to AppNavigator

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import React, { useCallback, useEffect } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { ErrorBoundary } from "@/components/ErrorBoundary";
// Now using V2 via compatibility shim in WalletProvider.tsx
import { WalletProvider, useWallet } from "@/providers/WalletProvider";
import { trpc, trpcClient } from "@/lib/trpc";
import { AuthProvider } from "@/providers/AuthProvider";
import { NetworkProvider } from "@/providers/NetworkProvider";
import { SecurityProvider, useSecurity } from "@/providers/SecurityProvider";
import LockScreen from "@/components/LockScreen";
import WalletSetup from "@/components/WalletSetup";
import OnboardingFlow from "@/components/OnboardingFlow";

const queryClient = new QueryClient();

// Component that checks wallet setup status and security lock
function AppNavigator() {
  const { wallet, completeOnboarding } = useWallet();
  const { isLocked } = useSecurity();

  // Create a unique key based on wallet state to force re-renders
  const appKey = `${wallet.isSetup}-${wallet.onboarding.hasCompletedOnboarding}-${wallet.address}`;

  console.log('[AppNavigator] Current state:', {
    needsSetup: wallet.needsSetup,
    isSetup: wallet.isSetup,
    onboardingComplete: wallet.onboarding.hasCompletedOnboarding,
    address: wallet.address,
    isLocked,
    appKey
  });

  // Show lock screen if wallet is locked (and setup is complete)
  if (isLocked && wallet.isSetup && wallet.onboarding.hasCompletedOnboarding) {
    console.log('[App] Wallet is locked, showing lock screen');
    return <LockScreen />;
  }

  // Show wallet setup if needed
  if (wallet.needsSetup) {
    console.log('[App] Showing wallet setup screen');
    return <WalletSetup key={appKey} />;
  }

  // Show onboarding if wallet is set up but onboarding not complete
  if (wallet.isSetup && !wallet.onboarding.hasCompletedOnboarding) {
    console.log('[App] Showing onboarding flow');
    return (
      <OnboardingFlow
        key={appKey}
        onComplete={async () => {
          console.log('[App] Onboarding completion triggered - calling completeOnboarding');
          try {
            await completeOnboarding();
            console.log('[App] Onboarding completed successfully - should show main app now');

            // Force a small delay to ensure state is updated
            setTimeout(() => {
              console.log('[App] Post-completion state check:', {
                isSetup: wallet.isSetup,
                onboardingComplete: wallet.onboarding.hasCompletedOnboarding
              });
            }, 100);
          } catch (error) {
            console.error('[App] Failed to complete onboarding:', error);
          }
        }}
      />
    );
  }

  // Show main app
  console.log('[App] 🎉 SHOWING MAIN APP 🎉 with address:', wallet.address);
  return (
    <Stack key={appKey} screenOptions={{ headerBackTitle: "Back" }}>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
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
      </QueryClientProvider>
    </trpc.Provider>
  );
}