// app/verify-otp.tsx
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
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useSupabase } from '@/providers/SupabaseProvider';
import Colors from '@/constants/colors';

export default function VerifyOTP() {
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const { supabase } = useSupabase();
  const router = useRouter();
  const params = useLocalSearchParams();
  const phone = params.phone as string;
  const email = params.email as string;
  const type = (params.type as 'phone' | 'email') || 'phone';

  useEffect(() => {
    if (!phone && !email) {
      Alert.alert('Error', 'Contact information not found');
      router.replace('/sign-in');
    }
  }, [phone, email]);

  const handleVerifyOTP = async () => {
    if (otp.length !== 6) {
      Alert.alert('Error', 'Please enter the 6-digit code');
      return;
    }

    setLoading(true);
    try {
      console.log('[VerifyOTP] Verifying OTP for:', type === 'phone' ? phone : email);

      let session;
      let error;

      if (type === 'phone') {
        const result = await supabase.auth.verifyOtp({
          phone,
          token: otp,
          type: 'sms',
        });
        session = result.data.session;
        error = result.error;
      } else {
        const result = await supabase.auth.verifyOtp({
          email,
          token: otp,
          type: 'email',
        });
        session = result.data.session;
        error = result.error;
      }

      if (error) {
        console.error('[VerifyOTP] Verification error:', error);
        Alert.alert('Error', error.message);
        setLoading(false);
        return;
      }

      if (!session) {
        Alert.alert('Error', 'Could not initialize session');
        setLoading(false);
        return;
      }

      console.log('[VerifyOTP] OTP verified successfully');

      // Check if profile exists (like heysalad-cash does)
      const { data: profile } = await supabase
        .from('profiles')
        .select()
        .eq('auth_user_id', session.user.id)
        .single();

      if (!profile) {
        console.log('[VerifyOTP] No profile found, going to onboarding');
        router.replace('/onboarding-profile');
        return;
      }

      console.log('[VerifyOTP] Profile exists, going to main app');
      router.replace('/(tabs)');

    } catch (error: any) {
      console.error('[VerifyOTP] Exception:', error);
      Alert.alert('Error', 'An unexpected error occurred');
      setLoading(false);
    }
  };

  const handleResendOTP = async () => {
    setResending(true);
    try {
      console.log('[VerifyOTP] Resending OTP to:', type === 'phone' ? phone : email);

      let error;
      if (type === 'phone') {
        const result = await supabase.auth.signInWithOtp({
          phone,
        });
        error = result.error;
      } else {
        const result = await supabase.auth.signInWithOtp({
          email,
        });
        error = result.error;
      }

      if (error) {
        console.error('[VerifyOTP] Resend error:', error);
        Alert.alert('Error', error.message);
      } else {
        Alert.alert('Success', 'Verification code resent');
      }
    } catch (error: any) {
      console.error('[VerifyOTP] Resend exception:', error);
      Alert.alert('Error', 'Failed to resend code');
    } finally {
      setResending(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.content}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>

        <Image
          source={require('@/assets/images/HeySalad_black_logo.png')}
          style={styles.logo}
          resizeMode="contain"
        />

        <Text style={styles.title}>Enter verification code</Text>
        <Text style={styles.subtitle}>
          We sent a code to {type === 'phone' ? phone : email}
        </Text>

        <TextInput
          style={styles.input}
          placeholder="000000"
          value={otp}
          onChangeText={setOtp}
          keyboardType="number-pad"
          maxLength={6}
          autoFocus
          editable={!loading}
        />

        <TouchableOpacity
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={handleVerifyOTP}
          disabled={loading}
        >
          <Text style={styles.buttonText}>
            {loading ? 'Verifying...' : 'Verify'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.resendButton}
          onPress={handleResendOTP}
          disabled={resending || loading}
        >
          <Text style={[styles.resendText, (resending || loading) && styles.resendTextDisabled]}>
            {resending ? 'Resending...' : 'Resend code'}
          </Text>
        </TouchableOpacity>
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
  backButton: {
    position: 'absolute',
    top: 60,
    left: 24,
  },
  backText: {
    fontSize: 16,
    color: Colors.brand.ink,
    fontWeight: '600',
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
  input: {
    height: 60,
    borderWidth: 2,
    borderColor: Colors.brand.border,
    borderRadius: 12,
    paddingHorizontal: 16,
    fontSize: 24,
    textAlign: 'center',
    letterSpacing: 8,
    marginBottom: 16,
    color: Colors.brand.ink,
    fontWeight: '600',
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
  resendButton: {
    padding: 12,
    alignItems: 'center',
  },
  resendText: {
    color: Colors.brand.ink,
    fontSize: 16,
    fontWeight: '600',
  },
  resendTextDisabled: {
    color: Colors.brand.inkMuted,
  },
});
