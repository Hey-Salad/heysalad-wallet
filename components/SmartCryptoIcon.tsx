// components/SmartCryptoIcon.tsx
// Smart crypto icon component with bundled icons + API fallback

import React, { useState, useEffect } from 'react';
import { View, Image, Text, StyleSheet, ViewStyle } from 'react-native';
import { getCryptoIconUrl } from '@/services/CryptoIconService';
import Colors from '@/constants/colors';

interface SmartCryptoIconProps {
  symbol: string;
  size?: number;
  style?: ViewStyle;
}

export default function SmartCryptoIcon({ symbol, size = 32, style }: SmartCryptoIconProps) {
  const [iconUrl, setIconUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    loadIcon();
  }, [symbol, size]);

  const loadIcon = async () => {
    try {
      setIsLoading(true);
      setHasError(false);

      const url = await getCryptoIconUrl(symbol, size);
      setIconUrl(url);
      setIsLoading(false);

      console.log(`[SmartCryptoIcon] Loaded icon for ${symbol}:`, url);
    } catch (error) {
      console.error(`[SmartCryptoIcon] Failed to load icon for ${symbol}:`, error);
      setHasError(true);
      setIsLoading(false);
    }
  };

  const handleImageError = () => {
    console.log(`[SmartCryptoIcon] Image failed to load for ${symbol}, showing fallback`);
    setHasError(true);
  };

  // Show fallback if error or loading
  if (hasError || !iconUrl) {
    return (
      <View style={[styles.container, styles.fallbackContainer, { width: size, height: size, borderRadius: size / 2 }, style]}>
        <Text style={[styles.fallbackText, { fontSize: size * 0.4 }]}>
          {symbol.slice(0, 3).toUpperCase()}
        </Text>
      </View>
    );
  }

  // Handle bundled icons
  if (iconUrl.startsWith('bundled:')) {
    const [, symbolLower, iconSize] = iconUrl.split(':');

    // Map of bundled icon requires
    // Note: In React Native, dynamic requires must use known paths
    const bundledIcons: Record<string, any> = {
      btc: require('cryptocurrency-icons/svg/color/btc.svg'),
      eth: require('cryptocurrency-icons/svg/color/eth.svg'),
      usdt: require('cryptocurrency-icons/svg/color/usdt.svg'),
      usdc: require('cryptocurrency-icons/svg/color/usdc.svg'),
      bnb: require('cryptocurrency-icons/svg/color/bnb.svg'),
      ada: require('cryptocurrency-icons/svg/color/ada.svg'),
      sol: require('cryptocurrency-icons/svg/color/sol.svg'),
      dot: require('cryptocurrency-icons/svg/color/dot.svg'),
      matic: require('cryptocurrency-icons/svg/color/matic.svg'),
      avax: require('cryptocurrency-icons/svg/color/avax.svg'),
      trx: require('cryptocurrency-icons/svg/color/trx.svg'),
      link: require('cryptocurrency-icons/svg/color/link.svg'),
      uni: require('cryptocurrency-icons/svg/color/uni.svg'),
      atom: require('cryptocurrency-icons/svg/color/atom.svg'),
      xrp: require('cryptocurrency-icons/svg/color/xrp.svg'),
    };

    const iconSource = bundledIcons[symbolLower];

    if (iconSource) {
      return (
        <View style={[styles.container, { width: size, height: size }, style]}>
          <Image
            source={iconSource}
            style={{ width: size, height: size, borderRadius: size / 2 }}
            resizeMode="contain"
          />
        </View>
      );
    }

    // If bundled icon not found, show fallback
    return (
      <View style={[styles.container, styles.fallbackContainer, { width: size, height: size, borderRadius: size / 2 }, style]}>
        <Text style={[styles.fallbackText, { fontSize: size * 0.4 }]}>
          {symbol.slice(0, 3).toUpperCase()}
        </Text>
      </View>
    );
  }

  // Remote URL (CoinGecko or Trust Wallet CDN)
  return (
    <View style={[styles.container, { width: size, height: size }, style]}>
      <Image
        source={{ uri: iconUrl }}
        style={{ width: size, height: size, borderRadius: size / 2 }}
        resizeMode="contain"
        onError={handleImageError}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  fallbackContainer: {
    backgroundColor: Colors.brand.lightPeach,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fallbackText: {
    fontWeight: '900' as const,
    color: Colors.brand.ink,
  },
});
