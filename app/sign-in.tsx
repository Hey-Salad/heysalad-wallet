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
import { useSupabase } from '@/providers/SupabaseProvider';
import Colors from '@/constants/colors';

export default function SignIn() {
  const [authMethod, setAuthMethod] = useState<'phone' | 'email'>('phone');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const { supabase, user } = useSupabase();
  const router = useRouter();

  // Redirect if already logged in
  useEffect(() => {
    if (user) {
      router.replace('/onboarding-profile');
    }
  }, [user]);

  // Countdown timer for email resend
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => {
        setCountdown(countdown - 1);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  // Reset emailSent when switching auth methods
  useEffect(() => {
    setEmailSent(false);
    setCountdown(0);
  }, [authMethod]);

  const handleSignIn = async () => {
    if (authMethod === 'phone') {
      const phoneNumber = phone.trim();

      if (!phoneNumber) {
        Alert.alert('Error', 'Please enter your phone number');
        return;
      }

      // Basic phone validation
      const cleanPhone = phoneNumber.replace(/\D/g, '');
      if (cleanPhone.length < 10) {
        Alert.alert('Error', 'Please enter a valid phone number');
        return;
      }

      // Format phone with country code if not already present
      const formattedPhone = cleanPhone.startsWith('1') ? `+${cleanPhone}` : `+1${cleanPhone}`;

      setLoading(true);
      try {
        console.log('[SignIn] Sending OTP to phone:', formattedPhone);

        const { error } = await supabase.auth.signInWithOtp({
          phone: formattedPhone,
        });

        if (error) {
          console.error('[SignIn] OTP error:', error);
          Alert.alert('Error', error.message);
          setLoading(false);
          return;
        }

        console.log('[SignIn] OTP sent successfully');
        // Navigate to OTP verification with phone number
        router.push({
          pathname: '/verify-otp',
          params: { phone: formattedPhone, type: 'phone' },
        });

      } catch (error: any) {
        console.error('[SignIn] Exception:', error);
        Alert.alert('Error', 'An unexpected error occurred');
        setLoading(false);
      }
    } else {
      // Email authentication
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

        const { error } = await supabase.auth.signInWithOtp({
          email: emailAddress,
          options: {
            emailRedirectTo: 'heysalad://auth/callback',
          },
        });

        if (error) {
          console.error('[SignIn] Email magic link error:', error);
          Alert.alert('Error', error.message);
          setLoading(false);
          return;
        }

        console.log('[SignIn] Magic link sent successfully');
        setLoading(false);
        setEmailSent(true);
        setCountdown(60); // Start 60 second countdown

      } catch (error: any) {
        console.error('[SignIn] Exception:', error);
        Alert.alert('Error', 'An unexpected error occurred');
        setLoading(false);
      }
    }
  };

  const handleResendEmail = async () => {
    if (countdown > 0 || !email) return;

    setLoading(true);
    try {
      console.log('[SignIn] Resending magic link to email:', email);

      const { error } = await supabase.auth.signInWithOtp({
        email: email.trim(),
        options: {
          emailRedirectTo: 'heysalad://auth/callback',
        },
      });

      if (error) {
        console.error('[SignIn] Resend error:', error);
        Alert.alert('Error', error.message);
        setLoading(false);
        return;
      }

      console.log('[SignIn] Magic link resent successfully');
      setLoading(false);
      setCountdown(60); // Restart countdown
      Alert.alert('Success', 'Magic link sent! Check your email.');
    } catch (error: any) {
      console.error('[SignIn] Resend exception:', error);
      Alert.alert('Error', 'Failed to resend. Please try again.');
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
        <Text style={styles.title}>
          {authMethod === 'phone' ? 'Enter your phone number' : 'Enter your email address'}
        </Text>
        <Text style={styles.subtitle}>We'll send you a verification code</Text>

        {authMethod === 'phone' ? (
          <View style={styles.phoneContainer}>
            <Text style={styles.countryCode}>+1</Text>
            <TextInput
              style={styles.input}
              placeholder="(555) 123-4567"
              value={phone}
              onChangeText={setPhone}
              keyboardType="phone-pad"
              autoFocus
              editable={!loading}
              placeholderTextColor={Colors.brand.inkMuted}
            />
          </View>
        ) : (
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
        )}

        {authMethod === 'email' && emailSent ? (
          <>
            <View style={styles.successBox}>
              <Text style={styles.successIcon}>✓</Text>
              <Text style={styles.successTitle}>Check your email</Text>
              <Text style={styles.successMessage}>
                We sent a magic link to {email}
              </Text>
              <Text style={styles.successMessage}>
                Click the link in your email to sign in.
              </Text>
            </View>

            {countdown > 0 ? (
              <View style={styles.countdownContainer}>
                <Text style={styles.countdownText}>
                  Request another link in {countdown}s
                </Text>
              </View>
            ) : (
              <TouchableOpacity
                style={[styles.resendButton, loading && styles.buttonDisabled]}
                onPress={handleResendEmail}
                disabled={loading}
              >
                <Text style={styles.resendButtonText}>
                  {loading ? 'Sending...' : 'Request another link'}
                </Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              style={styles.switchButton}
              onPress={() => {
                setEmailSent(false);
                setCountdown(0);
                setAuthMethod('phone');
              }}
              disabled={loading}
            >
              <Text style={styles.switchText}>Use phone instead</Text>
            </TouchableOpacity>
          </>
        ) : (
          <>
            <TouchableOpacity
              style={[styles.button, loading && styles.buttonDisabled]}
              onPress={handleSignIn}
              disabled={loading}
            >
              <Text style={styles.buttonText}>
                {loading ? 'Sending code...' : 'Continue'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.switchButton}
              onPress={() => setAuthMethod(authMethod === 'phone' ? 'email' : 'phone')}
              disabled={loading}
            >
              <Text style={[styles.switchText, loading && styles.switchTextDisabled]}>
                {authMethod === 'phone' ? 'Use email instead' : 'Use phone instead'}
              </Text>
            </TouchableOpacity>

            <Text style={styles.disclaimer}>
              {authMethod === 'phone'
                ? "We'll send you a verification code via SMS"
                : "We'll send you a magic link to sign in"}
            </Text>
          </>
        )}
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
  phoneContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 8,
  },
  countryCode: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.brand.ink,
    paddingHorizontal: 12,
    paddingVertical: 14,
    borderWidth: 2,
    borderColor: Colors.brand.border,
    borderRadius: 12,
  },
  input: {
    flex: 1,
    height: 50,
    borderWidth: 2,
    borderColor: Colors.brand.border,
    borderRadius: 12,
    paddingHorizontal: 16,
    fontSize: 16,
    color: Colors.brand.ink,
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
  switchButton: {
    padding: 12,
    alignItems: 'center',
    marginBottom: 8,
  },
  switchText: {
    color: Colors.brand.ink,
    fontSize: 16,
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
  switchTextDisabled: {
    color: Colors.brand.inkMuted,
  },
  disclaimer: {
    fontSize: 14,
    color: Colors.brand.inkMuted,
    textAlign: 'center',
  },
  successBox: {
    backgroundColor: '#F0FDF4',
    borderWidth: 2,
    borderColor: '#86EFAC',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    alignItems: 'center',
  },
  successIcon: {
    fontSize: 48,
    color: '#10B981',
    marginBottom: 12,
  },
  successTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.brand.ink,
    marginBottom: 8,
  },
  successMessage: {
    fontSize: 14,
    color: Colors.brand.inkMuted,
    textAlign: 'center',
    lineHeight: 20,
  },
  countdownContainer: {
    padding: 16,
    alignItems: 'center',
    marginBottom: 16,
  },
  countdownText: {
    fontSize: 14,
    color: Colors.brand.inkMuted,
    fontWeight: '500',
  },
  resendButton: {
    height: 50,
    backgroundColor: Colors.brand.ink,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  resendButtonText: {
    color: Colors.brand.white,
    fontSize: 16,
    fontWeight: '600',
  },
});
