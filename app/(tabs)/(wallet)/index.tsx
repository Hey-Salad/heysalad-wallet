import React, { useMemo } from "react";
import { View, Text, StyleSheet, FlatList, Image } from "react-native";
import Colors from "@/constants/colors";
import HSButton from "@/components/HSButton";
import { useWallet } from "@/providers/WalletProvider";
import { formatTrx, formatFiat, shortAddr } from "@/utils/format";
import { useRouter } from "expo-router";
import HSTag from "@/components/HSTag";
import { ArrowUpRight, ArrowDownLeft } from "lucide-react-native";

export default function WalletHome() {
  const { wallet, receiveMock } = useWallet();
  const router = useRouter();

  const balanceCard = useMemo(() => {
    return (
      <View style={styles.balanceCard} testID="balance-card">
        <Text style={styles.balanceTitle}>Total Balance</Text>
        <Text style={styles.balanceValue}>{formatTrx(wallet.tronBalance)}</Text>
        <Text style={styles.subValue}>Rewards: {wallet.tokenBalance} SALAD</Text>
      </View>
    );
  }, [wallet.tronBalance, wallet.tokenBalance]);

  const header = (
    <View style={styles.header} testID="wallet-actions">
      {balanceCard}
      <View style={styles.row}>
        <HSButton
          title="Voice pay"
          onPress={() => router.push("/(tabs)/pay")}
          variant="primary"
          leftIcon={<ArrowUpRight color="#fff" size={16} />}
          testID="voice-pay-btn"
        />
        <HSButton
          title="Split bill"
          onPress={() => router.push("/(tabs)/social")}
          variant="secondary"
          leftIcon={<ArrowDownLeft color="#fff" size={16} />}
          testID="split-bill-btn"
        />
      </View>
      <View style={styles.addressCard}>
        <View style={{ flex: 1 }}>
          <Text style={styles.addressLabel}>Your TRON address</Text>
          <Text style={styles.address}>{shortAddr(wallet.address)}</Text>
        </View>
        <Image
          source={{ uri: "https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=heysalad" }}
          style={{ width: 60, height: 60, borderRadius: 8 }}
        />
      </View>
      <HSButton
        title="Add mock funds +25 TRX"
        variant="ghost"
        onPress={() => receiveMock("friend", 25, "Test funds", "other")}
        testID="mock-funds-btn"
      />
      <Text style={styles.sectionTitle}>Recent activity</Text>
    </View>
  );

  return (
    <View style={styles.container} testID="wallet-home">
      <FlatList
        data={wallet.transactions}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={header}
        contentContainerStyle={{ paddingBottom: 40 }}
        renderItem={({ item }) => (
          <View style={styles.txCard} testID={`tx-${item.id}`}>
            <View style={{ flex: 1 }}>
              <Text style={styles.txTitle}>To {shortAddr(item.to)}</Text>
              <Text style={styles.txNote}>{item.note ?? "Food payment"} • {new Date(item.timestamp).toLocaleString()}</Text>
              <View style={styles.tags}>
                <HSTag
                  label={item.category}
                  tone={item.category === "sustainable" ? "success" : "info"}
                />
                {item.sustainable ? <HSTag label="+SALAD" tone="success" /> : null}
              </View>
            </View>
            <Text style={styles.txAmount}>-{formatTrx(item.amountTrx)}</Text>
          </View>
        )}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyTitle}>No payments yet</Text>
            <Text style={styles.emptyText}>Try a voice payment or split a bill with friends</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.brand.surface },
  header: { padding: 16, gap: 12 },
  balanceCard: {
    backgroundColor: "#ffffff",
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.brand.border,
  },
  balanceTitle: { color: Colors.brand.inkMuted, fontWeight: "700" as const },
  balanceValue: { fontSize: 28, fontWeight: "900" as const, color: Colors.brand.red, marginTop: 4 },
  subValue: { color: Colors.brand.inkMuted, marginTop: 4 },
  row: { flexDirection: "row", gap: 12 },
  addressCard: {
    flexDirection: "row",
    gap: 12,
    alignItems: "center",
    backgroundColor: "#ffffff",
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: Colors.brand.border,
  },
  addressLabel: { color: Colors.brand.inkMuted, fontSize: 12 },
  address: { color: Colors.brand.ink, fontSize: 16, fontWeight: "800" as const },
  sectionTitle: { marginTop: 8, fontSize: 16, fontWeight: "900" as const, color: Colors.brand.ink },
  txCard: {
    marginHorizontal: 16,
    marginBottom: 12,
    backgroundColor: "#ffffff",
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: Colors.brand.border,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  txTitle: { fontWeight: "800" as const, color: Colors.brand.ink },
  txNote: { color: Colors.brand.inkMuted, fontSize: 12, marginTop: 2 },
  txAmount: { fontWeight: "800" as const, color: Colors.brand.red },
  tags: { flexDirection: "row", gap: 8, marginTop: 8 },
  empty: { alignItems: "center", gap: 6, paddingTop: 40 },
  emptyTitle: { fontWeight: "900" as const, color: Colors.brand.ink },
  emptyText: { color: Colors.brand.inkMuted },
});