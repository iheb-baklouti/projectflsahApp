import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MMKV } from 'react-native-mmkv';

// Storage persistant pour le cache
const storage = new MMKV({
  id: 'react-query-cache',
});

// Configuration optimisée du QueryClient
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Cache pendant 5 minutes par défaut
      staleTime: 5 * 60 * 1000,
      // Garde en cache pendant 10 minutes
      gcTime: 10 * 60 * 1000,
      // Retry automatique en cas d'erreur
      retry: (failureCount, error: any) => {
        // Ne pas retry pour les erreurs 4xx
        if (error?.status >= 400 && error?.status < 500) {
          return false;
        }
        return failureCount < 3;
      },
      // Refetch en arrière-plan quand l'app revient au premier plan
      refetchOnWindowFocus: true,
      // Refetch quand la connexion revient
      refetchOnReconnect: true,
    },
    mutations: {
      // Retry automatique pour les mutations
      retry: 1,
    },
  },
});

export const QueryProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
};

export { queryClient };