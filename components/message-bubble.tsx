import { View, StyleSheet } from 'react-native';
import { Text, Avatar, useTheme, ActivityIndicator } from 'react-native-paper';
import { format } from 'date-fns';

type MessageBubbleProps = {
  content: string;
  timestamp: string;
  isOwn: boolean;
  sender: {
    username: string;
    avatar_url?: string;
  };
  pending?: boolean;
};

const formatMessageTime = (timestamp: string) => {
  try {
    return format(new Date(timestamp), 'HH:mm');
  } catch (error) {
    console.error('Error formatting time:', error);
    return '';
  }
};

export function MessageBubble({ content, timestamp, isOwn, sender, pending }: MessageBubbleProps) {
  const theme = useTheme();

  return (
    <View
      style={[
        styles.container,
        isOwn ? styles.ownMessage : styles.otherMessage,
        { backgroundColor: isOwn ? theme.colors.primaryContainer : theme.colors.surfaceVariant }
      ]}
    >
      {!isOwn && (
        <Avatar.Image
          size={30}
          source={
            sender.avatar_url
              ? { uri: sender.avatar_url }
              : require('../assets/default-avatar.png')
          }
          style={styles.avatar}
        />
      )}
      <View style={styles.contentContainer}>
        {!isOwn && (
          <Text variant="labelSmall" style={styles.username}>
            {sender.username}
          </Text>
        )}
        <Text>{content}</Text>
        <View style={styles.footer}>
          <Text variant="labelSmall" style={styles.timestamp}>
            {pending ? 'Sending...' : formatMessageTime(timestamp)}
          </Text>
          {pending && (
            <ActivityIndicator size={12} style={styles.pendingIndicator} />
          )}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    padding: 8,
    marginVertical: 4,
    marginHorizontal: 8,
    maxWidth: '80%',
    borderRadius: 12,
  },
  ownMessage: {
    alignSelf: 'flex-end',
  },
  otherMessage: {
    alignSelf: 'flex-start',
  },
  avatar: {
    marginRight: 8,
  },
  contentContainer: {
    flex: 1,
  },
  username: {
    marginBottom: 4,
    opacity: 0.7,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginTop: 4,
  },
  timestamp: {
    opacity: 0.5,
  },
  pendingIndicator: {
    marginLeft: 4,
  },
}); 