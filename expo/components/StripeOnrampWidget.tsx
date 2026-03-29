// components/StripeOnrampWidget.tsx
// Stripe Crypto Onramp widget for HeySalad Wallet

import React, { useState, useEffect } from 'react';
import {
  View,
  Modal,
  StyleSheet,
  TouchableOpacity,
  Text,
  ActivityIndicator,
  SafeAreaView,
  Alert,
} from 'react-native';
import { WebView } from 'react-native-webview';
import { X } from 'lucide-react-native';
import Colors from '@/constants/colors';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CloudflareAPI } from '@/services/cloudflareClient';
import { useSupabase } from '@/providers/SupabaseProvider';
import { logger } from '@/utils/logger';

interface StripeOnrampWidgetProps {
  visible: boolean;
  onClose: () => void;
  walletAddress: string;
  currency?: string; // Default: USDC
  network?: string; // Default: polygon
  onSuccess?: (sessionId: string) => void;
}

export default function StripeOnrampWidget({
  visible,
  onClose,
  walletAddress,
  currency = 'usdc',
  network = 'polygon',
  onSuccess,
}: StripeOnrampWidgetProps) {
  const insets = useSafeAreaInsets();
  const { user, profile } = useSupabase();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sessionUrl, setSessionUrl] = useState<string | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);

  useEffect(() => {
    if (visible && user && profile) {
      initializeOnrampSession();
    }
  }, [visible, user, profile]);

  const initializeOnrampSession = async () => {
    try {
      setIsLoading(true);
      setError(null);

      logger.log('[StripeOnramp] Initializing session for wallet:', walletAddress);

      // Create onramp session via Cloudflare Worker
      const response = await CloudflareAPI.createOnrampSession({
        customerEmail: profile?.email || user?.email || '',
        customerName: profile?.username || 'HeySalad User',
        walletAddress,
        destinationCurrency: currency,
        destinationNetwork: network,
        sourceCurrency: 'usd', // Default fiat currency
      });

      if (!response.success || !response.data) {
        throw new Error(response.error || 'Failed to create onramp session');
      }

      const { clientSecret, publishableKey } = response.data;

      // Build Stripe Onramp URL
      const url = `https://crypto.link.com/buy?client_secret=${clientSecret}&publishable_key=${publishableKey}`;

      setSessionUrl(url);
      setSessionId(response.data.sessionId);
      setIsLoading(false);

      logger.log('[StripeOnramp] Session initialized successfully');
    } catch (error) {
      logger.error('[StripeOnramp] Error initializing session:', error);
      setError(error instanceof Error ? error.message : 'Failed to initialize onramp');
      setIsLoading(false);

      Alert.alert(
        'Error',
        'Failed to initialize crypto purchase. Please try again.',
        [{ text: 'OK', onPress: onClose }]
      );
    }
  };

  const handleNavigationStateChange = (navState: any) => {
    logger.log('[StripeOnramp] Navigation:', navState.url);

    // Check if purchase completed
    if (navState.url.includes('success') || navState.url.includes('complete')) {
      Alert.alert(
        'Purchase Successful!',
        'Your crypto will arrive in your wallet shortly. It may take a few minutes to process.',
        [
          {
            text: 'OK',
            onPress: () => {
              if (sessionId && onSuccess) {
                onSuccess(sessionId);
              }
              onClose();
            },
          },
        ]
      );
    }

    // Check if user canceled
    if (navState.url.includes('cancel') || navState.url.includes('close')) {
      onClose();
    }
  };

  const handleClose = () => {
    Alert.alert(
      'Close Purchase?',
      'Are you sure you want to close? Any incomplete purchase will be canceled.',
      [
        { text: 'Continue', style: 'cancel' },
        { text: 'Close', style: 'destructive', onPress: onClose },
      ]
    );
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="fullScreen"
      onRequestClose={handleClose}
    >
      <SafeAreaView style={styles.container}>
        {/* Header */}
        <View style={[styles.header, { paddingTop: insets.top }]}>
          <View style={styles.headerContent}>
            <Text style={styles.headerTitle}>Buy Crypto</Text>
            <Text style={styles.headerSubtitle}>Powered by Stripe</Text>
          </View>
          <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
            <X color={Colors.brand.ink} size={24} />
          </TouchableOpacity>
        </View>

        {/* Loading State */}
        {isLoading && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={Colors.brand.cherryRed} />
            <Text style={styles.loadingText}>Initializing secure payment...</Text>
          </View>
        )}

        {/* Error State */}
        {error && !isLoading && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorTitle}>Something went wrong</Text>
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity
              style={styles.retryButton}
              onPress={initializeOnrampSession}
            >
              <Text style={styles.retryButtonText}>Try Again</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* WebView */}
        {sessionUrl && !error && (
          <WebView
            source={{ uri: sessionUrl }}
            style={styles.webview}
            onLoadStart={() => setIsLoading(true)}
            onLoadEnd={() => setIsLoading(false)}
            onNavigationStateChange={handleNavigationStateChange}
            javaScriptEnabled={true}
            domStorageEnabled={true}
            startInLoadingState={true}
            allowsInlineMediaPlayback={true}
            mediaPlaybackRequiresUserAction={false}
          />
        )}

        {/* Info Footer */}
        <View style={[styles.footer, { paddingBottom: insets.bottom + 8 }]}>
          <Text style={styles.footerText}>
            💳 Buy crypto securely with credit card, debit card, or bank transfer
          </Text>
          <Text style={styles.footerSubtext}>
            Network: {network.toUpperCase()} • Currency: {currency.toUpperCase()}
          </Text>
        </View>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.brand.white,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    backgroundColor: Colors.brand.white,
  },
  headerContent: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '900' as const,
    color: Colors.brand.ink,
  },
  headerSubtitle: {
    fontSize: 12,
    color: Colors.brand.inkMuted,
    marginTop: 2,
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.brand.lightPeach,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.brand.white,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: Colors.brand.inkMuted,
  },
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.brand.ink,
    marginBottom: 12,
  },
  errorText: {
    fontSize: 14,
    color: Colors.brand.inkMuted,
    textAlign: 'center',
    marginBottom: 24,
  },
  retryButton: {
    backgroundColor: Colors.brand.cherryRed,
    paddingVertical: 12,
    paddingHorizontal: 32,
    borderRadius: 24,
  },
  retryButtonText: {
    color: Colors.brand.white,
    fontSize: 16,
    fontWeight: '700',
  },
  webview: {
    flex: 1,
    backgroundColor: Colors.brand.white,
  },
  footer: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: '#FFF3F0',
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  footerText: {
    fontSize: 12,
    color: Colors.brand.ink,
    textAlign: 'center',
    lineHeight: 18,
  },
  footerSubtext: {
    fontSize: 10,
    color: Colors.brand.inkMuted,
    textAlign: 'center',
    marginTop: 4,
  },
});
