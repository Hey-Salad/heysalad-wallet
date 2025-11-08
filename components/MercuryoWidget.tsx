// components/MercuryoWidget.tsx
// Mercuryo on-ramp widget for buying crypto with fiat

import React, { useState } from 'react';
import { View, Modal, StyleSheet, TouchableOpacity, Text, ActivityIndicator, SafeAreaView, Alert } from 'react-native';
import { WebView } from 'react-native-webview';
import { X } from 'lucide-react-native';
import Colors from '@/constants/colors';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface MercuryoWidgetProps {
  visible: boolean;
  onClose: () => void;
  walletAddress: string;
  currency?: string; // Default: TRX
  network?: string;  // Default: TRON
}

export default function MercuryoWidget({
  visible,
  onClose,
  walletAddress,
  currency = 'TRX',
  network = 'TRON',
}: MercuryoWidgetProps) {
  const insets = useSafeAreaInsets();
  const [isLoading, setIsLoading] = useState(true);

  // Build Mercuryo widget URL
  // Note: You'll need to sign up at https://mercuryo.io and get your widget_id
  // Replace 'YOUR_WIDGET_ID' with your actual Mercuryo widget ID
  const getMercuryoUrl = () => {
    const widgetId = 'YOUR_WIDGET_ID'; // TODO: Replace with actual widget ID from Mercuryo

    const params = new URLSearchParams({
      widget_id: widgetId,
      type: 'buy',
      currency: currency,
      network: network,
      address: walletAddress,
      return_url: 'heysalad://mercuryo-success', // Deep link for success
      // Optional: Set default fiat currency
      fiat_currency: 'USD',
      // Optional: Set default amount
      // fiat_amount: '100',
    });

    return `https://exchange.mercuryo.io/?${params.toString()}`;
  };

  const handleNavigationStateChange = (navState: any) => {
    console.log('[Mercuryo] Navigation:', navState.url);

    // Check if user completed purchase
    if (navState.url.includes('heysalad://mercuryo-success')) {
      Alert.alert(
        'Purchase Successful!',
        'Your crypto will arrive in your wallet shortly. It may take a few minutes to process.',
        [
          {
            text: 'OK',
            onPress: () => {
              onClose();
              // Optional: Trigger balance refresh
              // refreshBalance();
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
      'Close Mercuryo?',
      'Are you sure you want to close? Any incomplete purchase will be canceled.',
      [
        { text: 'Cancel', style: 'cancel' },
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
            <Text style={styles.headerSubtitle}>Powered by Mercuryo</Text>
          </View>
          <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
            <X color={Colors.brand.ink} size={24} />
          </TouchableOpacity>
        </View>

        {/* Loading Indicator */}
        {isLoading && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={Colors.brand.cherryRed} />
            <Text style={styles.loadingText}>Loading Mercuryo...</Text>
          </View>
        )}

        {/* WebView */}
        <WebView
          source={{ uri: getMercuryoUrl() }}
          style={styles.webview}
          onLoadStart={() => setIsLoading(true)}
          onLoadEnd={() => setIsLoading(false)}
          onNavigationStateChange={handleNavigationStateChange}
          javaScriptEnabled={true}
          domStorageEnabled={true}
          startInLoadingState={true}
          // Security settings
          allowsInlineMediaPlayback={true}
          mediaPlaybackRequiresUserAction={false}
        />

        {/* Info Footer */}
        <View style={[styles.footer, { paddingBottom: insets.bottom + 8 }]}>
          <Text style={styles.footerText}>
            💳 Buy crypto securely with credit card, debit card, or bank transfer
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
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.brand.white,
    zIndex: 10,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: Colors.brand.inkMuted,
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
});
