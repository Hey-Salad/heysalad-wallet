// app/(tabs)/(wallet)/security.tsx
// Security settings screen

import React from 'react';
import { View, Text, StyleSheet, ScrollView, Switch, TouchableOpacity, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Stack, useRouter } from 'expo-router';
import Colors from '@/constants/colors';
import { Shield, Lock, Eye, Clock, Smartphone, Info, Key } from 'lucide-react-native';
import { useSecurity, AutoLockTimeout } from '@/providers/SecurityProvider';
import * as BiometricService from '@/services/BiometricService';

export default function SecuritySettings() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { settings, updateSettings } = useSecurity();

  const handleBiometricToggle = async (value: boolean) => {
    if (value) {
      const available = await BiometricService.isBiometricAvailable();
      if (!available) {
        Alert.alert(
          'Biometric Not Available',
          'Your device does not support biometric authentication or it is not set up.',
          [{ text: 'OK' }]
        );
        return;
      }
    }

    await updateSettings({ biometricEnabled: value });
  };

  const handleAutoLockChange = (timeout: AutoLockTimeout) => {
    updateSettings({ autoLockTimeout: timeout });
  };

  const handleLockOnBackgroundToggle = (value: boolean) => {
    updateSettings({ lockOnBackground: value });
  };

  const handleShowRecoveryPhrase = async () => {
    const authenticated = await BiometricService.authenticate('Authenticate to view recovery phrase');

    if (authenticated) {
      const privateKey = await BiometricService.getPrivateKey(false);
      if (privateKey) {
        // In a real app, you'd derive the mnemonic from the private key
        // For now, show a warning that this should be the actual recovery phrase
        Alert.alert(
          'Recovery Phrase',
          'Your recovery phrase was shown during wallet setup. This feature will display it in the next update.',
          [{ text: 'OK' }]
        );
      } else {
        Alert.alert('Error', 'Unable to retrieve recovery phrase');
      }
    } else {
      Alert.alert('Authentication Failed', 'Please try again');
    }
  };

  return (
    <>
      <Stack.Screen
        options={{
          title: 'Security',
          headerShown: true,
          headerBackTitle: 'Settings',
        }}
      />

      <ScrollView
        style={[styles.container, { paddingBottom: insets.bottom }]}
        contentContainerStyle={styles.content}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerIcon}>
            <Shield color={Colors.brand.cherryRed} size={32} />
          </View>
          <Text style={styles.headerTitle}>Security Settings</Text>
          <Text style={styles.headerSubtitle}>
            Manage your wallet's security preferences
          </Text>
        </View>

        {/* Authentication Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Authentication</Text>

          <View style={styles.settingCard}>
            <View style={styles.settingRow}>
              <View style={styles.settingLeft}>
                <Smartphone color={Colors.brand.ink} size={20} />
                <View style={styles.settingText}>
                  <Text style={styles.settingLabel}>Biometric Authentication</Text>
                  <Text style={styles.settingDescription}>
                    Use Face ID or Touch ID
                  </Text>
                </View>
              </View>
              <Switch
                value={settings.biometricEnabled}
                onValueChange={handleBiometricToggle}
                trackColor={{ true: Colors.brand.cherryRed, false: '#d1d5db' }}
              />
            </View>
          </View>

          <TouchableOpacity
            style={styles.settingCard}
            onPress={() => router.push('/(tabs)/(wallet)/passcode')}
          >
            <View style={styles.settingRow}>
              <View style={styles.settingLeft}>
                <Key color={Colors.brand.ink} size={20} />
                <View style={styles.settingText}>
                  <Text style={styles.settingLabel}>PIN Code</Text>
                  <Text style={styles.settingDescription}>
                    {settings.pinEnabled ? '6-digit PIN enabled' : 'Set up PIN as fallback'}
                  </Text>
                </View>
              </View>
              <Text style={styles.linkText}>Manage</Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Auto-Lock Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Auto-Lock</Text>

          <View style={styles.settingCard}>
            <View style={styles.settingRow}>
              <View style={styles.settingLeft}>
                <Clock color={Colors.brand.ink} size={20} />
                <View style={styles.settingText}>
                  <Text style={styles.settingLabel}>Auto-Lock Timeout</Text>
                  <Text style={styles.settingDescription}>
                    Lock wallet after inactivity
                  </Text>
                </View>
              </View>
            </View>

            <View style={styles.timeoutOptions}>
              {(['immediate', '1min', '5min', '15min', '30min', 'never'] as AutoLockTimeout[]).map((timeout) => (
                <TouchableOpacity
                  key={timeout}
                  style={[
                    styles.timeoutOption,
                    settings.autoLockTimeout === timeout && styles.timeoutOptionActive,
                  ]}
                  onPress={() => handleAutoLockChange(timeout)}
                >
                  <Text
                    style={[
                      styles.timeoutOptionText,
                      settings.autoLockTimeout === timeout && styles.timeoutOptionTextActive,
                    ]}
                  >
                    {timeout === 'immediate' ? 'Immediate' :
                     timeout === 'never' ? 'Never' :
                     timeout.replace('min', ' min')}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.settingCard}>
            <View style={styles.settingRow}>
              <View style={styles.settingLeft}>
                <Lock color={Colors.brand.ink} size={20} />
                <View style={styles.settingText}>
                  <Text style={styles.settingLabel}>Lock on Background</Text>
                  <Text style={styles.settingDescription}>
                    Lock immediately when app is closed
                  </Text>
                </View>
              </View>
              <Switch
                value={settings.lockOnBackground}
                onValueChange={handleLockOnBackgroundToggle}
                trackColor={{ true: Colors.brand.cherryRed, false: '#d1d5db' }}
              />
            </View>
          </View>
        </View>

        {/* Recovery Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recovery</Text>

          <TouchableOpacity style={styles.settingCard} onPress={handleShowRecoveryPhrase}>
            <View style={styles.settingRow}>
              <View style={styles.settingLeft}>
                <Eye color={Colors.brand.ink} size={20} />
                <View style={styles.settingText}>
                  <Text style={styles.settingLabel}>Show Recovery Phrase</Text>
                  <Text style={styles.settingDescription}>
                    View your 12-word recovery phrase
                  </Text>
                </View>
              </View>
              <Text style={styles.linkText}>View</Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Security Tips */}
        <View style={styles.tipsCard}>
          <View style={styles.tipsHeader}>
            <Info color={Colors.brand.cherryRed} size={20} />
            <Text style={styles.tipsTitle}>Security Tips</Text>
          </View>

          <View style={styles.tipsList}>
            <Text style={styles.tipText}>• Never share your recovery phrase with anyone</Text>
            <Text style={styles.tipText}>• Enable biometric authentication for quick access</Text>
            <Text style={styles.tipText}>• Set up a PIN as a backup authentication method</Text>
            <Text style={styles.tipText}>• Keep your recovery phrase in a safe offline location</Text>
            <Text style={styles.tipText}>• Double-check addresses before sending crypto</Text>
          </View>
        </View>
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.brand.white,
  },
  content: {
    padding: 20,
    gap: 24,
  },
  header: {
    alignItems: 'center',
    gap: 12,
    marginBottom: 8,
  },
  headerIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: Colors.brand.lightPeach,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '900' as const,
    color: Colors.brand.ink,
  },
  headerSubtitle: {
    fontSize: 14,
    color: Colors.brand.inkMuted,
    textAlign: 'center',
  },
  section: {
    gap: 12,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '700' as const,
    color: Colors.brand.inkMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  settingCard: {
    backgroundColor: Colors.brand.white,
    borderRadius: 16,
    padding: 16,
    shadowColor: '#00000010',
    shadowOpacity: 0.1,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  settingText: {
    flex: 1,
  },
  settingLabel: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: Colors.brand.ink,
    marginBottom: 2,
  },
  settingDescription: {
    fontSize: 13,
    color: Colors.brand.inkMuted,
    lineHeight: 18,
  },
  linkText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.brand.cherryRed,
  },
  timeoutOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 12,
  },
  timeoutOption: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: Colors.brand.lightPeach,
    borderWidth: 1,
    borderColor: Colors.brand.lightPeach,
  },
  timeoutOptionActive: {
    backgroundColor: Colors.brand.cherryRed,
    borderColor: Colors.brand.cherryRed,
  },
  timeoutOptionText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.brand.ink,
  },
  timeoutOptionTextActive: {
    color: Colors.brand.white,
  },
  tipsCard: {
    backgroundColor: '#FFF3F0',
    borderRadius: 16,
    padding: 20,
    gap: 16,
    borderLeftWidth: 4,
    borderLeftColor: Colors.brand.cherryRed,
  },
  tipsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  tipsTitle: {
    fontSize: 18,
    fontWeight: '900' as const,
    color: Colors.brand.ink,
  },
  tipsList: {
    gap: 8,
  },
  tipText: {
    fontSize: 14,
    color: Colors.brand.ink,
    lineHeight: 20,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: Colors.brand.white,
    padding: 24,
  },
  modalHeader: {
    alignItems: 'center',
    gap: 8,
    marginBottom: 40,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: '900' as const,
    color: Colors.brand.ink,
  },
  modalSubtitle: {
    fontSize: 16,
    color: Colors.brand.inkMuted,
    textAlign: 'center',
  },
  modalContent: {
    flex: 1,
    justifyContent: 'center',
  },
  cancelButton: {
    marginTop: 'auto',
  },
});
