import React, { useState, useCallback, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, RefreshControl, TouchableOpacity, Modal, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLanguage } from '@/hooks/useLanguage';
import { useInvoices, InvoiceListOptions } from '@/hooks/useInvoices';
import { useTheme } from '@/hooks/useTheme';
import { translations } from '@/constants/Translations';
import { COLORS, DARK_COLORS } from '@/constants/Colors';
import { HeaderBar } from '@/components/ui/HeaderBar';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { Search, Filter, Download, FileText, Calendar, Euro, ChevronLeft, ChevronRight, MoveHorizontal as MoreHorizontal, CircleCheck as CheckCircle, Clock, TriangleAlert as AlertTriangle, CreditCard, RefreshCw } from 'lucide-react-native';
import { EmptyState } from '@/components/ui/EmptyState';
import { Invoice } from '@/types/intervention';
import { useFocusEffect } from '@react-navigation/native';

type FilterType = 'all' | 'pending' | 'paid' | 'late' | 'cancelled';
type SortType = 'issue_date' | 'due_date' | 'amount_ttc' | 'status';

export default function InvoicesScreen() {
  const { language } = useLanguage();
  const { theme } = useTheme();
  const t = translations[language];
  const colors = theme === 'dark' ? DARK_COLORS : COLORS;
  
  const { 
    invoices,
    isLoading,
    paginationMeta,
    loadInvoices,
    refreshInvoices,
    downloadInvoice,
    payCommission, // ✅ Nouvelle fonction
    apiAvailable
  } = useInvoices();
  
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState<FilterType>('all');
  const [sortBy, setSortBy] = useState<SortType>('issue_date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const [perPage, setPerPage] = useState(10);
  const [apiStatus, setApiStatus] = useState<'loading' | 'connecting' | 'retrying' | 'timeout'>('loading');

  // ✅ NOUVEAU: Recharger automatiquement quand on revient sur cette page
  useFocusEffect(
    useCallback(() => {
      console.log('📱 Invoices screen focused - Rechargement des factures...');
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

  // Charger les factures au montage
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
  }, [selectedFilter, sortBy, sortOrder, searchQuery, perPage]);

  // Recharger les données quand la page change
  useEffect(() => {
    if (currentPage > 1) {
      loadData();
    }
  }, [currentPage]);

  const loadData = useCallback(async () => {
    const options: InvoiceListOptions = {
      page: currentPage,
      perPage,
      status: selectedFilter !== 'all' ? selectedFilter : undefined,
    };

    await loadInvoices(options);
  }, [currentPage, perPage, selectedFilter, loadInvoices]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    setCurrentPage(1);
    await loadData();
    setRefreshing(false);
  }, [loadData]);

  // ✅ NOUVEAU: Fonction pour refresh manuel avec bouton
  const handleManualRefresh = useCallback(async () => {
    console.log('🔄 Refresh manuel factures déclenché');
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
    setSortBy('issue_date');
    setSortOrder('desc');
    setSearchQuery('');
    setCurrentPage(1);
  };

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= (paginationMeta?.totalPages || 1)) {
      setCurrentPage(newPage);
    }
  };

  const handleDownloadInvoice = (invoiceId: string) => {
    downloadInvoice(invoiceId);
  };

  // ✅ Gérer le paiement de commission
  const handlePayCommission = async (invoiceId: string) => {
    const success = await payCommission(invoiceId);
    if (success) {
      // Optionnel: afficher un message de succès
      console.log('Commission payée avec succès');
      // Recharger les factures pour refléter le changement
      await loadData();
    }
  };

  // Statistiques calculées à partir des données actuelles
  const stats = React.useMemo(() => {
    const total = paginationMeta?.totalItems || invoices.length;
    const pending = invoices.filter(i => i.status === 'pending').length;
    const paid = invoices.filter(i => i.status === 'paid').length;
    const totalRevenue = invoices
      .filter(i => i.status === 'paid')
      .reduce((sum, i) => sum + i.amount_ttc, 0);

    return { total, pending, paid, totalRevenue };
  }, [invoices, paginationMeta]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'paid':
        return <CheckCircle size={16} color="#34C759" />;
      case 'pending':
        return <Clock size={16} color="#FF9500" />;
      case 'late':
        return <AlertTriangle size={16} color="#FF3B30" />;
      case 'cancelled':
        return <AlertTriangle size={16} color="#8E8E93" />;
      default:
        return <Clock size={16} color="#8E8E93" />;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'paid':
        return 'Payée';
      case 'pending':
        return 'En attente';
      case 'late':
        return 'En retard';
      case 'cancelled':
        return 'Annulée';
      default:
        return status;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  const renderInvoiceItem = ({ item }: { item: Invoice }) => (
    <View style={[styles.invoiceCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <View style={styles.invoiceHeader}>
        <View style={styles.invoiceInfo}>
          <Text style={[styles.invoiceNumber, { color: colors.text }]}>{item.number}</Text>
          <Text style={[styles.clientName, { color: colors.textLight }]}>
            {item.intervention?.client.name || 'Client inconnu'}
          </Text>
        </View>
        <View style={styles.statusContainer}>
          {getStatusIcon(item.status)}
          <Text style={[styles.statusText, { color: colors.textLight }]}>
            {getStatusText(item.status)}
          </Text>
        </View>
      </View>

      <View style={styles.invoiceDetails}>
        <View style={styles.detailRow}>
          <Calendar size={14} color={colors.textLight} />
          <Text style={[styles.detailText, { color: colors.textLight }]}>
            Émise le {formatDate(item.issue_date)}
          </Text>
        </View>
        <View style={styles.detailRow}>
          <Euro size={14} color={colors.textLight} />
          <Text style={[styles.detailText, { color: colors.textLight }]}>
            {item.amount_ttc.toFixed(2)}€ TTC
          </Text>
        </View>
        
        {/* ✅ Affichage de la commission */}
        {item.commission_amount && (
          <View style={styles.detailRow}>
            <CreditCard size={14} color={colors.textLight} />
            <Text style={[styles.detailText, { color: colors.textLight }]}>
              Commission: {item.commission_amount.toFixed(2)}€
              {item.commission_paid ? (
                <Text style={{ color: '#34C759', fontWeight: '600' }}> (Payée)</Text>
              ) : (
                <Text style={{ color: '#FF9500', fontWeight: '600' }}> (En attente)</Text>
              )}
            </Text>
          </View>
        )}
      </View>

      <View style={styles.invoiceActions}>
        <TouchableOpacity
          style={[styles.downloadButton, { backgroundColor: colors.primary }]}
          onPress={() => handleDownloadInvoice(item.id)}
        >
          <Download size={16} color={colors.buttonText} />
          <Text style={[styles.downloadButtonText, { color: colors.buttonText }]}>
            Télécharger
          </Text>
        </TouchableOpacity>
        
        {/* ✅ Bouton "Payer la commission" si pas encore payée */}
        {item.commission_amount && !item.commission_paid && item.status !== 'paid' && (
          <TouchableOpacity
            style={[styles.payCommissionButton, { backgroundColor: '#34C759' }]}
            onPress={() => handlePayCommission(item.id)}
          >
            <CreditCard size={16} color="#FFFFFF" />
            <Text style={styles.payCommissionButtonText}>
              Payer Commission
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
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
          <Text style={[styles.modalTitle, { color: colors.text }]}>Filtres</Text>
          
          <View style={styles.filterSection}>
            <Text style={[styles.filterSectionTitle, { color: colors.text }]}>Statut</Text>
            {[
              { key: 'all', label: 'Toutes les factures', icon: '📋' },
              { key: 'pending', label: 'En attente', icon: '⏳' },
              { key: 'paid', label: 'Payées', icon: '✅' },
              { key: 'late', label: 'En retard', icon: '⚠️' },
              { key: 'cancelled', label: 'Annulées', icon: '❌' },
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
    listContainer: {
      padding: 16,
      paddingBottom: 20,
    },
  });

  return (
    <SafeAreaView style={dynamicStyles.container} edges={['top']}>
      <HeaderBar 
        title={showSearch ? '' : t.invoices}
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
          }
        ]}
      />

      {showSearch && (
        <View style={dynamicStyles.searchContainer}>
          <TextInput
            style={dynamicStyles.searchInput}
            placeholder="Rechercher par numéro, client..."
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
          <FileText size={20} color={colors.primary} />
          <Text style={dynamicStyles.statNumber}>{stats.total}</Text>
          <Text style={dynamicStyles.statLabel}>Total</Text>
        </View>
        <View style={dynamicStyles.statCard}>
          <Clock size={20} color="#FF9500" />
          <Text style={dynamicStyles.statNumber}>{stats.pending}</Text>
          <Text style={dynamicStyles.statLabel}>En attente</Text>
        </View>
        <View style={dynamicStyles.statCard}>
          <CheckCircle size={20} color="#34C759" />
          <Text style={dynamicStyles.statNumber}>{stats.paid}</Text>
          <Text style={dynamicStyles.statLabel}>Payées</Text>
        </View>
        <View style={dynamicStyles.statCard}>
          <Text style={dynamicStyles.euroIcon}>€</Text>
          <Text style={dynamicStyles.statNumber}>{stats.totalRevenue.toFixed(0)}</Text>
          <Text style={dynamicStyles.statLabel}>Revenus</Text>
        </View>
      </View>

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
            data={invoices}
            renderItem={renderInvoiceItem}
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
                title="Aucune facture"
                description="Vos factures apparaîtront ici après avoir terminé des interventions"
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
  invoiceCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  invoiceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  invoiceInfo: {
    flex: 1,
  },
  invoiceNumber: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  clientName: {
    fontSize: 14,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '500',
  },
  invoiceDetails: {
    gap: 8,
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  detailText: {
    fontSize: 14,
  },
  invoiceActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
  },
  downloadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 6,
  },
  downloadButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  // ✅ Nouveau bouton pour payer la commission
  payCommissionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 6,
  },
  payCommissionButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
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
});