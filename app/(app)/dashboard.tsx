import { View, StyleSheet } from 'react-native';
import { Button, Text } from 'react-native-paper';
import { useAuth } from '../../lib/auth';

export default function Dashboard() {
  const { signOut } = useAuth();

  return (
    <View style={styles.container}>
      <Text variant="headlineMedium">Dashboard</Text>
      <Button onPress={signOut}>Sign Out</Button>
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
}); 