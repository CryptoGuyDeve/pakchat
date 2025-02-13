import { Stack } from 'expo-router';
import { useAuth } from '../../lib/auth';
import { useEffect } from 'react';
import { router } from 'expo-router';
import { ProtectedRoute } from '../../components/protected-route';

export default function AuthLayout() {
  const { session, loading } = useAuth();

  useEffect(() => {
    if (!loading && session) {
      // If user is authenticated, redirect to app
      router.replace('/(app)/chats');
    }
  }, [session, loading]);

  return (
    <ProtectedRoute>
      <Stack
        screenOptions={{
          headerShown: false,
        }}
      >
        <Stack.Screen name="welcome" />
        <Stack.Screen name="login" />
        <Stack.Screen name="signup" />
      </Stack>
    </ProtectedRoute>
  );
} 