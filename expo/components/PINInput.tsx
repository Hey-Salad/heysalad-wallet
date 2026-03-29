// components/PINInput.tsx
// 6-digit PIN input component

import React, { useState, useRef, useEffect } from 'react';
import { View, TextInput, StyleSheet, Text } from 'react-native';
import Colors from '@/constants/colors';

interface PINInputProps {
  length?: number;
  onComplete: (pin: string) => void;
  disabled?: boolean;
  error?: boolean;
}

export default function PINInput({ length = 6, onComplete, disabled = false, error = false }: PINInputProps) {
  const [pin, setPin] = useState('');
  const inputRef = useRef<TextInput>(null);

  useEffect(() => {
    // Auto-focus on mount
    setTimeout(() => inputRef.current?.focus(), 100);
  }, []);

  useEffect(() => {
    if (pin.length === length) {
      onComplete(pin);
      // Clear after submission
      setTimeout(() => setPin(''), 500);
    }
  }, [pin, length, onComplete]);

  const handleChangeText = (text: string) => {
    // Only allow digits
    const digits = text.replace(/[^0-9]/g, '');
    if (digits.length <= length) {
      setPin(digits);
    }
  };

  const renderDots = () => {
    const dots = [];
    for (let i = 0; i < length; i++) {
      const isFilled = i < pin.length;
      dots.push(
        <View
          key={i}
          style={[
            styles.dot,
            isFilled && styles.dotFilled,
            error && styles.dotError,
          ]}
        >
          {isFilled && <View style={styles.dotInner} />}
        </View>
      );
    }
    return dots;
  };

  return (
    <View style={styles.container}>
      {/* Visual dots */}
      <View style={styles.dotsContainer}>
        {renderDots()}
      </View>

      {/* Hidden input */}
      <TextInput
        ref={inputRef}
        value={pin}
        onChangeText={handleChangeText}
        keyboardType="number-pad"
        maxLength={length}
        secureTextEntry={false}
        autoFocus
        editable={!disabled}
        style={styles.hiddenInput}
        textContentType="oneTimeCode"
      />

      {/* Helper text */}
      <Text style={styles.helperText}>
        {pin.length === 0 ? 'Enter your PIN' : `${pin.length}/${length}`}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    gap: 16,
    width: '100%',
  },
  dotsContainer: {
    flexDirection: 'row',
    gap: 16,
    justifyContent: 'center',
  },
  dot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: Colors.brand.lightPeach,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dotFilled: {
    borderColor: Colors.brand.cherryRed,
    backgroundColor: Colors.brand.lightPeach,
  },
  dotError: {
    borderColor: '#ef4444',
  },
  dotInner: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.brand.cherryRed,
  },
  hiddenInput: {
    position: 'absolute',
    opacity: 0,
    height: 1,
    width: 1,
  },
  helperText: {
    fontSize: 14,
    color: Colors.brand.inkMuted,
    marginTop: 8,
  },
});
