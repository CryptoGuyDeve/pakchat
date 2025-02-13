import { StyleSheet, View } from 'react-native';
import { Button, Text } from 'react-native-paper';
import { Link } from 'expo-router';

export default function Welcome() {
  return (
    <View style={styles.container}>
      <Text variant="displaySmall" style={styles.title}>
        Welcome to ChatApp
      </Text>
      <Text variant="bodyLarge" style={styles.subtitle}>
        Connect with friends and start chatting
      </Text>

      <View style={styles.buttons}>
        <Link href="/login" asChild>
          <Button mode="contained" style={styles.button}>
            Login
          </Button>
        </Link>
        <Link href="/signup" asChild>
          <Button mode="outlined" style={styles.button}>
            Sign Up
          </Button>
        </Link>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    textAlign: 'center',
    marginBottom: 10,
  },
  subtitle: {
    textAlign: 'center',
    marginBottom: 30,
    opacity: 0.7,
  },
  buttons: {
    width: '100%',
    maxWidth: 400,
    gap: 10,
  },
  button: {
    width: '100%',
  },
}); 