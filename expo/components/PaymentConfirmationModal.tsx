/**
 * Payment Confirmation Modal
 * Displays payment details and handles confirmation flow
 * Requirements: 6.4
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Image,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  X,
  Check,
  CreditCard,
  AlertCircle,
  ExternalLink,
  Clock,
} from 'lucide-react-native';
import Colors from '@/constants/colors';
import {
  web3AgentApi,
  PaymentRequest,
  PaymentDeepLinkParams,
  SupportedChain,
} from '@/services/web3AgentApi';

// =============================================================================
// Types
// =============================================================================

interface PaymentConfirmationModalProps {
  visible: boolean;
  onClose: () => void;
  paymentParams: PaymentDeepLinkParams | null;
  onPaymentComplete?: (paymentId: string, transactionHash: string) => void;
}

// =============================================================================
// Component
// =============================================================================

export default function PaymentConfirmationModal({
  visible,
  onClose,
  paymentParams,
  onPaymentComplete,
}: PaymentConfirmationModalProps) {
  const insets = useSafeAreaInsets();
  
  const [payment, setPayment] = useState<PaymentRequest | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirming, setConfirming] = useState(false);

  // Fetch payment details when params change
  useEffect(() => {
    if (visible && paymentParams?.paymentId) {
      fetchPaymentDetails();
    } else {
      setPayment(null);
      setError(null);
    }
  }, [visible, paymentParams?.paymentId]);

  const fetchPaymentDetails = async () => {
    if (!paymentParams?.paymentId) return;

    setLoading(true);
    setError(null);

    try {
      const response = await web3AgentApi.getPayment(paymentParams.paymentId);
      if (response.success && response.data) {
        setPayment(response.data);
      } else {
        setError(response.error || 'Failed to load payment details');
      }
    } catch (err) {
      setError('Failed to connect to server');
    } finally {
      setLoading(false);
    }
  };

  // Handle payment confirmation
  const handleConfirm = async () => {
    if (!payment) return;

    // In a real implementation, this would:
    // 1. Connect to wallet (WalletConnect or similar)
    // 2. Sign and send the transaction
    // 3. Wait for confirmation
    // 4. Call verifyPayment with the proof

    Alert.alert(
      'Confirm Payment',
      `Send ${payment.amountFormatted} to ${payment.recipient.slice(0, 10)}...?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm',
          onPress: async () => {
            setConfirming(true);
            
            // Simulate transaction (in production, this would be real wallet interaction)
            // For now, we'll show a message about connecting a wallet
            setTimeout(() => {
              setConfirming(false);
              Alert.alert(
                'Wallet Connection Required',
                'To complete this payment, please connect your Web3 wallet (MetaMask, WalletConnect, etc.) to sign the transaction.',
                [
                  { text: 'OK', onPress: onClose },
                ]
              );
            }, 1500);
          },
        },
      ]
    );
  };

  // Handle cancel
  const handleCancel = () => {
    if (paymentParams?.action === 'cancel') {
      Alert.alert(
        'Cancel Payment',
        'Are you sure you want to cancel this payment?',
        [
          { text: 'No', style: 'cancel' },
          { text: 'Yes', onPress: onClose },
        ]
      );
    } else {
      onClose();
    }
  };

  // Get chain display name
  const getChainName = (chain: SupportedChain) => {
    return chain === 'bnb' ? 'BNB Chain' : 'Avalanche';
  };

  // Check if payment is expired
  const isExpired = payment && payment.expiresAt < Date.now();

  // Format time remaining
  const getTimeRemaining = () => {
    if (!payment) return '';
    const remaining = payment.expiresAt - Date.now();
    if (remaining <= 0) return 'Expired';
    const minutes = Math.floor(remaining / 60000);
    const seconds = Math.floor((remaining % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={handleCancel}
    >
      <View style={[styles.container, { paddingTop: insets.top + 20 }]}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Payment Confirmation</Text>
          <TouchableOpacity style={styles.closeButton} onPress={handleCancel}>
            <X size={24} color={Colors.brand.ink} />
          </TouchableOpacity>
        </View>

        {/* Content */}
        <View style={styles.content}>
          {loading ? (
            <View style={styles.centerContent}>
              <ActivityIndicator size="large" color={Colors.brand.cherryRed} />
              <Text style={styles.loadingText}>Loading payment details...</Text>
            </View>
          ) : error ? (
            <View style={styles.centerContent}>
              <AlertCircle size={48} color={Colors.brand.cherryRed} />
              <Text style={styles.errorText}>{error}</Text>
              <TouchableOpacity style={styles.retryButton} onPress={fetchPaymentDetails}>
                <Text style={styles.retryButtonText}>Retry</Text>
              </TouchableOpacity>
            </View>
          ) : payment ? (
            <>
              {/* Payment Status */}
              {payment.status !== 'pending' && (
                <View style={[
                  styles.statusBanner,
                  payment.status === 'completed' && styles.statusCompleted,
                  payment.status === 'failed' && styles.statusFailed,
                  payment.status === 'expired' && styles.statusExpired,
                ]}>
                  {payment.status === 'completed' && <Check size={20} color="#16a34a" />}
                  {payment.status === 'failed' && <X size={20} color="#dc2626" />}
                  {payment.status === 'expired' && <Clock size={20} color="#f59e0b" />}
                  <Text style={[
                    styles.statusText,
                    payment.status === 'completed' && styles.statusTextCompleted,
                    payment.status === 'failed' && styles.statusTextFailed,
                    payment.status === 'expired' && styles.statusTextExpired,
                  ]}>
                    {payment.status === 'completed' && 'Payment Completed'}
                    {payment.status === 'failed' && 'Payment Failed'}
                    {payment.status === 'expired' && 'Payment Expired'}
                  </Text>
                </View>
              )}

              {/* Amount Card */}
              <View style={styles.amountCard}>
                <Text style={styles.amountLabel}>Amount</Text>
                <Text style={styles.amountValue}>{payment.amountFormatted}</Text>
                <View style={styles.chainBadge}>
                  <Text style={styles.chainText}>{getChainName(payment.chain)}</Text>
                </View>
              </View>

              {/* Details */}
              <View style={styles.detailsCard}>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Recipient</Text>
                  <Text style={styles.detailValue} numberOfLines={1}>
                    {payment.recipient.slice(0, 10)}...{payment.recipient.slice(-8)}
                  </Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Description</Text>
                  <Text style={styles.detailValue}>{payment.description}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Asset</Text>
                  <Text style={styles.detailValue}>USDC</Text>
                </View>
                {payment.status === 'pending' && (
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Expires in</Text>
                    <Text style={[
                      styles.detailValue,
                      isExpired && styles.expiredText,
                    ]}>
                      {getTimeRemaining()}
                    </Text>
                  </View>
                )}
                {payment.transactionHash && (
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Transaction</Text>
                    <TouchableOpacity style={styles.txLink}>
                      <Text style={styles.txLinkText}>
                        {payment.transactionHash.slice(0, 10)}...
                      </Text>
                      <ExternalLink size={14} color={Colors.brand.cherryRed} />
                    </TouchableOpacity>
                  </View>
                )}
              </View>

              {/* QR Code */}
              {payment.status === 'pending' && payment.qrCode?.dataUrl && (
                <View style={styles.qrContainer}>
                  <Text style={styles.qrLabel}>Scan to pay</Text>
                  <Image
                    source={{ uri: payment.qrCode.dataUrl }}
                    style={styles.qrCode}
                    resizeMode="contain"
                  />
                </View>
              )}

              {/* Action Buttons */}
              {payment.status === 'pending' && !isExpired && (
                <View style={styles.actions}>
                  <TouchableOpacity
                    style={styles.cancelButton}
                    onPress={handleCancel}
                  >
                    <Text style={styles.cancelButtonText}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.confirmButton, confirming && styles.confirmButtonDisabled]}
                    onPress={handleConfirm}
                    disabled={confirming}
                  >
                    {confirming ? (
                      <ActivityIndicator size="small" color={Colors.brand.white} />
                    ) : (
                      <>
                        <CreditCard size={20} color={Colors.brand.white} />
                        <Text style={styles.confirmButtonText}>Pay Now</Text>
                      </>
                    )}
                  </TouchableOpacity>
                </View>
              )}

              {/* Close button for completed/failed/expired */}
              {payment.status !== 'pending' && (
                <TouchableOpacity style={styles.doneButton} onPress={onClose}>
                  <Text style={styles.doneButtonText}>Done</Text>
                </TouchableOpacity>
              )}
            </>
          ) : null}
        </View>
      </View>
    </Modal>
  );
}

