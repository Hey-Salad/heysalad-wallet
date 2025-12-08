// app/dev-bypass.tsx
// DEVELOPMENT ONLY - Bypass authentication for testing
// This screen allows you to create a test session without network requests

import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Image,
  ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Colors from '@/constants/colors';

export default function DevBypass() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('dev@heysalad.io');
  const [loading, setLoading] = useState(false);

  const handleDevBypass = async () => {
    if (!username.trim()) {
      Alert.alert('Error', 'Please enter a username');
      return;
    }

    if (!email.trim()) {
      Alert.alert('Error', 'Please enter an email');
      return;
    }

    setLoading(true);

    try {
      console.log('[DevBypass] Creating development session...');

      // Create a fake user ID for development
      const devUserId = `dev-user-${Date.now()}`;

      // Create a mock Supabase session
      const mockSession = {
        access_token: `dev-token-${Date.now()}`,
        token_type: 'bearer',
        expires_in: 3600,
        refresh_token: `dev-refresh-${Date.now()}`,
        user: {
          id: devUserId,
          email: email.trim(),
          created_at: new Date().toISOString(),
          app_metadata: {},
          user_metadata: { username: username.trim() },
          aud: 'authenticated',
        },
      };

      // Store the mock session
      await AsyncStorage.setItem(
        'supabase.auth.token',
        JSON.stringify(mockSession)
      );

      // Create a mock profile
      const mockProfile = {
        auth_user_id: devUserId,
        username: username.trim(),
        email: email.trim(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      await AsyncStorage.setItem('dev-profile', JSON.stringify(mockProfile));

      console.log('[DevBypass] Development session created');

      Alert.alert(
        'Development Mode',
        'Session created! You can now use the app.\n\nNote: This is for development only. Use preview build for real testing.',
        [
          {
            text: 'Continue',
            onPress: () => {
              // Force reload to pick up new session
              router.replace('/');
            },
          },
        ]
      );
    } catch (error) {
      console.error('[DevBypass] Error:', error);
      Alert.alert('Error', 'Failed to create development session');
    } finally {
      setLoading(false);
    }
  };

  const handleClearSession = async () => {
    await AsyncStorage.clear();
    Alert.alert('Cleared', 'All session data cleared');
    router.replace('/');
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Image
        source={require('@/assets/images/HeySalad_black_logo.png')}
        style={styles.logo}
        resizeMode="contain"
      />

      <View style={styles.warningBox}>
        <Text style={styles.warningIcon}>⚠️</Text>
        <Text style={styles.warningTitle}>Development Mode</Text>
        <Text style={styles.warningText}>
          This bypasses authentication for development only.
        </Text>
        <Text style={styles.warningText}>
          Use the preview build for real testing with Supabase.
        </Text>
      </View>

      <Text style={styles.label}>Username</Text>
      <TextInput
        style={styles.input}
        placeholder="Enter username"
        value={username}
        onChangeText={setUsername}
        autoCapitalize="none"
        autoCorrect={false}
        editable={!loading}
        placeholderTextColor={Colors.brand.inkMuted}
      />

      <Text style={styles.label}>Email</Text>
      <TextInput
        style={styles.input}
        placeholder="Enter email"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
        autoCorrect={false}
        editable={!loading}
        placeholderTextColor={Colors.brand.inkMuted}
      />

      <TouchableOpacity
        style={[styles.button, loading && styles.buttonDisabled]}
        onPress={handleDevBypass}
        disabled={loading}
      >
        <Text style={styles.buttonText}>
          {loading ? 'Creating Session...' : 'Create Dev Session'}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.secondaryButton, loading && styles.buttonDisabled]}
        onPress={() => router.back()}
        disabled={loading}
      >
        <Text style={styles.secondaryButtonText}>Back to Sign In</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.clearButton}
        onPress={handleClearSession}
        disabled={loading}
      >
        <Text style={styles.clearButtonText}>Clear All Data</Text>
      </TouchableOpacity>

      <View style={styles.infoBox}>
        <Text style={styles.infoText}>
          💡 This creates a local session without network requests
        </Text>
        <Text style={styles.infoText}>
          🔧 For real testing, use: eas build --profile preview
        </Text>
        <Text style={styles.infoText}>
          📱 Preview builds make direct network requests to Supabase
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.brand.white,
  },
  content: {
    padding: 24,
  },
  logo: {
    width: 180,
    height: 60,
    alignSelf: 'center',
    marginBottom: 24,
    marginTop: 40,
  },
  warningBox: {
    backgroundColor: '#FFF3CD',
    borderWidth: 2,
    borderColor: '#FFC107',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    alignItems: 'center',
  },
  warningIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  warningTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.brand.ink,
    marginBottom: 8,
  },
  warningText: {
    fontSize: 14,
    color: Colors.brand.inkMuted,
    textAlign: 'center',
    lineHeight: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.brand.ink,
    marginBottom: 8,
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
    backgroundColor: Colors.brand.cherryRed,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonText: {
    color: Colors.brand.white,
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryButton: {
    height: 50,
    backgroundColor: Colors.brand.lightPeach,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  secondaryButtonText: {
    color: Colors.brand.ink,
    fontSize: 16,
    fontWeight: '600',
  },
  clearButton: {
    padding: 12,
    alignItems: 'center',
    marginBottom: 24,
  },
  clearButtonText: {
    color: Colors.brand.inkMuted,
    fontSize: 14,
    textDecorationLine: 'underline',
  },
  infoBox: {
    backgroundColor: Colors.brand.lightPeach,
    borderRadius: 12,
    padding: 16,
  },
  infoText: {
    fontSize: 12,
    color: Colors.brand.inkMuted,
    lineHeight: 18,
    marginBottom: 4,
  },
});
