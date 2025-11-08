// components/NetworkSwitcher.tsx
// Beautiful network switcher with testnet warning

import React, { useState } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Colors from '@/constants/colors';
import { AlertTriangle, Check, ChevronDown, Globe, X } from 'lucide-react-native';
import { getNetworksByBlockchain, isTestnet } from '@/config/networks';
import { useNetwork } from '@/providers/NetworkProvider';

export default function NetworkSwitcher() {
  const [visible, setVisible] = useState(false);
  const insets = useSafeAreaInsets();
  const { networkId: currentNetworkId, network: currentNetwork, switchNetwork } = useNetwork();

  const handleNetworkSelect = async (networkId: string) => {
    // Warn if switching to mainnet
    if (!isTestnet(networkId) && isTestnet(currentNetworkId)) {
      Alert.alert(
        'Switch to Mainnet?',
        'You are switching to MAINNET where real cryptocurrency is used. Make sure you understand the risks.',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'I Understand',
            style: 'destructive',
            onPress: async () => {
              try {
                await switchNetwork(networkId);
                setVisible(false);
              } catch (error) {
                console.error('[NetworkSwitcher] Failed to switch network:', error);
                Alert.alert('Error', 'Failed to switch network. Please try again.');
              }
            },
          },
        ]
      );
    } else {
      try {
        await switchNetwork(networkId);
        setVisible(false);
      } catch (error) {
        console.error('[NetworkSwitcher] Failed to switch network:', error);
        Alert.alert('Error', 'Failed to switch network. Please try again.');
      }
    }
  };

  // Get all TRON networks for now (will expand with multi-chain)
  const tronNetworks = getNetworksByBlockchain('tron');

  return (
    <>
      {/* Current Network Button */}
      <TouchableOpacity
        style={[
          styles.button,
          isTestnet(currentNetworkId) && styles.buttonTestnet,
        ]}
        onPress={() => setVisible(true)}
        activeOpacity={0.7}
      >
        <Globe size={14} color={isTestnet(currentNetworkId) ? Colors.brand.cherryRed : Colors.brand.ink} />
        <Text
          style={[
            styles.buttonText,
            isTestnet(currentNetworkId) && styles.buttonTextTestnet,
          ]}
        >
          {currentNetwork.name}
        </Text>
        <ChevronDown size={14} color={isTestnet(currentNetworkId) ? Colors.brand.cherryRed : Colors.brand.inkMuted} />
      </TouchableOpacity>

      {/* Network Selection Modal */}
      <Modal
        visible={visible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setVisible(false)}
      >
        <View style={[styles.modal, { paddingTop: insets.top }]}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>Select Network</Text>
            <TouchableOpacity onPress={() => setVisible(false)} style={styles.closeButton}>
              <X color={Colors.brand.ink} size={24} />
            </TouchableOpacity>
          </View>

          {/* Testnet Warning */}
          {isTestnet(currentNetworkId) && (
            <View style={styles.warning}>
              <AlertTriangle color={Colors.brand.cherryRed} size={20} />
              <Text style={styles.warningText}>
                You're on testnet. Tokens have no real value.
              </Text>
            </View>
          )}

          <ScrollView style={styles.list} contentContainerStyle={{ paddingBottom: insets.bottom + 20 }}>
            {/* TRON Networks */}
            <Text style={styles.sectionTitle}>TRON</Text>
            {tronNetworks.map((network) => {
              const isSelected = network.id === currentNetworkId;
              const isTest = isTestnet(network.id);

              return (
                <TouchableOpacity
                  key={network.id}
                  style={[styles.networkItem, isSelected && styles.networkItemSelected]}
                  onPress={() => handleNetworkSelect(network.id)}
                  activeOpacity={0.7}
                >
                  <View style={styles.networkLeft}>
                    <View style={[styles.networkDot, isTest && styles.networkDotTestnet]} />
                    <View>
                      <Text style={styles.networkName}>{network.name}</Text>
                      <Text style={styles.networkMeta}>
                        {network.nativeToken.symbol} • {isTest ? 'Testnet' : 'Mainnet'}
                      </Text>
                    </View>
                  </View>
                  {isSelected && (
                    <Check color={Colors.brand.cherryRed} size={20} />
                  )}
                </TouchableOpacity>
              );
            })}

            {/* Coming Soon: Other Blockchains */}
            <Text style={[styles.sectionTitle, styles.sectionTitleDisabled]}>Coming Soon</Text>

            <View style={styles.comingSoon}>
              <Text style={styles.comingSoonText}>Solana</Text>
              <Text style={styles.comingSoonBadge}>Soon</Text>
            </View>

            <View style={styles.comingSoon}>
              <Text style={styles.comingSoonText}>Polkadot</Text>
              <Text style={styles.comingSoonBadge}>Soon</Text>
            </View>

            <View style={styles.comingSoon}>
              <Text style={styles.comingSoonText}>Avalanche</Text>
              <Text style={styles.comingSoonBadge}>Soon</Text>
            </View>

            {/* Info */}
            <View style={styles.info}>
              <Text style={styles.infoText}>
                More blockchains coming soon! Vote for your favorite on our Discord.
              </Text>
            </View>
          </ScrollView>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.brand.white,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 6,
    gap: 6,
    borderWidth: 1,
    borderColor: Colors.brand.lightPeach,
  },
  buttonTestnet: {
    backgroundColor: '#FFF3F0',
    borderColor: Colors.brand.cherryRed,
  },
  buttonText: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: Colors.brand.ink,
  },
  buttonTextTestnet: {
    color: Colors.brand.cherryRed,
  },
  modal: {
    flex: 1,
    backgroundColor: Colors.brand.white,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: Colors.brand.lightPeach,
  },
  title: {
    fontSize: 24,
    fontWeight: '900' as const,
    color: Colors.brand.ink,
  },
  closeButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  warning: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF3F0',
    padding: 16,
    marginHorizontal: 20,
    marginTop: 16,
    borderRadius: 12,
    gap: 12,
  },
  warningText: {
    flex: 1,
    fontSize: 13,
    color: Colors.brand.ink,
    lineHeight: 18,
  },
  list: {
    flex: 1,
    padding: 20,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '700' as const,
    color: Colors.brand.ink,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginTop: 16,
    marginBottom: 12,
  },
  sectionTitleDisabled: {
    color: Colors.brand.inkMuted,
  },
  networkItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.brand.white,
    borderRadius: 16,
    padding: 16,
    marginBottom: 8,
    borderWidth: 2,
    borderColor: Colors.brand.lightPeach,
  },
  networkItemSelected: {
    borderColor: Colors.brand.cherryRed,
    backgroundColor: '#FFF3F0',
  },
  networkLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  networkDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#4ade80',
  },
  networkDotTestnet: {
    backgroundColor: Colors.brand.cherryRed,
  },
  networkName: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: Colors.brand.ink,
  },
  networkMeta: {
    fontSize: 12,
    color: Colors.brand.inkMuted,
    marginTop: 2,
  },
  comingSoon: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F5F5F5',
    borderRadius: 16,
    padding: 16,
    marginBottom: 8,
    opacity: 0.6,
  },
  comingSoonText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.brand.inkMuted,
  },
  comingSoonBadge: {
    fontSize: 12,
    fontWeight: '700' as const,
    color: Colors.brand.inkMuted,
    backgroundColor: Colors.brand.white,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  info: {
    backgroundColor: Colors.brand.lightPeach,
    borderRadius: 12,
    padding: 16,
    marginTop: 16,
  },
  infoText: {
    fontSize: 13,
    color: Colors.brand.ink,
    lineHeight: 18,
    textAlign: 'center',
  },
});
