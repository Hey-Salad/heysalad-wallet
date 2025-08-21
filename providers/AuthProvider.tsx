import { useCallback, useEffect, useMemo, useState } from "react";
import createContextHook from "@nkzw/create-context-hook";
import * as LocalAuthentication from "expo-local-authentication";
import * as SecureStore from "expo-secure-store";

export type AuthState = {
  biometricAvailable: boolean;
  biometricEnabled: boolean;
  unlocked: boolean;
};

const KEY_BIO_ENABLED = "hs_bio_enabled_v1";
const KEY_DEVICE_ID = "hs_device_id_v1";

async function loadBiometricEnabled(): Promise<boolean> {
  try {
    const v = await SecureStore.getItemAsync(KEY_BIO_ENABLED);
    return v === "1";
  } catch (e) {
    console.log("[Auth] loadBiometricEnabled error", e);
    return false;
  }
}

async function saveBiometricEnabled(value: boolean) {
  try {
    await SecureStore.setItemAsync(KEY_BIO_ENABLED, value ? "1" : "0");
  } catch (e) {
    console.log("[Auth] saveBiometricEnabled error", e);
  }
}

async function ensureDeviceId(): Promise<string> {
  try {
    const existing = await SecureStore.getItemAsync(KEY_DEVICE_ID);
    if (existing) return existing;
    const id = (global as any).crypto?.randomUUID?.() ?? `hs_${Date.now()}_${Math.floor(Math.random() * 1e9)}`;
    await SecureStore.setItemAsync(KEY_DEVICE_ID, id);
    return id;
  } catch (e) {
    console.log("[Auth] ensureDeviceId error", e);
    const fallback = `hs_${Date.now()}_${Math.floor(Math.random() * 1e9)}`;
    return fallback;
  }
}

export const [AuthProvider, useAuth] = createContextHook(() => {
  const [state, setState] = useState<AuthState>({ biometricAvailable: false, biometricEnabled: false, unlocked: true });

  useEffect(() => {
    (async () => {
      const hardware = await LocalAuthentication.hasHardwareAsync();
      const enrolled = await LocalAuthentication.isEnrolledAsync();
      const available = !!hardware && !!enrolled;
      const enabled = await loadBiometricEnabled();
      await ensureDeviceId();
      setState((s) => ({ ...s, biometricAvailable: available, biometricEnabled: enabled, unlocked: !enabled }));
    })();
  }, []);

  const enableBiometrics = useCallback(async () => {
    try {
      if (!state.biometricAvailable) throw new Error("Biometric auth not available on this device");
      const res = await LocalAuthentication.authenticateAsync({ promptMessage: "Enable Face ID / Touch ID" });
      if (res.success) {
        await saveBiometricEnabled(true);
        setState((s) => ({ ...s, biometricEnabled: true, unlocked: true }));
        return true;
      }
      return false;
    } catch (e) {
      console.log("[Auth] enableBiometrics error", e);
      return false;
    }
  }, [state.biometricAvailable]);

  const lock = useCallback(() => {
    setState((s) => ({ ...s, unlocked: false }));
  }, []);

  const unlock = useCallback(async (): Promise<boolean> => {
    try {
      if (!state.biometricEnabled) {
        setState((s) => ({ ...s, unlocked: true }));
        return true;
      }
      const res = await LocalAuthentication.authenticateAsync({ promptMessage: "Unlock Wallet" });
      if (res.success) {
        setState((s) => ({ ...s, unlocked: true }));
        return true;
      }
      return false;
    } catch (e) {
      console.log("[Auth] unlock error", e);
      return false;
    }
  }, [state.biometricEnabled]);

  const ensureAuthenticated = useCallback(async (): Promise<boolean> => {
    if (state.unlocked) return true;
    return unlock();
  }, [state.unlocked, unlock]);

  const value = useMemo(() => ({
    biometricAvailable: state.biometricAvailable,
    biometricEnabled: state.biometricEnabled,
    unlocked: state.unlocked,
    enableBiometrics,
    lock,
    unlock,
    ensureAuthenticated,
  }), [state.biometricAvailable, state.biometricEnabled, state.unlocked, enableBiometrics, lock, unlock, ensureAuthenticated]);

  return value;
});

export type AuthContextValue = ReturnType<typeof useAuth>;
