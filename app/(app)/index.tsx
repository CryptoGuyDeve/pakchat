import { View, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { Text, Card, Avatar, Button, useTheme, Surface } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { useAuth } from '../../lib/auth';
import { supabase } from '../../lib/supabase';
import { useState, useEffect } from 'react';
import { Loading } from '../../components/loading';
import { formatDistanceToNow } from 'date-fns';

type DashboardStats = {
  totalChats: number;
  totalMessages: number;
  recentChats: {
    id: string;
    participant: {
      username: string;
      avatar_url?: string;
    };
    lastMessage: string;
    lastMessageTime: string;
  }[];
};

export default function Dashboard() {
  const { session, profile } = useAuth();
  const [stats, setStats] = useState<DashboardStats>({
    totalChats: 0,
    totalMessages: 0,
    recentChats: [],
  });
  const [loading, setLoading] = useState(true);
  const theme = useTheme();
  const router = useRouter();

  useEffect(() => {
    loadDashboardStats();
    const subscription = subscribeToUpdates();
    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const loadDashboardStats = async () => {
    if (!session?.user.id) return;

    try {
      // Get total chats
      const { count: totalChats } = await supabase
        .from('conversation_participants')
        .select('*', { count: 'exact' })
        .eq('profile_id', session.user.id);

      // Get total messages
      const { count: totalMessages } = await supabase
        .from('messages')
        .select('*', { count: 'exact' })
        .eq('sender_id', session.user.id);

      // Get recent chats
      const { data: recentChatsData } = await supabase
        .from('conversations')
        .select(`
          id,
          updated_at,
          messages (
            content,
            created_at
          ),
          conversation_participants!inner (
            profiles!inner (
              username,
              avatar_url
            )
          )
        `)
        .order('updated_at', { ascending: false })
        .limit(3);

      const recentChats = (recentChatsData || []).map(chat => {
        const otherParticipant = chat.conversation_participants
          .find(p => p.profiles.username !== profile?.username)?.profiles;

        return {
          id: chat.id,
          participant: {
            username: otherParticipant?.username || 'Unknown User',
            avatar_url: otherParticipant?.avatar_url,
          },
          lastMessage: chat.messages[0]?.content || 'No messages yet',
          lastMessageTime: chat.messages[0]?.created_at || chat.updated_at,
        };
      });

      setStats({
        totalChats: totalChats || 0,
        totalMessages: totalMessages || 0,
        recentChats,
      });
    } catch (error) {
      console.error('Error loading dashboard stats:', error);
    } finally {
      setLoading(false);
    }
  };

  // Add subscription for real-time updates
  const subscribeToUpdates = () => {
    return supabase
      .channel('dashboard_updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'messages',
        },
        () => {
          // Reload stats when new messages arrive
          loadDashboardStats();
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'conversations',
        },
        () => {
          // Reload stats when conversations change
          loadDashboardStats();
        }
      )
      .subscribe();
  };

  // Add refresh functionality
  const [refreshing, setRefreshing] = useState(false);
  const onRefresh = async () => {
    setRefreshing(true);
    await loadDashboardStats();
    setRefreshing(false);
  };

  if (loading) return <Loading />;

  return (
    <ScrollView 
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      {/* Welcome Card */}
      <Card style={styles.welcomeCard}>
        <Card.Content style={styles.welcomeContent}>
          <Avatar.Image
            size={60}
            source={
              profile?.avatar_url
                ? { uri: profile.avatar_url }
                : require('../../assets/default-avatar.png')
            }
          />
          <View style={styles.welcomeText}>
            <Text variant="titleLarge">Welcome back,</Text>
            <Text variant="headlineSmall" style={styles.username}>
              {profile?.username || 'User'}
            </Text>
          </View>
        </Card.Content>
      </Card>

      {/* Stats Cards */}
      <View style={styles.statsContainer}>
        <Surface style={[styles.statCard, { backgroundColor: theme.colors.primaryContainer }]}>
          <Text variant="titleLarge">{stats.totalChats}</Text>
          <Text variant="labelMedium">Active Chats</Text>
        </Surface>
        <Surface style={[styles.statCard, { backgroundColor: theme.colors.secondaryContainer }]}>
          <Text variant="titleLarge">{stats.totalMessages}</Text>
          <Text variant="labelMedium">Messages Sent</Text>
        </Surface>
      </View>

      {/* Recent Activity */}
      <Card style={styles.recentCard}>
        <Card.Content>
          <View style={styles.cardHeader}>
            <Text variant="titleMedium" style={styles.sectionTitle}>Recent Chats</Text>
            <Button 
              mode="text" 
              onPress={() => router.push('/chats')}
            >
              See All
            </Button>
          </View>
          {stats.recentChats.length > 0 ? (
            stats.recentChats.map((chat) => (
              <Button
                key={chat.id}
                mode="outlined"
                style={styles.chatButton}
                contentStyle={styles.chatButtonContent}
                onPress={() => router.push(`/chat/${chat.id}`)}
              >
                <Avatar.Image
                  size={40}
                  source={
                    chat.participant.avatar_url
                      ? { uri: chat.participant.avatar_url }
                      : require('../../assets/default-avatar.png')
                  }
                />
                <View style={styles.chatInfo}>
                  <Text variant="labelLarge">{chat.participant.username}</Text>
                  <Text variant="bodySmall" numberOfLines={1} style={styles.lastMessage}>
                    {chat.lastMessage}
                  </Text>
                  <Text variant="labelSmall" style={styles.timeText}>
                    {formatDistanceToNow(new Date(chat.lastMessageTime), { addSuffix: true })}
                  </Text>
                </View>
              </Button>
            ))
          ) : (
            <View style={styles.emptyState}>
              <Text variant="bodyMedium" style={styles.emptyText}>No recent chats</Text>
              <Button 
                mode="contained" 
                onPress={() => router.push('/search')}
                style={styles.startChatButton}
              >
                Start a Chat
              </Button>
            </View>
          )}
        </Card.Content>
      </Card>

      {/* Quick Actions */}
      <Card style={styles.actionsCard}>
        <Card.Content>
          <Text variant="titleMedium" style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.actions}>
            <Button
              mode="contained"
              icon="message-plus"
              onPress={() => router.push('/search')}
              style={styles.actionButton}
            >
              New Chat
            </Button>
            <Button
              mode="contained"
              icon="account"
              onPress={() => router.push('/profile')}
              style={styles.actionButton}
            >
              Profile
            </Button>
            <Button
              mode="contained"
              icon="cog"
              onPress={() => router.push('/settings')}
              style={styles.actionButton}
            >
              Settings
            </Button>
          </View>
        </Card.Content>
      </Card>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  welcomeCard: {
    marginBottom: 16,
  },
  welcomeContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  welcomeText: {
    marginLeft: 16,
  },
  username: {
    fontWeight: 'bold',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  statCard: {
    flex: 1,
    margin: 4,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    elevation: 2,
  },
  recentCard: {
    marginBottom: 16,
  },
  sectionTitle: {
    marginBottom: 12,
    fontWeight: 'bold',
  },
  chatButton: {
    marginBottom: 8,
  },
  chatButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    padding: 8,
  },
  chatInfo: {
    marginLeft: 12,
    flex: 1,
  },
  timeText: {
    opacity: 0.6,
  },
  actionsCard: {
    marginBottom: 16,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  actionButton: {
    flex: 1,
    marginHorizontal: 4,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  emptyState: {
    alignItems: 'center',
    padding: 20,
  },
  emptyText: {
    opacity: 0.7,
    marginBottom: 12,
  },
  startChatButton: {
    marginTop: 8,
  },
  lastMessage: {
    opacity: 0.7,
    marginVertical: 4,
  },
}); 