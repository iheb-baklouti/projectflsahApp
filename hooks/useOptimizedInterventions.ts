import { useMemo } from 'react';
import { useInterventionsInfinite, useScheduledInterventions, useTakeIntervention } from './useInterventionsQuery';
import { InterventionFilters } from '@/services/apiService';

// Hook optimisé qui remplace useInterventions
export function useOptimizedInterventions(filters: InterventionFilters = {}) {
  const {
    data,
    isLoading,
    error,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    refetch,
  } = useInterventionsInfinite(filters);

  // Aplatir les pages en une seule liste
  const interventions = useMemo(() => {
    if (!data?.pages) return [];
    
    return data.pages.flatMap(page => {
      if (Array.isArray(page)) return page;
      if (page?.data && Array.isArray(page.data)) return page.data;
      return [];
    });
  }, [data]);

  // Métadonnées de pagination
  const paginationMeta = useMemo(() => {
    const lastPage = data?.pages?.[data.pages.length - 1];
    if (!lastPage?.meta) return null;
    
    return {
      currentPage: lastPage.meta.current_page || 1,
      totalPages: lastPage.meta.last_page || 1,
      totalItems: lastPage.meta.total || interventions.length,
      perPage: lastPage.meta.per_page || 20,
      from: lastPage.meta.from || 1,
      to: lastPage.meta.to || interventions.length,
    };
  }, [data, interventions.length]);

  return {
    // Data
    interventions,
    paginationMeta,
    
    // State
    isLoading,
    error: error?.message || null,
    
    // Actions
    refetch,
    loadMore: fetchNextPage,
    hasMore: hasNextPage,
    isLoadingMore: isFetchingNextPage,
  };
}

// Hook pour les interventions planifiées
export function useOptimizedScheduled() {
  const { data, isLoading, error, refetch } = useScheduledInterventions();
  
  const scheduledInterventions = useMemo(() => {
    if (Array.isArray(data)) return data;
    if (data?.data && Array.isArray(data.data)) return data.data;
    return [];
  }, [data]);

  return {
    scheduledInterventions,
    isLoading,
    error: error?.message || null,
    refetch,
  };
}

// Export du hook de mutation pour l'utiliser dans les composants
export { useTakeIntervention } from './useInterventionsQuery';