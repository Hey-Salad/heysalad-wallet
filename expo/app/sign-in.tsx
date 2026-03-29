// app/sign-in.tsx
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Image,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useCloudflareAuth } from '@/providers/CloudflareAuthProvider';
import Colors from '@/constants/colors';

export default function SignIn() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const { user, signInWithMagicLink } = useCloudflareAuth();
  const router = useRouter();

  // Redirect if already logged in
  useEffect(() => {
    if (user) {
      router.replace('/onboarding-profile');
    }
  }, [user]);

  const handleSignIn = async () => {
    const emailAddress = email.trim();

    if (!emailAddress) {
      Alert.alert('Error', 'Please enter your email address');
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(emailAddress)) {
      Alert.alert('Error', 'Please enter a valid email address');
      return;
    }

    setLoading(true);
    try {
      console.log('[SignIn] Sending magic link to email:', emailAddress);

      const result = await signInWithMagicLink(emailAddress, 'heysalad://auth/callback');

      if (!result.success) {
        console.error('[SignIn] Email magic link error:', result.error);
        Alert.alert('Error', result.error || 'Failed to send magic link');
        setLoading(false);
        return;
      }

      console.log('[SignIn] Magic link sent successfully');
      setLoading(false);

      Alert.alert(
        'Check your email',
        `We sent a magic link to ${emailAddress}. Click the link in your email to sign in.`,
        [{ text: 'OK' }]
      );

    } catch (error: any) {
      console.error('[SignIn] Exception:', error);
      Alert.alert('Error', error.message || 'An unexpected error occurred');
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.content}>
        <Image
          source={require('@/assets/images/HeySalad_black_logo.png')}
          style={styles.logo}
          resizeMode="contain"
        />
        <Text style={styles.title}>Enter your email address</Text>
        <Text style={styles.subtitle}>We'll send you a magic link to sign in</Text>

        <TextInput
          style={styles.emailInput}
          placeholder="your.email@example.com"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
          autoFocus
          editable={!loading}
          placeholderTextColor={Colors.brand.inkMuted}
        />

        <TouchableOpacity
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={handleSignIn}
          disabled={loading}
        >
          <Text style={styles.buttonText}>
            {loading ? 'Sending link...' : 'Continue'}
          </Text>
        </TouchableOpacity>

        <Text style={styles.disclaimer}>
          We'll send you a magic link via email to sign in securely
        </Text>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.brand.white,
  },
  content: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
  },
  logo: {
    width: 180,
    height: 60,
    alignSelf: 'center',
    marginBottom: 40,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 8,
    color: Colors.brand.ink,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: Colors.brand.inkMuted,
    marginBottom: 32,
    textAlign: 'center',
  },
  emailInput: {
    height: 50,
    borderWidth: 2,
    borderColor: Colors.brand.border,
    borderRadius: 12,
    paddingHorizontal: 16,
    fontSize: 16,
    marginBottom: 16,
    color: Colors.brand.ink,
  },
  button: {
    height: 50,
    backgroundColor: Colors.brand.ink,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  buttonDisabled: {
    backgroundColor: Colors.brand.inkMuted,
    opacity: 0.5,
  },
  buttonText: {
    color: Colors.brand.white,
    fontSize: 16,
    fontWeight: '600',
  },
  disclaimer: {
    fontSize: 14,
    color: Colors.brand.inkMuted,
    textAlign: 'center',
  },
});
