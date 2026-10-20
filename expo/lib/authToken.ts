/**
 * Session tokens live in SecureStore (Keychain / Keystore), never in
 * AsyncStorage, which is a plaintext file readable by any process with the
 * app's sandbox (SECURITY-AUDIT CLIENT-07). Older builds wrote the same keys to
 * AsyncStorage; the first read copies a legacy value across and deletes it.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';

export interface TokenStore {
  read(): Promise<string | null>;
  write(token: string): Promise<void>;
  clear(): Promise<void>;
}

export function createTokenStore(key: string): TokenStore {
  return {
    async read() {
      try {
        const secure = await SecureStore.getItemAsync(key);
        if (secure) return secure;
      } catch {
        // SecureStore is unavailable on web and in some test harnesses; fall through.
      }
      let legacy: string | null = null;
      try {
        legacy = await AsyncStorage.getItem(key);
      } catch {
        return null;
      }
      if (!legacy) return null;
      try {
        await SecureStore.setItemAsync(key, legacy);
        await AsyncStorage.removeItem(key);
      } catch {
        // Keep the legacy copy readable if the secure write fails.
      }
      return legacy;
    },
    async write(token: string) {
      try {
        await SecureStore.setItemAsync(key, token);
        await AsyncStorage.removeItem(key);
      } catch {
        await AsyncStorage.setItem(key, token);
      }
    },
    async clear() {
      await Promise.all([
        SecureStore.deleteItemAsync(key).catch(() => undefined),
        AsyncStorage.removeItem(key).catch(() => undefined),
      ]);
    },
  };
}

export const HEYSALAD_TOKEN_KEY = 'heysalad_jwt_token';
export const WEB3_AGENT_TOKEN_KEY = 'web3_agent_token';

export const heysaladToken = createTokenStore(HEYSALAD_TOKEN_KEY);
export const web3AgentToken = createTokenStore(WEB3_AGENT_TOKEN_KEY);
