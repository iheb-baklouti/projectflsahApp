import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, RefreshControl, TouchableOpacity, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLanguage } from '@/hooks/useLanguage';
import { useInterventions } from '@/hooks/useInterventions';
import { translations } from '@/constants/Translations';
import { InterventionCard } from '@/components/interventions/InterventionCard';
import { HeaderBar } from '@/components/ui/HeaderBar';
import { Calendar, Search, Filter, TrendingUp, Clock, CircleCheck as CheckCircle, Circle as XCircle } from 'lucide-react-native';
import { EmptyState } from '@/components/ui/EmptyState';
import { Intervention } from '@/types/intervention';
import { TextInput } from 'react-native';
import { COLORS } from '@/constants/Colors';

type FilterType = 'all' | 'completed' | 'cancelled' | 'thisWeek' | 'thisMonth';
type SortType = 'date' | 'amount' | 'client';

export default function HistoryScreen() {
  const { language } = useLanguage();
  const t = translations[language];
  const { completedInterventions, refreshCompletedInterventions, isLoading } = useInterventions();
  
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredInterventions, setFilteredInterventions] = useState<Intervention[]>(completedInterventions);
  const [showSearch, setShowSearch] = useState(false);
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState<FilterType>('all');
  const [sortBy, setSortBy] = useState<SortType>('date');

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refreshCompletedInterventions();
    setRefreshing(false);
  }, [refreshCompletedInterventions]);

  // Filtrer et trier les interventions
  React.useEffect(() => {
    let filtered = [...completedInterventions];

    // Filtrage par recherche
    if (searchQuery.trim() !== '') {
      filtered = filtered.filter(
        (intervention) =>
          intervention.clientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
          intervention.address.toLowerCase().includes(searchQuery.toLowerCase()) ||
          intervention.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
          intervention.serviceType.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Filtrage par type
    if (selectedFilter !== 'all') {
      const now = new Date();
      const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

      filtered = filtered.filter(intervention => {
        switch (selectedFilter) {
          case 'completed':
            return intervention.status === 'DONE';
          case 'cancelled':
            return intervention.status === 'ANNULÉE';
          case 'thisWeek':
            return new Date(intervention.updatedAt) >= oneWeekAgo;
          case 'thisMonth':
            return new Date(intervention.updatedAt) >= oneMonthAgo;
          default:
            return true;
        }
      });
    }

    // Tri
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'date':
          return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
        case 'amount':
          return (b.totalAmount || 0) - (a.totalAmount || 0);
        case 'client':
          return a.clientName.localeCompare(b.clientName);
        default:
          return 0;
      }
    });

    setFilteredInterventions(filtered);
  }, [searchQuery, completedInterventions, selectedFilter, sortBy]);

  const toggleSearch = () => {
    setShowSearch(!showSearch);
    if (showSearch) setSearchQuery('');
  };

  // Statistiques
  const stats = React.useMemo(() => {
    const total = completedInterventions.length;
    const completed = completedInterventions.filter(i => i.status === 'DONE').length;
    const cancelled = completedInterventions.filter(i => i.status === 'ANNULÉE').length;
    const totalRevenue = completedInterventions
      .filter(i => i.status === 'DONE' && i.totalAmount)
      .reduce((sum, i) => sum + (i.totalAmount || 0), 0);

    return { total, completed, cancelled, totalRevenue };
  }, [completedInterventions]);

  const renderItem = ({ item }: { item: Intervention }) => (
    <InterventionCard
      intervention={item}
      showDetails={true}
      isHistorical={true}
    />
  );

  const FilterModal = () => (
    <Modal
      visible={showFilterModal}
      transparent
      animationType="slide"
      onRequestClose={() => setShowFilterModal(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>Filtres et tri</Text>
          
          <View style={styles.filterSection}>
            <Text style={styles.filterSectionTitle}>Filtrer par</Text>
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
                  selectedFilter === filter.key && styles.filterOptionSelected
                ]}
                onPress={() => setSelectedFilter(filter.key as FilterType)}
              >
                <Text style={styles.filterIcon}>{filter.icon}</Text>
                <Text style={[
                  styles.filterLabel,
                  selectedFilter === filter.key && styles.filterLabelSelected
                ]}>
                  {filter.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <View style={styles.filterSection}>
            <Text style={styles.filterSectionTitle}>Trier par</Text>
            {[
              { key: 'date', label: 'Date (plus récent)', icon: '📅' },
              { key: 'amount', label: 'Montant (plus élevé)', icon: '💰' },
              { key: 'client', label: 'Client (A-Z)', icon: '👤' },
            ].map((sort) => (
              <TouchableOpacity
                key={sort.key}
                style={[
                  styles.filterOption,
                  sortBy === sort.key && styles.filterOptionSelected
                ]}
                onPress={() => setSortBy(sort.key as SortType)}
              >
                <Text style={styles.filterIcon}>{sort.icon}</Text>
                <Text style={[
                  styles.filterLabel,
                  sortBy === sort.key && styles.filterLabelSelected
                ]}>
                  {sort.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <TouchableOpacity
            style={styles.closeModalButton}
            onPress={() => setShowFilterModal(false)}
          >
            <Text style={styles.closeModalButtonText}>Fermer</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <HeaderBar 
        title={showSearch ? '' : t.history}
        rightButtons={[
          {
            icon: <Search size={24} color="#333" />,
            onPress: toggleSearch
          },
          {
            icon: <Filter size={24} color="#333" />,
            onPress: () => setShowFilterModal(true)
          },
          {
            icon: <TrendingUp size={24} color="#333" />,
            onPress: () => {}
          }
        ]}
      />

      {showSearch && (
        <View style={styles.searchContainer}>
          <TextInput
            style={styles.searchInput}
            placeholder="Rechercher par client, adresse, description..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoFocus
          />
        </View>
      )}

      {/* Statistiques */}
      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <Clock size={20} color={COLORS.primary} />
          <Text style={styles.statNumber}>{stats.total}</Text>
          <Text style={styles.statLabel}>Total</Text>
        </View>
        <View style={styles.statCard}>
          <CheckCircle size={20} color="#34C759" />
          <Text style={styles.statNumber}>{stats.completed}</Text>
          <Text style={styles.statLabel}>Terminées</Text>
        </View>
        <View style={styles.statCard}>
          <XCircle size={20} color="#FF3B30" />
          <Text style={styles.statNumber}>{stats.cancelled}</Text>
          <Text style={styles.statLabel}>Annulées</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.euroIcon}>€</Text>
          <Text style={styles.statNumber}>{stats.totalRevenue.toFixed(0)}</Text>
          <Text style={styles.statLabel}>Revenus</Text>
        </View>
      </View>

      {/* Filtres actifs */}
      {(selectedFilter !== 'all' || sortBy !== 'date') && (
        <View style={styles.activeFiltersContainer}>
          <Text style={styles.activeFiltersText}>
            Filtres actifs: {selectedFilter !== 'all' ? selectedFilter : ''} 
            {sortBy !== 'date' ? ` • Tri: ${sortBy}` : ''}
          </Text>
          <TouchableOpacity 
            onPress={() => {
              setSelectedFilter('all');
              setSortBy('date');
            }}
            style={styles.clearFiltersButton}
          >
            <Text style={styles.clearFiltersText}>Effacer</Text>
          </TouchableOpacity>
        </View>
      )}

      <FlatList
        data={filteredInterventions}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <EmptyState
            title={searchQuery ? "Aucun résultat" : t.noCompletedInterventions}
            description={searchQuery ? "Essayez avec d'autres mots-clés" : t.noCompletedInterventionsDescription}
            icon="clipboard"
          />
        }
      />

      <FilterModal />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F6F6F6',
  },
  searchContainer: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#EEEEEE',
  },
  searchInput: {
    backgroundColor: '#F6F6F6',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 16,
  },
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  statNumber: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  euroIcon: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  activeFiltersContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#FFF9E6',
    borderBottomWidth: 1,
    borderBottomColor: '#EEEEEE',
  },
  activeFiltersText: {
    fontSize: 14,
    color: '#666',
    flex: 1,
  },
  clearFiltersButton: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    backgroundColor: COLORS.primary,
    borderRadius: 4,
  },
  clearFiltersText: {
    fontSize: 12,
    color: '#000',
    fontWeight: '600',
  },
  listContainer: {
    padding: 16,
    paddingBottom: 100,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
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
    color: '#333',
  },
  filterSection: {
    marginBottom: 24,
  },
  filterSectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  filterOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginBottom: 8,
    backgroundColor: '#F6F6F6',
  },
  filterOptionSelected: {
    backgroundColor: COLORS.primary,
  },
  filterIcon: {
    fontSize: 16,
    marginRight: 12,
  },
  filterLabel: {
    fontSize: 16,
    color: '#333',
  },
  filterLabelSelected: {
    color: '#000',
    fontWeight: '600',
  },
  closeModalButton: {
    backgroundColor: '#000',
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 12,
  },
  closeModalButtonText: {
    color: COLORS.primary,
    fontSize: 16,
    fontWeight: 'bold',
  },
});