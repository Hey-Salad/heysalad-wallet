import { Stack } from "expo-router";
import React, { useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Settings } from "lucide-react-native";
import Colors from "@/constants/colors";
import SettingsModal from "@/components/SettingsModal";

export default function WalletStackLayout() {
  const insets = useSafeAreaInsets();
  const [showSettings, setShowSettings] = useState(false);
  
  return (
    <>
      <Stack
        screenOptions={{
          header: () => (
            <View style={[styles.header, { paddingTop: insets.top + 8 }]} testID="wallet-header">
              <View style={styles.headerContent}>
                <View>
                  <Text style={styles.brand}>HeySalad® Wallet</Text>
                  <Text style={styles.tagline}>Friendly, fresh payments for foodies</Text>
                </View>
                <TouchableOpacity style={styles.settingsButton} onPress={() => setShowSettings(true)}>
                  <Settings color={Colors.brand.red} size={20} />
                </TouchableOpacity>
              </View>
            </View>
          ),
        }}
      >
        <Stack.Screen name="index" options={{ title: "Wallet" }} />
      </Stack>
      
      <SettingsModal visible={showSettings} onClose={() => setShowSettings(false)} />
    </>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingBottom: 16,
    paddingHorizontal: 20,
    backgroundColor: Colors.brand.white,
  },
  headerContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  brand: {
    fontSize: 22,
    fontWeight: "900" as const,
    color: Colors.brand.red,
  },
  tagline: {
    fontSize: 13,
    color: Colors.brand.inkMuted,
    marginTop: 2,
  },
  settingsButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.brand.lightPeach,
    alignItems: "center",
    justifyContent: "center",
  },
});