// app/_layout.tsx
// Force re-render by adding a key to AppNavigator

// Import polyfills first
import '../polyfills';

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import Constants from "expo-constants";
import React, { useCallback, useEffect } from "react";
import { View, Text, Platform } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { ErrorBoundary } from "@/components/ErrorBoundary";
// Now using V2 via compatibility shim in WalletProvider.tsx
import { WalletProvider, useWallet } from "@/providers/WalletProvider";
import { CircleWalletProvider } from "@/providers/CircleWalletProvider";
import { trpc, trpcClient } from "@/lib/trpc";
import { AuthProvider } from "@/providers/AuthProvider";
import { NetworkProvider } from "@/providers/NetworkProvider";
import { SecurityProvider, useSecurity } from "@/providers/SecurityProvider";
import { CloudflareAuthProvider, useCloudflareAuth } from "@/providers/CloudflareAuthProvider";
import LockScreen from "@/components/LockScreen";
import WalletSetup from "@/components/WalletSetup";
import OnboardingFlow from "@/components/OnboardingFlow";
import PaymentConfirmationModal from "@/components/PaymentConfirmationModal";
import { usePaymentDeepLink } from "@/hooks/usePaymentDeepLink";

const queryClient = new QueryClient();

// Simplified component that just provides the navigation structure
// Individual screens handle their own auth checks
function AppNavigator() {
  const { user, loading: authLoading } = useCloudflareAuth();
  const { paymentParams, showPaymentModal, clearPayment, handlePaymentComplete } = usePaymentDeepLink();

  // Show loading while auth initializes
  if (authLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#FFF' }}>
        <Text style={{ fontSize: 18, fontWeight: '600' }}>Loading...</Text>
        <Text style={{ fontSize: 12, color: '#666', marginTop: 8 }}>Initializing...</Text>
      </View>
    );
  }

  // Provide all screens - each screen will handle its own auth checks
  return (
    <>
      <Stack screenOptions={{ headerShown: false }}>
        {/* Auth screens */}
        <Stack.Screen name="sign-in" />
        <Stack.Screen name="onboarding-profile" />
        <Stack.Screen name="onboarding-wallet" />
        <Stack.Screen name="auth/callback" />

        {/* Main app */}
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="modal" options={{ presentation: "modal", title: "HeySalad®" }} />
      </Stack>

      {/* Payment Confirmation Modal - Requirements 6.4 */}
      <PaymentConfirmationModal
        visible={showPaymentModal}
        onClose={clearPayment}
        paymentParams={paymentParams}
        onPaymentComplete={handlePaymentComplete}
      />
    </>
  );
}

export default function RootLayout() {
  useEffect(() => {
    // Log version/build info on app startup to help identify correct bundle
    const appVersion = Constants.expoConfig?.version ?? 'unknown';
    const buildNumber = Platform.select({
      ios: Constants.expoConfig?.ios?.buildNumber,
      android: Constants.expoConfig?.android?.versionCode?.toString(),
    }) ?? 'unknown';
    const appName = Constants.expoConfig?.name ?? 'HeySalad Wallet';
    const runtimeVersion = Constants.expoConfig?.runtimeVersion ?? 'unknown';
    
    console.log('='.repeat(50));
    console.log(`[App] ${appName} v${appVersion} (build: ${buildNumber})`);
    console.log(`[App] Runtime: ${runtimeVersion}`);
    console.log(`[App] Platform: ${Platform.OS} ${Platform.Version}`);
    console.log(`[App] Started at: ${new Date().toISOString()}`);
    console.log('='.repeat(50));

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
        <CloudflareAuthProvider>
          <CircleWalletProvider>
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
          </CircleWalletProvider>
        </CloudflareAuthProvider>
      </QueryClientProvider>
    </trpc.Provider>
  );
}