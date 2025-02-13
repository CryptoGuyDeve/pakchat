import { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { Searchbar, List, Avatar, ActivityIndicator, Text } from 'react-native-paper';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../lib/auth';
import { router } from 'expo-router';

type SearchResult = {
  id: string;
  username: string;
  avatar_url?: string;
};

export default function Search() {
  const { session } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [creatingChat, setCreatingChat] = useState(false);
  const [error, setError] = useState('');

  const onSearch = async (query: string) => {
    if (!query.trim()) {
      setResults([]);
      return;
    }

    setLoading(true);
    setError('');

    try {
      console.log('Searching for:', query); // Debug log
      const { data, error } = await supabase
        .from('profiles')
        .select('id, username, avatar_url')
        .neq('id', session?.user.id)
        .ilike('username', `%${query}%`)
        .limit(10);

      if (error) {
        console.error('Search error:', error); // Debug log
        throw error;
      }

      console.log('Search results:', data); // Debug log
      setResults(data || []);
    } catch (error) {
      console.error('Error searching users:', error);
      setError('Failed to search users');
    } finally {
      setLoading(false);
    }
  };

  const startChat = async (userId: string) => {
    if (!session?.user.id) return;
    setCreatingChat(true);
    setError('');

    try {
      // Check if chat already exists
      const { data: existingChats, error: checkError } = await supabase
        .from('conversation_participants')
        .select('conversation_id')
        .eq('profile_id', session.user.id);

      if (checkError) throw checkError;

      if (existingChats && existingChats.length > 0) {
        const { data: existingChat, error: matchError } = await supabase
          .from('conversation_participants')
          .select('conversation_id')
          .eq('profile_id', userId)
          .in('conversation_id', existingChats.map(chat => chat.conversation_id))
          .single();

        if (existingChat) {
          router.push(`/chat/${existingChat.conversation_id}`);
          return;
        }
      }

      // Create new conversation
      const { data: newConversation, error: conversationError } = await supabase
        .from('conversations')
        .insert({})
        .select()
        .single();

      if (conversationError) throw conversationError;

      // Add participants
      const { error: participantsError } = await supabase
        .from('conversation_participants')
        .insert([
          { conversation_id: newConversation.id, profile_id: session.user.id },
          { conversation_id: newConversation.id, profile_id: userId }
        ]);

      if (participantsError) throw participantsError;

      router.push(`/chat/${newConversation.id}`);
    } catch (error) {
      console.error('Error creating chat:', error);
      setError('Failed to create chat');
    } finally {
      setCreatingChat(false);
    }
  };

  return (
    <View style={styles.container}>
      <Searchbar
        placeholder="Search users..."
        onChangeText={setSearchQuery}
        value={searchQuery}
        onSubmitEditing={() => onSearch(searchQuery)}
        style={styles.searchbar}
        loading={loading}
      />

      {error ? (
        <Text style={styles.error}>{error}</Text>
      ) : results.length === 0 && searchQuery.trim() ? (
        <Text style={styles.noResults}>No users found</Text>
      ) : (
        <List.Section>
          {results.map((user) => (
            <List.Item
              key={user.id}
              title={user.username}
              left={props => (
                <Avatar.Image
                  {...props}
                  size={40}
                  source={
                    user.avatar_url
                      ? { uri: user.avatar_url }
                      : require('../../assets/default-avatar.png')
                  }
                />
              )}
              right={props => 
                creatingChat ? (
                  <ActivityIndicator {...props} />
                ) : (
                  <List.Icon {...props} icon="message-plus" />
                )
              }
              onPress={() => startChat(user.id)}
            />
          ))}
        </List.Section>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  searchbar: {
    margin: 16,
  },
  error: {
    color: 'red',
    textAlign: 'center',
    margin: 16,
  },
  noResults: {
    textAlign: 'center',
    margin: 16,
    opacity: 0.7,
  },
}); 