import { useEffect } from 'react';
import { useRouter, useSegments } from 'expo-router';
import { useAuth } from '../lib/auth';
import { Loading } from './loading';

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { session, loading } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;

    const inAuthGroup = segments[0] === '(auth)';
    
    if (!session && !inAuthGroup) {
      // Redirect to login if not authenticated and trying to access protected routes
      router.replace('/login');
    } else if (session && inAuthGroup) {
      // Redirect to dashboard if authenticated and trying to access auth routes
      router.replace('/(app)/chats');
    }
  }, [session, loading, segments]);

  if (loading) {
    return <Loading />;
  }

  return <>{children}</>;
} 