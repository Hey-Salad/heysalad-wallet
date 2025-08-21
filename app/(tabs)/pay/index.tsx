import React, { useCallback, useMemo, useState } from "react";
import { View, Text, StyleSheet, Alert, ScrollView, Image, Linking, Platform, TextInput } from "react-native";
import Colors from "@/constants/colors";
import VoiceRecorder from "@/features/voice/VoiceRecorder";
import HSButton from "@/components/HSButton";
import { useWallet } from "@/providers/WalletProvider";
import { parseVoiceToIntent } from "@/features/voice/intent";
import { formatTrx } from "@/utils/format";
import { Stack } from "expo-router";
import { Check, ExternalLink, QrCode, Mic, Keyboard } from "lucide-react-native";
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

type BroadcastResult = {
  result?: boolean;
  txid?: string;
  code?: string;
  message?: string;
  Error?: string;
};
type PayMethod = "voice" | "text" | "qr" | "qrImage";

async function decodeQrFromImageUrl(url: string): Promise<string | null> {
  try {
    const api = `https://api.qrserver.com/v1/read-qr-code/?fileurl=${encodeURIComponent(url)}`;
    const res = await fetch(api);
    if (!res.ok) return null;
    const data = (await res.json()) as any[];
    const txt: string | undefined = data?.[0]?.symbol?.[0]?.data;
    return txt ?? null;
  } catch (e) {
    console.log("[QR] decode error", e);
    return null;
  }
}

