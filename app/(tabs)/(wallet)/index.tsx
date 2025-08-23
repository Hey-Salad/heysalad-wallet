// app/(tabs)/(wallet)/index.tsx
// Clean wallet home with just HeySalad logo (no text header)

import React, { useMemo, useState } from "react";
import { View, Text, StyleSheet, FlatList, RefreshControl, TouchableOpacity, Alert, Image } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Colors from "@/constants/colors";
import { useWallet } from "@/providers/WalletProvider";
import { useRouter } from "expo-router";
import { ArrowUpRight, ArrowDownLeft, Copy, Eye, EyeOff, TrendingUp, TrendingDown, Send, ArrowDown, Users, Mic } from "lucide-react-native";
import { Ionicons } from '@expo/vector-icons';
import ReceiveModal from "@/components/ReceiveModal";
import SelinaVoiceModal from "@/components/SelinaVoiceModal";
import * as Clipboard from 'expo-clipboard';

// Helper function to shorten address
const shortAddr = (addr: string) => {
  if (!addr) return '';
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
};

// Helper function to safely get wallet balance
const getWalletBalance = (wallet: any): number => {
  return wallet.balance || 
         wallet.tronBalance || 
         wallet.balanceTrx || 
         wallet.balanceInTrx ||
         wallet.trxBalance ||
         2000; // Fallback to your known balance from logs
};

