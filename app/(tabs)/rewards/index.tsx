import React, { useMemo } from "react";
import { View, Text, StyleSheet, FlatList, Image } from "react-native";
import Colors from "@/constants/colors";
import { useWallet } from "@/providers/WalletProvider";
import HSTag from "@/components/HSTag";
import { Stack } from "expo-router";

export default function RewardsScreen() {
  const { wallet } = useWallet();

  const sustainableTx = useMemo(
    () => wallet.transactions.filter((t) => t.sustainable || t.category === "sustainable"),
    [wallet.transactions]
  );

  return (
    <View style={styles.container} testID="rewards-screen">
      <Stack.Screen
        options={{
          title: "Rewards",
          headerStyle: { backgroundColor: Colors.brand.peachLight },
          headerTintColor: Colors.brand.red,
        }}
      />

      <View style={styles.headerCard}>
        <Text style={styles.points}>{wallet.tokenBalance}</Text>
        <Text style={styles.pointsLabel}>SALAD tokens</Text>
        <HSTag label="Earned from sustainable food purchases" tone="success" />
      </View>

      <Text style={styles.subTitle}>Recent sustainable wins</Text>
      <FlatList
        data={sustainableTx}
        keyExtractor={(i) => i.id}
        renderItem={({ item }) => (
          <View style={styles.txCard}>
            <Image
              source={{
                uri:
                  "https://images.unsplash.com/photo-1542831371-29b0f74f9713?q=80&w=400&auto=format&fit=crop",
              }}
              style={styles.txImage}
            />
            <View style={{ flex: 1 }}>
              <Text style={styles.txTitle}>{item.note ?? "Sustainable purchase"}</Text>
              <Text style={styles.txSub}>{new Date(item.timestamp).toLocaleDateString()} • {item.category}</Text>
            </View>
            <HSTag label="+SALAD" tone="success" />
          </View>
        )}
        ListEmptyComponent={
          <Text style={styles.empty}>Make your first sustainable purchase to earn SALAD tokens</Text>
        }
        contentContainerStyle={{ paddingBottom: 40 }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.brand.surface, padding: 16 },
  headerCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.brand.border,
    padding: 16,
    gap: 8,
    alignItems: "center",
  },
  points: { fontSize: 36, fontWeight: "900" as const, color: Colors.brand.red },
  pointsLabel: { color: Colors.brand.inkMuted, marginBottom: 8 },
  subTitle: { marginTop: 16, marginBottom: 8, fontWeight: "900" as const, color: Colors.brand.ink },
  txCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.brand.border,
    padding: 12,
    flexDirection: "row",
    gap: 12,
    alignItems: "center",
    marginBottom: 12,
  },
  txImage: { width: 44, height: 44, borderRadius: 8 },
  txTitle: { fontWeight: "800" as const, color: Colors.brand.ink },
  txSub: { color: Colors.brand.inkMuted, fontSize: 12 },
  empty: { textAlign: "center", color: Colors.brand.inkMuted, marginTop: 20 },
});