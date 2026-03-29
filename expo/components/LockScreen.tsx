// components/LockScreen.tsx
// Lock screen with biometric authentication and PIN fallback

import React, { useState } from 'react';
import { View, Text, StyleSheet, Image, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Colors from '@/constants/colors';
import HSButton from '@/components/HSButton';
import { Lock, Fingerprint } from 'lucide-react-native';
import { useSecurity } from '@/providers/SecurityProvider';
import PINInput from '@/components/PINInput';

export default function LockScreen() {
  const insets = useSafeAreaInsets();
  const { unlock, verifyPIN, settings } = useSecurity();
  const [showPINInput, setShowPINInput] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleUnlock = async () => {
    setLoading(true);
    const success = await unlock();
    setLoading(false);

    if (!success && settings.pinEnabled) {
      // Biometric failed, show PIN input
      setShowPINInput(true);
    } else if (!success) {
      Alert.alert('Authentication Failed', 'Please try again');
    }
  };

  const handlePINSubmit = async (pin: string) => {
    setLoading(true);
    const success = await verifyPIN(pin);
    setLoading(false);

    if (!success) {
      Alert.alert('Invalid PIN', 'Please try again');
    }
    // If success, useSecurity will unlock automatically
  };

  if (showPINInput && settings.pinEnabled) {
    return (
      <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
        <View style={styles.content}>
          {/* Logo */}
          <View style={styles.logoContainer}>
            <Image
              source={require('@/assets/images/HeySalad_black_logo.png')}
              style={styles.logo}
              resizeMode="contain"
            />
          </View>

          {/* Lock Icon */}
          <View style={styles.iconContainer}>
            <Lock color={Colors.brand.cherryRed} size={48} />
          </View>

          {/* Title */}
          <Text style={styles.title}>Enter PIN</Text>
          <Text style={styles.subtitle}>Enter your 6-digit PIN to unlock</Text>

          {/* PIN Input */}
          <PINInput
            length={6}
            onComplete={handlePINSubmit}
            disabled={loading}
          />

          {/* Biometric Option */}
          {settings.biometricEnabled && (
            <HSButton
              title="Use Biometric Instead"
              onPress={() => {
                setShowPINInput(false);
                handleUnlock();
              }}
              variant="ghost"
              style={styles.switchButton}
            />
          )}
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      <View style={styles.content}>
        {/* Logo */}
        <View style={styles.logoContainer}>
          <Image
            source={require('@/assets/images/HeySalad_black_logo.png')}
            style={styles.logo}
            resizeMode="contain"
          />
        </View>

        {/* Lock Icon */}
        <View style={styles.iconContainer}>
          <Lock color={Colors.brand.cherryRed} size={64} />
        </View>

        {/* Title */}
        <Text style={styles.title}>Wallet Locked</Text>
        <Text style={styles.subtitle}>
          {settings.biometricEnabled
            ? 'Authenticate to unlock your wallet'
            : 'Enter PIN to unlock your wallet'}
        </Text>

        {/* Unlock Button */}
        <HSButton
          title={settings.biometricEnabled ? 'Unlock with Biometric' : 'Unlock with PIN'}
          onPress={handleUnlock}
          variant="primary"
          loading={loading}
          leftIcon={settings.biometricEnabled ? <Fingerprint color={Colors.brand.white} size={20} /> : undefined}
          style={styles.unlockButton}
        />

        {/* PIN Option */}
        {settings.pinEnabled && settings.biometricEnabled && (
          <HSButton
            title="Use PIN Instead"
            onPress={() => setShowPINInput(true)}
            variant="ghost"
            style={styles.switchButton}
          />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.brand.white,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    alignItems: 'center',
    paddingHorizontal: 32,
    gap: 24,
    maxWidth: 400,
  },
  logoContainer: {
    marginBottom: 20,
  },
  logo: {
    height: 50,
    width: 250,
  },
  iconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: Colors.brand.lightPeach,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  title: {
    fontSize: 28,
    fontWeight: '900' as const,
    color: Colors.brand.ink,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: Colors.brand.inkMuted,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 16,
  },
  unlockButton: {
    width: '100%',
    marginTop: 16,
  },
  switchButton: {
    marginTop: 8,
  },
});