// =============================================================================
// Styles
// =============================================================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.brand.white,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.brand.border,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.brand.ink,
  },
  closeButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  centerContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
  },
  loadingText: {
    fontSize: 16,
    color: Colors.brand.inkMuted,
  },
  errorText: {
    fontSize: 16,
    color: Colors.brand.ink,
    textAlign: 'center',
  },
  retryButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: Colors.brand.cherryRed,
    borderRadius: 24,
  },
  retryButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.brand.white,
  },
  statusBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: 12,
    borderRadius: 12,
    marginBottom: 20,
  },
  statusCompleted: {
    backgroundColor: '#dcfce7',
  },
  statusFailed: {
    backgroundColor: '#fef2f2',
  },
  statusExpired: {
    backgroundColor: '#fffbeb',
  },
  statusText: {
    fontSize: 14,
    fontWeight: '600',
  },
  statusTextCompleted: {
    color: '#16a34a',
  },
  statusTextFailed: {
    color: '#dc2626',
  },
  statusTextExpired: {
    color: '#f59e0b',
  },
  amountCard: {
    alignItems: 'center',
    padding: 24,
    backgroundColor: '#F5F5F5',
    borderRadius: 16,
    marginBottom: 20,
  },
  amountLabel: {
    fontSize: 14,
    color: Colors.brand.inkMuted,
    marginBottom: 8,
  },
  amountValue: {
    fontSize: 36,
    fontWeight: '700',
    color: Colors.brand.ink,
  },
  chainBadge: {
    marginTop: 12,
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: Colors.brand.lightPeach,
    borderRadius: 20,
  },
  chainText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.brand.cherryRed,
  },
  detailsCard: {
    backgroundColor: '#F5F5F5',
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: Colors.brand.border,
  },
  detailLabel: {
    fontSize: 14,
    color: Colors.brand.inkMuted,
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.brand.ink,
    maxWidth: '60%',
    textAlign: 'right',
  },
  expiredText: {
    color: '#dc2626',
  },
  txLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  txLinkText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.brand.cherryRed,
  },
  qrContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  qrLabel: {
    fontSize: 14,
    color: Colors.brand.inkMuted,
    marginBottom: 12,
  },
  qrCode: {
    width: 180,
    height: 180,
    borderRadius: 12,
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 'auto',
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: Colors.brand.border,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.brand.ink,
  },
  confirmButton: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
    borderRadius: 16,
    backgroundColor: Colors.brand.cherryRed,
  },
  confirmButtonDisabled: {
    backgroundColor: Colors.brand.inkMuted,
  },
  confirmButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.brand.white,
  },
  doneButton: {
    paddingVertical: 16,
    borderRadius: 16,
    backgroundColor: Colors.brand.cherryRed,
    alignItems: 'center',
    marginTop: 'auto',
  },
  doneButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.brand.white,
  },
});
