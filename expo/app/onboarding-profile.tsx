// app/onboarding-profile.tsx
// Simplified onboarding - just collect username and proceed to wallet setup
// Profile data is stored in heysalad-oauth (user.email, user.id)
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
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useCloudflareAuth } from '@/providers/CloudflareAuthProvider';
import Colors from '@/constants/colors';

const PROFILE_KEY = 'heysalad_profile';

interface LocalProfile {
  username: string;
  userId: string;
  email?: string;
  createdAt: string;
}

export default function OnboardingProfile() {
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(false);
  const [checkingProfile, setCheckingProfile] = useState(true);
  const { user, loading: authLoading } = useCloudflareAuth();
  const router = useRouter();

  // Check if user already has a local profile
  useEffect(() => {
    if (authLoading) {
      console.log('[OnboardingProfile] Auth still loading, waiting...');
      return;
    }

    const checkProfile = async () => {
      if (!user) {
        console.log('[OnboardingProfile] No user, redirecting to sign-in');
        router.replace('/sign-in');
        return;
      }

      console.log('[OnboardingProfile] User found:', user.id);

      try {
        const profileJson = await AsyncStorage.getItem(PROFILE_KEY);
        if (profileJson) {
          const profile: LocalProfile = JSON.parse(profileJson);
          // Check if profile belongs to current user
          if (profile.userId === user.id) {
            console.log('[OnboardingProfile] Profile exists, redirecting to wallet setup');
            router.replace('/wallet-disclaimer');
            return;
          }
        }
      } catch (e) {
        console.error('[OnboardingProfile] Error checking profile:', e);
      }

      // No profile found - show form
      console.log('[OnboardingProfile] No profile found, showing form');
      setCheckingProfile(false);
    };

    checkProfile();
  }, [user, authLoading, router]);

  const handleCreateProfile = async () => {
    if (!username.trim()) {
      Alert.alert('Error', 'Please enter a username');
      return;
    }

    if (!user) {
      Alert.alert('Error', 'No user found. Please sign in again.');
      router.replace('/sign-in');
      return;
    }

    setLoading(true);
    try {
      console.log('[OnboardingProfile] Creating local profile for user:', user.id);

      const profile: LocalProfile = {
        username: username.trim(),
        userId: user.id,
        email: user.email,
        createdAt: new Date().toISOString(),
      };

      await AsyncStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
      console.log('[OnboardingProfile] Profile saved locally');

      // Navigate to wallet disclaimer
      router.replace('/wallet-disclaimer');

    } catch (error) {
      console.error('[OnboardingProfile] Exception:', error);
      Alert.alert('Error', 'Failed to create profile. Please try again.');
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

        {user?.email && (
          <Text style={styles.emailText}>Signed in as {user.email}</Text>
        )}

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
  emailText: {
    fontSize: 14,
    color: Colors.brand.inkMuted,
    marginBottom: 24,
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
    marginBottom: 16,
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
