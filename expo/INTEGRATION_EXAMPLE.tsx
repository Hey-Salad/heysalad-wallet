// INTEGRATION_EXAMPLE.tsx
// Example of how to use the Stripe Crypto Onramp in your wallet screens

import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import StripeOnrampWidget from '@/components/StripeOnrampWidget';
import { useWallet } from '@/providers/WalletProvider';
import { useSupabase } from '@/providers/SupabaseProvider';
import Colors from '@/constants/colors';
import { DollarSign } from 'lucide-react-native';

/**
 * EXAMPLE 1: Add "Buy Crypto" button to wallet screen
 *
 * This can be integrated into:
 * - app/(tabs)/(wallet)/index.tsx
 * - Any screen where you want to offer crypto purchase
 */
export function WalletScreenWithBuyCrypto() {
  const { wallet } = useWallet();
  const { profile } = useSupabase();
  const [showOnramp, setShowOnramp] = useState(false);

  const handleBuyCrypto = () => {
    if (!wallet.address) {
      alert('Please create a wallet first');
      return;
    }
    setShowOnramp(true);
  };

  const handleOnrampSuccess = async (sessionId: string) => {
    console.log('Crypto purchase completed:', sessionId);

    // Optional: Save to Supabase for tracking
    // await supabase.from('onramp_sessions').insert({
    //   session_id: sessionId,
    //   user_id: profile.auth_user_id,
    //   status: 'completed'
    // });

    // Refresh wallet balance after purchase
    // await refreshBalance();
  };

  return (
    <View style={styles.container}>
      {/* Your existing wallet UI */}
      <Text style={styles.balance}>Balance: $0.00</Text>

      {/* Buy Crypto Button */}
      <TouchableOpacity
        style={styles.buyCryptoButton}
        onPress={handleBuyCrypto}
      >
        <DollarSign size={20} color={Colors.brand.white} />
        <Text style={styles.buyCryptoText}>Buy Crypto with Card</Text>
      </TouchableOpacity>

      {/* Stripe Onramp Widget */}
      <StripeOnrampWidget
        visible={showOnramp}
        onClose={() => setShowOnramp(false)}
        walletAddress={wallet.address}
        currency="usdc" // or 'eth', 'btc'
        network="polygon" // or 'ethereum', 'base'
        onSuccess={handleOnrampSuccess}
      />
    </View>
  );
}

/**
 * EXAMPLE 2: Currency selector for onramp
 *
 * Allow users to choose which crypto to buy
 */
