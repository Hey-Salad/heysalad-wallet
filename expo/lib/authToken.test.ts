/**
 * The session token must be written to SecureStore only on native, a legacy
 * AsyncStorage copy must be migrated and deleted on first read, and a
 * SecureStore failure must never turn into a plaintext write.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

const secure = new Map<string, string>();
const plain = new Map<string, string>();
let secureAvailable = true;
let secureWriteFails = false;
vi.mock('expo-secure-store', () => ({
  isAvailableAsync: vi.fn(async () => secureAvailable),
  getItemAsync: vi.fn(async (k: string) => secure.get(k) ?? null),
  setItemAsync: vi.fn(async (k: string, v: string) => { if (secureWriteFails) throw new Error('keychain unavailable'); secure.set(k, v); }),
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

beforeEach(() => { secure.clear(); plain.clear(); secureAvailable = true; secureWriteFails = false; });

describe('token store on native', () => {
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

  it('rejects when SecureStore fails instead of storing the token in plaintext', async () => {
    secureWriteFails = true;
    const store = createTokenStore('heysalad_jwt_token');
    await expect(store.write('jwt-abc')).rejects.toThrow('keychain unavailable');
    expect(plain.has('heysalad_jwt_token')).toBe(false);
    expect(secure.has('heysalad_jwt_token')).toBe(false);
  });

  it('uses AsyncStorage only where SecureStore does not exist (web)', async () => {
    secureAvailable = false;
    const store = createTokenStore('heysalad_jwt_token');
    await store.write('web-jwt');
    expect(plain.get('heysalad_jwt_token')).toBe('web-jwt');
    expect(secure.size).toBe(0);
    expect(await store.read()).toBe('web-jwt');
    await store.clear();
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
