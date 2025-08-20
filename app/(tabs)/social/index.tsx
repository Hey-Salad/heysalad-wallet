import React, { useMemo, useState } from "react";
import { View, Text, StyleSheet, TextInput, FlatList } from "react-native";
import Colors from "@/constants/colors";
import HSButton from "@/components/HSButton";
import { useWallet } from "@/providers/WalletProvider";
import { formatTrx } from "@/utils/format";
import { Stack } from "expo-router";

type Person = { id: string; name: string; share: number };

export default function SocialSplitScreen() {
  const { send } = useWallet();
  const [total, setTotal] = useState<string>("");
  const [people, setPeople] = useState<Person[]>([
    { id: "1", name: "You", share: 1 },
    { id: "2", name: "Alex", share: 1 },
  ]);
  const [note, setNote] = useState<string>("Cooking night");

  const perHead = useMemo(() => {
    const t = parseFloat(total) || 0;
    const shares = people.reduce((acc, p) => acc + p.share, 0);
    if (shares <= 0) return 0;
    return t / shares;
  }, [total, people]);

  const onAdd = () => {
    const id = `${Date.now()}`;
    setPeople((p) => [...p, { id, name: `Friend ${p.length}`, share: 1 }]);
  };

  const onSend = () => {
    const amountTrx = parseFloat(total) || 0;
    if (amountTrx <= 0) return;
    const to = "@Group";
    const participants = people.map((p) => ({ name: p.name, share: Number(perHead * p.share) }));
    try {
      send(to, amountTrx, note, "groceries", true, participants);
    } catch (e) {
      console.error("[Social] send error", e);
    }
  };

  return (
    <View style={styles.container} testID="social-screen">
      <Stack.Screen
        options={{
          title: "Split & Cook",
          headerStyle: { backgroundColor: Colors.brand.peachLight },
          headerTintColor: Colors.brand.red,
        }}
      />

      <View style={styles.card}>
        <Text style={styles.title}>Split your foodie bill</Text>
        <TextInput
          placeholder="Total in TRX"
          keyboardType="decimal-pad"
          value={total}
          onChangeText={setTotal}
          style={styles.input}
          testID="total-input"
        />
        <FlatList
          data={people}
          keyExtractor={(i) => i.id}
          renderItem={({ item, index }) => (
            <View style={styles.row}>
              <TextInput
                value={item.name}
                onChangeText={(t) =>
                  setPeople((arr) => arr.map((p, ix) => (ix === index ? { ...p, name: t } : p)))
                }
                style={[styles.personInput, { flex: 1 }]}
              />
              <TextInput
                value={String(item.share)}
                onChangeText={(t) =>
                  setPeople((arr) => arr.map((p, ix) => (ix === index ? { ...p, share: Number(t) || 0 } : p)))
                }
                keyboardType="number-pad"
                style={[styles.personInput, { width: 70, textAlign: "center" }]}
              />
              <Text style={styles.shareValue}>≈ {formatTrx(perHead * item.share)}</Text>
            </View>
          )}
          ListFooterComponent={
            <HSButton title="Add friend" variant="ghost" onPress={onAdd} testID="add-friend-btn" />
          }
        />

        <TextInput
          placeholder="What's this for?"
          value={note}
          onChangeText={setNote}
          style={styles.input}
        />

        <HSButton title="Send & log split" onPress={onSend} variant="primary" testID="send-split-btn" />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.brand.surface, padding: 16 },
  card: {
    backgroundColor: "#fff",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.brand.border,
    padding: 16,
    gap: 12,
  },
  title: { fontSize: 18, fontWeight: "900" as const, color: Colors.brand.ink },
  input: {
    height: 50,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.brand.border,
    paddingHorizontal: 12,
    backgroundColor: "#fff",
  },
  row: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 8 },
  personInput: {
    height: 44,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.brand.border,
    paddingHorizontal: 10,
    backgroundColor: "#fff",
  },
  shareValue: { fontWeight: "700" as const, color: Colors.brand.red },
});