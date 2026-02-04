import { Redirect } from 'expo-router';
import { useAuthStore } from '../src/stores/authStore';

export default function Index() {
  const { isAuthenticated, hasCompletedOnboarding } = useAuthStore();

  // Not authenticated -> go to login
  if (!isAuthenticated) {
    return <Redirect href="/(auth)/login" />;
  }

  // Authenticated but not completed onboarding -> go to onboarding
  if (!hasCompletedOnboarding) {
    return <Redirect href="/(auth)/set-app-id" />;
  }

  // Authenticated and completed onboarding -> go to home
  return <Redirect href="/(tabs)" />;
}
