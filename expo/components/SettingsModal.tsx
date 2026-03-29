import React, { useState } from "react";
import { View, Text, StyleSheet, Modal, TouchableOpacity, Alert, ScrollView, Switch } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { X, Key, Shield, Download, Trash2, Info, Moon, Bell, Globe } from "lucide-react-native";
import Colors from "@/constants/colors";
import HSButton from "./HSButton";
import { useWallet } from "@/providers/WalletProvider";
import { useAuth } from "@/providers/AuthProvider";
import * as Clipboard from "expo-clipboard";

type Props = {
  visible: boolean;
  onClose: () => void;
};

const SettingsModal: React.FC<Props> = ({ visible, onClose }) => {
  const insets = useSafeAreaInsets();
  const { wallet } = useWallet();
  const { biometricAvailable, biometricEnabled, enableBiometrics } = useAuth();
  const [darkMode, setDarkMode] = useState(false);
  const [notifications, setNotifications] = useState(true);

  const showPrivateKey = () => {
    Alert.alert(
      "⚠️ Private Key Warning",
      "Your private key gives complete control over your wallet. Never share it with anyone!",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Show Key",
          style: "destructive",
          onPress: () => {
            Alert.alert(
              "🔑 Your Private Key",
              wallet.privateKey || "Private key not available",
              [
                {
                  text: "Copy",
                  onPress: async () => {
                    if (wallet.privateKey) {
                      await Clipboard.setStringAsync(wallet.privateKey);
                      Alert.alert("Copied! ✅", "Private key copied to clipboard");
                    }
                  }
                },
                { text: "Done" }
              ]
            );
          }
        }
      ]
    );
  };

  const exportWallet = () => {
    Alert.alert(
      "Export Wallet",
      "This will create a backup of your wallet data.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Export",
          onPress: () => {
            Alert.alert("Coming Soon!", "Wallet export feature will be available in the next update.");
          }
        }
      ]
    );
  };

  const resetWallet = () => {
    Alert.alert(
      "⚠️ Reset Wallet",
      "This will permanently delete your wallet data. Make sure you have your private key backed up!",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Reset",
          style: "destructive",
          onPress: () => {
            Alert.alert("Coming Soon!", "Wallet reset feature will be available in the next update.");
          }
        }
      ]
    );
  };

  const handleBiometricToggle = async () => {
    if (!biometricEnabled) {
      const success = await enableBiometrics();
      if (!success) {
        Alert.alert("Failed", "Could not enable biometric authentication");
      }
    } else {
      Alert.alert("Coming Soon!", "Disabling biometrics will be available in the next update.");
    }
  };

  const SettingItem = ({ 
    icon, 
    title, 
    subtitle, 
    onPress, 
    rightElement, 
    danger = false 
  }: {
    icon: React.ReactNode;
    title: string;
    subtitle?: string;
    onPress?: () => void;
    rightElement?: React.ReactNode;
    danger?: boolean;
  }) => (
    <TouchableOpacity 
      style={styles.settingItem} 
      onPress={onPress}
      disabled={!onPress}
    >
      <View style={styles.settingLeft}>
        <View style={[styles.settingIcon, danger && styles.settingIconDanger]}>
          {icon}
        </View>
        <View style={styles.settingContent}>
          <Text style={[styles.settingTitle, danger && styles.settingTitleDanger]}>
            {title}
          </Text>
          {subtitle && (
            <Text style={styles.settingSubtitle}>{subtitle}</Text>
          )}
        </View>
      </View>
      {rightElement}
    </TouchableOpacity>
  );

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={[styles.container, { paddingTop: insets.top }]}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Settings</Text>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <X color={Colors.brand.red} size={24} />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Security Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Security</Text>
            
            <SettingItem
              icon={<Shield color={Colors.brand.red} size={20} />}
              title="Biometric Authentication"
              subtitle={biometricAvailable ? "Use Face ID or Touch ID" : "Not available on this device"}
              rightElement={
                <Switch
                  value={biometricEnabled}
                  onValueChange={handleBiometricToggle}
                  disabled={!biometricAvailable}
                  trackColor={{ false: "#767577", true: Colors.brand.lightPeach }}
                  thumbColor={biometricEnabled ? Colors.brand.red : "#f4f3f4"}
                />
              }
            />
            
            <SettingItem
              icon={<Key color={Colors.brand.red} size={20} />}
              title="Show Private Key"
              subtitle="View your wallet's private key"
              onPress={showPrivateKey}
            />
            
            <SettingItem
              icon={<Download color={Colors.brand.red} size={20} />}
              title="Export Wallet"
              subtitle="Backup your wallet data"
              onPress={exportWallet}
            />
          </View>

          {/* Preferences Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Preferences</Text>
            
            <SettingItem
              icon={<Moon color={Colors.brand.red} size={20} />}
              title="Dark Mode"
              subtitle="Switch to dark theme"
              rightElement={
                <Switch
                  value={darkMode}
                  onValueChange={setDarkMode}
                  trackColor={{ false: "#767577", true: Colors.brand.lightPeach }}
                  thumbColor={darkMode ? Colors.brand.red : "#f4f3f4"}
                />
              }
            />
            
            <SettingItem
              icon={<Bell color={Colors.brand.red} size={20} />}
              title="Notifications"
              subtitle="Transaction alerts and updates"
              rightElement={
                <Switch
                  value={notifications}
                  onValueChange={setNotifications}
                  trackColor={{ false: "#767577", true: Colors.brand.lightPeach }}
                  thumbColor={notifications ? Colors.brand.red : "#f4f3f4"}
                />
              }
            />
            
            <SettingItem
              icon={<Globe color={Colors.brand.red} size={20} />}
              title="Currency"
              subtitle="GBP (£)"
              onPress={() => Alert.alert("Coming Soon!", "Currency selection will be available soon.")}
            />
          </View>

          {/* About Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>About</Text>
            
            <SettingItem
              icon={<Info color={Colors.brand.red} size={20} />}
              title="App Version"
              subtitle="HeySalad Wallet v1.0.4"
            />
            
            <SettingItem
              icon={<Globe color={Colors.brand.red} size={20} />}
              title="Network"
              subtitle="TRON Nile Testnet"
            />
          </View>

          {/* Danger Zone */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, styles.dangerSectionTitle]}>Danger Zone</Text>
            
            <SettingItem
              icon={<Trash2 color="#ef4444" size={20} />}
              title="Reset Wallet"
              subtitle="Permanently delete all wallet data"
              onPress={resetWallet}
              danger
            />
          </View>
        </ScrollView>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.brand.white,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: "900" as const,
    color: Colors.brand.ink,
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.brand.lightPeach,
    alignItems: "center",
    justifyContent: "center",
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700" as const,
    color: Colors.brand.ink,
    marginBottom: 16,
  },
  dangerSectionTitle: {
    color: "#ef4444",
  },
  settingItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 16,
    paddingHorizontal: 16,
    backgroundColor: Colors.brand.white,
    borderRadius: 12,
    marginBottom: 8,
    shadowColor: "#00000008",
    shadowOpacity: 0.05,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  settingLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  settingIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.brand.lightPeach,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  settingIconDanger: {
    backgroundColor: "#fef2f2",
  },
  settingContent: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: "600" as const,
    color: Colors.brand.ink,
  },
  settingTitleDanger: {
    color: "#ef4444",
  },
  settingSubtitle: {
    fontSize: 14,
    color: Colors.brand.inkMuted,
    marginTop: 2,
  },
});

export default SettingsModal;