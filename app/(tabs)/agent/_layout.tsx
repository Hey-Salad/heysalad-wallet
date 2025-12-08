import { Stack } from 'expo-router';
import Colors from '@/constants/colors';

export default function AgentLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: Colors.brand.white },
      }}
    >
      <Stack.Screen name="index" />
      <Stack.Screen 
        name="shopping-session" 
        options={{
          presentation: 'modal',
          headerShown: true,
          headerTitle: 'Shopping Progress',
          headerStyle: { backgroundColor: Colors.brand.white },
          headerTintColor: Colors.brand.ink,
        }}
      />
    </Stack>
  );
}
