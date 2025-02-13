import { useState, useEffect } from 'react';
import { View, FlatList, StyleSheet, RefreshControl } from 'react-native';
import { List, Text, Avatar, useTheme, FAB } from 'react-native-paper';
import { Link, useRouter } from 'expo-router';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../lib/auth';
import { Loading } from '../../components/loading';
import { formatDistanceToNow } from 'date-fns';

type ChatPreview = {
  id: string;
  lastMessage: string;
  lastMessageTime: string;
  participants: {
    id: string;
    username: string;
    avatar_url?: string;
  }[];
};

const formatMessageTime = (timestamp: string | null) => {
  if (!timestamp) return '';
  try {
    return formatDistanceToNow(new Date(timestamp), { addSuffix: true });
  } catch (error) {
    console.error('Error formatting time:', error);
    return '';
  }
};

export default function Chats() {
  const { session } = useAuth();
  const [loading, setLoading] = useState(true);
  const [chats, setChats] = useState<ChatPreview[]>([]);
  const theme = useTheme();
  const router = useRouter();
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadChats();
    const subscription = subscribeToMessages();
    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const loadChats = async () => {
    if (!session?.user.id) return;
    
    try {
      // First get all conversation IDs for the current user
      const { data: userConversations, error: conversationError } = await supabase
        .from('conversation_participants')
        .select('conversation_id')
        .eq('profile_id', session.user.id);

      if (conversationError) throw conversationError;

      if (!userConversations?.length) {
        setChats([]);
        return;
      }

      // Then get the conversation details
      const { data, error } = await supabase
        .from('conversations')
        .select(`
          id,
          updated_at,
          messages (
            id,
            content,
            created_at
          ),
          conversation_participants!inner (
            profiles!inner (
              id,
              username,
              avatar_url
            )
          )
        `)
        .in('id', userConversations.map(uc => uc.conversation_id))
        .order('updated_at', { ascending: false });

      if (error) throw error;

      const transformedChats = data.map(chat => {
        const otherParticipant = chat.conversation_participants
          .find(p => p.profiles.id !== session.user.id)?.profiles;

        const messages = chat.messages || [];
        messages.sort((a, b) => 
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );

        return {
          id: chat.id,
          lastMessage: messages[0]?.content ?? 'No messages yet',
          lastMessageTime: messages[0]?.created_at ?? chat.updated_at ?? new Date().toISOString(),
          participants: [{
            id: otherParticipant?.id || '',
            username: otherParticipant?.username || 'Unknown User',
            avatar_url: otherParticipant?.avatar_url,
          }],
        };
      });

      setChats(transformedChats);
    } catch (error) {
      console.error('Error loading chats:', error);
    } finally {
      setLoading(false);
    }
  };

  const subscribeToMessages = () => {
    return supabase
      .channel('chat_updates')
      .on(
        'postgres_changes',
        {
          event: '*', // Listen to all events
          schema: 'public',
          table: 'messages',
        },
        async () => {
          // Reload chats when any message changes
          await loadChats();
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'conversations',
        },
        async () => {
          // Reload chats when conversations change
          await loadChats();
        }
      )
      .subscribe((status) => {
        console.log('Chats subscription status:', status);
      });
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadChats();
    setRefreshing(false);
  };

  if (loading) return <Loading />;

  return (
    <View style={styles.container}>
      <FlatList
        data={chats}
        keyExtractor={(item) => item.id}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        renderItem={({ item }) => (
          <Link href={`/chat/${item.id}`} asChild>
            <List.Item
              title={item.participants[0]?.username ?? 'Unknown User'}
              description={item.lastMessage}
              left={() => (
                <Avatar.Image
                  size={50}
                  source={
                    item.participants[0]?.avatar_url
                      ? { uri: item.participants[0].avatar_url }
                      : require('../../assets/default-avatar.png')
                  }
                />
              )}
              right={() => (
                <Text style={styles.time}>
                  {formatMessageTime(item.lastMessageTime)}
                </Text>
              )}
            />
          </Link>
        )}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text>No conversations yet</Text>
            <Text style={styles.emptySubtext}>
              Start a chat by searching for users
            </Text>
          </View>
        }
      />
      <FAB
        icon="plus"
        style={[styles.fab, { backgroundColor: theme.colors.primary }]}
        onPress={() => router.push('/search')}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  emptySubtext: {
    opacity: 0.5,
    marginTop: 8,
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
  },
  time: {
    fontSize: 12,
    opacity: 0.5,
  },
}); 