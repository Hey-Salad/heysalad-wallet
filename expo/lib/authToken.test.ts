/**
 * The session token must be written to SecureStore only, and a legacy
 * AsyncStorage copy must be migrated and deleted on first read.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

const secure = new Map<string, string>();
const plain = new Map<string, string>();
vi.mock('expo-secure-store', () => ({
  getItemAsync: vi.fn(async (k: string) => secure.get(k) ?? null),
  setItemAsync: vi.fn(async (k: string, v: string) => { secure.set(k, v); }),
  deleteItemAsync: vi.fn(async (k: string) => { secure.delete(k); }),
}));
vi.mock('@react-native-async-storage/async-storage', () => ({
  default: {
    getItem: vi.fn(async (k: string) => plain.get(k) ?? null),
    setItem: vi.fn(async (k: string, v: string) => { plain.set(k, v); }),
    removeItem: vi.fn(async (k: string) => { plain.delete(k); }),
  },
}));

import { createTokenStore } from './authToken';

beforeEach(() => { secure.clear(); plain.clear(); });

describe('token store', () => {
  it('writes to SecureStore and never to AsyncStorage', async () => {
    const store = createTokenStore('heysalad_jwt_token');
    await store.write('jwt-abc');
    expect(secure.get('heysalad_jwt_token')).toBe('jwt-abc');
    expect(plain.has('heysalad_jwt_token')).toBe(false);
    expect(await store.read()).toBe('jwt-abc');
  });

  it('migrates a legacy AsyncStorage copy into SecureStore and deletes it', async () => {
    plain.set('heysalad_jwt_token', 'legacy-jwt');
    const store = createTokenStore('heysalad_jwt_token');
    expect(await store.read()).toBe('legacy-jwt');
    expect(secure.get('heysalad_jwt_token')).toBe('legacy-jwt');
    expect(plain.has('heysalad_jwt_token')).toBe(false);
  });

  it('clear removes both copies', async () => {
    const store = createTokenStore('k');
    await store.write('x'); plain.set('k', 'stale');
    await store.clear();
    expect(secure.has('k')).toBe(false);
    expect(plain.has('k')).toBe(false);
    expect(await store.read()).toBeNull();
  });
});
