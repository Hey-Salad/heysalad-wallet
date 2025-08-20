import { Tabs } from "expo-router";
import React from "react";
import Colors from "@/constants/colors";
import { Wallet, Mic, Users, Gift } from "lucide-react-native";

export default function TabLayout() {
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
          title: "Pay",
          tabBarIcon: ({ color }) => <Mic color={color} />,
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