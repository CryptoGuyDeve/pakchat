import { Redirect } from 'expo-router';

// This redirects the root route to the welcome screen
export default function Index() {
  return <Redirect href="/(auth)/welcome" replace />;
} 