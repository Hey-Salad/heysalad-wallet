// providers/SecurityProvider.tsx
// Security provider for auto-lock, session management, and authentication

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as BiometricService from '@/services/BiometricService';

const SECURITY_SETTINGS_KEY = 'heysalad_security_settings_v1';

export type AutoLockTimeout = 'immediate' | '1min' | '5min' | '15min' | '30min' | 'never';

export interface SecuritySettings {
  autoLockTimeout: AutoLockTimeout;
  lockOnBackground: boolean;
  biometricEnabled: boolean;
  requireBiometricForTransactions: boolean;
  pinEnabled: boolean;
  pinHash?: string;
}

const DEFAULT_SETTINGS: SecuritySettings = {
  autoLockTimeout: '5min',
  lockOnBackground: true,
  biometricEnabled: true,
  requireBiometricForTransactions: true,
  pinEnabled: false,
};

interface SecurityContextType {
  isLocked: boolean;
  settings: SecuritySettings;
  lock: () => void;
  unlock: () => Promise<boolean>;
  updateActivity: () => void;
  updateSettings: (settings: Partial<SecuritySettings>) => Promise<void>;
  setPIN: (pin: string) => Promise<void>;
  verifyPIN: (pin: string) => Promise<boolean>;
}

const SecurityContext = createContext<SecurityContextType | undefined>(undefined);

export function SecurityProvider({ children }: { children: ReactNode }) {
  const [isLocked, setIsLocked] = useState(false);
  const [lastActivity, setLastActivity] = useState(Date.now());
  const [settings, setSettings] = useState<SecuritySettings>(DEFAULT_SETTINGS);

  // Load settings on mount
  useEffect(() => {
    loadSettings();
  }, []);

  // Monitor app state for background lock
  useEffect(() => {
    const subscription = AppState.addEventListener('change', handleAppStateChange);
    return () => subscription.remove();
  }, [settings.lockOnBackground]);

  // Auto-lock timer
  useEffect(() => {
    if (settings.autoLockTimeout === 'never') return;

    const timeoutMs = getTimeoutMs(settings.autoLockTimeout);
    const interval = setInterval(() => {
      const timeSinceActivity = Date.now() - lastActivity;
      if (timeSinceActivity > timeoutMs && !isLocked) {
        console.log('[Security] Auto-locking wallet due to inactivity');
        lock();
      }
    }, 10000); // Check every 10 seconds

    return () => clearInterval(interval);
  }, [lastActivity, settings.autoLockTimeout, isLocked]);

  const loadSettings = async () => {
    try {
      const saved = await AsyncStorage.getItem(SECURITY_SETTINGS_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        setSettings({ ...DEFAULT_SETTINGS, ...parsed });
        console.log('[Security] Settings loaded:', parsed);
      }
    } catch (error) {
      console.error('[Security] Failed to load settings:', error);
    }
  };

  const saveSettings = async (newSettings: SecuritySettings) => {
    try {
      await AsyncStorage.setItem(SECURITY_SETTINGS_KEY, JSON.stringify(newSettings));
      console.log('[Security] Settings saved');
    } catch (error) {
      console.error('[Security] Failed to save settings:', error);
    }
  };

  const handleAppStateChange = (nextAppState: AppStateStatus) => {
    if (settings.lockOnBackground && (nextAppState === 'background' || nextAppState === 'inactive')) {
      console.log('[Security] App backgrounded, locking wallet');
      lock();
    }
  };

  const getTimeoutMs = (timeout: AutoLockTimeout): number => {
    switch (timeout) {
      case 'immediate': return 0;
      case '1min': return 1 * 60 * 1000;
      case '5min': return 5 * 60 * 1000;
      case '15min': return 15 * 60 * 1000;
      case '30min': return 30 * 60 * 1000;
      case 'never': return Infinity;
      default: return 5 * 60 * 1000;
    }
  };

  const lock = useCallback(() => {
    setIsLocked(true);
    console.log('[Security] Wallet locked');
  }, []);

  const unlock = useCallback(async (): Promise<boolean> => {
    try {
      // Try biometric first if enabled
      if (settings.biometricEnabled) {
        const biometricAvailable = await BiometricService.isBiometricAvailable();
        if (biometricAvailable) {
          const authenticated = await BiometricService.authenticate('Unlock HeySalad Wallet');
          if (authenticated) {
            setIsLocked(false);
            updateActivity();
            console.log('[Security] Wallet unlocked with biometric');
            return true;
          }
        }
      }

      // Fallback to PIN if enabled
      if (settings.pinEnabled) {
        console.log('[Security] Biometric failed, PIN fallback available');
        return false; // Return false to trigger PIN input in UI
      }

      console.log('[Security] Unlock failed');
      return false;
    } catch (error) {
      console.error('[Security] Unlock error:', error);
      return false;
    }
  }, [settings.biometricEnabled, settings.pinEnabled]);

  const updateActivity = useCallback(() => {
    setLastActivity(Date.now());
    // If wallet is locked and user is interacting, don't auto-unlock
    // but DO reset the timer for when they unlock
  }, []);

  const updateSettings = useCallback(async (newSettings: Partial<SecuritySettings>) => {
    const updated = { ...settings, ...newSettings };
    setSettings(updated);
    await saveSettings(updated);
  }, [settings]);

  // Simple PIN hash function (in production, use bcrypt or similar)
  const hashPIN = (pin: string): string => {
    // Simple hash for demo - in production use proper hashing like bcrypt
    let hash = 0;
    for (let i = 0; i < pin.length; i++) {
      const char = pin.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return hash.toString(36);
  };

  const setPIN = useCallback(async (pin: string) => {
    if (pin.length !== 6 || !/^\d{6}$/.test(pin)) {
      throw new Error('PIN must be 6 digits');
    }

    const pinHash = hashPIN(pin);
    await updateSettings({ pinEnabled: true, pinHash });
    console.log('[Security] PIN set');
  }, [updateSettings]);

  const verifyPIN = useCallback(async (pin: string): Promise<boolean> => {
    if (!settings.pinHash) return false;
    const inputHash = hashPIN(pin);
    const isValid = inputHash === settings.pinHash;

    if (isValid) {
      setIsLocked(false);
      updateActivity();
      console.log('[Security] Wallet unlocked with PIN');
    }

    return isValid;
  }, [settings.pinHash, updateActivity]);

  const value: SecurityContextType = {
    isLocked,
    settings,
    lock,
    unlock,
    updateActivity,
    updateSettings,
    setPIN,
    verifyPIN,
  };

  return (
    <SecurityContext.Provider value={value}>
      {children}
    </SecurityContext.Provider>
  );
}

export function useSecurity() {
  const context = useContext(SecurityContext);
  if (!context) {
    throw new Error('useSecurity must be used within SecurityProvider');
  }
  return context;
}
