import { Stack } from "expo-router";
import React from "react";
import { View, Text, StyleSheet } from "react-native";
import Colors from "@/constants/colors";

export default function WalletStackLayout() {
  return (
    <Stack
      screenOptions={{
        header: () => (
          <View style={styles.header} testID="wallet-header">
            <Text style={styles.brand}>HeySalad® Wallet</Text>
            <Text style={styles.tagline}>Friendly, fresh payments for foodies</Text>
          </View>
        ),
      }}
    >
      <Stack.Screen name="index" options={{ title: "Wallet" }} />
    </Stack>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingTop: 20,
    paddingBottom: 12,
    paddingHorizontal: 16,
    backgroundColor: Colors.brand.peachLight,
    borderBottomWidth: 1,
    borderBottomColor: Colors.brand.border,
  },
  brand: {
    fontSize: 20,
    fontWeight: "900" as const,
    color: Colors.brand.red,
  },
  tagline: {
    fontSize: 12,
    color: Colors.brand.inkMuted,
  },
});