export function OnrampWithCurrencySelector() {
  const { wallet } = useWallet();
  const [showOnramp, setShowOnramp] = useState(false);
  const [selectedCurrency, setSelectedCurrency] = useState<'usdc' | 'eth' | 'btc'>('usdc');
  const [selectedNetwork, setSelectedNetwork] = useState<'polygon' | 'ethereum' | 'base'>('polygon');

  const currencies = [
    { value: 'usdc', label: 'USDC', networks: ['polygon', 'ethereum', 'base'] },
    { value: 'eth', label: 'ETH', networks: ['ethereum', 'base'] },
    { value: 'btc', label: 'BTC', networks: ['bitcoin'] },
  ];

  return (
    <View style={styles.container}>
      {/* Currency Selector */}
      <Text style={styles.label}>Select Cryptocurrency</Text>
      <View style={styles.currencyGrid}>
        {currencies.map((currency) => (
          <TouchableOpacity
            key={currency.value}
            style={[
              styles.currencyButton,
              selectedCurrency === currency.value && styles.currencyButtonActive,
            ]}
            onPress={() => {
              setSelectedCurrency(currency.value as any);
              setSelectedNetwork(currency.networks[0] as any);
            }}
          >
            <Text
              style={[
                styles.currencyButtonText,
                selectedCurrency === currency.value && styles.currencyButtonTextActive,
              ]}
            >
              {currency.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Buy Button */}
      <TouchableOpacity
        style={styles.primaryButton}
        onPress={() => setShowOnramp(true)}
      >
        <Text style={styles.primaryButtonText}>
          Buy {selectedCurrency.toUpperCase()} on {selectedNetwork}
        </Text>
      </TouchableOpacity>

      {/* Onramp Widget */}
      <StripeOnrampWidget
        visible={showOnramp}
        onClose={() => setShowOnramp(false)}
        walletAddress={wallet.address}
        currency={selectedCurrency}
        network={selectedNetwork}
        onSuccess={(sessionId) => {
          console.log('Purchase completed:', sessionId);
          setShowOnramp(false);
        }}
      />
    </View>
  );
}

/**
 * EXAMPLE 3: Integration with existing MercuryoWidget
 *
 * Replace MercuryoWidget with StripeOnrampWidget
 */
export function MigrateFromMercuryoToStripe() {
  const { wallet } = useWallet();
  const [onrampProvider, setOnrampProvider] = useState<'stripe' | 'mercuryo'>('stripe');
  const [showOnramp, setShowOnramp] = useState(false);

  return (
    <View style={styles.container}>
      {/* Provider Selector */}
      <View style={styles.providerSelector}>
        <TouchableOpacity
          style={[styles.providerButton, onrampProvider === 'stripe' && styles.providerButtonActive]}
          onPress={() => setOnrampProvider('stripe')}
        >
          <Text style={styles.providerButtonText}>Stripe</Text>
          <Text style={styles.providerSubtext}>Recommended</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.providerButton, onrampProvider === 'mercuryo' && styles.providerButtonActive]}
          onPress={() => setOnrampProvider('mercuryo')}
        >
          <Text style={styles.providerButtonText}>Mercuryo</Text>
          <Text style={styles.providerSubtext}>Alternative</Text>
        </TouchableOpacity>
      </View>

      {/* Buy Button */}
      <TouchableOpacity
        style={styles.primaryButton}
        onPress={() => setShowOnramp(true)}
      >
        <Text style={styles.primaryButtonText}>Buy Crypto</Text>
      </TouchableOpacity>

      {/* Conditional Rendering of Onramp Widget */}
      {onrampProvider === 'stripe' ? (
        <StripeOnrampWidget
          visible={showOnramp}
          onClose={() => setShowOnramp(false)}
          walletAddress={wallet.address}
          currency="usdc"
          network="polygon"
        />
      ) : (
        // Your existing MercuryoWidget
        <View />
      )}
    </View>
  );
}

/**
 * EXAMPLE 4: Direct API usage (without widget)
 *
 * Use the API client directly for custom implementations
 */
import { CloudflareAPI } from '@/services/cloudflareClient';

export async function directApiUsageExample() {
  // Check service health
  const health = await CloudflareAPI.checkOnrampHealth();
  console.log('Service status:', health);

  // Get supported currencies and networks
  const config = await CloudflareAPI.getOnrampConfig();
  console.log('Supported currencies:', config.data?.supportedCurrencies);
  console.log('Supported networks:', config.data?.supportedNetworks);

  // Create onramp session
  const session = await CloudflareAPI.createOnrampSession({
    customerEmail: 'user@example.com',
    customerName: 'John Doe',
    walletAddress: '0x123...',
    destinationCurrency: 'usdc',
    destinationNetwork: 'polygon',
    sourceCurrency: 'usd',
    sourceAmount: '100', // $100 USD
  });

  if (session.success && session.data) {
    const { clientSecret, publishableKey, sessionId } = session.data;

    // Use these to open Stripe onramp manually
    console.log('Session created:', sessionId);

    // Check session status later
    const status = await CloudflareAPI.getOnrampSessionStatus(sessionId);
    console.log('Session status:', status);
  }
}

/**
 * EXAMPLE 5: Save onramp history to Supabase
 */
import { supabase } from '@/providers/SupabaseProvider';

export async function trackOnrampInSupabase(
  sessionId: string,
  amount: string,
  currency: string,
  userId: string
) {
  // Create table first:
  // CREATE TABLE onramp_sessions (
  //   id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  //   user_id UUID REFERENCES auth.users,
  //   stripe_session_id VARCHAR(255),
  //   amount DECIMAL,
  //   currency VARCHAR(10),
  //   network VARCHAR(50),
  //   status VARCHAR(50),
  //   created_at TIMESTAMP DEFAULT NOW()
  // );

  const { error } = await supabase.from('onramp_sessions').insert({
    user_id: userId,
    stripe_session_id: sessionId,
    amount: parseFloat(amount),
    currency: currency,
    network: 'polygon',
    status: 'pending',
  });

  if (error) {
    console.error('Error saving onramp session:', error);
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: Colors.brand.white,
  },
  balance: {
    fontSize: 32,
    fontWeight: '900',
    color: Colors.brand.ink,
    textAlign: 'center',
    marginVertical: 20,
  },
  buyCryptoButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.brand.cherryRed,
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 24,
    gap: 8,
  },
  buyCryptoText: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.brand.white,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.brand.ink,
    marginBottom: 12,
  },
  currencyGrid: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  currencyButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: Colors.brand.border,
    backgroundColor: Colors.brand.white,
    alignItems: 'center',
  },
  currencyButtonActive: {
    borderColor: Colors.brand.cherryRed,
    backgroundColor: Colors.brand.lightPeach,
  },
  currencyButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.brand.inkMuted,
  },
  currencyButtonTextActive: {
    color: Colors.brand.cherryRed,
  },
  primaryButton: {
    backgroundColor: Colors.brand.cherryRed,
    paddingVertical: 16,
    borderRadius: 24,
    alignItems: 'center',
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.brand.white,
  },
  providerSelector: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  providerButton: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: Colors.brand.border,
    backgroundColor: Colors.brand.white,
  },
  providerButtonActive: {
    borderColor: Colors.brand.cherryRed,
    backgroundColor: Colors.brand.lightPeach,
  },
  providerButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.brand.ink,
    marginBottom: 4,
  },
  providerSubtext: {
    fontSize: 12,
    color: Colors.brand.inkMuted,
  },
});
