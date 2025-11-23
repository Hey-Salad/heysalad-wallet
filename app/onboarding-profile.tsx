// app/onboarding-profile.tsx
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
  ActivityIndicator,
  Image,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSupabase } from '@/providers/SupabaseProvider';
import Colors from '@/constants/colors';

export default function OnboardingProfile() {
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(false);
  const [checkingProfile, setCheckingProfile] = useState(true);
  const { supabase, user, refreshProfile } = useSupabase();
  const router = useRouter();

  // Check if user already has a profile (like heysalad-cash does)
  useEffect(() => {
    const checkProfile = async () => {
      if (!user) {
        console.log('[OnboardingProfile] No user, redirecting to sign-in');
        router.replace('/sign-in');
        return;
      }

      console.log('[OnboardingProfile] Checking for existing profile...');

      // Add timeout to prevent hanging
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('Profile check timeout')), 5000);
      });

      const queryPromise = supabase
        .from('profiles')
        .select('*')
        .eq('auth_user_id', user.id)
        .single();

      const { data: profile, error } = await Promise.race([queryPromise, timeoutPromise]) as any;

      if (error && error.code !== 'PGRST116') {
        // Log errors that aren't "no rows" errors
        console.error('[OnboardingProfile] Error checking profile:', error);
      }

      if (profile) {
        console.log('[OnboardingProfile] Profile exists, redirecting to main app');
        router.replace('/(tabs)/(wallet)' as any);
        return;
      }

      // No profile found - that's expected for new users
      console.log('[OnboardingProfile] No profile found, showing onboarding form');
      setCheckingProfile(false);
    };

    checkProfile().catch((err) => {
      console.error('[OnboardingProfile] Exception in checkProfile:', err);
      // Show form even on error so user isn't stuck
      setCheckingProfile(false);
    });
  }, [user, supabase, router]);

  const handleCreateProfile = async () => {
    if (!username.trim()) {
      Alert.alert('Error', 'Please enter a username');
      return;
    }

    if (!user) {
      Alert.alert('Error', 'No user found. Please sign in again.');
      return;
    }

    setLoading(true);
    try {
      console.log('[OnboardingProfile] Creating profile for user:', user.id);

      // Check if username is already taken
      const { data: existingUser } = await supabase
        .from('profiles')
        .select('username')
        .eq('username', username.trim())
        .single();

      if (existingUser) {
        Alert.alert('Error', 'Username is already taken. Please choose another one.');
        setLoading(false);
        return;
      }

      // Prepare profile data - only include fields that have values
      const profileData: any = {
        auth_user_id: user.id,
        username: username.trim(),
      };

      // Add email if it exists (for email auth)
      if (user.email) {
        profileData.email = user.email;
      }

      // Add phone if it exists (for phone auth)
      // Note: Only add this if your profiles table has a phone column
      if (user.phone) {
        profileData.phone = user.phone;
      }

      const { error } = await supabase
        .from('profiles')
        .insert(profileData);

      if (error) {
        console.error('[OnboardingProfile] Error creating profile:', error);
        Alert.alert('Error', error.message || 'Failed to create profile');
        setLoading(false);
        return;
      }

      console.log('[OnboardingProfile] Profile created successfully');

      // Refresh the profile in the context
      await refreshProfile();

      // Navigate to main app
      router.replace('/(tabs)/(wallet)' as any);

    } catch (error) {
      console.error('[OnboardingProfile] Exception:', error);
      Alert.alert('Error', 'An unexpected error occurred');
      setLoading(false);
    }
  };

  // Show loading while checking for existing profile
  if (checkingProfile) {
    return (
      <View style={styles.container}>
        <View style={styles.content}>
          <ActivityIndicator size="large" color={Colors.brand.ink} />
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      </View>
    );
  }

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
        <Text style={styles.title}>Create your profile</Text>
        <Text style={styles.subtitle}>Choose a username to get started</Text>

        <TextInput
          style={styles.input}
          placeholder="Username"
          value={username}
          onChangeText={setUsername}
          autoCapitalize="none"
          autoCorrect={false}
          editable={!loading}
          placeholderTextColor={Colors.brand.inkMuted}
        />

        <TouchableOpacity
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={handleCreateProfile}
          disabled={loading}
        >
          <Text style={styles.buttonText}>
            {loading ? 'Creating...' : 'Continue'}
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
  logo: {
    width: 180,
    height: 60,
    alignSelf: 'center',
    marginBottom: 40,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: Colors.brand.inkMuted,
    textAlign: 'center',
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
});
