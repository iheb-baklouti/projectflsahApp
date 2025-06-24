import { Stack } from 'expo-router';
import { useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Redirect } from 'expo-router';

export default function AuthLayout() {
  const { isAuthenticated, isLoading } = useAuth();
  
  // If authenticated, redirect to main app
  if (isAuthenticated && !isLoading) {
    return <Redirect href="/feed" />;
  }

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: '#ffffff' },
        animation: 'fade',
      }}
    />
  );
}