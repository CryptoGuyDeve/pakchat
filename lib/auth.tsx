import { createContext, useContext, useEffect, useState, useRef } from 'react';
import { Session } from '@supabase/supabase-js';
import { supabase } from './supabase';
import * as Notifications from 'expo-notifications';
import { registerForPushNotificationsAsync, savePushToken } from './notifications';
import { useRouter } from 'expo-router';

type Profile = {
  id: string;
  username: string;
  avatar_url?: string;
};

type AuthContextType = {
  session: Session | null;
  profile: Profile | null;
  loading: boolean;
  signUp: (email: string, password: string, username: string) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const notificationListener = useRef<any>();
  const responseListener = useRef<any>();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) {
        loadProfile(session.user.id);
      }
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setSession(session);
      if (session) {
        await loadProfile(session.user.id);
      } else {
        setProfile(null);
      }
    });

    // Register for push notifications when logged in
    if (session?.user) {
      registerForPushNotificationsAsync().then(token => {
        if (token) {
          savePushToken(session.user.id, token);
        }
      });

      // Listen for notifications when app is in foreground
      notificationListener.current = Notifications.addNotificationReceivedListener(notification => {
        console.log('Notification received:', notification);
      });

      // Handle notification when user taps it
      responseListener.current = Notifications.addNotificationResponseReceivedListener(response => {
        const conversationId = response.notification.request.content.data?.conversationId;
        if (conversationId) {
          router.push(`/chat/${conversationId}`);
        }
      });
    }

    return () => {
      subscription.unsubscribe();
      if (notificationListener.current) {
        Notifications.removeNotificationSubscription(notificationListener.current);
      }
      if (responseListener.current) {
        Notifications.removeNotificationSubscription(responseListener.current);
      }
    };
  }, [session]);

  const loadProfile = async (userId: string) => {
    try {
      // First try to select the profile
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          // Profile doesn't exist, create it
          const { data: newProfile, error: createError } = await supabase
            .from('profiles')
            .insert([
              {
                id: userId,
                username: session?.user.email?.split('@')[0] || `user_${userId.slice(0, 8)}`,
              },
            ])
            .select()
            .single();

          if (createError) {
            console.error('Error creating profile:', createError);
            return;
          }
          setProfile(newProfile);
        } else {
          console.error('Error loading profile:', error);
        }
      } else {
        setProfile(data);
      }
    } catch (error) {
      console.error('Error in loadProfile:', error);
    }
  };

  const signUp = async (email: string, password: string, username: string) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          username,
        },
      },
    });

    if (error) throw error;
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) throw error;
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  };

  return (
    <AuthContext.Provider value={{ session, profile, loading, signUp, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}; 