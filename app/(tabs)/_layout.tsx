import { Tabs, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import { View, Text, ActivityIndicator } from "react-native";
import Colors from "@/constants/colors";
import { Wallet, DollarSign, Users, Gift, CreditCard, Bot } from "lucide-react-native";
import { useCloudflareAuth } from "@/providers/CloudflareAuthProvider";
import AsyncStorage from "@react-native-async-storage/async-storage";

const PROFILE_KEY = 'heysalad_profile';

export default function TabLayout() {
  const { user, loading } = useCloudflareAuth();
  const router = useRouter();
  const [hasChecked, setHasChecked] = useState(false);
  const [hasProfile, setHasProfile] = useState(false);

  // Check authentication ONCE
  useEffect(() => {
    if (loading || hasChecked) return;

    const checkAuth = async () => {
      console.log('[TabLayout] Checking auth...', { user: !!user });

      if (!user) {
        console.log('[TabLayout] No user, redirecting to sign-in');
        router.replace('/sign-in');
        return;
      }

      // Check for profile in AsyncStorage
      const profileJson = await AsyncStorage.getItem(PROFILE_KEY);
      if (!profileJson) {
        console.log('[TabLayout] No profile, redirecting to onboarding');
        router.replace('/onboarding-profile');
        return;
      }

      const profile = JSON.parse(profileJson);
      console.log('[TabLayout] ✅ User authenticated:', user.id, 'Profile:', profile.username);
      setHasProfile(true);
      setHasChecked(true);
    };

    checkAuth();
  }, [user, loading, hasChecked, router]);

  // Show loading only while initial check
  if (loading || (!hasChecked && !user)) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.brand.white }}>
        <ActivityIndicator size="large" color={Colors.brand.ink} />
        <Text style={{ marginTop: 16, fontSize: 16, color: Colors.brand.inkMuted }}>Loading...</Text>
      </View>
    );
  }

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors.light.tint,
        tabBarInactiveTintColor: Colors.light.tabIconDefault,
        headerShown: false,
        tabBarStyle: { backgroundColor: "#ffffff", borderTopColor: Colors.brand.border },
      }}
    >
      <Tabs.Screen
        name="(wallet)"
        options={{
          title: "Wallet",
          tabBarIcon: ({ color }) => <Wallet color={color} />,
        }}
      />
      <Tabs.Screen
        name="card"
        options={{
          title: "Card",
          tabBarIcon: ({ color }) => <CreditCard color={color} />,
        }}
      />
      <Tabs.Screen
        name="pay"
        options={{
          href: null, // Hide from tab bar - card replaces it
        }}
      />
      <Tabs.Screen
        name="agent"
        options={{
          title: "Agent",
          tabBarIcon: ({ color }) => <Bot color={color} />,
        }}
      />
      <Tabs.Screen
        name="social"
        options={{
          title: "Social",
          tabBarIcon: ({ color }) => <Users color={color} />,
        }}
      />
      <Tabs.Screen
        name="rewards"
        options={{
          href: null, // Hide from tab bar - agent replaces it
        }}
      />
    </Tabs>
  );
}
