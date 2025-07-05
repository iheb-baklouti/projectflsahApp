import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from '@tanstack/react-query';
import { useAuth } from './useAuth';
import ApiService, { isApiAvailable, InterventionFilters } from '@/services/apiService';
import { Intervention } from '@/types/intervention';
import { Alert } from 'react-native';

// Clés de requête pour une gestion optimisée du cache
export const interventionKeys = {
  all: ['interventions'] as const,
  lists: () => [...interventionKeys.all, 'list'] as const,
  list: (filters: InterventionFilters) => [...interventionKeys.lists(), filters] as const,
  details: () => [...interventionKeys.all, 'detail'] as const,
  detail: (id: string) => [...interventionKeys.details(), id] as const,
  scheduled: () => [...interventionKeys.all, 'scheduled'] as const,
  completed: () => [...interventionKeys.all, 'completed'] as const,
};

// Hook principal pour les interventions avec pagination infinie
export function useInterventionsInfinite(filters: InterventionFilters = {}) {
  const { token } = useAuth();
  
  return useInfiniteQuery({
    queryKey: interventionKeys.list(filters),
    queryFn: async ({ pageParam }) => {
      if (!token) throw new Error('Non authentifié');
      
      const available = await isApiAvailable();
      if (!available) {
        // Retourner les données mock
        return getMockInterventions(pageParam, filters);
      }
      
      const response = await ApiService.getInterventions(token, {
        ...filters,
        page: pageParam,
        per_page: filters.per_page || 20,
      });
      
      if (!response.success) {
        throw new Error(response.message || 'Erreur API');
      }
      
      return response.data;
    },
    initialPageParam: 1, // Paramètre requis pour TanStack Query v5
    getNextPageParam: (lastPage: any) => {
      if (!lastPage?.meta) return undefined;
      const { current_page, last_page } = lastPage.meta;
      return current_page < last_page ? current_page + 1 : undefined;
    },
    enabled: !!token,
    staleTime: 2 * 60 * 1000, // 2 minutes pour les interventions (données critiques)
  });
}

// Hook pour les interventions planifiées
export function useScheduledInterventions() {
  const { token } = useAuth();
  
  return useQuery({
    queryKey: interventionKeys.scheduled(),
    queryFn: async () => {
      if (!token) throw new Error('Non authentifié');
      
      const available = await isApiAvailable();
      if (!available) {
        return getMockScheduledInterventions();
      }
      
      const response = await ApiService.getScheduledInterventions(token, {
        date_from: new Date().toISOString().split('T')[0],
        sort_by: 'scheduled_at',
        sort_order: 'asc',
      });
      
      return response.data;
    },
    enabled: !!token,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

// Hook pour une intervention spécifique
export function useIntervention(id: string) {
  const { token } = useAuth();
  
  return useQuery({
    queryKey: interventionKeys.detail(id),
    queryFn: async () => {
      if (!token) throw new Error('Non authentifié');
      
      const available = await isApiAvailable();
      if (!available) {
        return getMockIntervention(id);
      }
      
      const response = await ApiService.getInterventionById(token, id);
      return response.data;
    },
    enabled: !!token && !!id,
    staleTime: 1 * 60 * 1000, // 1 minute pour les détails
  });
}

// Mutation pour accepter une intervention - MISE À JOUR pour utiliser assign-to-me
export function useTakeIntervention() {
  const queryClient = useQueryClient();
  const { token } = useAuth();
  
  return useMutation({
    mutationFn: async (interventionId: string) => {
      if (!token) throw new Error('Non authentifié');
      
      const available = await isApiAvailable();
      if (!available) {
        // Simulation mock
        await new Promise(resolve => setTimeout(resolve, 500));
        return { success: true };
      }
      
      try {
        // Utiliser la nouvelle API assign-to-me
        return await ApiService.assignInterventionToMe(token, interventionId);
      } catch (error: any) {
        // Gérer les erreurs spécifiques
        if (error.status === 403) {
          Alert.alert(
            'Non autorisé', 
            error.message || 'Vous n\'êtes pas autorisé à prendre cette intervention'
          );
        }
        throw error;
      }
    },
    onSuccess: (data, interventionId) => {
      // Invalider et refetch les listes d'interventions
      queryClient.invalidateQueries({ queryKey: interventionKeys.lists() });
      
      // Mettre à jour l'intervention spécifique dans le cache
      queryClient.setQueryData(
        interventionKeys.detail(interventionId),
        (old: any) => old ? { ...old, status: 'ACCEPTED' } : old
      );
      
      // Optimistic update pour une UX instantanée
      queryClient.setQueriesData(
        { queryKey: interventionKeys.lists() },
        (old: any) => {
          if (!old?.pages) return old;
          
          return {
            ...old,
            pages: old.pages.map((page: any) => ({
              ...page,
              data: page.data?.map((intervention: Intervention) =>
                intervention.id === interventionId
                  ? { ...intervention, status: 'ACCEPTED' as const }
                  : intervention
              ),
            })),
          };
        }
      );
    },
    onError: (error) => {
      console.error('Erreur lors de la prise d\'intervention:', error);
      // En cas d'erreur, invalider pour refetch les vraies données
      queryClient.invalidateQueries({ queryKey: interventionKeys.lists() });
    },
  });
}

// Mutation pour mettre à jour le statut
export function useUpdateInterventionStatus() {
  const queryClient = useQueryClient();
  const { token } = useAuth();
  
  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: Intervention['status'] }) => {
      if (!token) throw new Error('Non authentifié');
      
      const available = await isApiAvailable();
      if (!available) {
        await new Promise(resolve => setTimeout(resolve, 500));
        return { success: true };
      }
      
      return ApiService.updateIntervention(token, id, { status });
    },
    onSuccess: (data, { id, status }) => {
      // Mise à jour optimiste
      queryClient.setQueryData(
        interventionKeys.detail(id),
        (old: any) => old ? { ...old, status } : old
      );
      
      // Invalider les listes pour refetch
      queryClient.invalidateQueries({ queryKey: interventionKeys.lists() });
    },
  });
}

// Fonctions mock (simplifiées)
async function getMockInterventions(page: number, filters: InterventionFilters) {
  // Simuler un délai réseau
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // Données mock basiques
  const mockData = [
    {
      id: `mock_${page}_1`,
      clientName: 'Client Mock',
      address: 'Adresse Mock',
      serviceType: 'Service Mock',
      status: 'NEW',
      isUrgent: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
  ];

  return {
    data: page === 1 ? mockData : [], // Seulement des données sur la première page
    meta: {
      current_page: page,
      last_page: 1,
      total: mockData.length,
      per_page: 20,
      from: 1,
      to: mockData.length,
    },
  };
}

async function getMockScheduledInterventions() {
  await new Promise(resolve => setTimeout(resolve, 500));
  return { 
    data: [],
    meta: {
      current_page: 1,
      last_page: 1,
      total: 0,
    }
  };
}

async function getMockIntervention(id: string) {
  await new Promise(resolve => setTimeout(resolve, 500));
  return { 
    data: {
      id,
      clientName: 'Client Mock',
      address: 'Adresse Mock',
      serviceType: 'Service Mock',
      status: 'NEW',
      isUrgent: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
  };
}