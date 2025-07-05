import React, { useState, useCallback, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, RefreshControl, TouchableOpacity, Modal, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLanguage } from '@/hooks/useLanguage';
import { useInterventions, InterventionListOptions } from '@/hooks/useInterventions';
import { useTheme } from '@/hooks/useTheme';
import { translations } from '@/constants/Translations';
import { COLORS, DARK_COLORS } from '@/constants/Colors';
import { InterventionCard } from '@/components/interventions/InterventionCard';
import { HeaderBar } from '@/components/ui/HeaderBar';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { Calendar, Search, Filter, TrendingUp, Clock, CircleCheck as CheckCircle, Circle as XCircle, ChevronLeft, ChevronRight, MoveHorizontal as MoreHorizontal, RefreshCw } from 'lucide-react-native';
import { EmptyState } from '@/components/ui/EmptyState';
import { Intervention } from '@/types/intervention';
import { useFocusEffect } from '@react-navigation/native';

type FilterType = 'all' | 'completed' | 'cancelled' | 'thisWeek' | 'thisMonth';
type SortType = 'updated_at' | 'created_at' | 'amount' | 'client';

export default function HistoryScreen() {
  const { language } = useLanguage();
  const { theme } = useTheme();
  const t = translations[language];
  const colors = theme === 'dark' ? DARK_COLORS : COLORS;
  
  const { 
    interventions,
    isLoading,
    paginationMeta,
    loadCompletedInterventions, // ✅ Utiliser la fonction pour les interventions terminées
    refreshCompletedInterventions,
    apiAvailable
  } = useInterventions();
  
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState<FilterType>('all');
  const [sortBy, setSortBy] = useState<SortType>('updated_at');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const [perPage, setPerPage] = useState(10);
  const [apiStatus, setApiStatus] = useState<'loading' | 'connecting' | 'retrying' | 'timeout'>('loading');

  // ✅ NOUVEAU: Recharger automatiquement quand on revient sur cette page
  useFocusEffect(
    useCallback(() => {
      console.log('📱 History screen focused - Rechargement des interventions terminées...');
      loadData();
    }, [])
  );

  // Mettre à jour le statut API en fonction de l'état de chargement
  useEffect(() => {
    if (isLoading && !refreshing) {
      if (apiAvailable) {
        setApiStatus('connecting');
        
        // Après 3 secondes, passer à "retrying" si toujours en chargement
        const timeoutId = setTimeout(() => {
          if (isLoading) {
            setApiStatus('retrying');
          }
        }, 3000);
        
        // Après 7 secondes, passer à "timeout" si toujours en chargement
        const timeoutId2 = setTimeout(() => {
          if (isLoading) {
            setApiStatus('timeout');
          }
        }, 7000);
        
        return () => {
          clearTimeout(timeoutId);
          clearTimeout(timeoutId2);
        };
      } else {
        setApiStatus('loading');
      }
    } else {
      setApiStatus('loading');
    }
  }, [isLoading, apiAvailable, refreshing]);

  // ✅ Charger les interventions terminées au montage
  useEffect(() => {
    loadData();
  }, []);

  // Recharger les données quand les filtres changent
  useEffect(() => {
    if (currentPage === 1) {
      loadData();
    } else {
      setCurrentPage(1);
    }
  }, [searchQuery, perPage]);

  // Recharger les données quand la page change
  useEffect(() => {
    if (currentPage > 1) {
      loadData();
    }
  }, [currentPage]);

  const loadData = useCallback(async () => {
    const options: InterventionListOptions = {
      page: currentPage,
      perPage,
      search: searchQuery.trim() || undefined,
      sortBy: sortBy === 'amount' ? 'updated_at' : sortBy === 'client' ? 'updated_at' : sortBy,
      sortOrder,
    };

    // Ajouter des filtres de date selon le filtre sélectionné
    if (selectedFilter === 'thisWeek') {
      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
      options.dateFrom = oneWeekAgo.toISOString().split('T')[0];
    } else if (selectedFilter === 'thisMonth') {
      const oneMonthAgo = new Date();
      oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
      options.dateFrom = oneMonthAgo.toISOString().split('T')[0];
    }

    // ✅ Charger seulement les interventions terminées
    await loadCompletedInterventions(options);
  }, [currentPage, perPage, searchQuery, selectedFilter, sortBy, sortOrder, loadCompletedInterventions]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    setCurrentPage(1);
    await loadData();
    setRefreshing(false);
  }, [loadData]);

  // ✅ NOUVEAU: Fonction pour refresh manuel avec bouton
  const handleManualRefresh = useCallback(async () => {
    console.log('🔄 Refresh manuel historique déclenché');
    await loadData();
  }, [loadData]);

  const toggleSearch = () => {
    setShowSearch(!showSearch);
    if (showSearch) {
      setSearchQuery('');
    }
  };

  const clearFilters = () => {
    setSelectedFilter('all');
    setSortBy('updated_at');
    setSortOrder('desc');
    setSearchQuery('');
    setCurrentPage(1);
  };

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= (paginationMeta?.totalPages || 1)) {
      setCurrentPage(newPage);
    }
  };

  // Statistiques calculées à partir des données actuelles
  const stats = React.useMemo(() => {
    const total = paginationMeta?.totalItems || interventions.length;
    const completed = interventions.filter(i => i.status === 'COMPLETED').length;
    const cancelled = interventions.filter(i => i.status === 'CANCELLED').length;
    const totalRevenue = interventions
      .filter(i => i.status === 'COMPLETED' && i.totalAmount)
      .reduce((sum, i) => sum + (i.totalAmount || 0), 0);

    return { total, completed, cancelled, totalRevenue };
  }, [interventions, paginationMeta]);

  const renderItem = ({ item }: { item: Intervention }) => (
    <InterventionCard
      intervention={item}
      showDetails={true}
      isHistorical={true}
    />
  );

  const renderPagination = () => {
    if (!paginationMeta || paginationMeta.totalPages <= 1) return null;

    const { currentPage: page, totalPages } = paginationMeta;
    const pages = [];
    
    // Calculer les pages à afficher
    let startPage = Math.max(1, page - 2);
    let endPage = Math.min(totalPages, page + 2);
    
    // Ajuster si on est près du début ou de la fin
    if (endPage - startPage < 4) {
      if (startPage === 1) {
        endPage = Math.min(totalPages, startPage + 4);
      } else if (endPage === totalPages) {
        startPage = Math.max(1, endPage - 4);
      }
    }

    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }

    return (
      <View style={[styles.paginationContainer, { backgroundColor: colors.card }]}>
        <View style={styles.paginationInfo}>
          <Text style={[styles.paginationText, { color: colors.textLight }]}>
            {paginationMeta.from}-{paginationMeta.to} sur {paginationMeta.totalItems}
          </Text>
        </View>
        
        <View style={styles.paginationControls}>
          <TouchableOpacity
            style={[
              styles.paginationButton,
              page === 1 && styles.paginationButtonDisabled,
              { borderColor: colors.border }
            ]}
            onPress={() => handlePageChange(page - 1)}
            disabled={page === 1}
          >
            <ChevronLeft size={16} color={page === 1 ? colors.border : colors.text} />
          </TouchableOpacity>

          {startPage > 1 && (
            <>
              <TouchableOpacity
                style={[styles.paginationButton, { borderColor: colors.border }]}
                onPress={() => handlePageChange(1)}
              >
                <Text style={[styles.paginationButtonText, { color: colors.text }]}>1</Text>
              </TouchableOpacity>
              {startPage > 2 && (
                <View style={styles.paginationEllipsis}>
                  <MoreHorizontal size={16} color={colors.textLight} />
                </View>
              )}
            </>
          )}

          {pages.map((pageNum) => (
            <TouchableOpacity
              key={pageNum}
              style={[
                styles.paginationButton,
                { borderColor: colors.border },
                pageNum === page && { backgroundColor: colors.primary, borderColor: colors.primary }
              ]}
              onPress={() => handlePageChange(pageNum)}
            >
              <Text style={[
                styles.paginationButtonText,
                { color: pageNum === page ? colors.buttonText : colors.text }
              ]}>
                {pageNum}
              </Text>
            </TouchableOpacity>
          ))}

          {endPage < totalPages && (
            <>
              {endPage < totalPages - 1 && (
                <View style={styles.paginationEllipsis}>
                  <MoreHorizontal size={16} color={colors.textLight} />
                </View>
              )}
              <TouchableOpacity
                style={[styles.paginationButton, { borderColor: colors.border }]}
                onPress={() => handlePageChange(totalPages)}
              >
                <Text style={[styles.paginationButtonText, { color: colors.text }]}>
                  {totalPages}
                </Text>
              </TouchableOpacity>
            </>
          )}

          <TouchableOpacity
            style={[
              styles.paginationButton,
              page === totalPages && styles.paginationButtonDisabled,
              { borderColor: colors.border }
            ]}
            onPress={() => handlePageChange(page + 1)}
            disabled={page === totalPages}
          >
            <ChevronRight size={16} color={page === totalPages ? colors.border : colors.text} />
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const FilterModal = () => (
    <Modal
      visible={showFilterModal}
      transparent
      animationType="slide"
      onRequestClose={() => setShowFilterModal(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
          <Text style={[styles.modalTitle, { color: colors.text }]}>Filtres et tri</Text>
          
          <View style={styles.filterSection}>
            <Text style={[styles.filterSectionTitle, { color: colors.text }]}>Filtrer par</Text>
            {[
              { key: 'all', label: 'Toutes les interventions', icon: '📋' },
              { key: 'completed', label: 'Terminées', icon: '✅' },
              { key: 'cancelled', label: 'Annulées', icon: '❌' },
              { key: 'thisWeek', label: 'Cette semaine', icon: '📅' },
              { key: 'thisMonth', label: 'Ce mois', icon: '🗓️' },
            ].map((filter) => (
              <TouchableOpacity
                key={filter.key}
                style={[
                  styles.filterOption,
                  { backgroundColor: colors.background },
                  selectedFilter === filter.key && { backgroundColor: colors.primary }
                ]}
                onPress={() => setSelectedFilter(filter.key as FilterType)}
              >
                <Text style={styles.filterIcon}>{filter.icon}</Text>
                <Text style={[
                  styles.filterLabel,
                  { color: colors.text },
                  selectedFilter === filter.key && { color: colors.buttonText, fontWeight: '600' }
                ]}>
                  {filter.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <View style={styles.filterSection}>
            <Text style={[styles.filterSectionTitle, { color: colors.text }]}>Trier par</Text>
            {[
              { key: 'updated_at', label: 'Date (plus récent)', icon: '📅' },
              { key: 'created_at', label: 'Date de création', icon: '🆕' },
              { key: 'amount', label: 'Montant', icon: '💰' },
              { key: 'client', label: 'Client (A-Z)', icon: '👤' },
            ].map((sort) => (
              <TouchableOpacity
                key={sort.key}
                style={[
                  styles.filterOption,
                  { backgroundColor: colors.background },
                  sortBy === sort.key && { backgroundColor: colors.primary }
                ]}
                onPress={() => setSortBy(sort.key as SortType)}
              >
                <Text style={styles.filterIcon}>{sort.icon}</Text>
                <Text style={[
                  styles.filterLabel,
                  { color: colors.text },
                  sortBy === sort.key && { color: colors.buttonText, fontWeight: '600' }
                ]}>
                  {sort.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <View style={styles.filterSection}>
            <Text style={[styles.filterSectionTitle, { color: colors.text }]}>Ordre</Text>
            <View style={styles.sortOrderContainer}>
              <TouchableOpacity
                style={[
                  styles.sortOrderButton,
                  { backgroundColor: colors.background, borderColor: colors.border },
                  sortOrder === 'desc' && { backgroundColor: colors.primary, borderColor: colors.primary }
                ]}
                onPress={() => setSortOrder('desc')}
              >
                <Text style={[
                  styles.sortOrderText,
                  { color: colors.text },
                  sortOrder === 'desc' && { color: colors.buttonText, fontWeight: '600' }
                ]}>
                  Décroissant
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.sortOrderButton,
                  { backgroundColor: colors.background, borderColor: colors.border },
                  sortOrder === 'asc' && { backgroundColor: colors.primary, borderColor: colors.primary }
                ]}
                onPress={() => setSortOrder('asc')}
              >
                <Text style={[
                  styles.sortOrderText,
                  { color: colors.text },
                  sortOrder === 'asc' && { color: colors.buttonText, fontWeight: '600' }
                ]}>
                  Croissant
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.filterSection}>
            <Text style={[styles.filterSectionTitle, { color: colors.text }]}>Éléments par page</Text>
            <View style={styles.perPageContainer}>
              {[5, 10, 20, 50].map((count) => (
                <TouchableOpacity
                  key={count}
                  style={[
                    styles.perPageButton,
                    { backgroundColor: colors.background, borderColor: colors.border },
                    perPage === count && { backgroundColor: colors.primary, borderColor: colors.primary }
                  ]}
                  onPress={() => setPerPage(count)}
                >
                  <Text style={[
                    styles.perPageText,
                    { color: colors.text },
                    perPage === count && { color: colors.buttonText, fontWeight: '600' }
                  ]}>
                    {count}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.modalActions}>
            <TouchableOpacity
              style={[styles.clearFiltersButton, { backgroundColor: colors.background, borderColor: colors.border }]}
              onPress={clearFilters}
            >
              <Text style={[styles.clearFiltersText, { color: colors.text }]}>Réinitialiser</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.closeModalButton, { backgroundColor: colors.text }]}
              onPress={() => setShowFilterModal(false)}
            >
              <Text style={[styles.closeModalButtonText, { color: colors.primary }]}>Appliquer</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );

  const dynamicStyles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    searchContainer: {
      backgroundColor: colors.card,
      paddingHorizontal: 16,
      paddingVertical: 8,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    searchInput: {
      backgroundColor: colors.background,
      borderRadius: 8,
      paddingHorizontal: 12,
      paddingVertical: 8,
      fontSize: 16,
      color: colors.text,
    },
    statsContainer: {
      flexDirection: 'row',
      paddingHorizontal: 16,
      paddingVertical: 12,
      gap: 8,
    },
    statCard: {
      flex: 1,
      backgroundColor: colors.card,
      borderRadius: 8,
      padding: 12,
      alignItems: 'center',
      shadowColor: colors.shadow,
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 2,
      elevation: 2,
    },
    statNumber: {
      fontSize: 18,
      fontWeight: 'bold',
      color: colors.text,
      marginTop: 4,
    },
    statLabel: {
      fontSize: 12,
      color: colors.textLight,
      marginTop: 2,
    },
    euroIcon: {
      fontSize: 20,
      fontWeight: 'bold',
      color: colors.primary,
    },
    activeFiltersContainer: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: 16,
      paddingVertical: 8,
      backgroundColor: colors.card,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    activeFiltersText: {
      fontSize: 14,
      color: colors.textLight,
      flex: 1,
    },
    clearFiltersButtonSmall: {
      paddingHorizontal: 12,
      paddingVertical: 4,
      backgroundColor: colors.primary,
      borderRadius: 4,
    },
    clearFiltersTextSmall: {
      fontSize: 12,
      color: colors.buttonText,
      fontWeight: '600',
    },
    listContainer: {
      padding: 16,
      paddingBottom: 20,
    },
  });

  return (
    <SafeAreaView style={dynamicStyles.container} edges={['top']}>
      <HeaderBar 
        title={showSearch ? '' : t.history}
        rightButtons={[
          {
            icon: <Search size={24} color={colors.text} />,
            onPress: toggleSearch
          },
          {
            icon: <Filter size={24} color={colors.text} />,
            onPress: () => setShowFilterModal(true)
          },
          {
            icon: <RefreshCw size={24} color={colors.text} />,
            onPress: handleManualRefresh
          },
          {
            icon: <TrendingUp size={24} color={colors.text} />,
            onPress: () => {}
          }
        ]}
      />

      {showSearch && (
        <View style={dynamicStyles.searchContainer}>
          <TextInput
            style={dynamicStyles.searchInput}
            placeholder="Rechercher par client, adresse, description..."
            placeholderTextColor={colors.textLight}
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoFocus
          />
        </View>
      )}

      {/* Statistiques */}
      <View style={dynamicStyles.statsContainer}>
        <View style={dynamicStyles.statCard}>
          <Clock size={20} color={colors.primary} />
          <Text style={dynamicStyles.statNumber}>{stats.total}</Text>
          <Text style={dynamicStyles.statLabel}>Total</Text>
        </View>
        <View style={dynamicStyles.statCard}>
          <CheckCircle size={20} color="#34C759" />
          <Text style={dynamicStyles.statNumber}>{stats.completed}</Text>
          <Text style={dynamicStyles.statLabel}>Terminées</Text>
        </View>
        <View style={dynamicStyles.statCard}>
          <XCircle size={20} color="#FF3B30" />
          <Text style={dynamicStyles.statNumber}>{stats.cancelled}</Text>
          <Text style={dynamicStyles.statLabel}>Annulées</Text>
        </View>
        <View style={dynamicStyles.statCard}>
          <Text style={dynamicStyles.euroIcon}>€</Text>
          <Text style={dynamicStyles.statNumber}>{stats.totalRevenue.toFixed(0)}</Text>
          <Text style={dynamicStyles.statLabel}>Revenus</Text>
        </View>
      </View>

      {/* Filtres actifs */}
      {(selectedFilter !== 'all' || sortBy !== 'updated_at' || searchQuery) && (
        <View style={dynamicStyles.activeFiltersContainer}>
          <Text style={dynamicStyles.activeFiltersText}>
            Filtres actifs: {selectedFilter !== 'all' ? selectedFilter : ''} 
            {sortBy !== 'updated_at' ? ` • Tri: ${sortBy}` : ''}
            {searchQuery ? ` • Recherche: "${searchQuery}"` : ''}
          </Text>
          <TouchableOpacity 
            onPress={clearFilters}
            style={dynamicStyles.clearFiltersButtonSmall}
          >
            <Text style={dynamicStyles.clearFiltersTextSmall}>Effacer</Text>
          </TouchableOpacity>
        </View>
      )}

      {isLoading && !refreshing ? (
        <LoadingSpinner 
          fullScreen 
          apiStatus={apiStatus}
          message={
            apiStatus === 'connecting' ? 'Connexion à l\'API...' :
            apiStatus === 'retrying' ? 'Nouvelle tentative...' :
            apiStatus === 'timeout' ? 'Chargement des données locales...' :
            'Chargement...'
          }
        />
      ) : (
        <>
          <FlatList
            data={interventions}
            renderItem={renderItem}
            keyExtractor={(item) => item.id}
            contentContainerStyle={dynamicStyles.listContainer}
            refreshControl={
              <RefreshControl 
                refreshing={refreshing} 
                onRefresh={onRefresh}
                tintColor={colors.primary}
                colors={[colors.primary]}
              />
            }
            ListEmptyComponent={
              <EmptyState
                title={searchQuery ? "Aucun résultat" : t.noCompletedInterventions}
                description={searchQuery ? "Essayez avec d'autres mots-clés" : t.noCompletedInterventionsDescription}
                icon="clipboard"
              />
            }
            ListFooterComponent={renderPagination}
          />
        </>
      )}

      <FilterModal />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: '80%',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
  },
  filterSection: {
    marginBottom: 24,
  },
  filterSectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  filterOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginBottom: 8,
  },
  filterIcon: {
    fontSize: 16,
    marginRight: 12,
  },
  filterLabel: {
    fontSize: 16,
  },
  sortOrderContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  sortOrderButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
  },
  sortOrderText: {
    fontSize: 14,
  },
  perPageContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  perPageButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    borderWidth: 1,
    minWidth: 40,
    alignItems: 'center',
  },
  perPageText: {
    fontSize: 14,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 12,
  },
  clearFiltersButton: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
  },
  clearFiltersText: {
    fontSize: 16,
    fontWeight: '600',
  },
  closeModalButton: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  closeModalButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  paginationContainer: {
    marginTop: 20,
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 12,
    marginHorizontal: 16,
  },
  paginationInfo: {
    alignItems: 'center',
    marginBottom: 12,
  },
  paginationText: {
    fontSize: 14,
  },
  paginationControls: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  paginationButton: {
    width: 36,
    height: 36,
    borderRadius: 6,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  paginationButtonDisabled: {
    opacity: 0.3,
  },
  paginationButtonText: {
    fontSize: 14,
    fontWeight: '500',
  },
  paginationEllipsis: {
    paddingHorizontal: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
});