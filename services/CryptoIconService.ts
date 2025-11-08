// services/CryptoIconService.ts
// Smart crypto icon service with bundled icons + CoinGecko API fallback

import AsyncStorage from '@react-native-async-storage/async-storage';

// Symbol to CoinGecko ID mapping for accurate API lookups
const SYMBOL_TO_COINGECKO_ID: Record<string, string> = {
  'BTC': 'bitcoin',
  'ETH': 'ethereum',
  'USDT': 'tether',
  'USDC': 'usd-coin',
  'BNB': 'binancecoin',
  'ADA': 'cardano',
  'SOL': 'solana',
  'DOT': 'polkadot',
  'MATIC': 'matic-network',
  'AVAX': 'avalanche-2',
  'TRX': 'tron',
  'LINK': 'chainlink',
  'UNI': 'uniswap',
  'ATOM': 'cosmos',
  'XRP': 'ripple',
};

interface CoinImage {
  thumb: string;  // 32x32
  small: string;  // 64x64
  large: string;  // 256x256
}

/**
 * Get CoinGecko ID from symbol
 */
export function getCoingeckoId(symbol: string): string {
  return SYMBOL_TO_COINGECKO_ID[symbol.toUpperCase()] || symbol.toLowerCase();
}

/**
 * Check if icon exists in bundled cryptocurrency-icons package
 */
export function hasBundledIcon(symbol: string): boolean {
  const bundledIcons = [
    'btc', 'eth', 'usdt', 'usdc', 'bnb', 'ada', 'sol', 'dot',
    'matic', 'avax', 'trx', 'link', 'uni', 'atom', 'xrp',
    'ltc', 'bch', 'etc', 'xlm', 'vet', 'theta', 'fil', 'trx',
    'ftt', 'eos', 'xmr', 'aave', 'mkr', 'comp', 'snx',
    // Add more as needed
  ];
  return bundledIcons.includes(symbol.toLowerCase());
}

/**
 * Get icon URL from bundled package (for offline use)
 */
export function getBundledIconPath(symbol: string, size: 32 | 128 = 32): string {
  // Returns require path for bundled icons
  // In React Native, you'd use dynamic require with known paths
  const symbolLower = symbol.toLowerCase();
  return `cryptocurrency-icons/${size}/${symbolLower}.png`;
}

/**
 * Fetch icon from CoinGecko API
 */
export async function fetchCoinGeckoIcon(symbol: string): Promise<CoinImage | null> {
  try {
    const coinId = getCoingeckoId(symbol);
    const response = await fetch(
      `https://api.coingecko.com/api/v3/coins/${coinId}?localization=false&tickers=false&market_data=false&community_data=false&developer_data=false`
    );

    if (!response.ok) {
      console.log(`[CryptoIcon] CoinGecko API failed for ${symbol}:`, response.status);
      return null;
    }

    const data = await response.json();
    return data.image;
  } catch (error) {
    console.error(`[CryptoIcon] Failed to fetch icon for ${symbol}:`, error);
    return null;
  }
}

/**
 * Get cached icon URL from AsyncStorage
 */
export async function getCachedIconUrl(symbol: string): Promise<string | null> {
  try {
    const cacheKey = `crypto_icon_${symbol.toLowerCase()}`;
    const cached = await AsyncStorage.getItem(cacheKey);

    if (cached) {
      const { url, timestamp } = JSON.parse(cached);

      // Cache valid for 7 days
      const SEVEN_DAYS = 7 * 24 * 60 * 60 * 1000;
      if (Date.now() - timestamp < SEVEN_DAYS) {
        return url;
      }
    }

    return null;
  } catch (error) {
    console.error(`[CryptoIcon] Failed to get cached icon for ${symbol}:`, error);
    return null;
  }
}

/**
 * Cache icon URL to AsyncStorage
 */
export async function cacheIconUrl(symbol: string, url: string): Promise<void> {
  try {
    const cacheKey = `crypto_icon_${symbol.toLowerCase()}`;
    await AsyncStorage.setItem(
      cacheKey,
      JSON.stringify({ url, timestamp: Date.now() })
    );
    console.log(`[CryptoIcon] Cached icon for ${symbol}`);
  } catch (error) {
    console.error(`[CryptoIcon] Failed to cache icon for ${symbol}:`, error);
  }
}

/**
 * Get crypto icon URL with smart fallback strategy
 * 1. Check bundled icons (offline)
 * 2. Check cache
 * 3. Fetch from CoinGecko API
 * 4. Fallback to Trust Wallet CDN
 */
export async function getCryptoIconUrl(symbol: string, size: number = 32): Promise<string> {
  const symbolLower = symbol.toLowerCase();

  // 1. Check if bundled (offline support for major coins)
  if (hasBundledIcon(symbol)) {
    // Return a flag that tells the component to use bundled icon
    return `bundled:${symbolLower}:${size}`;
  }

  // 2. Check cache
  const cached = await getCachedIconUrl(symbol);
  if (cached) {
    return cached;
  }

  // 3. Try CoinGecko API
  const coinGeckoImages = await fetchCoinGeckoIcon(symbol);
  if (coinGeckoImages) {
    const iconUrl = size <= 32 ? coinGeckoImages.thumb :
                    size <= 64 ? coinGeckoImages.small :
                    coinGeckoImages.large;

    await cacheIconUrl(symbol, iconUrl);
    return iconUrl;
  }

  // 4. Fallback to Trust Wallet CDN
  const trustWalletUrl = getTrustWalletIconUrl(symbol);
  return trustWalletUrl;
}

/**
 * Get Trust Wallet CDN URL (fallback)
 */
function getTrustWalletIconUrl(symbol: string): string {
  const blockchainMap: Record<string, string> = {
    'BTC': 'bitcoin',
    'ETH': 'ethereum',
    'BNB': 'binance',
    'SOL': 'solana',
    'TRX': 'tron',
    'DOT': 'polkadot',
    'AVAX': 'avalanchec',
    'MATIC': 'polygon',
  };

  const blockchain = blockchainMap[symbol.toUpperCase()] || 'ethereum';
  return `https://assets.trustwallet.com/blockchains/${blockchain}/info/logo.png`;
}

/**
 * Preload icons for common cryptocurrencies (call on app start)
 */
export async function preloadCommonIcons() {
  const commonCoins = ['BTC', 'ETH', 'USDT', 'USDC', 'BNB', 'SOL', 'TRX', 'MATIC', 'AVAX', 'DOT'];

  console.log('[CryptoIcon] Preloading common icons...');

  await Promise.all(
    commonCoins.map(symbol => getCryptoIconUrl(symbol, 32))
  );

  console.log('[CryptoIcon] Preload complete');
}

/**
 * Clear icon cache (for settings/debugging)
 */
export async function clearIconCache() {
  try {
    const keys = await AsyncStorage.getAllKeys();
    const iconKeys = keys.filter(key => key.startsWith('crypto_icon_'));
    await AsyncStorage.multiRemove(iconKeys);
    console.log(`[CryptoIcon] Cleared ${iconKeys.length} cached icons`);
  } catch (error) {
    console.error('[CryptoIcon] Failed to clear cache:', error);
  }
}
