// app/index.tsx
import { useEffect, useState } from 'react';
import { View, ActivityIndicator, Text, Image, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import * as Linking from 'expo-linking';
import { useCloudflareAuth } from '@/providers/CloudflareAuthProvider';
import { useWallet } from '@/providers/WalletProvider';
import Colors from '@/constants/colors';

export default function Index() {
  const { user, loading } = useCloudflareAuth();
  const { wallet } = useWallet();
  const router = useRouter();
  const [checkingDeepLink, setCheckingDeepLink] = useState(true);
  const [consecutiveTimeouts, setConsecutiveTimeouts] = useState(0);

  // Check for magic link deep link on mount
  useEffect(() => {
    const checkDeepLink = async () => {
      try {
        const url = await Linking.getInitialURL();
        console.log('[Index] Checking initial URL:', url);
        
        // heysalad-oauth returns token as query param
        if (url && url.includes('auth/callback') && url.includes('token=')) {
          console.log('[Index] Magic link detected, redirecting to callback');
          router.replace('/auth/callback');
          return;
        }
      } catch (e) {
        console.error('[Index] Error checking deep link:', e);
      }
      setCheckingDeepLink(false);
    };

    checkDeepLink();
  }, [router]);

  // Show slow network message after 5 seconds of loading
  useEffect(() => {
    if (!loading) {
      setConsecutiveTimeouts(0);
      return;
    }
    
    const timeout = setTimeout(() => {
      setConsecutiveTimeouts(prev => prev + 1);
    }, 5000);
    
    return () => clearTimeout(timeout);
  }, [loading]);

  useEffect(() => {
    if (loading || checkingDeepLink) return;

    console.log('[Index] Determining initial route...', {
      hasUser: !!user,
      hasWallet: !!wallet.address,
      walletSetup: wallet.isSetup,
    });

    // Not logged in - go to sign in
    if (!user) {
      console.log('[Index] No user, going to sign-in');
      router.replace('/sign-in');
      return;
    }

    // Logged in - check wallet setup
    // Profile is now stored in heysalad-oauth, so we skip profile check
    if (!wallet.isSetup || !wallet.address || wallet.needsSetup) {
      console.log('[Index] User logged in but no wallet, going to wallet disclaimer');
      router.replace('/wallet-disclaimer');
      return;
    }

    // Logged in with wallet - go to main app
    console.log('[Index] User has wallet, going to main app');
    router.replace({ pathname: '/(tabs)/(wallet)' });
  }, [user, wallet, loading, checkingDeepLink, router]);

  return (
    <View style={styles.container}>
      <Image
        source={require('@/assets/images/HeySalad_black_logo.png')}
        style={styles.logo}
        resizeMode="contain"
      />
      <ActivityIndicator size="large" color={Colors.brand.cherryRed} style={styles.spinner} />
      {consecutiveTimeouts > 0 && (
        <Text style={styles.slowNetworkText}>
          Network is slow, please wait...
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.brand.white,
    padding: 20,
  },
  logo: {
    width: 200,
    height: 80,
    marginBottom: 40,
  },
  spinner: {
    marginTop: 20,
  },
  slowNetworkText: {
    marginTop: 24,
    color: Colors.brand.inkMuted,
    fontSize: 14,
    textAlign: 'center',
  },
});
