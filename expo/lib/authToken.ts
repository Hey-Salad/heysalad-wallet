/**
 * Session tokens live in SecureStore (Keychain / Keystore), never in
 * AsyncStorage, which is a plaintext file readable by anything inside the
 * app sandbox and included in some backups (SECURITY-AUDIT CLIENT-07).
 *
 * Older builds wrote the same keys to AsyncStorage; the first read copies a
 * legacy value across and deletes it. On native a SecureStore failure is an
 * error, never a reason to write plaintext. SecureStore does not exist on web,
 * so web (and only web) uses AsyncStorage, which is localStorage there.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';

export interface TokenStore {
  read(): Promise<string | null>;
  write(token: string): Promise<void>;
  clear(): Promise<void>;
}

// False only on web, where expo-secure-store has no implementation.
const secureStoreAvailable = (): Promise<boolean> => SecureStore.isAvailableAsync();

export function createTokenStore(key: string): TokenStore {
  return {
    async read() {
      if (!(await secureStoreAvailable())) {
        return AsyncStorage.getItem(key);
      }
      const secure = await SecureStore.getItemAsync(key);
      if (secure) return secure;
      // One-time migration of a copy an older build left in AsyncStorage.
      const legacy = await AsyncStorage.getItem(key);
      if (!legacy) return null;
      await SecureStore.setItemAsync(key, legacy);
      await AsyncStorage.removeItem(key);
      return legacy;
    },
    async write(token: string) {
      if (!(await secureStoreAvailable())) {
        await AsyncStorage.setItem(key, token);
        return;
      }
      await SecureStore.setItemAsync(key, token);
      // A stale plaintext copy must not outlive the secure write.
      await AsyncStorage.removeItem(key);
    },
    async clear() {
      const removals: Promise<void>[] = [AsyncStorage.removeItem(key)];
      if (await secureStoreAvailable()) removals.push(SecureStore.deleteItemAsync(key));
      await Promise.all(removals);
    },
  };
}

export const HEYSALAD_TOKEN_KEY = 'heysalad_jwt_token';
export const WEB3_AGENT_TOKEN_KEY = 'web3_agent_token';

export const heysaladToken = createTokenStore(HEYSALAD_TOKEN_KEY);
export const web3AgentToken = createTokenStore(WEB3_AGENT_TOKEN_KEY);
