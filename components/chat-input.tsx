import { View, StyleSheet, Keyboard } from 'react-native';
import { TextInput, IconButton, useTheme } from 'react-native-paper';
import { useState } from 'react';

type ChatInputProps = {
  onSend: (message: string) => Promise<void>;
  disabled?: boolean;
};

export function ChatInput({ onSend, disabled }: ChatInputProps) {
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const theme = useTheme();

  const handleSend = async () => {
    if (!message.trim() || sending) return;

    try {
      setSending(true);
      await onSend(message);
      setMessage('');
      Keyboard.dismiss();
    } finally {
      setSending(false);
    }
  };

  return (
    <View style={styles.container}>
      <TextInput
        mode="outlined"
        placeholder="Type a message..."
        value={message}
        onChangeText={setMessage}
        style={styles.input}
        disabled={disabled}
        right={
          <TextInput.Icon
            icon="send"
            disabled={!message.trim() || sending || disabled}
            onPress={handleSend}
            color={() => theme.colors.primary}
          />
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(0, 0, 0, 0.1)',
  },
  input: {
    backgroundColor: 'transparent',
  },
}); 