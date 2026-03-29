// app/(tabs)/(wallet)/asset-detail.tsx
// Asset detail screen showing token information, network, balance, and actions

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ArrowLeft, ArrowUp, ArrowDown, Repeat, ShoppingBag } from 'lucide-react-native';
import Colors from '@/constants/colors';
import SmartCryptoIcon from '@/components/SmartCryptoIcon';

export default function AssetDetailScreen() {
  const params = useLocalSearchParams();
  const insets = useSafeAreaInsets();

  // Parse params
  const symbol = params.symbol as string;
  const name = params.name as string;
  const balance = parseFloat(params.balance as string);
  const balanceGBP = parseFloat(params.balanceGBP as string);
  const price = parseFloat(params.price as string);
  const change24h = parseFloat(params.change24h as string);
  const blockchain = params.blockchain as string;

  const networkName = blockchain.charAt(0).toUpperCase() + blockchain.slice(1);

  const handleSend = () => {
    Alert.alert('Send', `Send ${symbol} coming soon`);
  };

  const handleReceive = () => {
    Alert.alert('Receive', `Receive ${symbol} coming soon`);
  };

  const handleSwap = () => {
    Alert.alert('Swap', `Swap ${symbol} coming soon`);
  };

  const handleBuy = () => {
    Alert.alert('Buy', `Buy ${symbol} coming soon`);
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft color={Colors.brand.ink} size={24} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{name}</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.content} contentContainerStyle={{ paddingBottom: insets.bottom + 20 }}>
        {/* Token Icon and Info */}
        <View style={styles.tokenSection}>
          <SmartCryptoIcon symbol={symbol} size={64} />
          <Text style={styles.tokenName}>{name}</Text>
          <Text style={styles.tokenSymbol}>{symbol}</Text>
          <View style={styles.networkBadge}>
            <Text style={styles.networkText}>{networkName} Network</Text>
          </View>
        </View>

        {/* Balance Section */}
        <View style={styles.balanceSection}>
          <Text style={styles.balanceLabel}>Balance</Text>
          <Text style={styles.balanceAmount}>
            {balance.toFixed(6)} {symbol}
          </Text>
          <Text style={styles.balanceValue}>£{balanceGBP.toFixed(2)}</Text>
        </View>

        {/* Price Section */}
        <View style={styles.priceSection}>
          <View style={styles.priceRow}>
            <Text style={styles.priceLabel}>Current Price</Text>
            <Text style={styles.priceAmount}>£{price.toFixed(2)}</Text>
          </View>
          <View style={styles.priceRow}>
            <Text style={styles.priceLabel}>24h Change</Text>
            <Text style={[styles.priceChange, change24h >= 0 ? styles.priceChangePositive : styles.priceChangeNegative]}>
              {change24h >= 0 ? '+' : ''}{change24h.toFixed(2)}%
            </Text>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionsSection}>
          <TouchableOpacity style={styles.actionButton} onPress={handleSend}>
            <View style={[styles.actionIcon, styles.actionIconSend]}>
              <ArrowUp color={Colors.brand.white} size={20} />
            </View>
            <Text style={styles.actionText}>Send</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionButton} onPress={handleReceive}>
            <View style={[styles.actionIcon, styles.actionIconReceive]}>
              <ArrowDown color={Colors.brand.white} size={20} />
            </View>
            <Text style={styles.actionText}>Receive</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionButton} onPress={handleSwap}>
            <View style={[styles.actionIcon, styles.actionIconSwap]}>
              <Repeat color={Colors.brand.white} size={20} />
            </View>
            <Text style={styles.actionText}>Swap</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionButton} onPress={handleBuy}>
            <View style={[styles.actionIcon, styles.actionIconBuy]}>
              <ShoppingBag color={Colors.brand.white} size={20} />
            </View>
            <Text style={styles.actionText}>Buy</Text>
          </TouchableOpacity>
        </View>

        {/* Transaction History Placeholder */}
        <View style={styles.historySection}>
          <Text style={styles.historyTitle}>Transaction History</Text>
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateText}>No transactions yet</Text>
            <Text style={styles.emptyStateSubtext}>
              Your {symbol} transactions will appear here
            </Text>
          </View>
        </View>
      </ScrollView>
    </View>
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
    borderBottomColor: Colors.brand.lightPeach,
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: Colors.brand.ink,
  },
  content: {
    flex: 1,
  },
  tokenSection: {
    alignItems: 'center',
    paddingVertical: 32,
    borderBottomWidth: 1,
    borderBottomColor: Colors.brand.lightPeach,
  },
  tokenName: {
    fontSize: 24,
    fontWeight: '900' as const,
    color: Colors.brand.ink,
    marginTop: 16,
  },
  tokenSymbol: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.brand.inkMuted,
    marginTop: 4,
  },
  networkBadge: {
    backgroundColor: Colors.brand.lightPeach,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 6,
    marginTop: 12,
  },
  networkText: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: Colors.brand.ink,
  },
  balanceSection: {
    alignItems: 'center',
    paddingVertical: 32,
    borderBottomWidth: 1,
    borderBottomColor: Colors.brand.lightPeach,
  },
  balanceLabel: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.brand.inkMuted,
    marginBottom: 8,
  },
  balanceAmount: {
    fontSize: 32,
    fontWeight: '900' as const,
    color: Colors.brand.ink,
    marginBottom: 8,
  },
  balanceValue: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: Colors.brand.inkMuted,
  },
  priceSection: {
    paddingHorizontal: 20,
    paddingVertical: 24,
    borderBottomWidth: 1,
    borderBottomColor: Colors.brand.lightPeach,
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  priceLabel: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.brand.inkMuted,
  },
  priceAmount: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: Colors.brand.ink,
  },
  priceChange: {
    fontSize: 16,
    fontWeight: '700' as const,
  },
  priceChangePositive: {
    color: '#10b981',
  },
  priceChangeNegative: {
    color: Colors.brand.cherryRed,
  },
  actionsSection: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 20,
    paddingVertical: 32,
    borderBottomWidth: 1,
    borderBottomColor: Colors.brand.lightPeach,
  },
  actionButton: {
    alignItems: 'center',
    gap: 8,
  },
  actionIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionIconSend: {
    backgroundColor: Colors.brand.cherryRed,
  },
  actionIconReceive: {
    backgroundColor: '#10b981',
  },
  actionIconSwap: {
    backgroundColor: '#3b82f6',
  },
  actionIconBuy: {
    backgroundColor: '#8b5cf6',
  },
  actionText: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: Colors.brand.ink,
  },
  historySection: {
    padding: 20,
  },
  historyTitle: {
    fontSize: 18,
    fontWeight: '900' as const,
    color: Colors.brand.ink,
    marginBottom: 16,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 48,
  },
  emptyStateText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.brand.inkMuted,
    marginBottom: 8,
  },
  emptyStateSubtext: {
    fontSize: 13,
    color: Colors.brand.inkMuted,
    textAlign: 'center',
  },
});
