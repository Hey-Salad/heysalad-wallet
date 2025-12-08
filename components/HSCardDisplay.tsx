/**
 * HSCardDisplay - Card display component for HeySalad Wallet
 * Matches heysalad-pay-mobile card design with remote logos
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Colors from '@/constants/colors';
import { Card } from '@/stores/cardStore';

// Logo URLs - same as heysalad-pay-mobile
const HEYSALAD_LOGO_WHITE = 'https://pay.heysalad.cash/HeySalad%20Logo%20White.png';
const VISA_LOGO_WHITE = 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/5e/Visa_Inc._logo.svg/200px-Visa_Inc._logo.svg.png';

interface HSCardDisplayProps {
  card: Card;
  cardholderName?: string;
  onPress?: () => void;
}

export const HSCardDisplay: React.FC<HSCardDisplayProps> = ({
  card,
  cardholderName,
  onPress,
}) => {
  const isFrozen = card.status === 'inactive';
  const isCanceled = card.status === 'canceled';

  return (
    <TouchableOpacity 
      style={[styles.card, isFrozen && styles.cardFrozen]} 
      onPress={onPress}
      activeOpacity={0.9}
      disabled={!onPress}
    >
      {/* HeySalad Logo - Top Left */}
      <View style={styles.logoTopLeft}>
        <Image
          source={{ uri: HEYSALAD_LOGO_WHITE }}
          style={styles.heysaladLogo}
          resizeMode="contain"
        />
      </View>

      {/* Cardholder Name */}
      {cardholderName && (
        <View style={styles.cardholderContainer}>
          <Text style={styles.cardholderName}>{cardholderName}</Text>
        </View>
      )}

      {/* Card Number (masked) */}
      <View style={styles.cardNumberContainer}>
        <Text style={styles.cardNumber}>•••• •••• •••• {card.last4}</Text>
      </View>

      {/* Expiry */}
      <View style={styles.expiryContainer}>
        <Text style={styles.expiryLabel}>VALID THRU</Text>
        <Text style={styles.expiry}>
          {String(card.exp_month).padStart(2, '0')}/{String(card.exp_year).slice(-2)}
        </Text>
      </View>

      {/* Visa Logo - Bottom Right */}
      <View style={styles.logoBottomRight}>
        <Image
          source={{ uri: VISA_LOGO_WHITE }}
          style={styles.visaLogo}
          resizeMode="contain"
        />
      </View>

      {/* Frozen Overlay */}
      {isFrozen && (
        <View style={styles.frozenOverlay}>
          <Ionicons name="snow" size={32} color="#ffffff" />
          <Text style={styles.frozenText}>FROZEN</Text>
        </View>
      )}

      {/* Canceled Overlay */}
      {isCanceled && (
        <View style={styles.canceledOverlay}>
          <Ionicons name="close-circle" size={32} color="#ffffff" />
          <Text style={styles.frozenText}>CANCELED</Text>
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    width: '100%',
    aspectRatio: 1.586,
    backgroundColor: '#0a0a0a',
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 10,
    position: 'relative',
  },
  cardFrozen: {
    opacity: 0.85,
  },
  logoTopLeft: {
    position: 'absolute',
    top: 20,
    left: 20,
  },
  heysaladLogo: {
    width: 120,
    height: 32,
  },
  cardholderContainer: {
    position: 'absolute',
    bottom: 80,
    left: 20,
  },
  cardholderName: {
    fontSize: 12,
    fontWeight: '600',
    color: '#ffffff',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  cardNumberContainer: {
    position: 'absolute',
    bottom: 55,
    left: 20,
  },
  cardNumber: {
    fontSize: 18,
    fontWeight: '500',
    color: '#ffffff',
    letterSpacing: 2,
  },
  expiryContainer: {
    position: 'absolute',
    bottom: 20,
    left: 20,
  },
  expiryLabel: {
    fontSize: 8,
    color: '#888888',
    marginBottom: 2,
  },
  expiry: {
    fontSize: 14,
    fontWeight: '500',
    color: '#ffffff',
  },
  logoBottomRight: {
    position: 'absolute',
    bottom: 20,
    right: 20,
  },
  visaLogo: {
    width: 60,
    height: 20,
    tintColor: '#ffffff',
  },
  frozenOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(59, 130, 246, 0.8)',
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  canceledOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(220, 38, 38, 0.8)',
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  frozenText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#ffffff',
    marginTop: 8,
    letterSpacing: 2,
  },
});

export default HSCardDisplay;
