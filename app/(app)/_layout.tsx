import { Stack } from 'expo-router';
import { Tabs } from 'expo-router';
import { useTheme } from 'react-native-paper';
import Icon from '@expo/vector-icons/MaterialCommunityIcons';
import { ProtectedRoute } from '../../components/protected-route';

export default function AppLayout() {
  const theme = useTheme();

  return (
    <ProtectedRoute>
      <Tabs screenOptions={{ tabBarActiveTintColor: theme.colors.primary }}>
        <Tabs.Screen
          name="chats"
          options={{
            title: 'Chats',
            tabBarIcon: ({ color, size }) => (
              <Icon name="chat" size={size} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="search"
          options={{
            title: 'Search',
            tabBarIcon: ({ color, size }) => (
              <Icon name="magnify" size={size} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="profile"
          options={{
            title: 'Profile',
            tabBarIcon: ({ color, size }) => (
              <Icon name="account" size={size} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="about"
          options={{
            title: 'About Us',
            tabBarIcon: ({ color, size }) => (
              <Icon name="information" size={size} color={color} />
            ),
          }}
        />
      </Tabs>
    </ProtectedRoute>
  );
} 