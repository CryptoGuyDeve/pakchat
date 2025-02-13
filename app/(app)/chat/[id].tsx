import { useState, useEffect, useRef } from 'react';
import { View, StyleSheet, FlatList, AppState, AppStateStatus } from 'react-native';
import { useLocalSearchParams, useNavigation } from 'expo-router';
import { Appbar } from 'react-native-paper';
import { supabase } from '../../../lib/supabase';
import { useAuth } from '../../../lib/auth';
import { Loading } from '../../../components/loading';
import { MessageBubble } from '../../../components/message-bubble';
import { ChatInput } from '../../../components/chat-input';
import { ErrorMessage } from '../../../components/error-message';

type Message = {
  id: string;
  content: string;
  created_at: string;
  sender: {
    id: string;
    username: string;
    avatar_url?: string;
  };
  pending?: boolean;
};

type Participant = {
  username: string;
  avatar_url?: string;
};

export default function ChatRoom() {
  const params = useLocalSearchParams();
  const chatId = typeof params.id === 'string' ? params.id : null;
  const { session } = useAuth();
  const navigation = useNavigation();
  const [messages, setMessages] = useState<Message[]>([]);
  const [participant, setParticipant] = useState<Participant | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const flatListRef = useRef<FlatList>(null);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const appStateRef = useRef(AppState.currentState);

  useEffect(() => {
    if (!chatId) return;
    
    setupRealtimeSubscription();
    loadInitialData();

    // Handle app state changes
    const subscription = AppState.addEventListener('change', handleAppStateChange);

    return () => {
      cleanupRealtimeSubscription();
      subscription.remove();
    };
  }, [chatId]);

  const handleAppStateChange = async (nextAppState: AppStateStatus) => {
    if (
      appStateRef.current.match(/inactive|background/) &&
      nextAppState === 'active'
    ) {
      // App has come to the foreground
      await loadMessages();
      setupRealtimeSubscription();
    } else if (nextAppState.match(/inactive|background/)) {
      // App has gone to the background
      cleanupRealtimeSubscription();
    }
    appStateRef.current = nextAppState;
  };

  const setupRealtimeSubscription = () => {
    if (!chatId) return;

    cleanupRealtimeSubscription();

    channelRef.current = supabase
      .channel(`chat:${chatId}`)
      .on(
        'postgres_changes',
        {
          event: '*', // Listen to all events (INSERT, UPDATE, DELETE)
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${chatId}`,
        },
        async (payload) => {
          if (payload.eventType === 'INSERT') {
            // Fetch complete message with sender details
            const { data: newMessage, error } = await supabase
              .from('messages')
              .select(`
                id,
                content,
                created_at,
                sender:profiles (
                  id,
                  username,
                  avatar_url
                )
              `)
              .eq('id', payload.new.id)
              .single();

            if (error) {
              console.error('Error fetching new message:', error);
              return;
            }

            if (newMessage) {
              setMessages(current => {
                // Check if message already exists
                if (current.some(msg => msg.id === newMessage.id)) {
                  return current;
                }
                return [...current, newMessage];
              });
              flatListRef.current?.scrollToEnd({ animated: true });
            }
          }
        }
      )
      .subscribe((status) => {
        console.log(`Chat subscription status:`, status);
      });
  };

  const cleanupRealtimeSubscription = () => {
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
      channelRef.current = null;
    }
  };

  const loadInitialData = async () => {
    try {
      await Promise.all([loadMessages(), loadParticipant()]);
    } finally {
      setLoading(false);
    }
  };

  const loadMessages = async () => {
    if (!chatId) return;
    try {
      const { data, error } = await supabase
        .from('messages')
        .select(`
          id,
          content,
          created_at,
          sender:profiles (
            id,
            username,
            avatar_url
          )
        `)
        .eq('conversation_id', chatId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setMessages(data || []);
      setTimeout(() => flatListRef.current?.scrollToEnd(), 100);
    } catch (error) {
      console.error('Error loading messages:', error);
      setError('Failed to load messages');
    }
  };

  const loadParticipant = async () => {
    if (!chatId || !session?.user.id) return;
    try {
      const { data, error } = await supabase
        .from('conversation_participants')
        .select(`
          profiles (
            username,
            avatar_url
          )
        `)
        .eq('conversation_id', chatId)
        .neq('profile_id', session.user.id)
        .single();

      if (error) throw error;
      
      if (data?.profiles) {
        setParticipant(data.profiles);
        // Set the chat header title
        navigation.setOptions({
          header: () => (
            <Appbar.Header>
              <Appbar.BackAction onPress={() => navigation.goBack()} />
              <Appbar.Content title={data.profiles.username} />
            </Appbar.Header>
          ),
        });
      }
    } catch (error) {
      console.error('Error loading participant:', error);
      setError('Failed to load chat details');
    }
  };

  const sendMessage = async (content: string) => {
    if (!chatId || !session?.user.id || !content.trim()) return;

    // Create temporary message for optimistic update
    const tempMessage: Message = {
      id: `temp-${Date.now()}`,
      content: content.trim(),
      created_at: new Date().toISOString(),
      sender: {
        id: session.user.id,
        username: session.user.email?.split('@')[0] || 'Me',
        avatar_url: undefined,
      },
      pending: true,
    };

    // Add temporary message immediately
    setMessages(current => [...current, tempMessage]);
    flatListRef.current?.scrollToEnd({ animated: true });

    try {
      const { data, error } = await supabase
        .from('messages')
        .insert({
          conversation_id: chatId,
          sender_id: session.user.id,
          content: content.trim(),
        })
        .select(`
          id,
          content,
          created_at,
          sender:profiles (
            id,
            username,
            avatar_url
          )
        `)
        .single();

      if (error) throw error;

      // Replace temporary message with real one
      if (data) {
        setMessages(current =>
          current.map(msg =>
            msg.id === tempMessage.id ? data : msg
          )
        );
      }
    } catch (error) {
      console.error('Error sending message:', error);
      // Remove temporary message if send failed
      setMessages(current =>
        current.filter(msg => msg.id !== tempMessage.id)
      );
      setError('Failed to send message');
    }
  };

  if (loading) return <Loading />;

  return (
    <View style={styles.container}>
      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <MessageBubble
            content={item.content}
            timestamp={item.created_at}
            isOwn={item.sender.id === session?.user.id}
            sender={item.sender}
            pending={item.pending}
          />
        )}
        onContentSizeChange={() => flatListRef.current?.scrollToEnd()}
        style={styles.messageList}
      />
      <ChatInput onSend={sendMessage} />
      {error ? <ErrorMessage message={error} onDismiss={() => setError('')} /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  messageList: {
    flex: 1,
  },
}); 