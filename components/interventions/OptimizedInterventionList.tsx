import React, { useCallback } from 'react';
import { FlatList, RefreshControl, ActivityIndicator, View, Text } from 'react-native';
import { useOptimizedInterventions, useTakeIntervention } from '@/hooks/useOptimizedInterventions';
import { InterventionCard } from './InterventionCard';
import { EmptyState } from '@/components/ui/EmptyState';
import { useTheme } from '@/hooks/useTheme';
import { COLORS, DARK_COLORS } from '@/constants/Colors';

interface Props {
  filters?: any;
  onInterventionPress?: (id: string) => void;
}

export const OptimizedInterventionList: React.FC<Props> = ({ 
  filters = {}, 
  onInterventionPress 
}) => {
  const { theme } = useTheme();
  const colors = theme === 'dark' ? DARK_COLORS : COLORS;
  
  const {
    interventions,
    isLoading,
    error,
    refetch,
    loadMore,
    hasMore,
    isLoadingMore,
  } = useOptimizedInterventions(filters);

  const takeMutation = useTakeIntervention();

  const handleTakeIntervention = useCallback(async (id: string) => {
    try {
      await takeMutation.mutateAsync(id);
    } catch (error) {
      console.error('Erreur lors de la prise d\'intervention:', error);
    }
  }, [takeMutation]);

  const handleLoadMore = useCallback(() => {
    if (hasMore && !isLoadingMore) {
      loadMore();
    }
  }, [hasMore, isLoadingMore, loadMore]);

  const renderItem = useCallback(({ item }) => (
    <InterventionCard
      intervention={item}
      onTake={() => handleTakeIntervention(item.id)}
      isTakeable={item.status === 'NEW'}
      onPress={() => onInterventionPress?.(item.id)}
    />
  ), [handleTakeIntervention, onInterventionPress]);

  const renderFooter = useCallback(() => {
    if (!isLoadingMore) return null;
    
    return (
      <View style={{ padding: 20, alignItems: 'center' }}>
        <ActivityIndicator size="small" color={colors.primary} />
        <Text style={{ color: colors.textLight, marginTop: 8 }}>
          Chargement...
        </Text>
      </View>
    );
  }, [isLoadingMore, colors]);

  if (error) {
    return (
      <EmptyState
        title="Erreur de chargement"
        description={error}
        icon="alert"
      />
    );
  }

  return (
    <FlatList
      data={interventions}
      renderItem={renderItem}
      keyExtractor={(item) => item.id}
      refreshControl={
        <RefreshControl
          refreshing={isLoading}
          onRefresh={refetch}
          tintColor={colors.primary}
          colors={[colors.primary]}
        />
      }
      onEndReached={handleLoadMore}
      onEndReachedThreshold={0.5}
      ListFooterComponent={renderFooter}
      ListEmptyComponent={
        isLoading ? null : (
          <EmptyState
            title="Aucune intervention"
            description="Aucune intervention trouvée"
            icon="inbox"
          />
        )
      }
      contentContainerStyle={{ padding: 16, paddingBottom: 100 }}
      showsVerticalScrollIndicator={false}
      removeClippedSubviews={true} // Optimisation performance
      maxToRenderPerBatch={10} // Limite le rendu par batch
      windowSize={10} // Optimise la mémoire
    />
  );
};