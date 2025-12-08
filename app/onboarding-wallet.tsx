// app/onboarding-wallet.tsx
import React, { useEffect, useState, useRef } from 'react';
import { View } from 'react-native';
import { useRouter } from 'expo-router';
import WalletSetup from '@/components/WalletSetup';
import { useWallet } from '@/providers/WalletProvider';
import HSButton from '@/components/HSButton';
import Colors from '@/constants/colors';

export default function OnboardingWallet() {
  const router = useRouter();
  const { wallet } = useWallet();
  const [previousSetupState, setPreviousSetupState] = useState(wallet.isSetup);
  const hasRedirectedRef = useRef(false);

  // Monitor wallet setup completion and redirect to main app
  useEffect(() => {
    // If wallet just became setup (transition from false to true)
    if (!previousSetupState && wallet.isSetup && wallet.address && !wallet.needsSetup && !hasRedirectedRef.current) {
      console.log('[OnboardingWallet] Wallet setup completed, redirecting to main app in 2 seconds');
      hasRedirectedRef.current = true;

      // Small delay to show the completion screen
      const timer = setTimeout(() => {
        router.replace({ pathname: '/(tabs)/(wallet)' });
      }, 2000);

      return () => clearTimeout(timer);
    }

    // Update previous state
    if (wallet.isSetup !== previousSetupState) {
      setPreviousSetupState(wallet.isSetup);
    }
  }, [wallet.isSetup, wallet.address, wallet.needsSetup, previousSetupState, router]);

  // If wallet is already setup on mount, redirect immediately
  useEffect(() => {
    if (wallet.isSetup && wallet.address && !wallet.needsSetup && !hasRedirectedRef.current) {
      console.log('[OnboardingWallet] Wallet already setup, redirecting to main app');
      hasRedirectedRef.current = true;
      router.replace({ pathname: '/(tabs)/(wallet)' });
    }
  }, [wallet.isSetup, wallet.address, wallet.needsSetup, router]);

  return <WalletSetup />;
}
