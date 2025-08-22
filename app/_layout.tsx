// app/_layout.tsx
// Force re-render by adding a key to AppNavigator

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import React, { useCallback, useEffect } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { WalletProvider, useWallet } from "@/providers/WalletProvider";
import { trpc, trpcClient } from "@/lib/trpc";
import { AuthProvider } from "@/providers/AuthProvider";
import WalletSetup from "@/components/WalletSetup";
import OnboardingFlow from "@/components/OnboardingFlow";

const queryClient = new QueryClient();

// Component that checks wallet setup status
function AppNavigator() {
  const { wallet, completeOnboarding } = useWallet();

  // Create a unique key based on wallet state to force re-renders
  const appKey = `${wallet.isSetup}-${wallet.onboarding.hasCompletedOnboarding}-${wallet.address}`;

  console.log('[AppNavigator] Current state:', {
    needsSetup: wallet.needsSetup,
    isSetup: wallet.isSetup,
    onboardingComplete: wallet.onboarding.hasCompletedOnboarding,
    address: wallet.address,
    appKey
  });

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
  }, []);

  const onReady = useCallback(() => {
    SplashScreen.hideAsync();
  }, []);

  return (
    <trpc.Provider client={trpcClient} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <WalletProvider>
            <GestureHandlerRootView style={{ flex: 1 }} onLayout={onReady}>
              <ErrorBoundary>
                <AppNavigator />
              </ErrorBoundary>
            </GestureHandlerRootView>
          </WalletProvider>
        </AuthProvider>
      </QueryClientProvider>
    </trpc.Provider>
  );
}