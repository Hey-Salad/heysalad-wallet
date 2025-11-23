import React, { useCallback, useMemo, useState } from "react";
import { View, Text, StyleSheet, Alert, ScrollView, Image, Linking, Platform, TextInput, Dimensions } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { CameraView, useCameraPermissions } from 'expo-camera';
import Colors from "@/constants/colors";
import AudioPay from "@/components/AudioPay";
import HSButton from "@/components/HSButton";
import { useWallet } from "@/providers/WalletProvider";
import { parseVoiceToIntent } from "@/features/voice/intent";
import { Stack, router } from "expo-router";
import { Check, ExternalLink, QrCode, Keyboard, ArrowLeft, X, Headphones, Nfc, MonitorSmartphone } from "lucide-react-native";

const { width, height } = Dimensions.get('window');

// Safe balance getter function
const getWalletBalance = (wallet: any): number => {
  // Use wallet.balance (primary source from WalletProvider)
  // Fallback to 0 if no balance is set
  return wallet.balance ?? wallet.tronBalance ?? 0;
};

// Define proper response type for sendTrx based on your backend
interface SendTrxResponse {
  result?: boolean;
  txid?: string;
  explorerUrl?: string;
  Error?: string;
  [key: string]: any; // Allow other properties
}

type PendingIntent = {
  rawText: string;
  amountTrx: number;
  toName?: string;
  address?: string;
  note?: string;
  category: "groceries" | "restaurants" | "farmers_market" | "delivery" | "other" | "sustainable";
  sustainable: boolean;
};

type PayMethod = "audio" | "text" | "qr";
type PayStep = "method" | "input" | "review" | "success";

