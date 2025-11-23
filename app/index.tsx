// app/index.tsx
import { useEffect } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { useSupabase } from '@/providers/SupabaseProvider';

export default function Index() {
  const { user, profile, loading } = useSupabase();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;

    console.log('[Index] Determining initial route...', {
      hasUser: !!user,
      hasProfile: !!profile,
    });

    // Not logged in - go to sign in
    if (!user) {
      console.log('[Index] No user, going to sign-in');
      router.replace('/sign-in');
      return;
    }

    // Logged in but no profile - go to profile creation
    if (!profile) {
      console.log('[Index] User exists but no profile, going to onboarding');
      router.replace('/onboarding-profile');
      return;
    }

    // Logged in with profile - go to main app
    console.log('[Index] User has profile, going to main app');
    router.replace('/(tabs)');
  }, [user, profile, loading, router]);

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#FFF' }}>
      <ActivityIndicator size="large" color="#007AFF" />
    </View>
  );
}
