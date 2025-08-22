// Add this debug component to test state updates
// components/DebugOnboarding.tsx

import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { useWallet } from "@/providers/WalletProvider";
import HSButton from "./HSButton";
import AsyncStorage from "@react-native-async-storage/async-storage";

const DebugOnboarding: React.FC = () => {
  const { wallet, completeOnboarding } = useWallet();

  const checkStorage = async () => {
    const stored = await AsyncStorage.getItem('heysalad_wallet');
    console.log('[Debug] Storage contents:', stored);
  };

  const forceComplete = async () => {
    console.log('[Debug] Force completing onboarding...');
    
    // Manually update storage
    const updatedWallet = {
      ...wallet,
      onboarding: {
        ...wallet.onboarding,
        hasCompletedOnboarding: true
      }
    };
    
    await AsyncStorage.setItem('heysalad_wallet', JSON.stringify(updatedWallet));
    console.log('[Debug] Manual update complete');
    
    // Try the normal completion too
    await completeOnboarding();
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>🔧 Debug Info</Text>
      <Text style={styles.text}>Address: {wallet.address}</Text>
      <Text style={styles.text}>Setup: {wallet.isSetup ? 'Yes' : 'No'}</Text>
      <Text style={styles.text}>Needs Setup: {wallet.needsSetup ? 'Yes' : 'No'}</Text>
      <Text style={styles.text}>Onboarding Complete: {wallet.onboarding.hasCompletedOnboarding ? 'Yes' : 'No'}</Text>
      <Text style={styles.text}>Balance: {wallet.tronBalance} TRX</Text>
      
      <HSButton title="Check Storage" onPress={checkStorage} variant="secondary" />
      <HSButton title="Force Complete" onPress={forceComplete} variant="primary" />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#f0f0f0',
    padding: 16,
    margin: 16,
    borderRadius: 8,
    gap: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  text: {
    fontSize: 14,
  },
});

export default DebugOnboarding;