// app/(tabs)/(wallet)/passcode.tsx
// Dedicated Passcode/PIN management screen

import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert, Modal } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Stack, useRouter } from 'expo-router';
import Colors from '@/constants/colors';
import { Key, Lock, ShieldCheck, Info } from 'lucide-react-native';
import { useSecurity } from '@/providers/SecurityProvider';
import HSButton from '@/components/HSButton';
import PINInput from '@/components/PINInput';
import * as BiometricService from '@/services/BiometricService';

export default function PasscodeSettings() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { settings, setPIN, updateSettings, verifyPIN } = useSecurity();
  const [showSetupModal, setShowSetupModal] = useState(false);
  const [showChangeModal, setShowChangeModal] = useState(false);
  const [pinStep, setPinStep] = useState<'current' | 'new' | 'confirm'>('current');
  const [currentPIN, setCurrentPIN] = useState('');
  const [newPIN, setNewPIN] = useState('');

  const handleSetupPIN = () => {
    setShowSetupModal(true);
    setPinStep('new');
    setNewPIN('');
  };

  const handleChangePIN = async () => {
    // First verify biometric or current PIN
    const biometricAuth = await BiometricService.authenticate('Authenticate to change PIN');

    if (biometricAuth) {
      setShowChangeModal(true);
      setPinStep('new');
      setNewPIN('');
    } else {
      Alert.alert('Authentication Required', 'Please authenticate to change your PIN');
    }
  };

  const handleDisablePIN = async () => {
    // Require authentication to disable PIN
    const authenticated = await BiometricService.authenticate('Authenticate to disable PIN');

    if (!authenticated) {
      Alert.alert('Authentication Failed', 'Please authenticate to disable PIN');
      return;
    }

    Alert.alert(
      'Disable PIN?',
      'Are you sure you want to disable PIN authentication? You will only be able to unlock with biometrics.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Disable',
          style: 'destructive',
          onPress: async () => {
            await updateSettings({ pinEnabled: false, pinHash: undefined });
            Alert.alert('PIN Disabled', 'PIN authentication has been disabled');
          },
        },
      ]
    );
  };

  const handlePINSetupComplete = async (pin: string) => {
    if (pinStep === 'new') {
      setNewPIN(pin);
      setPinStep('confirm');
    } else if (pinStep === 'confirm') {
      // Verify confirmation matches
      if (pin === newPIN) {
        try {
          await setPIN(pin);
          setShowSetupModal(false);
          setShowChangeModal(false);
          Alert.alert('Success', 'PIN has been set successfully');
        } catch (error) {
          Alert.alert('Error', 'Failed to set PIN. Please try again.');
        }
      } else {
        Alert.alert('PIN Mismatch', 'PINs do not match. Please try again.');
        setPinStep('new');
        setNewPIN('');
      }
    }
  };

  const renderSetupModal = () => (
    <Modal
      visible={showSetupModal}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={() => setShowSetupModal(false)}
    >
      <View style={[styles.modalContainer, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
        <View style={styles.modalHeader}>
          <View style={styles.modalIconContainer}>
            <Key color={Colors.brand.cherryRed} size={32} />
          </View>
          <Text style={styles.modalTitle}>
            {pinStep === 'new' ? 'Create PIN' : 'Confirm PIN'}
          </Text>
          <Text style={styles.modalSubtitle}>
            {pinStep === 'new'
              ? 'Enter a 6-digit PIN code'
              : 'Enter your PIN again to confirm'}
          </Text>
        </View>

        <View style={styles.modalContent}>
          <PINInput onComplete={handlePINSetupComplete} length={6} />

          {pinStep === 'new' && (
            <View style={styles.tipBox}>
              <Info color={Colors.brand.cherryRed} size={16} />
              <Text style={styles.tipText}>
                Choose a PIN that's easy to remember but hard to guess
              </Text>
            </View>
          )}
        </View>

        <HSButton
          title="Cancel"
          onPress={() => {
            setShowSetupModal(false);
            setPinStep('new');
            setNewPIN('');
          }}
          variant="ghost"
          style={styles.cancelButton}
        />
      </View>
    </Modal>
  );

  return (
    <>
      <Stack.Screen
        options={{
          title: 'Passcode',
          headerShown: true,
          headerBackTitle: 'Security',
        }}
      />

      <ScrollView
        style={[styles.container, { paddingBottom: insets.bottom }]}
        contentContainerStyle={styles.content}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerIcon}>
            <Key color={Colors.brand.cherryRed} size={32} />
          </View>
          <Text style={styles.headerTitle}>Passcode Settings</Text>
          <Text style={styles.headerSubtitle}>
            Manage your 6-digit PIN code
          </Text>
        </View>

        {/* Status Card */}
        <View style={[styles.statusCard, settings.pinEnabled && styles.statusCardEnabled]}>
          <View style={styles.statusHeader}>
            {settings.pinEnabled ? (
              <ShieldCheck color="#16a34a" size={24} />
            ) : (
              <Lock color={Colors.brand.inkMuted} size={24} />
            )}
            <View style={styles.statusText}>
              <Text style={styles.statusTitle}>
                {settings.pinEnabled ? 'PIN Enabled' : 'PIN Not Set'}
              </Text>
              <Text style={styles.statusSubtitle}>
                {settings.pinEnabled
                  ? 'Your wallet is protected with a 6-digit PIN'
                  : 'Set up a PIN as a backup authentication method'}
              </Text>
            </View>
          </View>
        </View>

        {/* Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Actions</Text>

          {!settings.pinEnabled ? (
            <View style={styles.actionCard}>
              <Text style={styles.actionTitle}>Set Up PIN</Text>
              <Text style={styles.actionDescription}>
                Create a 6-digit PIN code to unlock your wallet when biometrics are unavailable
              </Text>
              <HSButton
                title="Set Up PIN"
                onPress={handleSetupPIN}
                variant="primary"
                leftIcon={<Key color={Colors.brand.white} size={20} />}
                style={styles.actionButton}
              />
            </View>
          ) : (
            <>
              <View style={styles.actionCard}>
                <Text style={styles.actionTitle}>Change PIN</Text>
                <Text style={styles.actionDescription}>
                  Update your current PIN code
                </Text>
                <HSButton
                  title="Change PIN"
                  onPress={handleChangePIN}
                  variant="secondary"
                  style={styles.actionButton}
                />
              </View>

              <View style={styles.actionCard}>
                <Text style={styles.actionTitle}>Disable PIN</Text>
                <Text style={styles.actionDescription}>
                  Remove PIN authentication (biometric only)
                </Text>
                <HSButton
                  title="Disable PIN"
                  onPress={handleDisablePIN}
                  variant="ghost"
                  style={[styles.actionButton, styles.dangerButton]}
                />
              </View>
            </>
          )}
        </View>

        {/* Benefits */}
        <View style={styles.benefitsCard}>
          <Text style={styles.benefitsTitle}>Why Use a PIN?</Text>
          <View style={styles.benefitsList}>
            <View style={styles.benefitItem}>
              <Text style={styles.benefitIcon}>✓</Text>
              <Text style={styles.benefitText}>
                <Text style={styles.benefitBold}>Backup Authentication:</Text> Unlock your wallet if biometrics fail
              </Text>
            </View>
            <View style={styles.benefitItem}>
              <Text style={styles.benefitIcon}>✓</Text>
              <Text style={styles.benefitText}>
                <Text style={styles.benefitBold}>Universal Access:</Text> Works on all devices
              </Text>
            </View>
            <View style={styles.benefitItem}>
              <Text style={styles.benefitIcon}>✓</Text>
              <Text style={styles.benefitText}>
                <Text style={styles.benefitBold}>Quick & Secure:</Text> Fast entry with strong security
              </Text>
            </View>
            <View style={styles.benefitItem}>
              <Text style={styles.benefitIcon}>✓</Text>
              <Text style={styles.benefitText}>
                <Text style={styles.benefitBold}>Privacy:</Text> No biometric data required
              </Text>
            </View>
          </View>
        </View>

        {/* Security Tips */}
        <View style={styles.tipsCard}>
          <View style={styles.tipsHeader}>
            <Info color={Colors.brand.cherryRed} size={20} />
            <Text style={styles.tipsTitle}>PIN Security Tips</Text>
          </View>
          <View style={styles.tipsList}>
            <Text style={styles.tipText}>• Don't use obvious PINs like 123456 or birthdays</Text>
            <Text style={styles.tipText}>• Never share your PIN with anyone</Text>
            <Text style={styles.tipText}>• Change your PIN if you suspect it's been compromised</Text>
            <Text style={styles.tipText}>• Don't write your PIN down in plain text</Text>
          </View>
        </View>
      </ScrollView>

      {/* Setup Modal */}
      {renderSetupModal()}
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
    gap: 20,
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
  statusCard: {
    backgroundColor: Colors.brand.white,
    borderRadius: 20,
    padding: 20,
    shadowColor: '#00000010',
    shadowOpacity: 0.1,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 2 },
    borderWidth: 2,
    borderColor: '#e5e7eb',
  },
  statusCardEnabled: {
    borderColor: '#16a34a',
    backgroundColor: '#f0fdf4',
  },
  statusHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  statusText: {
    flex: 1,
  },
  statusTitle: {
    fontSize: 18,
    fontWeight: '900' as const,
    color: Colors.brand.ink,
    marginBottom: 4,
  },
  statusSubtitle: {
    fontSize: 14,
    color: Colors.brand.inkMuted,
    lineHeight: 20,
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
  },
  actionCard: {
    backgroundColor: Colors.brand.white,
    borderRadius: 16,
    padding: 20,
    shadowColor: '#00000010',
    shadowOpacity: 0.1,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    gap: 12,
  },
  actionTitle: {
    fontSize: 18,
    fontWeight: '900' as const,
    color: Colors.brand.ink,
  },
  actionDescription: {
    fontSize: 14,
    color: Colors.brand.inkMuted,
    lineHeight: 20,
  },
  actionButton: {
    marginTop: 8,
  },
  dangerButton: {
    borderColor: '#ef4444',
  },
  benefitsCard: {
    backgroundColor: '#FFF3F0',
    borderRadius: 16,
    padding: 20,
    gap: 16,
  },
  benefitsTitle: {
    fontSize: 18,
    fontWeight: '900' as const,
    color: Colors.brand.ink,
  },
  benefitsList: {
    gap: 12,
  },
  benefitItem: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'flex-start',
  },
  benefitIcon: {
    fontSize: 18,
    color: '#16a34a',
    fontWeight: '700' as const,
  },
  benefitText: {
    flex: 1,
    fontSize: 14,
    color: Colors.brand.ink,
    lineHeight: 20,
  },
  benefitBold: {
    fontWeight: '700' as const,
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
    gap: 12,
    marginBottom: 40,
  },
  modalIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.brand.lightPeach,
    alignItems: 'center',
    justifyContent: 'center',
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
    gap: 24,
  },
  tipBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#FFF3F0',
    padding: 16,
    borderRadius: 12,
    marginTop: 24,
  },
  cancelButton: {
    marginTop: 'auto',
  },
});
