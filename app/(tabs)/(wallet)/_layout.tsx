// app/(tabs)/(wallet)/_layout.tsx
// Layout for the wallet tab with proper navigation structure

import { Stack } from 'expo-router';
import React from 'react';
import Colors from '@/constants/colors';

export default function WalletStackLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: Colors.brand.white },
        animation: 'slide_from_right',
      }}
    >
      <Stack.Screen 
        name="index" 
        options={{
          headerShown: false,
        }} 
      />
      <Stack.Screen 
        name="settings" 
        options={{
          headerShown: true,
          title: "Settings",
          headerBackTitle: "Wallet",
          headerStyle: {
            backgroundColor: Colors.brand.white,
          },
          headerTintColor: Colors.brand.ink,
          headerTitleStyle: {
            fontWeight: '700',
          },
        }} 
      />
      <Stack.Screen 
        name="transaction-history" 
        options={{
          headerShown: true,
          title: "Transaction History",
          headerBackTitle: "Wallet",
          headerStyle: {
            backgroundColor: Colors.brand.white,
          },
          headerTintColor: Colors.brand.ink,
          headerTitleStyle: {
            fontWeight: '700',
          },
        }} 
      />
    </Stack>
  );
}