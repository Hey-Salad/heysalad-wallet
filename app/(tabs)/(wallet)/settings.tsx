// app/(tabs)/(wallet)/settings.tsx
// Settings screen for wallet configuration

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Colors from '@/constants/colors';
import { useWallet } from '@/providers/WalletProvider';

export default function SettingsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { wallet } = useWallet();

  const settingsOptions = [
    {
      id: 'security',
      title: 'Security & Privacy',
      subtitle: 'Face ID, PIN, auto-lock, backup',
      icon: 'shield-checkmark-outline',
      onPress: () => router.push('/(tabs)/(wallet)/security'),
    },
    {
      id: 'voice',
      title: 'Voice Assistant',
      subtitle: 'Selina Saladtron settings',
      icon: 'mic-outline',
      onPress: () => Alert.alert('Voice', 'Voice settings coming soon!'),
    },
    {
      id: 'network',
      title: 'Network',
      subtitle: 'TRON Nile Testnet',
      icon: 'globe-outline',
      onPress: () => Alert.alert('Network', 'Network settings coming soon!'),
    },
    {
      id: 'notifications',
      title: 'Notifications',
      subtitle: 'Transaction alerts and updates',
      icon: 'notifications-outline',
      onPress: () => Alert.alert('Notifications', 'Notification settings coming soon!'),
    },
    {
      id: 'support',
      title: 'Help & Support',
      subtitle: 'FAQ, contact support',
      icon: 'help-circle-outline',
      onPress: () => Alert.alert('Support', 'Support coming soon!'),
    },
    {
      id: 'about',
      title: 'About HeySalad® Wallet',
      subtitle: 'Version 1.0.4, Terms & Privacy',
      icon: 'information-circle-outline',
      onPress: () => Alert.alert('About', 'HeySalad® Wallet v1.0.4\nBuilt for sustainable payments'),
    },
  ];

  const renderSettingItem = (item: typeof settingsOptions[0]) => (
    <TouchableOpacity
      key={item.id}
      style={styles.settingItem}
      onPress={item.onPress}
      activeOpacity={0.7}
    >
      <View style={styles.settingIcon}>
        <Ionicons name={item.icon as any} size={24} color={Colors.brand.cherryRed} />
      </View>
      <View style={styles.settingContent}>
        <Text style={styles.settingTitle}>{item.title}</Text>
        <Text style={styles.settingSubtitle}>{item.subtitle}</Text>
      </View>
      <Ionicons name="chevron-forward" size={20} color={Colors.brand.inkMuted} />
    </TouchableOpacity>
  );

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Wallet Info Card */}
        <View style={styles.walletCard}>
          <View style={styles.walletInfo}>
            <Text style={styles.walletTitle}>Current Wallet</Text>
            <Text style={styles.walletAddress}>
              {wallet.address ? `${wallet.address.slice(0, 8)}...${wallet.address.slice(-8)}` : 'No address'}
            </Text>
            <View style={styles.statusRow}>
              <View style={styles.statusBadge}>
                <Text style={styles.statusText}>TRON Nile Testnet</Text>
              </View>
              <View style={[styles.statusBadge, styles.securityBadge]}>
                <Ionicons name="shield-checkmark" size={14} color="#16a34a" />
                <Text style={[styles.statusText, { color: '#16a34a' }]}>Secured</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Settings List */}
        <View style={styles.settingsSection}>
          <Text style={styles.sectionTitle}>Settings</Text>
          <View style={styles.settingsList}>
            {settingsOptions.map(renderSettingItem)}
          </View>
        </View>

        {/* Danger Zone */}
        <View style={styles.dangerSection}>
          <Text style={styles.sectionTitle}>Advanced</Text>
          <TouchableOpacity
            style={[styles.settingItem, styles.dangerItem]}
            onPress={() => 
              Alert.alert(
                'Reset Wallet',
                'This will remove all wallet data. Make sure you have your private key backed up.',
                [
                  { text: 'Cancel', style: 'cancel' },
                  { text: 'Reset', style: 'destructive' },
                ]
              )
            }
          >
            <View style={[styles.settingIcon, styles.dangerIcon]}>
              <Ionicons name="warning-outline" size={24} color="#ef4444" />
            </View>
            <View style={styles.settingContent}>
              <Text style={[styles.settingTitle, styles.dangerText]}>Reset Wallet</Text>
              <Text style={styles.settingSubtitle}>Remove all wallet data</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={Colors.brand.inkMuted} />
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.brand.white,
  },
  scrollView: {
    flex: 1,
    padding: 20,
  },
  walletCard: {
    backgroundColor: Colors.brand.white,
    borderRadius: 20,
    padding: 20,
    marginBottom: 24,
    shadowColor: '#00000010',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
  },
  walletInfo: {
    alignItems: 'center',
  },
  walletTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.brand.inkMuted,
    marginBottom: 8,
  },
  walletAddress: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.brand.ink,
    marginBottom: 16,
  },
  statusRow: {
    flexDirection: 'row',
    gap: 12,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.brand.lightPeach,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 6,
    gap: 4,
  },
  securityBadge: {
    backgroundColor: '#dcfce7',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.brand.cherryRed,
  },
  settingsSection: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: Colors.brand.ink,
    marginBottom: 16,
  },
  settingsList: {
    backgroundColor: Colors.brand.white,
    borderRadius: 20,
    shadowColor: '#00000008',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 2,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  settingIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.brand.lightPeach,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  settingContent: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.brand.ink,
    marginBottom: 2,
  },
  settingSubtitle: {
    fontSize: 14,
    color: Colors.brand.inkMuted,
  },
  dangerSection: {
    marginBottom: 32,
  },
  dangerItem: {
    backgroundColor: '#fef2f2',
  },
  dangerIcon: {
    backgroundColor: '#fee2e2',
  },
  dangerText: {
    color: '#ef4444',
  },
});