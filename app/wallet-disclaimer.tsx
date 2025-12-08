// app/wallet-disclaimer.tsx
// Disclaimer screen shown before wallet setup

import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import HSButton from '@/components/HSButton';
import Colors from '@/constants/colors';
import { AlertCircle, Shield, Lock, Info } from 'lucide-react-native';
import Checkbox from 'expo-checkbox';

export default function WalletDisclaimer() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [accepted, setAccepted] = useState(false);

  const handleContinue = () => {
    if (accepted) {
      router.replace('/onboarding-wallet');
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <Image
          source={require('@/assets/images/HeySalad_black_logo.png')}
          style={styles.logo}
          resizeMode="contain"
        />

        <View style={styles.warningHeader}>
          <AlertCircle color={Colors.brand.cherryRed} size={48} />
          <Text style={styles.title}>BEFORE YOU CONTINUE{'\n'}YOU SHOULD KNOW...</Text>
        </View>

        <View style={styles.disclaimerContainer}>
          {/* Security Warning */}
          <View style={styles.disclaimerItem}>
            <View style={styles.iconContainer}>
              <Shield color={Colors.brand.cherryRed} size={24} />
            </View>
            <View style={styles.textContainer}>
              <Text style={styles.disclaimerTitle}>You Are Responsible for Your Wallet</Text>
              <Text style={styles.disclaimerText}>
                HeySalad Wallet is a non-custodial wallet. This means you have full control of your funds,
                but also full responsibility. We cannot recover your wallet if you lose access to your device
                or biometric authentication.
              </Text>
            </View>
          </View>

          {/* Private Key Warning */}
          <View style={styles.disclaimerItem}>
            <View style={styles.iconContainer}>
              <Lock color={Colors.brand.orange} size={24} />
            </View>
            <View style={styles.textContainer}>
              <Text style={styles.disclaimerTitle}>Secure Your Device</Text>
              <Text style={styles.disclaimerText}>
                Your wallet keys are stored securely in your device's Secure Enclave. Make sure your device
                is protected with a strong passcode and biometric authentication (Face ID/Touch ID). Never
                share your device access with anyone.
              </Text>
            </View>
          </View>

          {/* Backup Warning */}
          <View style={styles.disclaimerItem}>
            <View style={styles.iconContainer}>
              <Info color={Colors.brand.blue} size={24} />
            </View>
            <View style={styles.textContainer}>
              <Text style={styles.disclaimerTitle}>Backup & Recovery</Text>
              <Text style={styles.disclaimerText}>
                If you choose a passkey wallet, your keys sync via iCloud Keychain (on iOS). If you choose
                a TRON wallet, you'll receive a private key that you MUST back up safely. Without proper
                backup, you cannot recover your wallet.
              </Text>
            </View>
          </View>

          {/* Transaction Warning */}
          <View style={styles.disclaimerItem}>
            <View style={styles.iconContainer}>
              <AlertCircle color={Colors.brand.purple} size={24} />
            </View>
            <View style={styles.textContainer}>
              <Text style={styles.disclaimerTitle}>Transactions Are Final</Text>
              <Text style={styles.disclaimerText}>
                Blockchain transactions cannot be reversed. Always double-check the recipient address and
                amount before confirming any transaction. HeySalad cannot reverse or refund transactions.
              </Text>
            </View>
          </View>

          {/* Legal Disclaimer */}
          <View style={styles.disclaimerItem}>
            <View style={styles.iconContainer}>
              <Info color={Colors.brand.inkMuted} size={24} />
            </View>
            <View style={styles.textContainer}>
              <Text style={styles.disclaimerTitle}>No Warranties</Text>
              <Text style={styles.disclaimerText}>
                HeySalad Wallet is provided "as is" without warranties of any kind. We are not liable for
                any losses, damages, or issues arising from your use of the wallet. Use at your own risk.
              </Text>
            </View>
          </View>
        </View>

        {/* Acceptance Checkbox */}
        <View style={styles.acceptanceContainer}>
          <Checkbox
            value={accepted}
            onValueChange={setAccepted}
            color={accepted ? Colors.brand.cherryRed : undefined}
            style={styles.checkbox}
          />
          <Text style={styles.acceptanceText}>
            I understand and accept these risks. I am responsible for securing my wallet and backing up
            my keys. I acknowledge that transactions are final and HeySalad cannot recover lost funds.
          </Text>
        </View>

        <HSButton
          title="Continue to Wallet Setup"
          onPress={handleContinue}
          variant="primary"
          disabled={!accepted}
          style={styles.button}
        />

        <Text style={styles.footerText}>
          By continuing, you agree to our Terms of Service and Privacy Policy
        </Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.brand.white,
  },
  content: {
    padding: 24,
  },
  logo: {
    width: 180,
    height: 60,
    alignSelf: 'center',
    marginBottom: 32,
  },
  warningHeader: {
    alignItems: 'center',
    marginBottom: 32,
  },
  title: {
    fontSize: 24,
    fontWeight: '900',
    color: Colors.brand.ink,
    textAlign: 'center',
    marginTop: 16,
    lineHeight: 32,
  },
  disclaimerContainer: {
    gap: 20,
    marginBottom: 32,
  },
  disclaimerItem: {
    flexDirection: 'row',
    gap: 16,
    padding: 16,
    backgroundColor: Colors.brand.lightPeach,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.brand.border,
  },
  iconContainer: {
    marginTop: 2,
  },
  textContainer: {
    flex: 1,
  },
  disclaimerTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.brand.ink,
    marginBottom: 8,
  },
  disclaimerText: {
    fontSize: 14,
    color: Colors.brand.inkMuted,
    lineHeight: 20,
  },
  acceptanceContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
    padding: 16,
    backgroundColor: Colors.brand.lightPeach,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: Colors.brand.cherryRed,
  },
  checkbox: {
    marginTop: 2,
  },
  acceptanceText: {
    flex: 1,
    fontSize: 14,
    color: Colors.brand.ink,
    lineHeight: 20,
  },
  button: {
    marginBottom: 16,
  },
  footerText: {
    fontSize: 12,
    color: Colors.brand.inkMuted,
    textAlign: 'center',
    lineHeight: 18,
  },
});
