import { Stack } from "expo-router";
import React from "react";

export default function SocialLayout() {
  return (
    <Stack screenOptions={{ headerShown: true }}>
      <Stack.Screen name="index" options={{ title: "Split & Cook" }} />
    </Stack>
  );
}