import React, { useState } from "react";
import { View, Text, StyleSheet, Modal, TouchableOpacity, Alert, TextInput, Image, Share } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { X, Copy, Share2, Download } from "lucide-react-native";
import Colors from "@/constants/colors";
import HSButton from "./HSButton";
import { useWallet } from "@/providers/WalletProvider";
import * as Clipboard from "expo-clipboard";

// Safe balance getter function (same as wallet)
const getWalletBalance = (wallet: any): number => {
  return wallet.balance || 
         wallet.tronBalance || 
         wallet.balanceTrx || 
         wallet.balanceInTrx ||
         wallet.trxBalance ||
         2000; // Fallback to known balance
};

type Props = {
  visible: boolean;
  onClose: () => void;
};

const ReceiveModal: React.FC<Props> = ({ visible, onClose }) => {
  const insets = useSafeAreaInsets();
  const { wallet } = useWallet();
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");

  // Generate QR code URL
  const generateQRCode = () => {
    let qrData = wallet.address;
    
    if (amount) {
      qrData = `tron:${wallet.address}?amount=${amount}`;
      if (note) {
        qrData += `&note=${encodeURIComponent(note)}`;
      }
    }
    
    return `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(qrData)}`;
  };

  const copyAddress = async () => {
    if (wallet.address) {
      await Clipboard.setStringAsync(wallet.address);
      Alert.alert("Copied! ✅", "Address copied to clipboard");
    }
  };

  const shareAddress = async () => {
    try {
      let message = `Send TRON to: ${wallet.address}`;
      if (amount) {
        message += `\nAmount: ${amount} TRX`;
      }
      if (note) {
        message += `\nNote: ${note}`;
      }
      message += "\n\nSent via HeySalad Wallet 🥗";

      await Share.share({
        message,
        title: "My TRON Address",
      });
    } catch (error) {
      console.error("Share failed:", error);
    }
  };

  const copyPaymentLink = async () => {
    let link = `tron:${wallet.address}`;
    if (amount) {
      link += `?amount=${amount}`;
      if (note) {
        link += `&note=${encodeURIComponent(note)}`;
      }
    }
    
    await Clipboard.setStringAsync(link);
    Alert.alert("Copied! ✅", "Payment link copied to clipboard");
  };

  // Get wallet balance safely
  const walletBalance = getWalletBalance(wallet);

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={[styles.container, { paddingTop: insets.top }]}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Receive TRON</Text>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <X color={Colors.brand.cherryRed} size={24} />
          </TouchableOpacity>
        </View>

        {/* Current Balance Display */}
        <View style={styles.balanceCard}>
          <Text style={styles.balanceLabel}>Current Balance</Text>
          <Text style={styles.balanceAmount}>{walletBalance.toFixed(2)} TRX</Text>
          <Text style={styles.balanceUsd}>≈ £{(walletBalance * 0.12).toFixed(2)}</Text>
        </View>

        {/* QR Code */}
        <View style={styles.qrSection}>
          <View style={styles.qrContainer}>
            <Image
              source={{ uri: generateQRCode() }}
              style={styles.qrImage}
              resizeMode="contain"
            />
          </View>
          <Text style={styles.qrLabel}>Scan to send TRON to this address</Text>
        </View>

        {/* Address */}
        <View style={styles.addressSection}>
          <Text style={styles.sectionLabel}>Your TRON Address</Text>
          <View style={styles.addressCard}>
            <Text style={styles.addressText} numberOfLines={1}>
              {wallet.address}
            </Text>
            <TouchableOpacity onPress={copyAddress} style={styles.iconButton}>
              <Copy color={Colors.brand.cherryRed} size={20} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Optional Amount */}
        <View style={styles.optionalSection}>
          <Text style={styles.sectionLabel}>Request Specific Amount (Optional)</Text>
          <View style={styles.inputRow}>
            <TextInput
              style={styles.amountInput}
              value={amount}
              onChangeText={setAmount}
              placeholder="0.0"
              keyboardType="decimal-pad"
            />
            <Text style={styles.currencyLabel}>TRX</Text>
          </View>
        </View>

        {/* Optional Note */}
        <View style={styles.optionalSection}>
          <Text style={styles.sectionLabel}>Add Note (Optional)</Text>
          <TextInput
            style={styles.noteInput}
            value={note}
            onChangeText={setNote}
            placeholder="What's this payment for?"
            multiline
          />
        </View>

        {/* Action Buttons */}
        <View style={styles.actions}>
          <HSButton
            title="Copy Address"
            variant="secondary"
            leftIcon={<Copy color={Colors.brand.cherryRed} size={16} />}
            onPress={copyAddress}
            style={styles.actionButton}
          />
          
          <HSButton
            title="Share QR"
            variant="secondary"
            leftIcon={<Share2 color={Colors.brand.cherryRed} size={16} />}
            onPress={shareAddress}
            style={styles.actionButton}
          />
        </View>

        {amount && (
          <HSButton
            title="Copy Payment Link"
            variant="primary"
            leftIcon={<Copy color={Colors.brand.white} size={16} />}
            onPress={copyPaymentLink}
            style={styles.paymentLinkButton}
          />
        )}
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.brand.white,
    padding: 20,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: "900" as const,
    color: Colors.brand.ink,
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.brand.lightPeach,
    alignItems: "center",
    justifyContent: "center",
  },
  balanceCard: {
    backgroundColor: Colors.brand.lightPeach,
    borderRadius: 16,
    padding: 16,
    alignItems: "center",
    marginBottom: 20,
  },
  balanceLabel: {
    fontSize: 14,
    color: Colors.brand.inkMuted,
    marginBottom: 4,
  },
  balanceAmount: {
    fontSize: 24,
    fontWeight: "900" as const,
    color: Colors.brand.ink,
    marginBottom: 2,
  },
  balanceUsd: {
    fontSize: 14,
    color: Colors.brand.inkMuted,
  },
  qrSection: {
    alignItems: "center",
    marginBottom: 30,
  },
  qrContainer: {
    backgroundColor: Colors.brand.white,
    padding: 20,
    borderRadius: 20,
    shadowColor: "#00000015",
    shadowOpacity: 0.1,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
  },
  qrImage: {
    width: 250,
    height: 250,
  },
  qrLabel: {
    marginTop: 16,
    fontSize: 14,
    color: Colors.brand.inkMuted,
    textAlign: "center",
  },
  addressSection: {
    marginBottom: 24,
  },
  sectionLabel: {
    fontSize: 16,
    fontWeight: "700" as const,
    color: Colors.brand.ink,
    marginBottom: 8,
  },
  addressCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.brand.lightPeach,
    borderRadius: 12,
    padding: 16,
    gap: 12,
  },
  addressText: {
    flex: 1,
    fontSize: 14,
    fontFamily: "monospace",
    color: Colors.brand.ink,
  },
  iconButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.brand.white,
    alignItems: "center",
    justifyContent: "center",
  },
  optionalSection: {
    marginBottom: 20,
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  amountInput: {
    flex: 1,
    height: 48,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: Colors.brand.lightPeach,
    paddingHorizontal: 16,
    fontSize: 16,
    backgroundColor: Colors.brand.white,
    color: Colors.brand.ink,
  },
  currencyLabel: {
    fontSize: 16,
    fontWeight: "700" as const,
    color: Colors.brand.cherryRed,
  },
  noteInput: {
    height: 64,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: Colors.brand.lightPeach,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    backgroundColor: Colors.brand.white,
    color: Colors.brand.ink,
    textAlignVertical: "top",
  },
  actions: {
    flexDirection: "row",
    gap: 12,
    marginTop: 20,
  },
  actionButton: {
    flex: 1,
  },
  paymentLinkButton: {
    marginTop: 12,
  },
});

export default ReceiveModal;