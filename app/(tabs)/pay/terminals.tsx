/**
 * Terminals Screen - BLE Terminal Payment
 * Scan for and connect to HeySalad payment terminals via Bluetooth
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { router } from 'expo-router';
import { ArrowLeft, Bluetooth, RefreshCw, Check } from 'lucide-react-native';
import Colors from '@/constants/colors';
import HSButton from '@/components/HSButton';
import { getTerminalBLEService, Terminal } from '@/services/TerminalBLEService';
import * as Device from 'expo-device';

export default function TerminalsScreen() {
  const [isScanning, setIsScanning] = useState(false);
  const [terminals, setTerminals] = useState<Terminal[]>([]);
  const [connectedTerminal, setConnectedTerminal] = useState<Terminal | null>(null);
  const [isInitializing, setIsInitializing] = useState(true);
  const [bleSupported, setBleSupported] = useState(true);

  const bleService = getTerminalBLEService();

  useEffect(() => {
    initializeBLE();

    return () => {
      // Cleanup on unmount
      if (connectedTerminal) {
        bleService.disconnect();
      }
      bleService.stopScan();
    };
  }, []);

  const initializeBLE = async () => {
    try {
      // Check if device supports BLE
      if (!Device.isDevice) {
        Alert.alert(
          'Not Supported',
          'Bluetooth is not available on simulator. Please use a physical device.'
        );
        setBleSupported(false);
        setIsInitializing(false);
        return;
      }

      const initialized = await bleService.initialize();

      if (!initialized) {
        Alert.alert(
          'Bluetooth Not Available',
          'Please enable Bluetooth in your device settings to scan for terminals.'
        );
        setBleSupported(false);
      } else {
        setBleSupported(true);
      }
    } catch (error: any) {
      console.error('[Terminals] Initialize error:', error);
      Alert.alert('Error', 'Failed to initialize Bluetooth: ' + error.message);
      setBleSupported(false);
    } finally {
      setIsInitializing(false);
    }
  };

  const startScan = async () => {
    if (!bleSupported) {
      Alert.alert(
        'Bluetooth Not Available',
        'Please enable Bluetooth to scan for terminals.'
      );
      return;
    }

    setIsScanning(true);
    setTerminals([]);

    try {
      await bleService.scanForTerminals(
        (terminal: Terminal) => {
          setTerminals((prev) => {
            // Avoid duplicates
            const exists = prev.find((t) => t.id === terminal.id);
            if (exists) return prev;
            return [...prev, terminal];
          });
        },
        10000 // Scan for 10 seconds
      );

      setTimeout(() => {
        setIsScanning(false);
        if (terminals.length === 0) {
          Alert.alert(
            'No Terminals Found',
            'Make sure your terminal is powered on and nearby.'
          );
        }
      }, 10000);
    } catch (error: any) {
      console.error('[Terminals] Scan error:', error);
      Alert.alert('Scan Error', error.message);
      setIsScanning(false);
    }
  };

  const connectToTerminal = async (terminal: Terminal) => {
    try {
      // Disconnect from current terminal if connected
      if (connectedTerminal) {
        await bleService.disconnect();
        setConnectedTerminal(null);
      }

      // Connect to new terminal
      await bleService.connect(terminal.id);

      const updatedTerminal = { ...terminal, isConnected: true };
      setConnectedTerminal(updatedTerminal);

      // Update terminals list
      setTerminals((prev) =>
        prev.map((t) =>
          t.id === terminal.id ? updatedTerminal : { ...t, isConnected: false }
        )
      );

      Alert.alert(
        'Connected',
        `Successfully connected to ${terminal.name}`,
        [
          {
            text: 'OK',
            onPress: () => {
              // Navigate back to payment screen to continue with terminal payment
              router.back();
            },
          },
        ]
      );
    } catch (error: any) {
      console.error('[Terminals] Connection error:', error);
      Alert.alert('Connection Failed', error.message);
    }
  };

  const disconnectFromTerminal = async () => {
    if (!connectedTerminal) return;

    try {
      await bleService.disconnect();

      setTerminals((prev) =>
        prev.map((t) =>
          t.id === connectedTerminal.id ? { ...t, isConnected: false } : t
        )
      );

      setConnectedTerminal(null);
      Alert.alert('Disconnected', 'Terminal disconnected successfully');
    } catch (error: any) {
      console.error('[Terminals] Disconnect error:', error);
      Alert.alert('Disconnect Failed', error.message);
    }
  };

  const renderTerminalItem = (terminal: Terminal) => (
    <TouchableOpacity
      key={terminal.id}
      style={[
        styles.terminalCard,
        terminal.isConnected && styles.terminalCardConnected,
      ]}
      onPress={() => {
        if (terminal.isConnected) {
          disconnectFromTerminal();
        } else {
          connectToTerminal(terminal);
        }
      }}
    >
      <View style={styles.terminalInfo}>
        <Bluetooth
          color={terminal.isConnected ? Colors.brand.green : Colors.brand.ink}
          size={24}
        />
        <View style={styles.terminalDetails}>
          <Text style={styles.terminalName}>{terminal.name}</Text>
          {terminal.rssi && (
            <Text style={styles.terminalRSSI}>Signal: {terminal.rssi} dBm</Text>
          )}
        </View>
      </View>

      {terminal.isConnected ? (
        <View style={styles.connectedBadge}>
          <Check color={Colors.brand.white} size={16} />
          <Text style={styles.connectedText}>Connected</Text>
        </View>
      ) : (
        <HSButton
          title="Connect"
          variant="secondary"
          onPress={() => connectToTerminal(terminal)}
          style={styles.connectButton}
        />
      )}
    </TouchableOpacity>
  );

  if (isInitializing) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <ArrowLeft color={Colors.brand.ink} size={24} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Payment Terminals</Text>
          <View style={styles.placeholder} />
        </View>

        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.brand.green} />
          <Text style={styles.loadingText}>Initializing Bluetooth...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft color={Colors.brand.ink} size={24} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Payment Terminals</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
        {/* Connection Status */}
        {connectedTerminal && (
          <View style={styles.statusCard}>
            <Check color={Colors.brand.green} size={24} />
            <View style={styles.statusInfo}>
              <Text style={styles.statusTitle}>Connected to Terminal</Text>
              <Text style={styles.statusSubtitle}>{connectedTerminal.name}</Text>
            </View>
          </View>
        )}

        {/* Scan Button */}
        <View style={styles.scanSection}>
          <Text style={styles.sectionTitle}>
            {connectedTerminal
              ? 'Scan for Other Terminals'
              : 'Scan for Terminals'}
          </Text>
          <Text style={styles.sectionSubtitle}>
            Make sure your terminal is powered on and nearby
          </Text>

          <HSButton
            title={isScanning ? 'Scanning...' : 'Start Scan'}
            variant="primary"
            leftIcon={
              isScanning ? (
                <ActivityIndicator color={Colors.brand.white} />
              ) : (
                <RefreshCw color={Colors.brand.white} size={20} />
              )
            }
            onPress={startScan}
            disabled={isScanning || !bleSupported}
            style={styles.scanButton}
          />
        </View>

        {/* Terminals List */}
        {terminals.length > 0 && (
          <View style={styles.terminalsSection}>
            <Text style={styles.sectionTitle}>
              Available Terminals ({terminals.length})
            </Text>

            <View style={styles.terminalsList}>
              {terminals.map(renderTerminalItem)}
            </View>
          </View>
        )}

        {/* Empty State */}
        {!isScanning && terminals.length === 0 && !connectedTerminal && (
          <View style={styles.emptyState}>
            <Bluetooth color={Colors.brand.neutral} size={64} />
            <Text style={styles.emptyStateTitle}>No Terminals Found</Text>
            <Text style={styles.emptyStateSubtitle}>
              Tap "Start Scan" to search for nearby HeySalad payment terminals
            </Text>
          </View>
        )}

        {/* Instructions */}
        <View style={styles.instructionsCard}>
          <Text style={styles.instructionsTitle}>How to Use</Text>
          <View style={styles.instructionsList}>
            <Text style={styles.instructionItem}>
              1. Make sure Bluetooth is enabled on your device
            </Text>
            <Text style={styles.instructionItem}>
              2. Power on your HeySalad payment terminal
            </Text>
            <Text style={styles.instructionItem}>
              3. Tap "Start Scan" to search for terminals
            </Text>
            <Text style={styles.instructionItem}>
              4. Tap a terminal to connect
            </Text>
            <Text style={styles.instructionItem}>
              5. Return to payment screen to complete transaction
            </Text>
          </View>
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingBottom: 20,
    backgroundColor: Colors.brand.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.brand.lightGray,
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.brand.ink,
  },
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
  },
  loadingText: {
    fontSize: 16,
    color: Colors.brand.neutral,
  },
  statusCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.brand.lightGreen,
    padding: 16,
    borderRadius: 12,
    gap: 12,
    marginBottom: 24,
  },
  statusInfo: {
    flex: 1,
  },
  statusTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.brand.green,
    marginBottom: 4,
  },
  statusSubtitle: {
    fontSize: 14,
    color: Colors.brand.green,
  },
  scanSection: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.brand.ink,
    marginBottom: 8,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: Colors.brand.neutral,
    marginBottom: 16,
  },
  scanButton: {
    width: '100%',
  },
  terminalsSection: {
    marginBottom: 32,
  },
  terminalsList: {
    gap: 12,
  },
  terminalCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.brand.white,
    borderWidth: 1,
    borderColor: Colors.brand.lightGray,
    borderRadius: 12,
    padding: 16,
  },
  terminalCardConnected: {
    borderColor: Colors.brand.green,
    borderWidth: 2,
    backgroundColor: Colors.brand.lightGreen + '20',
  },
  terminalInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  terminalDetails: {
    flex: 1,
  },
  terminalName: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.brand.ink,
    marginBottom: 4,
  },
  terminalRSSI: {
    fontSize: 12,
    color: Colors.brand.neutral,
  },
  connectedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.brand.green,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 4,
  },
  connectedText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.brand.white,
  },
  connectButton: {
    minWidth: 100,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
    gap: 16,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.brand.ink,
  },
  emptyStateSubtitle: {
    fontSize: 14,
    color: Colors.brand.neutral,
    textAlign: 'center',
    paddingHorizontal: 32,
  },
  instructionsCard: {
    backgroundColor: Colors.brand.lightGray,
    borderRadius: 12,
    padding: 16,
    marginTop: 16,
  },
  instructionsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.brand.ink,
    marginBottom: 12,
  },
  instructionsList: {
    gap: 8,
  },
  instructionItem: {
    fontSize: 14,
    color: Colors.brand.neutral,
    lineHeight: 20,
  },
});
