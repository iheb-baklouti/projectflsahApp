import { Redirect } from 'expo-router';

export default function Index() {
  // Redirect to main feed or auth
  return <Redirect href="/feed" />;
}