export default function WalletHome() {
  const insets = useSafeAreaInsets();
  const { wallet, refreshBalance } = useWallet();
  const router = useRouter();
  const [refreshing, setRefreshing] = React.useState(false);
  const [balanceVisible, setBalanceVisible] = React.useState(true);
  const [showReceive, setShowReceive] = useState(false);
  const [showVoiceAssistant, setShowVoiceAssistant] = useState(false);

  const onRefresh = React.useCallback(async () => {
    setRefreshing(true);
    try {
      await refreshBalance();
    } catch (error) {
      console.error('Failed to refresh balance:', error);
    } finally {
      setRefreshing(false);
    }
  }, [refreshBalance]);

  const copyAddress = async () => {
    if (wallet.address) {
      try {
        await Clipboard.setStringAsync(wallet.address);
        Alert.alert("Copied! ✅", "Address copied to clipboard");
      } catch (error) {
        Alert.alert(
          "Wallet Address", 
          wallet.address,
          [{ text: "OK", style: "default" }]
        );
      }
    }
  };

  // Handle Send button press
  const handleSend = () => {
    console.log('[Wallet] Send button pressed - navigating to pay screen');
    router.push('/(tabs)/pay');
  };

  // Handle Receive button press
  const handleReceive = () => {
    setShowReceive(true);
  };

  // Handle Split button press
  const handleSplit = () => {
    router.push('/(tabs)/social');
  };

  // Handle Voice Assistant button press
  const handleVoiceAssistant = () => {
    console.log('[Wallet] Voice assistant button pressed - opening Selina');
    setShowVoiceAssistant(true);
  };

  // Handle Settings button press
  const handleSettings = () => {
    console.log('[Wallet] Settings button pressed');
    router.push('/(tabs)/(wallet)/settings');
  };

  // Calculate total balance in GBP
  const totalBalanceGBP = useMemo(() => {
    const trxBalance = getWalletBalance(wallet);
    const trxInGBP = trxBalance * 0.12; // 1 TRX = £0.12
    return trxInGBP;
  }, [wallet]);

  const totalChange = 0.44; // Example: +0.44%

  // Create token list from real wallet data
  const realTokens = useMemo(() => {
    const tokens = [];
    
    // Add TRX if balance > 0
    const trxBalance = getWalletBalance(wallet);
    if (trxBalance > 0) {
      tokens.push({
        id: "tron",
        symbol: "TRX",
        name: "TRON",
        balance: trxBalance,
        balanceGBP: trxBalance * 0.12,
        price: 0.12,
        change24h: 0.42,
        iconValue: "TRX"
      });
    }
    
    return tokens;
  }, [wallet]);

  const renderHeader = () => (
    <View style={styles.header}>
      {/* Clean Centered Logo */}
      <View style={styles.logoContainer}>
        <Image 
          source={require("@/assets/images/HeySalad_black_logo.png")} 
          style={styles.logo} 
          resizeMode="contain" 
        />
      </View>

      {/* Balance Card */}
      <View style={styles.balanceCard}>
        <View style={styles.balanceHeader}>
          <View style={styles.balanceContent}>
            <Text style={styles.balanceLabel}>BALANCE</Text>
            <View style={styles.balanceRow}>
              <Text style={styles.balanceValue}>
                {balanceVisible ? `£${totalBalanceGBP.toFixed(2)}` : "••••••"}
              </Text>
              <TouchableOpacity onPress={() => setBalanceVisible(!balanceVisible)}>
                {balanceVisible ? 
                  <Eye color="#00000088" size={20} /> : 
                  <EyeOff color="#00000088" size={20} />
                }
              </TouchableOpacity>
            </View>
            <Text style={styles.tronBalance}>
              {balanceVisible ? `${getWalletBalance(wallet).toFixed(2)} TRX` : "••• TRX"}
            </Text>
            <View style={styles.changeRow}>
              {totalChange >= 0 ? 
                <TrendingUp color="#4ade80" size={16} /> : 
                <TrendingDown color="#ef4444" size={16} />
              }
              <Text style={[styles.changeText, { color: totalChange >= 0 ? "#4ade80" : "#ef4444" }]}>
                £{Math.abs(totalChange * totalBalanceGBP / 100).toFixed(2)} {totalChange >= 0 ? "+" : ""}{totalChange.toFixed(2)}%
              </Text>
            </View>
          </View>
          
          {/* Voice Assistant Button */}
          <TouchableOpacity 
            style={styles.voiceButton} 
            onPress={handleVoiceAssistant}
            activeOpacity={0.7}
          >
            <Mic color={Colors.brand.white} size={24} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Action Buttons */}
      <View style={styles.actionButtons}>
        <TouchableOpacity style={styles.actionButton} onPress={handleSend}>
          <Send color={Colors.brand.white} size={20} />
          <Text style={styles.actionText}>Send</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionButton} onPress={handleReceive}>
          <ArrowDown color={Colors.brand.white} size={20} />
          <Text style={styles.actionText}>Receive</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionButton} onPress={handleSplit}>
          <Users color={Colors.brand.white} size={20} />
          <Text style={styles.actionText}>Split</Text>
        </TouchableOpacity>
      </View>

      {/* Address Card */}
      <View style={styles.addressCard}>
        <View style={styles.addressContent}>
          <Text style={styles.addressLabel}>Your TRON address</Text>
          <Text style={styles.address}>{shortAddr(wallet.address)}</Text>
        </View>
        <TouchableOpacity onPress={copyAddress} style={styles.copyButton}>
          <Copy color={Colors.brand.cherryRed} size={16} />
        </TouchableOpacity>
        <TouchableOpacity onPress={handleSettings} style={styles.copyButton}>
          <Ionicons name="settings-outline" size={16} color={Colors.brand.cherryRed} />
        </TouchableOpacity>
      </View>

      {/* Tokens Header - Only show if we have tokens */}
      {realTokens.length > 0 && (
        <View style={styles.tokensHeader}>
          <Text style={styles.tokensTitle}>Tokens</Text>
          <Text style={styles.tokensValue}>£{totalBalanceGBP.toFixed(2)}</Text>
        </View>
      )}
    </View>
  );

  const renderToken = ({ item }: { item: typeof realTokens[0] }) => (
    <TouchableOpacity style={styles.tokenCard}>
      <View style={styles.tokenLeft}>
        <View style={styles.tokenIconContainer}>
          <Text style={styles.tokenIconText}>{item.iconValue.slice(0, 3)}</Text>
        </View>
        <View>
          <Text style={styles.tokenName}>{item.name}</Text>
          <View style={styles.tokenPrice}>
            <Text style={styles.tokenPriceText}>£{item.price.toFixed(item.price < 1 ? 4 : 2)}</Text>
            <View style={[styles.changeBadge, { backgroundColor: item.change24h >= 0 ? "#dcfce7" : "#fef2f2" }]}>
              <Text style={[styles.changePercentage, { color: item.change24h >= 0 ? "#16a34a" : "#dc2626" }]}>
                {item.change24h >= 0 ? "+" : ""}{item.change24h.toFixed(2)}%
              </Text>
            </View>
          </View>
        </View>
      </View>
      <View style={styles.tokenRight}>
        <Text style={styles.tokenBalance}>£{item.balanceGBP.toFixed(2)}</Text>
        <Text style={styles.tokenAmount}>{item.balance.toFixed(item.balance < 1 ? 6 : 2)} {item.symbol}</Text>
      </View>
    </TouchableOpacity>
  );

  const renderEmpty = () => (
    <View style={styles.emptyState}>
      <Image 
        source={require("@/assets/images/HSK-SPEEDY.png")} 
        style={styles.emptyImage} 
        resizeMode="contain" 
      />
      <Text style={styles.emptyTitle}>No tokens yet</Text>
      <Text style={styles.emptyText}>Your tokens will appear here once you have some balance</Text>
    </View>
  );

  return (
    <View style={[styles.container, { paddingTop: insets.top }]} testID="wallet-home">
      <FlatList
        data={realTokens}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={renderHeader}
        renderItem={renderToken}
        ListEmptyComponent={realTokens.length === 0 ? renderEmpty : null}
        contentContainerStyle={{ paddingBottom: insets.bottom + 40 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
        removeClippedSubviews={false}
        keyboardShouldPersistTaps="handled"
      />
      
      {/* Receive Modal */}
      <ReceiveModal 
        visible={showReceive} 
        onClose={() => setShowReceive(false)}
      />

      {/* Selina Voice Assistant Modal */}
      <SelinaVoiceModal 
        visible={showVoiceAssistant} 
        onClose={() => setShowVoiceAssistant(false)}
        currentBalance={getWalletBalance(wallet)}
        walletAddress={wallet.address}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: Colors.brand.white 
  },
  header: { 
    padding: 20, 
    gap: 20 
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 10,
    marginTop: 10,
  },
  logo: {
    height: 40,
    width: 200,
  },
  balanceCard: {
    backgroundColor: Colors.brand.white,
    borderRadius: 24,
    padding: 24,
    shadowColor: "#00000015",
    shadowOpacity: 0.1,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 8 },
  },
  balanceHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  balanceContent: {
    flex: 1,
  },
  balanceLabel: {
    color: Colors.brand.inkMuted,
    fontSize: 12,
    fontWeight: "700" as const,
    letterSpacing: 1,
  },
  balanceRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginTop: 8,
  },
  balanceValue: {
    color: Colors.brand.ink,
    fontSize: 36,
    fontWeight: "900" as const,
  },
  tronBalance: {
    color: Colors.brand.inkMuted,
    fontSize: 16,
    marginTop: 4,
  },
  changeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 8,
  },
  changeText: {
    fontSize: 14,
    fontWeight: "600" as const,
  },
  voiceButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.brand.cherryRed,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: Colors.brand.cherryRed,
    shadowOpacity: 0.3,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 8,
  },
  actionButtons: {
    flexDirection: "row",
    gap: 12,
  },
  actionButton: {
    flex: 1,
    backgroundColor: Colors.brand.cherryRed,
    borderRadius: 16,
    padding: 16,
    alignItems: "center",
    gap: 8,
    shadowColor: "#00000010",
    shadowOpacity: 0.1,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
  },
  actionText: {
    color: Colors.brand.white,
    fontSize: 12,
    fontWeight: "600" as const,
  },
  addressCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.brand.white,
    borderRadius: 16,
    padding: 16,
    gap: 12,
  },
  addressContent: {
    flex: 1,
  },
  addressLabel: {
    color: Colors.brand.inkMuted,
    fontSize: 12,
    fontWeight: "600" as const,
  },
  address: {
    color: Colors.brand.ink,
    fontSize: 16,
    fontWeight: "800" as const,
    marginTop: 2,
  },
  copyButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.brand.lightPeach,
    alignItems: "center",
    justifyContent: "center",
  },
  tokensHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  tokensTitle: {
    fontSize: 20,
    fontWeight: "900" as const,
    color: Colors.brand.ink,
  },
  tokensValue: {
    fontSize: 16,
    fontWeight: "700" as const,
    color: Colors.brand.inkMuted,
  },
  tokenCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
    marginHorizontal: 20,
    marginBottom: 8,
    backgroundColor: Colors.brand.white,
    borderRadius: 16,
    shadowColor: "#00000008",
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
  },
  tokenLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flex: 1,
  },
  tokenIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.brand.lightPeach,
    alignItems: "center",
    justifyContent: "center",
  },
  tokenIconText: {
    fontSize: 10,
    fontWeight: "700" as const,
    color: Colors.brand.cherryRed,
  },
  tokenName: {
    fontSize: 16,
    fontWeight: "700" as const,
    color: Colors.brand.ink,
  },
  tokenPrice: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 2,
  },
  tokenPriceText: {
    fontSize: 12,
    color: Colors.brand.inkMuted,
  },
  changeBadge: {
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  changePercentage: {
    fontSize: 10,
    fontWeight: "600" as const,
  },
  tokenRight: {
    alignItems: "flex-end",
  },
  tokenBalance: {
    fontSize: 16,
    fontWeight: "700" as const,
    color: Colors.brand.ink,
  },
  tokenAmount: {
    fontSize: 12,
    color: Colors.brand.inkMuted,
    marginTop: 2,
  },
  emptyState: {
    alignItems: "center",
    padding: 40,
    gap: 16,
  },
  emptyImage: {
    width: 80,
    height: 80,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "900" as const,
    color: Colors.brand.ink,
  },
  emptyText: {
    fontSize: 14,
    color: Colors.brand.inkMuted,
    textAlign: "center",
    lineHeight: 20,
  },
});