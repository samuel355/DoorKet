import { useAuth } from '@/store/authStore';
import { Redirect } from 'expo-router';

export default function Index() {
  const { isAuthenticated, profile, isLoading } = useAuth();

  if (isLoading) {
    return null; // Could show a loading screen
  }

  if (!isAuthenticated || !profile) {
    return <Redirect href="/auth/welcome" />;
  }

  // Redirect based on user type
  switch (profile.user_type) {
    case 'student':
      return <Redirect href="/student" />;
    case 'runner':
      return <Redirect href="/runner" />;
    case 'admin':
      return <Redirect href="/admin" />;
    default:
      return <Redirect href="/auth/welcome" />;
  }
}
