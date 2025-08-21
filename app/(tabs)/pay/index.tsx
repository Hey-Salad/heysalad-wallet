import React, { useCallback, useMemo, useState } from "react";
import { View, Text, StyleSheet, Alert, ScrollView, Image } from "react-native";
import Colors from "@/constants/colors";
import VoiceRecorder from "@/features/voice/VoiceRecorder";
import HSButton from "@/components/HSButton";
import { useWallet } from "@/providers/WalletProvider";
import { parseVoiceToIntent } from "@/features/voice/intent";
import { formatTrx } from "@/utils/format";
import { Stack } from "expo-router";
import { Check } from "lucide-react-native";
import { trpc } from "@/lib/trpc";

type PendingIntent = {
  rawText: string;
  amountTrx: number;
  toName?: string;
  address?: string;
  note?: string;
  category: "groceries" | "restaurants" | "farmers_market" | "delivery" | "other" | "sustainable";
  sustainable: boolean;
};

export default function PayScreen() {
  const { send } = useWallet();
  const [intent, setIntent] = useState<PendingIntent | null>(null);
  const [processing, setProcessing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const trpcUtils = trpc.useUtils();
  const sendTrxMutation = trpc.tron.sendTrx.useMutation({
    onError: (e) => {
      console.error("[Pay] sendTrx error", e);
    },
  });

  const onTranscript = useCallback(async (text: string) => {
    console.log("[Pay] Transcript", text);
    setError(null);
    const parsed = await parseVoiceToIntent(text);
    if (!parsed) {
      setIntent(null);
      setError("Sorry, I couldn't understand. Try: 'Send 12 TRX to Alex for groceries'.");
      return;
    }
    const pending: PendingIntent = {
      rawText: text,
      amountTrx: parsed.amountTrx,
      toName: parsed.toName,
      address: parsed.address,
      note: parsed.note,
      category: parsed.category ?? "other",
      sustainable: parsed.sustainable ?? false,
    };
    setIntent(pending);
  }, []);

  const onConfirm = useCallback(async () => {
    if (!intent) return;
    setProcessing(true);
    setError(null);
    try {
      const to = intent.address ?? (intent.toName ? `@${intent.toName}` : "unknown");
      const amountSun = Math.round(intent.amountTrx * 1_000_000);
      try {
        await sendTrxMutation.mutateAsync({ to, amountSun });
      } catch (networkErr) {
        console.warn("[Pay] Backend sendTrx failed, falling back to local mock", networkErr);
      }
      send(to, intent.amountTrx, intent.note ?? intent.rawText, intent.category, intent.sustainable);
      Alert.alert("Payment sent", "Your foodie payment is on its way. Enjoy! 🥗");
      setIntent(null);
    } catch (e) {
      console.error("[Pay] Send failed", e);
      setError(e instanceof Error ? e.message : "Payment failed");
    } finally {
      setProcessing(false);
    }
  }, [intent, send, sendTrxMutation]);

  const canConfirm = useMemo(() => !!intent && intent.amountTrx > 0, [intent]);

  return (
    <ScrollView contentContainerStyle={styles.container} testID="pay-screen">
      <Stack.Screen
        options={{
          title: "Voice Pay",
          headerStyle: { backgroundColor: Colors.brand.peachLight },
          headerTintColor: Colors.brand.red,
        }}
      />

      <View style={styles.card}>
        <View style={{ alignItems: "center", marginBottom: 12 }}>
          <Image source={require("@/assets/images/HSK-SPEEDY.png")} style={{ width: 96, height: 96 }} resizeMode="contain" />
        </View>
        <VoiceRecorder onTranscript={onTranscript} />
      </View>

      {intent ? (
        <View style={styles.reviewCard} testID="intent-review">
          <Text style={styles.reviewTitle}>Does this look right?</Text>
          <View style={styles.rowBetween}>
            <Text style={styles.label}>Amount</Text>
            <Text style={styles.value}>{formatTrx(intent.amountTrx)}</Text>
          </View>
          <View style={styles.rowBetween}>
            <Text style={styles.label}>To</Text>
            <Text style={styles.value}>{intent.toName ? `@${intent.toName}` : intent.address ?? "Unknown"}</Text>
          </View>
          {intent.note ? (
            <View style={styles.rowBetween}>
              <Text style={styles.label}>Note</Text>
              <Text style={styles.value}>{intent.note}</Text>
            </View>
          ) : null}
          <View style={styles.rowBetween}>
            <Text style={styles.label}>Category</Text>
            <Text style={styles.value}>{intent.category}</Text>
          </View>
          <View style={styles.rowBetween}>
            <Text style={styles.label}>Sustainable</Text>
            <Text style={styles.value}>{intent.sustainable ? "Yes" : "No"}</Text>
          </View>

          <HSButton
            title={processing ? "Sending…" : "Confirm & send"}
            onPress={onConfirm}
            loading={processing}
            leftIcon={<Check color="#fff" size={16} />}
            variant="primary"
            testID="confirm-send"
            style={{ marginTop: 12 }}
          />
        </View>
      ) : null}

      {error ? <Text style={styles.error}>{error}</Text> : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, backgroundColor: Colors.brand.surface, gap: 12 },
  card: {
    backgroundColor: "#fff",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.brand.border,
    padding: 16,
  },
  reviewCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.brand.border,
    padding: 16,
    gap: 8,
  },
  reviewTitle: { fontSize: 16, fontWeight: "900" as const, color: Colors.brand.ink },
  rowBetween: { flexDirection: "row", justifyContent: "space-between" },
  label: { color: Colors.brand.inkMuted },
  value: { fontWeight: "800" as const, color: Colors.brand.ink },
  error: { color: Colors.brand.red, fontWeight: "700" as const },
});