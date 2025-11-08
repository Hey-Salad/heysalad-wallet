// components/TransactionReview.tsx
// Industry-standard transaction review screen
// Shows transaction details before biometric confirmation

import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import HSButton from '@/components/HSButton';
import Colors from '@/constants/colors';
import { AlertCircle, ArrowRight } from 'lucide-react-native';

interface TransactionReviewProps {
  from: string;
  to: string;
  amount: number;
  token: string;
  feeEstimate?: number;
  onConfirm: () => void;
  onCancel: () => void;
}

// Helper to shorten addresses
const shortAddr = (addr: string) => {
  if (!addr || addr.length < 10) return addr;
  return `${addr.slice(0, 8)}...${addr.slice(-6)}`;
};

export default function TransactionReview({
  from,
  to,
  amount,
  token = 'TRX',
  feeEstimate = 0,
  onConfirm,
  onCancel,
}: TransactionReviewProps) {
  const insets = useSafeAreaInsets();
  const total = amount + feeEstimate;

  return (
    <ScrollView
      style={[styles.container, { paddingTop: insets.top }]}
      contentContainerStyle={{ paddingBottom: insets.bottom + 40 }}
    >
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Review Transaction</Text>
        <Text style={styles.subtitle}>
          Please verify the details below before confirming
        </Text>
      </View>

      {/* Transaction Details Card */}
      <View style={styles.card}>
        {/* From Section */}
        <View style={styles.section}>
          <Text style={styles.label}>From</Text>
          <View style={styles.addressRow}>
            <View style={styles.addressBox}>
              <Text style={styles.address}>{shortAddr(from)}</Text>
            </View>
          </View>
          <Text style={styles.hint}>Your wallet</Text>
        </View>

        {/* Arrow */}
        <View style={styles.arrowContainer}>
          <ArrowRight color={Colors.brand.cherryRed} size={24} />
        </View>

        {/* To Section */}
        <View style={styles.section}>
          <Text style={styles.label}>To</Text>
          <View style={styles.addressRow}>
            <View style={styles.addressBox}>
              <Text style={styles.address}>{shortAddr(to)}</Text>
            </View>
          </View>
          <Text style={styles.hint}>Recipient address</Text>
        </View>
      </View>

      {/* Amount Card */}
      <View style={styles.card}>
        <View style={styles.amountSection}>
          <Text style={styles.label}>Amount</Text>
          <View style={styles.amountDisplay}>
            <Text style={styles.amountValue}>{amount}</Text>
            <Text style={styles.amountToken}>{token}</Text>
          </View>
        </View>

        {/* Fee Section */}
        {feeEstimate > 0 && (
          <View style={styles.feeSection}>
            <Text style={styles.feeLabel}>Network Fee (estimated)</Text>
            <Text style={styles.feeValue}>~{feeEstimate} {token}</Text>
          </View>
        )}

        {/* Divider */}
        <View style={styles.divider} />

        {/* Total */}
        <View style={styles.totalSection}>
          <Text style={styles.totalLabel}>Total</Text>
          <Text style={styles.totalValue}>
            {total.toFixed(6)} {token}
          </Text>
        </View>
      </View>

      {/* Warning */}
      <View style={styles.warningCard}>
        <AlertCircle color={Colors.brand.cherryRed} size={20} />
        <Text style={styles.warningText}>
          Double-check the recipient address. Transactions cannot be reversed.
        </Text>
      </View>

      {/* Action Buttons */}
      <View style={styles.actions}>
        <HSButton
          title="Cancel"
          onPress={onCancel}
          variant="secondary"
          style={styles.button}
        />
        <HSButton
          title="Confirm with Face ID"
          onPress={onConfirm}
          variant="primary"
          style={styles.button}
        />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.brand.white,
  },
  header: {
    padding: 24,
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: '900' as const,
    color: Colors.brand.ink,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: Colors.brand.inkMuted,
    textAlign: 'center',
  },
  card: {
    backgroundColor: Colors.brand.white,
    borderRadius: 20,
    padding: 20,
    marginHorizontal: 20,
    marginBottom: 16,
    shadowColor: '#00000010',
    shadowOpacity: 0.1,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  section: {
    marginBottom: 16,
  },
  label: {
    fontSize: 12,
    fontWeight: '700' as const,
    color: Colors.brand.inkMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  addressRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  addressBox: {
    flex: 1,
    backgroundColor: Colors.brand.lightPeach,
    borderRadius: 12,
    padding: 12,
  },
  address: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: Colors.brand.ink,
    fontFamily: 'monospace',
  },
  hint: {
    fontSize: 12,
    color: Colors.brand.inkMuted,
    marginTop: 4,
  },
  arrowContainer: {
    alignItems: 'center',
    marginVertical: 8,
  },
  amountSection: {
    alignItems: 'center',
    paddingVertical: 16,
  },
  amountDisplay: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginTop: 8,
  },
  amountValue: {
    fontSize: 48,
    fontWeight: '900' as const,
    color: Colors.brand.ink,
  },
  amountToken: {
    fontSize: 24,
    fontWeight: '700' as const,
    color: Colors.brand.inkMuted,
    marginLeft: 8,
  },
  feeSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
  },
  feeLabel: {
    fontSize: 14,
    color: Colors.brand.inkMuted,
  },
  feeValue: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.brand.ink,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.brand.lightPeach,
    marginVertical: 12,
  },
  totalSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: Colors.brand.ink,
  },
  totalValue: {
    fontSize: 20,
    fontWeight: '900' as const,
    color: Colors.brand.ink,
  },
  warningCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF3F0',
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 20,
    marginBottom: 24,
    gap: 12,
  },
  warningText: {
    flex: 1,
    fontSize: 13,
    color: Colors.brand.ink,
    lineHeight: 18,
  },
  actions: {
    paddingHorizontal: 20,
    gap: 12,
  },
  button: {
    width: '100%',
  },
});