export default function PayScreen() {
  const insets = useSafeAreaInsets();
  const { send, wallet, refreshBalance } = useWallet();
  const [step, setStep] = useState<PayStep>("method");
  const [method, setMethod] = useState<PayMethod>("audio");
  const [intent, setIntent] = useState<PendingIntent | null>(null);
  const [toAddr, setToAddr] = useState<string>("");
  const [amountStr, setAmountStr] = useState<string>("");
  const [processing, setProcessing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [lastTxId, setLastTxId] = useState<string | null>(null);
  const [scanned, setScanned] = useState(false);
  const [permission, requestPermission] = useCameraPermissions();

  // Get wallet balance safely
  const walletBalance = getWalletBalance(wallet);

  const balance = useMemo(() => {
    const trxBalance = walletBalance;
    const usdBalance = trxBalance * 0.12; // Approximate USD conversion
    return { trx: trxBalance, usd: usdBalance };
  }, [walletBalance]);

  const onTranscript = useCallback(async (text: string) => {
    try {
      const parsed = await parseVoiceToIntent(text);
      if (!parsed) {
        setError("Sorry, I couldn't understand. Try: 'Send 5 TRX to TLyqzVGLV1srkB7dToTAEqgDSfPtXRJZYH'.");
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
      setStep("review");
    } catch (error) {
      setError("Voice recognition failed. Please try manual entry.");
    }
  }, []);

  const confirmFromText = useCallback(() => {
    const amt = parseFloat(amountStr);
    if (!toAddr || !isFinite(amt) || amt <= 0) {
      setError("Enter a valid TRON address and amount");
      return;
    }

    // Validate TRON address format
    if (!toAddr.startsWith('T') || toAddr.length < 30) {
      setError("Invalid TRON address format");
      return;
    }

    // Check if user has enough balance
    if (amt > balance.trx) {
      setError(`Insufficient balance. You have ${balance.trx.toFixed(2)} TRX`);
      return;
    }

    const p: PendingIntent = { 
      rawText: `Send ${amt} TRX to ${toAddr}`, 
      amountTrx: amt, 
      address: toAddr, 
      category: "other", 
      sustainable: false 
    };
    setIntent(p);
    setStep("review");
  }, [toAddr, amountStr, balance.trx]);

  // Handle QR Code scanning
  const handleBarCodeScanned = ({ data }: { data: string }) => {
    if (scanned) return;
    
    setScanned(true);
    console.log('QR Code scanned:', data);
    
    let address = "";
    let amount = "";
    
    try {
      const parsed = JSON.parse(data);
      if (parsed.address) {
        address = parsed.address;
        amount = parsed.amount || "";
      }
    } catch {
      if (data.startsWith("tron:")) {
        const match = data.match(/tron:([T][A-Za-z0-9]+)(?:\?(.+))?/);
        if (match) {
          address = match[1];
          if (match[2]) {
            const params = new URLSearchParams(match[2]);
            amount = params.get('amount') || "";
          }
        }
      } else if (data.startsWith("T") && data.length >= 30) {
        address = data.trim();
      }
    }
    
    if (address && address.startsWith("T") && address.length >= 30) {
      setToAddr(address);
      if (amount) setAmountStr(amount);
      
      Alert.alert(
        "QR Code Scanned! ✅",
        `Address: ${address.slice(0, 8)}...${address.slice(-6)}${amount ? `\nAmount: ${amount} TRX` : ""}`,
        [
          {
            text: "Continue",
            onPress: () => {
              setMethod("text");
              setStep("input");
            }
          },
          {
            text: "Scan Again",
            onPress: () => setScanned(false)
          }
        ]
      );
    } else {
      Alert.alert(
        "Invalid QR Code",
        "This QR code doesn't contain a valid TRON address. Please try again.",
        [
          {
            text: "Try Again",
            onPress: () => setScanned(false)
          },
          {
            text: "Manual Entry",
            onPress: () => {
              setMethod("text");
              setStep("input");
            }
          }
        ]
      );
    }
  };

  const handleQrScan = async () => {
    if (!permission) return;

    if (!permission.granted) {
      const result = await requestPermission();
      if (!result.granted) {
        Alert.alert(
          "Camera Permission Required",
          "Please enable camera access to scan QR codes",
          [
            { text: "Cancel" },
            { 
              text: "Settings", 
              onPress: () => {
                if (Platform.OS === 'ios') {
                  Linking.openURL('app-settings:');
                } else {
                  Linking.openSettings();
                }
              }
            }
          ]
        );
        return;
      }
    }

    setMethod("qr");
    setStep("input");
    setScanned(false);
    setError(null);
  };

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

      // Final balance check
      if (intent.amountTrx > balance.trx) {
        setError(`Insufficient balance. You have ${balance.trx.toFixed(2)} TRX`);
        setProcessing(false);
        return;
      }

      console.log('[Pay] Sending transaction:', {
        to,
        amount: intent.amountTrx,
        from: wallet.address
      });

      // Send using wallet provider function - expect your backend response format
      const result = await send(to, intent.amountTrx) as SendTrxResponse;
      
      console.log('[Pay] Transaction result:', result);
      
      // Handle your backend response format
      if (result.result === true || result.txid) {
        // Extract transaction ID from your backend response
        const txid = result.txid;
        if (txid) {
          setLastTxId(txid);
          console.log('[Pay] Transaction ID:', txid);
        }
        
        // Refresh balance
        await refreshBalance();
        
        setStep("success");
      } else {
        // Handle error from your backend
        const errorMsg = result.Error || "Transaction failed";
        throw new Error(errorMsg);
      }
    } catch (e: any) {
      console.error('[Pay] Transaction failed:', e);
      const errorMsg = e.message || "Payment failed. Please try again.";
      setError(errorMsg);
    } finally {
      setProcessing(false);
    }
  }, [intent, send, wallet.address, balance.trx, refreshBalance]);

  const reset = () => {
    setStep("method");
    setIntent(null);
    setError(null);
    setLastTxId(null);
    setToAddr("");
    setAmountStr("");
    setScanned(false);
  };

  const explorerBase = useMemo(() => {
    const env = process.env.EXPO_PUBLIC_TRONGRID_URL ?? "https://nile.trongrid.io";
    return env.includes("nile") || env.includes("shasta")
      ? "https://nile.tronscan.org/#/transaction/"
      : "https://tronscan.org/#/transaction/";
  }, []);

  const openInExplorer = useCallback(async () => {
    if (!lastTxId) return;
    const url = `${explorerBase}${lastTxId}`;
    
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

  const renderMethodSelection = () => (
    <View style={styles.stepContainer}>
      <View style={styles.logoContainer}>
        <Image
          source={require("@/assets/images/HeySalad_black_logo.png")}
          style={styles.payLogo}
          resizeMode="contain"
        />
      </View>
      <Text style={styles.stepSubtitle}>Choose your preferred payment method</Text>

      <View style={styles.methodGrid}>
        <HSButton
          title="NFC Card"
          variant="primary"
          leftIcon={<Nfc color={Colors.brand.white} size={20} />}
          onPress={() => router.push('/pay/nfc-card')}
          style={styles.methodCard}
        />

        <HSButton
          title="Terminals"
          variant="primary"
          leftIcon={<MonitorSmartphone color={Colors.brand.white} size={20} />}
          onPress={() => router.push('/pay/terminals')}
          style={styles.methodCard}
        />

        <HSButton
          title="Audio Pay"
          variant="primary"
          leftIcon={<Headphones color={Colors.brand.white} size={22} />}
          onPress={() => {
            setMethod("audio");
            setStep("input");
          }}
          style={{...styles.methodCard, ...styles.audioPayCard}}
        />

        <HSButton
          title="Scan QR Code"
          variant="primary"
          leftIcon={<QrCode color={Colors.brand.white} size={20} />}
          onPress={handleQrScan}
          style={styles.methodCard}
        />

        <HSButton
          title="Manual Entry"
          variant="secondary"
          leftIcon={<Keyboard color={Colors.brand.cherryRed} size={20} />}
          onPress={() => {
            setMethod("text");
            setStep("input");
          }}
          style={styles.methodCard}
        />
      </View>
    </View>
  );

  const renderInput = () => (
    <View style={styles.stepContainer}>
      <View style={styles.stepHeader}>
        <HSButton
          title=""
          leftIcon={<ArrowLeft color={Colors.brand.cherryRed} size={20} />}
          onPress={() => setStep("method")}
          variant="ghost"
          style={styles.backButton}
        />
        <Text style={styles.stepTitle}>
          {method === "audio" ? "Audio Payment" : 
           method === "qr" ? "Scan QR Code" : "Enter Details"}
        </Text>
        {method === "qr" && (
          <HSButton
            title=""
            leftIcon={<X color={Colors.brand.cherryRed} size={20} />}
            onPress={() => setStep("method")}
            variant="ghost"
            style={styles.closeButton}
          />
        )}
      </View>

      {method === "audio" && (
        <View style={styles.audioContainer}>
          <AudioPay 
            onTranscript={onTranscript}
            currentBalance={balance.trx}
            onCancel={() => setStep("method")}
          />
        </View>
      )}

      {method === "qr" && (
        <View style={styles.qrContainer}>
          <View style={styles.cameraContainer}>
            <CameraView
              style={styles.camera}
              facing="back"
              onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
            >
              <View style={styles.qrOverlay}>
                <View style={styles.qrFrame}>
                  <View style={styles.qrCorner} />
                  <View style={[styles.qrCorner, styles.qrCornerTR]} />
                  <View style={[styles.qrCorner, styles.qrCornerBL]} />
                  <View style={[styles.qrCorner, styles.qrCornerBR]} />
                </View>
                
                <View style={styles.qrInstructions}>
                  <Text style={styles.qrText}>
                    {scanned ? "QR Code Detected!" : "Point camera at QR code"}
                  </Text>
                  <Text style={styles.qrSubtext}>
                    Make sure the QR code contains a TRON address
                  </Text>
                </View>
                
                {scanned && (
                  <HSButton
                    title="Scan Again"
                    onPress={() => setScanned(false)}
                    variant="secondary"
                    style={styles.scanAgainButton}
                  />
                )}
              </View>
            </CameraView>
          </View>
          
          <View style={styles.qrActions}>
            <HSButton
              title="Switch to Manual Entry"
              onPress={() => {
                setMethod("text");
              }}
              variant="ghost"
              style={styles.manualEntryButton}
            />
          </View>
        </View>
      )}

      {method === "text" && (
        <View style={styles.textInputContainer}>
          {/* Balance Info */}
          <View style={styles.balanceInfo}>
            <Text style={styles.balanceText}>Available: {balance.trx.toFixed(2)} TRX</Text>
            <Text style={styles.balanceGBP}>≈ £{balance.usd.toFixed(2)}</Text>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Recipient Address</Text>
            <TextInput
              value={toAddr}
              onChangeText={setToAddr}
              placeholder="T... (TRON address)"
              autoCapitalize="none"
              style={styles.textInput}
              testID="to-address"
            />
            <Text style={styles.inputHelp}>Test address: TLyqzVGLV1srkB7dToTAEqgDSfPtXRJZYH</Text>
          </View>
          
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Amount (TRX)</Text>
            <TextInput
              value={amountStr}
              onChangeText={setAmountStr}
              placeholder="0.0"
              keyboardType="decimal-pad"
              style={styles.textInput}
              testID="amount-input"
            />
            <View style={styles.quickAmounts}>
              <HSButton title="1" onPress={() => setAmountStr("1")} variant="ghost" style={styles.quickAmount} />
              <HSButton title="10" onPress={() => setAmountStr("10")} variant="ghost" style={styles.quickAmount} />
              <HSButton title="100" onPress={() => setAmountStr("100")} variant="ghost" style={styles.quickAmount} />
              <HSButton title="Max" onPress={() => setAmountStr(balance.trx.toString())} variant="ghost" style={styles.quickAmount} />
            </View>
          </View>
          
          <HSButton 
            title="Review Payment" 
            onPress={confirmFromText} 
            variant="primary"
            style={styles.reviewButton}
          />
        </View>
      )}
      
      {error && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}
    </View>
  );

  const renderReview = () => (
    <View style={styles.stepContainer}>
      <View style={styles.stepHeader}>
        <HSButton
          title=""
          leftIcon={<ArrowLeft color={Colors.brand.cherryRed} size={20} />}
          onPress={() => setStep("input")}
          variant="ghost"
          style={styles.backButton}
        />
        <Text style={styles.stepTitle}>Review Payment</Text>
      </View>

      <View style={styles.reviewCard}>
        <Text style={styles.reviewTitle}>Payment Details</Text>
        
        <View style={styles.reviewRow}>
          <Text style={styles.reviewLabel}>Amount</Text>
          <Text style={styles.reviewValue}>{intent?.amountTrx} TRX</Text>
        </View>

        <View style={styles.reviewRow}>
          <Text style={styles.reviewLabel}>Amount (GBP)</Text>
          <Text style={styles.reviewValue}>£{((intent?.amountTrx || 0) * 0.12).toFixed(2)}</Text>
        </View>
        
        <View style={styles.reviewRow}>
          <Text style={styles.reviewLabel}>To</Text>
          <Text style={styles.reviewValue} numberOfLines={1}>
            {intent?.toName ? `@${intent.toName}` : intent?.address ? `${intent.address.slice(0, 8)}...${intent.address.slice(-6)}` : "Unknown"}
          </Text>
        </View>

        <View style={styles.reviewRow}>
          <Text style={styles.reviewLabel}>From</Text>
          <Text style={styles.reviewValue} numberOfLines={1}>
            {wallet.address ? `${wallet.address.slice(0, 8)}...${wallet.address.slice(-6)}` : "Your wallet"}
          </Text>
        </View>

        <View style={styles.reviewRow}>
          <Text style={styles.reviewLabel}>New Balance</Text>
          <Text style={styles.reviewValue}>
            {(balance.trx - (intent?.amountTrx ?? 0)).toFixed(2)} TRX
          </Text>
        </View>
        
        {intent?.note && (
          <View style={styles.reviewRow}>
            <Text style={styles.reviewLabel}>Note</Text>
            <Text style={styles.reviewValue}>{intent.note}</Text>
          </View>
        )}
      </View>

      {/* Security Warning */}
      <View style={styles.warningCard}>
        <Text style={styles.warningTitle}>⚠️ Important</Text>
        <Text style={styles.warningText}>
          Double-check the recipient address. Blockchain transactions cannot be reversed.
        </Text>
      </View>

      <View style={styles.confirmContainer}>
        <HSButton
          title={processing ? "Sending..." : "Confirm with Biometric"}
          onPress={onConfirm}
          loading={processing}
          leftIcon={processing ? undefined : <Check color={Colors.brand.white} size={16} />}
          variant="primary"
          style={styles.confirmButton}
        />
      </View>
    </View>
  );

  const renderSuccess = () => (
    <View style={styles.stepContainer}>
      <View style={styles.successContainer}>
        <View style={styles.successIcon}>
          <Check color={Colors.brand.cherryRed} size={48} />
        </View>
        
        <Text style={styles.successTitle}>Payment Sent! 🎉</Text>
        <Text style={styles.successSubtitle}>
          Your payment of {intent?.amountTrx} TRX has been sent successfully
        </Text>
        
        {lastTxId && (
          <View style={styles.txContainer}>
            <Text style={styles.txLabel}>Transaction ID</Text>
            <Text style={styles.txValue} numberOfLines={1} ellipsizeMode="middle">
              {lastTxId}
            </Text>
            <HSButton
              title="View on Explorer"
              onPress={openInExplorer}
              variant="secondary"
              leftIcon={<ExternalLink color={Colors.brand.cherryRed} size={16} />}
              style={styles.explorerButton}
            />
          </View>
        )}
        
        <HSButton
          title="Make Another Payment"
          onPress={reset}
          variant="primary"
          style={styles.anotherButton}
        />
      </View>
    </View>
  );

  return (
    <View style={[styles.container, { paddingTop: insets.top }]} testID="pay-screen">
      <Stack.Screen
        options={{
          headerShown: false,
        }}
      />
      
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {step === "method" && renderMethodSelection()}
        {step === "input" && renderInput()}
        {step === "review" && renderReview()}
        {step === "success" && renderSuccess()}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.brand.white,
  },
  scrollContent: {
    flexGrow: 1,
    padding: 20,
  },
  stepContainer: {
    flex: 1,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 16,
    marginTop: 20,
  },
  payLogo: {
    height: 40,
    width: 200,
  },
  stepHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 24,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginLeft: 12,
  },
  stepTitle: {
    fontSize: 24,
    fontWeight: "900" as const,
    color: Colors.brand.ink,
    flex: 1,
  },
  stepSubtitle: {
    fontSize: 16,
    color: Colors.brand.inkMuted,
    marginBottom: 32,
    textAlign: "center",
  },
  methodGrid: {
    gap: 16,
  },
  methodCard: {
    height: 80,
    justifyContent: "center",
    backgroundColor: Colors.brand.cherryRed,
  },
  audioPayCard: {
    backgroundColor: '#ed4c4c', // Same cherry red as other buttons
    shadowColor: '#ed4c4c',
    shadowOpacity: 0.3,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 8,
  },
  audioContainer: {
    alignItems: "center",
    gap: 24,
    width: "100%",
  },
  qrContainer: {
    flex: 1,
    gap: 20,
  },
  cameraContainer: {
    borderRadius: 20,
    overflow: "hidden",
    height: height * 0.6,
    backgroundColor: "#000",
  },
  camera: {
    flex: 1,
  },
  qrOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    alignItems: "center",
    justifyContent: "center",
    gap: 40,
  },
  qrFrame: {
    width: 250,
    height: 250,
    position: "relative",
  },
  qrCorner: {
    position: "absolute",
    width: 30,
    height: 30,
    borderWidth: 4,
    borderColor: Colors.brand.cherryRed,
    top: 0,
    left: 0,
    borderRightWidth: 0,
    borderBottomWidth: 0,
  },
  qrCornerTR: {
    top: 0,
    right: 0,
    left: "auto",
    borderLeftWidth: 0,
    borderRightWidth: 4,
    borderBottomWidth: 0,
  },
  qrCornerBL: {
    bottom: 0,
    left: 0,
    top: "auto",
    borderRightWidth: 0,
    borderTopWidth: 0,
    borderBottomWidth: 4,
  },
  qrCornerBR: {
    bottom: 0,
    right: 0,
    top: "auto",
    left: "auto",
    borderLeftWidth: 0,
    borderTopWidth: 0,
    borderRightWidth: 4,
    borderBottomWidth: 4,
  },
  qrInstructions: {
    alignItems: "center",
    gap: 8,
  },
  qrText: {
    color: Colors.brand.white,
    fontSize: 18,
    fontWeight: "700" as const,
    textAlign: "center",
  },
  qrSubtext: {
    color: "rgba(255,255,255,0.8)",
    fontSize: 14,
    textAlign: "center",
  },
  scanAgainButton: {
    backgroundColor: "rgba(255,255,255,0.2)",
    borderColor: Colors.brand.white,
  },
  qrActions: {
    alignItems: "center",
  },
  manualEntryButton: {
    paddingHorizontal: 32,
  },
  textInputContainer: {
    gap: 24,
  },
  balanceInfo: {
    backgroundColor: Colors.brand.lightPeach,
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
  },
  balanceText: {
    fontSize: 18,
    fontWeight: "700" as const,
    color: Colors.brand.ink,
  },
  balanceGBP: {
    fontSize: 14,
    color: Colors.brand.inkMuted,
    marginTop: 4,
  },
  inputGroup: {
    gap: 8,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: "700" as const,
    color: Colors.brand.ink,
  },
  inputHelp: {
    fontSize: 12,
    color: Colors.brand.inkMuted,
    fontStyle: "italic",
  },
  textInput: {
    height: 56,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: Colors.brand.lightPeach,
    paddingHorizontal: 16,
    fontSize: 16,
    backgroundColor: Colors.brand.white,
    color: Colors.brand.ink,
  },
  quickAmounts: {
    flexDirection: "row",
    gap: 8,
    marginTop: 8,
  },
  quickAmount: {
    flex: 1,
    height: 36,
  },
  reviewButton: {
    marginTop: 16,
    backgroundColor: Colors.brand.cherryRed,
  },
  reviewCard: {
    backgroundColor: Colors.brand.white,
    borderRadius: 20,
    padding: 24,
    gap: 16,
    marginBottom: 16,
    shadowColor: "#00000015",
    shadowOpacity: 0.1,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
  },
  reviewTitle: {
    fontSize: 18,
    fontWeight: "900" as const,
    color: Colors.brand.ink,
    marginBottom: 8,
  },
  warningCard: {
    backgroundColor: '#FFF3F0',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderLeftWidth: 4,
    borderLeftColor: Colors.brand.cherryRed,
  },
  warningTitle: {
    fontSize: 14,
    fontWeight: "700" as const,
    color: Colors.brand.ink,
    marginBottom: 4,
  },
  warningText: {
    fontSize: 13,
    color: Colors.brand.ink,
    lineHeight: 18,
  },
  confirmContainer: {
    marginTop: 8,
  },
  reviewRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 8,
  },
  reviewLabel: {
    fontSize: 16,
    color: Colors.brand.inkMuted,
  },
  reviewValue: {
    fontSize: 16,
    fontWeight: "700" as const,
    color: Colors.brand.ink,
    flex: 1,
    textAlign: "right",
    marginLeft: 16,
  },
  confirmButton: {
    backgroundColor: Colors.brand.cherryRed,
  },
  successContainer: {
    alignItems: "center",
    gap: 24,
    paddingTop: 40,
  },
  successIcon: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: Colors.brand.white,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 3,
    borderColor: Colors.brand.cherryRed,
  },
  successTitle: {
    fontSize: 28,
    fontWeight: "900" as const,
    color: Colors.brand.ink,
    textAlign: "center",
  },
  successSubtitle: {
    fontSize: 16,
    color: Colors.brand.inkMuted,
    textAlign: "center",
    lineHeight: 24,
  },
  txContainer: {
    backgroundColor: Colors.brand.white,
    borderRadius: 16,
    padding: 20,
    width: "100%",
  },
  txLabel: {
    fontSize: 14,
    fontWeight: "700" as const,
    color: Colors.brand.inkMuted,
    marginBottom: 4,
  },
  txValue: {
    fontSize: 12,
    color: Colors.brand.ink,
    marginBottom: 16,
    fontFamily: "monospace",
  },
  explorerButton: {
    height: 44,
  },
  anotherButton: {
    width: "100%",
    backgroundColor: Colors.brand.cherryRed,
  },
  errorContainer: {
    backgroundColor: '#FEF2F2',
    borderRadius: 12,
    padding: 16,
    marginTop: 16,
    borderLeftWidth: 4,
    borderLeftColor: Colors.brand.cherryRed,
  },
  errorText: {
    color: Colors.brand.cherryRed,
    fontWeight: "600" as const,
    textAlign: "center",
    fontSize: 14,
  },
});