export default function PayScreen() {
  const { send, wallet } = useWallet();
  const [intent, setIntent] = useState<PendingIntent | null>(null);
  const [method, setMethod] = useState<PayMethod>("voice");
  const [toAddr, setToAddr] = useState<string>("");
  const [amountStr, setAmountStr] = useState<string>("");
  const [imgUrl, setImgUrl] = useState<string>("");
  const [processing, setProcessing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [lastTxId, setLastTxId] = useState<string | null>(null);
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

  const confirmFromText = useCallback(() => {
    const amt = parseFloat(amountStr);
    if (!toAddr || !isFinite(amt) || amt <= 0) {
      setError("Enter a valid TRON address and amount");
      return;
    }
    const p: PendingIntent = { rawText: `Send ${amt} TRX to ${toAddr}`, amountTrx: amt, address: toAddr, category: "other", sustainable: false };
    setIntent(p);
  }, [toAddr, amountStr]);

  const onConfirm = useCallback(async () => {
    if (!intent) return;
    setProcessing(true);
    setError(null);
    try {
      const to = intent.address?.trim();
      if (!to || !to.startsWith("T")) {
        setError("A valid recipient TRON address is required");
        setProcessing(false);
        return;
      }
      if (!wallet.address) {
        setError("Set your wallet address in Settings first");
        setProcessing(false);
        return;
      }
      const amountSun = Math.round(intent.amountTrx * 1_000_000);
      try {
        const res = (await sendTrxMutation.mutateAsync({ to, amountSun, from: wallet.address })) as BroadcastResult & { explorerUrl?: string };
        const txid = res?.txid ?? null;
        if (txid) {
          console.log("[Pay] Broadcast txid", txid);
          setLastTxId(txid);
        } else {
          console.warn("[Pay] No txid in response", res);
          setLastTxId(null);
        }
        if (res?.explorerUrl) {
          console.log("[Pay] Explorer URL", res.explorerUrl);
        }
      } catch (networkErr) {
        console.warn("[Pay] Backend sendTrx failed", networkErr);
        setError(networkErr instanceof Error ? networkErr.message : "Failed to send on-chain");
        setProcessing(false);
        return;
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
  }, [intent, send, sendTrxMutation, wallet.address]);

  const canConfirm = useMemo(() => !!intent && intent.amountTrx > 0, [intent]);

  const explorerBase = useMemo(() => {
    const env = process.env.EXPO_PUBLIC_TRONGRID_URL ?? "https://nile.trongrid.io";
    return env.includes("nile") || env.includes("shasta")
      ? "https://nile.tronscan.org/#/transaction/"
      : "https://tronscan.org/#/transaction/";
  }, []);

  const openInExplorer = useCallback(async () => {
    if (!lastTxId) return;
    const url = `${explorerBase}${lastTxId}`;
    console.log("[Pay] Open explorer", url);
    try {
      if (Platform.OS === "web") {
        window.open(url, "_blank");
        return;
      }
      const can = await Linking.canOpenURL(url);
      if (can) await Linking.openURL(url);
    } catch (e) {
      console.error("[Pay] open explorer failed", e);
    }
  }, [lastTxId, explorerBase]);

  return (
    <ScrollView contentContainerStyle={styles.container} testID="pay-screen">
      <Stack.Screen
        options={{
          title: "Payments",
          headerStyle: { backgroundColor: "#ffffff" },
          headerTintColor: Colors.brand.red,
        }}
      />

      <View style={[styles.card, { paddingBottom: 8 }]}>
        <View style={styles.methodRow}>
          <HSButton
            title="Voice"
            variant={method === "voice" ? "primary" : "secondary"}
            leftIcon={<Mic color={method === "voice" ? "#fff" : Colors.brand.red} size={16} />}
            onPress={() => setMethod("voice")}
            style={styles.methodBtn}
          />
          <HSButton
            title="Text"
            variant={method === "text" ? "primary" : "secondary"}
            leftIcon={<Keyboard color={method === "text" ? "#fff" : Colors.brand.red} size={16} />}
            onPress={() => setMethod("text")}
            style={styles.methodBtn}
          />
          <HSButton
            title="QR Scan"
            variant={method === "qr" ? "primary" : "secondary"}
            leftIcon={<QrCode color={method === "qr" ? "#fff" : Colors.brand.red} size={16} />}
            onPress={() => setMethod("qr")}
            style={styles.methodBtn}
          />
          <HSButton
            title="QR Image"
            variant={method === "qrImage" ? "primary" : "secondary"}
            leftIcon={<QrCode color={method === "qrImage" ? "#fff" : Colors.brand.red} size={16} />}
            onPress={() => setMethod("qrImage")}
            style={styles.methodBtn}
          />
        </View>

        {method === "voice" ? (
          <>
            <View style={{ alignItems: "center", marginBottom: 12 }}>
              <Image source={require("@/assets/images/HSK-SPEEDY.png")} style={{ width: 96, height: 96 }} resizeMode="contain" />
            </View>
            <VoiceRecorder onTranscript={onTranscript} />
          </>
        ) : null}

        {method === "text" ? (
          <View style={{ gap: 8 }}>
            <Text style={styles.label}>TRON address</Text>
            <TextInput value={toAddr} onChangeText={setToAddr} placeholder="T..." autoCapitalize="none" style={styles.input} testID="to-address" />
            <Text style={styles.label}>Amount (TRX)</Text>
            <TextInput value={amountStr} onChangeText={setAmountStr} placeholder="0.0" keyboardType="decimal-pad" style={styles.input} testID="amount-input" />
            <HSButton title="Review" onPress={confirmFromText} variant="primary" />
          </View>
        ) : null}

        {method === "qrImage" ? (
          <View style={{ gap: 8 }}>
            <Text style={styles.label}>Paste QR image URL</Text>
            <TextInput value={imgUrl} onChangeText={setImgUrl} placeholder="https://.../qr.png" autoCapitalize="none" style={styles.input} testID="qr-image-url" />
            <HSButton
              title="Decode"
              onPress={async () => {
                setProcessing(true);
                const decoded = await decodeQrFromImageUrl(imgUrl.trim());
                setProcessing(false);
                if (!decoded) {
                  setError("Could not decode QR image");
                  return;
                }
                setError(null);
                const match = decoded.match(/^(T[\w]+)(?:\?amount=(\d+(?:\.\d+)?))?/);
                if (match) {
                  setToAddr(match[1]);
                  if (match[2]) setAmountStr(match[2]);
                  setMethod("text");
                } else {
                  setError("QR did not contain a TRON address");
                }
              }}
              variant="secondary"
            />
          </View>
        ) : null}

        {method === "qr" ? (
          <View style={{ gap: 8 }}>
            <Text style={styles.label}>Scan a QR code with TRON address</Text>
            <HSButton title="Open scanner" variant="secondary" onPress={() => Alert.alert("Scanner", "Use the built-in scanner in the next version. For now, use QR Image or Voice/Text.")} />
          </View>
        ) : null}
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

      {lastTxId ? (
        <View style={styles.hashCard} testID="txid-card">
          <Text style={styles.hashTitle}>Transaction broadcasted</Text>
          <Text style={styles.hashValue} numberOfLines={1} ellipsizeMode="middle">
            {lastTxId}
          </Text>
          <HSButton
            title="View on Tronscan"
            onPress={openInExplorer}
            variant="secondary"
            leftIcon={<ExternalLink color={Colors.brand.red} size={16} />}
            testID="view-tronscan"
            style={{ marginTop: 8 }}
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
    shadowColor: "#00000022",
    shadowOpacity: 0.08,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
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
  hashCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.brand.border,
    padding: 16,
  },
  hashTitle: { fontSize: 14, fontWeight: "800" as const, color: Colors.brand.ink },
  hashValue: { marginTop: 4, color: Colors.brand.inkMuted },
  error: { color: Colors.brand.red, fontWeight: "700" as const },
  input: { borderWidth: 1, borderColor: Colors.brand.border, borderRadius: 10, padding: 12 },
  methodRow: { flexDirection: "row", gap: 8, marginBottom: 12 },
  methodBtn: { flex: 1 },
});