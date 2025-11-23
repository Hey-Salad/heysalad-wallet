import { Tabs, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import { View, Text, ActivityIndicator } from "react-native";
import Colors from "@/constants/colors";
import { Wallet, DollarSign, Users, Gift } from "lucide-react-native";
import { useSupabase } from "@/providers/SupabaseProvider";

export default function TabLayout() {
  const { user, profile, loading } = useSupabase();
  const router = useRouter();
  const [hasChecked, setHasChecked] = useState(false);

  // Check authentication ONCE (like heysalad-cash dashboard layout)
  useEffect(() => {
    if (loading || hasChecked) return;

    console.log('[TabLayout] Checking auth...', { user: !!user, profile: !!profile });

    if (!user) {
      console.log('[TabLayout] No user, redirecting to sign-in');
      router.replace('/sign-in');
      return;
    }

    if (!profile) {
      console.log('[TabLayout] No profile, redirecting to onboarding');
      router.replace('/onboarding-profile');
      return;
    }

    console.log('[TabLayout] ✅ User authenticated:', user.id, 'Profile:', profile.username);
    setHasChecked(true);
  }, [user, profile, loading, hasChecked, router]);

  // Show loading only while initial check
  if (loading || (!hasChecked && (!user || !profile))) {
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
        name="pay"
        options={{
          title: "Payments",
          tabBarIcon: ({ color }) => <DollarSign color={color} />,
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
          title: "Rewards",
          tabBarIcon: ({ color }) => <Gift color={color} />,
        }}
      />
    </Tabs>
  );
}
