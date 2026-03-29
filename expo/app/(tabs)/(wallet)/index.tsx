// app/(tabs)/(wallet)/index.tsx
// Clean wallet home with just HeySalad logo (no text header)

import React, { useMemo, useState } from "react";
import { View, Text, StyleSheet, FlatList, RefreshControl, TouchableOpacity, Alert, Image } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Colors from "@/constants/colors";
import { useWallet } from "@/providers/WalletProvider";
import { useRouter } from "expo-router";
import { Copy, Eye, EyeOff, TrendingUp, TrendingDown, Send, ArrowDown, Users, Mic, CreditCard, ArrowUpDown } from "lucide-react-native";
import { Ionicons } from '@expo/vector-icons';
import ReceiveModal from "@/components/ReceiveModal";
import SelinaVoiceModal from "@/components/SelinaVoiceModal";
import MercuryoWidget from "@/components/MercuryoWidget";
import SmartCryptoIcon from "@/components/SmartCryptoIcon";
import NetworkSwitcher from "@/components/NetworkSwitcher";
import { useNetwork } from "@/providers/NetworkProvider";
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
  const { network } = useNetwork();
  const router = useRouter();
  const [refreshing, setRefreshing] = React.useState(false);
  const [balanceVisible, setBalanceVisible] = React.useState(true);
  const [showReceive, setShowReceive] = useState(false);
  const [showVoiceAssistant, setShowVoiceAssistant] = useState(false);
  const [showMercuryo, setShowMercuryo] = useState(false);

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

  // Handle Buy button press
  const handleBuy = () => {
    console.log('[Wallet] Buy button pressed - opening Mercuryo');
    setShowMercuryo(true);
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

  // Multi-chain token list - shows all supported chains
  const realTokens = useMemo(() => {
    const tokens = [];

    // TRX (TRON)
    const trxBalance = getWalletBalance(wallet);
    tokens.push({
      id: "tron",
      symbol: "TRX",
      name: "Tron",
      balance: trxBalance,
      balanceGBP: trxBalance * 0.12,
      price: 0.12,
      change24h: 0.42,
      iconValue: "TRX",
      blockchain: "tron"
    });

    // ETH (Base)
    tokens.push({
      id: "base-eth",
      symbol: "ETH",
      name: "Ethereum",
      balance: 0,
      balanceGBP: 0,
      price: 2450.00,
      change24h: 1.24,
      iconValue: "ETH",
      blockchain: "base"
    });

    // MATIC (Polygon)
    tokens.push({
      id: "polygon-matic",
      symbol: "MATIC",
      name: "Polygon",
      balance: 0,
      balanceGBP: 0,
      price: 0.68,
      change24h: -0.82,
      iconValue: "MATIC",
      blockchain: "polygon"
    });

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

      {/* Simple Balance Display */}
      <View style={styles.balanceSection}>
        <View style={styles.balanceRow}>
          <Text style={styles.balanceValue}>
            {balanceVisible ? `£${totalBalanceGBP.toFixed(2)}` : "••••••"}
          </Text>
          <TouchableOpacity onPress={() => setBalanceVisible(!balanceVisible)}>
            {balanceVisible ?
              <Eye color="#00000088" size={22} /> :
              <EyeOff color="#00000088" size={22} />
            }
          </TouchableOpacity>
        </View>
        <Text style={styles.networksText}>3 networks</Text>
      </View>

      {/* Action Buttons - Tangem Style */}
      <View style={styles.actionButtons}>
        <TouchableOpacity style={styles.actionButton} onPress={handleBuy}>
          <View style={styles.actionIcon}>
            <CreditCard color={Colors.brand.cherryRed} size={20} />
          </View>
          <Text style={styles.actionText}>Buy</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionButton} onPress={() => Alert.alert('Swap', 'Swap feature coming soon!')}>
          <View style={styles.actionIcon}>
            <ArrowUpDown color={Colors.brand.cherryRed} size={20} />
          </View>
          <Text style={styles.actionText}>Swap</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionButton} onPress={handleSend}>
          <View style={styles.actionIcon}>
            <Send color={Colors.brand.cherryRed} size={20} />
          </View>
          <Text style={styles.actionText}>Send</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionButton} onPress={handleReceive}>
          <View style={styles.actionIcon}>
            <ArrowDown color={Colors.brand.cherryRed} size={20} />
          </View>
          <Text style={styles.actionText} numberOfLines={1}>Receive</Text>
        </TouchableOpacity>
      </View>

      {/* Tokens Header - Tangem Style */}
      <View style={styles.tokensHeader}>
        <Text style={styles.tokensTitle}>Assets</Text>
        <TouchableOpacity onPress={handleSettings} style={styles.settingsButton}>
          <Ionicons name="settings-outline" size={20} color={Colors.brand.inkMuted} />
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderTokenIcon = (symbol: string) => {
    return <SmartCryptoIcon symbol={symbol} size={28} />;
  };

  const handleTokenPress = (item: typeof realTokens[0]) => {
    router.push({
      pathname: '/(tabs)/(wallet)/asset-detail',
      params: {
        symbol: item.symbol,
        name: item.name,
        balance: item.balance.toString(),
        balanceGBP: item.balanceGBP.toString(),
        price: item.price.toString(),
        change24h: item.change24h.toString(),
        blockchain: item.blockchain,
      },
    });
  };

  const renderToken = ({ item }: { item: typeof realTokens[0] }) => (
    <TouchableOpacity style={styles.tokenCard} onPress={() => handleTokenPress(item)}>
      <View style={styles.tokenLeft}>
        {renderTokenIcon(item.symbol)}
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

      {/* Mercuryo Buy Crypto Widget */}
      <MercuryoWidget
        visible={showMercuryo}
        onClose={() => setShowMercuryo(false)}
        walletAddress={wallet.address}
        currency="TRX"
        network="TRON"
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
  balanceSection: {
    alignItems: "center",
    paddingVertical: 20,
  },
  balanceRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  balanceValue: {
    color: Colors.brand.ink,
    fontSize: 48,
    fontWeight: "700" as const,
    letterSpacing: -1,
  },
  networksText: {
    color: Colors.brand.inkMuted,
    fontSize: 15,
    marginTop: 8,
    fontWeight: "500" as const,
  },
  actionButtons: {
    flexDirection: "row",
    gap: 12,
  },
  actionButton: {
    flex: 1,
    backgroundColor: Colors.brand.white,
    borderRadius: 16,
    padding: 16,
    alignItems: "center",
    gap: 8,
    shadowColor: "#00000008",
    shadowOpacity: 0.1,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 2 },
  },
  actionIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#FFF3F0",
    alignItems: "center",
    justifyContent: "center",
  },
  actionText: {
    color: Colors.brand.ink,
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
    marginTop: 8,
  },
  tokensTitle: {
    fontSize: 22,
    fontWeight: "700" as const,
    color: Colors.brand.ink,
  },
  settingsButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.brand.white,
    alignItems: "center",
    justifyContent: "center",
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
  tronLogoOuter: {
    width: 32,
    height: 32,
    alignItems: "center",
    justifyContent: "center",
  },
  tronLogo: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.brand.cherryRed,
    alignItems: "center",
    justifyContent: "center",
  },
  tronLogoText: {
    fontSize: 16,
    fontWeight: "900" as const,
    color: Colors.brand.white,
    marginTop: 2,
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