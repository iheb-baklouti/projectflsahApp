import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Modal, ScrollView, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLanguage } from '@/hooks/useLanguage';
import { useInterventions, InterventionListOptions } from '@/hooks/useInterventions';
import { useTheme } from '@/hooks/useTheme';
import { translations } from '@/constants/Translations';
import { COLORS, DARK_COLORS } from '@/constants/Colors';
import { HeaderBar } from '@/components/ui/HeaderBar';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { CalendarDays, ChevronLeft, ChevronRight, Plus, Clock, MapPin, User, Search, Filter, RefreshCw } from 'lucide-react-native';
import { InterventionCard } from '@/components/interventions/InterventionCard';
import { EmptyState } from '@/components/ui/EmptyState';
import { Intervention } from '@/types/intervention';

// Days of the week in both languages
const daysOfWeek = {
  en: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
  fr: ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam']
};

// Months in both languages
const months = {
  en: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
  fr: ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre']
};

type CalendarView = 'week' | 'month' | 'agenda';

export default function CalendarScreen() {
  const { language } = useLanguage();
  const { theme } = useTheme();
  const t = translations[language];
  const colors = theme === 'dark' ? DARK_COLORS : COLORS;
  
  const { 
    interventions,
    isLoading,
    paginationMeta,
    loadScheduledInterventions,
    refreshScheduledInterventions,
    apiAvailable
  } = useInterventions();
  
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [calendarView, setCalendarView] = useState<CalendarView>('week');
  const [showInterventionModal, setShowInterventionModal] = useState(false);
  const [selectedIntervention, setSelectedIntervention] = useState<Intervention | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [perPage, setPerPage] = useState(20);
  const [apiStatus, setApiStatus] = useState<'loading' | 'connecting' | 'retrying' | 'timeout'>('loading');

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

  // Charger les interventions planifiées au montage
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
      sortBy: 'scheduled_at',
      sortOrder: 'asc',
    };

    await loadScheduledInterventions(options);
  }, [currentPage, perPage, searchQuery, loadScheduledInterventions]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    setCurrentPage(1);
    await loadData();
    setRefreshing(false);
  }, [loadData]);

  const toggleSearch = () => {
    setShowSearch(!showSearch);
    if (showSearch) {
      setSearchQuery('');
    }
  };
  
  // Get current week dates
  const getWeekDates = () => {
    const dates = [];
    const startOfWeek = new Date(selectedDate);
    startOfWeek.setDate(selectedDate.getDate() - selectedDate.getDay());
    
    for (let i = 0; i < 7; i++) {
      const date = new Date(startOfWeek);
      date.setDate(startOfWeek.getDate() + i);
      dates.push(date);
    }
    return dates;
  };

  // Get month dates for calendar grid
  const getMonthDates = () => {
    const year = selectedDate.getFullYear();
    const month = selectedDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay());
    
    const dates = [];
    for (let i = 0; i < 42; i++) { // 6 weeks * 7 days
      const date = new Date(startDate);
      date.setDate(startDate.getDate() + i);
      dates.push(date);
    }
    return dates;
  };
  
  const weekDates = getWeekDates();
  const monthDates = getMonthDates();
  
  // Filter interventions for selected date
  const getInterventionsForDate = (date: Date) => {
    return interventions.filter(intervention => {
      if (!intervention.scheduledDate) return false;
      const interventionDate = new Date(intervention.scheduledDate);
      return (
        interventionDate.getDate() === date.getDate() &&
        interventionDate.getMonth() === date.getMonth() &&
        interventionDate.getFullYear() === date.getFullYear()
      );
    });
  };
  
  const selectedDateInterventions = getInterventionsForDate(selectedDate);
  
  // Handle previous and next navigation
  const goToPrevious = () => {
    const newDate = new Date(selectedDate);
    if (calendarView === 'week') {
      newDate.setDate(selectedDate.getDate() - 7);
    } else {
      newDate.setMonth(selectedDate.getMonth() - 1);
    }
    setSelectedDate(newDate);
  };
  
  const goToNext = () => {
    const newDate = new Date(selectedDate);
    if (calendarView === 'week') {
      newDate.setDate(selectedDate.getDate() + 7);
    } else {
      newDate.setMonth(selectedDate.getMonth() + 1);
    }
    setSelectedDate(newDate);
  };
  
  // Check if a date is today
  const isToday = (date: Date) => {
    const today = new Date();
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    );
  };
  
  // Check if a date is the selected date
  const isSelectedDate = (date: Date) => {
    return (
      date.getDate() === selectedDate.getDate() &&
      date.getMonth() === selectedDate.getMonth() &&
      date.getFullYear() === selectedDate.getFullYear()
    );
  };

  // Check if date is in current month (for month view)
  const isCurrentMonth = (date: Date) => {
    return date.getMonth() === selectedDate.getMonth();
  };
  
  // Format month and year for display
  const formatMonthYear = () => {
    const monthName = months[language][selectedDate.getMonth()];
    return `${monthName} ${selectedDate.getFullYear()}`;
  };

  const renderWeekView = () => (
    <View style={[styles.weekDaysContainer, { backgroundColor: colors.card }]}>
      {weekDates.map((date, index) => (
        <TouchableOpacity
          key={index}
          style={[
            styles.dateItem,
            isSelectedDate(date) && styles.selectedDateItem
          ]}
          onPress={() => setSelectedDate(date)}
        >
          <Text style={[
            styles.dayOfWeekText,
            { color: colors.textLight },
            isSelectedDate(date) && { color: colors.primary, fontWeight: '600' }
          ]}>
            {daysOfWeek[language][date.getDay()]}
          </Text>
          <View style={[
            styles.dateCircle,
            isToday(date) && { backgroundColor: colors.textLight },
            isSelectedDate(date) && { backgroundColor: colors.primary }
          ]}>
            <Text style={[
              styles.dateText,
              { color: colors.text },
              isToday(date) && { color: '#FFFFFF' },
              isSelectedDate(date) && { color: colors.buttonText, fontWeight: '600' }
            ]}>
              {date.getDate()}
            </Text>
          </View>
          {getInterventionsForDate(date).length > 0 && (
            <View style={styles.dotContainer}>
              <View style={[styles.dot, { backgroundColor: colors.primary }]} />
              {getInterventionsForDate(date).length > 1 && (
                <Text style={[styles.dotCount, { color: colors.primary }]}>
                  {getInterventionsForDate(date).length}
                </Text>
              )}
            </View>
          )}
        </TouchableOpacity>
      ))}
    </View>
  );

  const renderMonthView = () => (
    <View style={[styles.monthContainer, { backgroundColor: colors.card }]}>
      <View style={styles.monthHeader}>
        {daysOfWeek[language].map((day, index) => (
          <Text key={index} style={[styles.monthHeaderDay, { color: colors.textLight }]}>
            {day}
          </Text>
        ))}
      </View>
      <View style={styles.monthGrid}>
        {monthDates.map((date, index) => (
          <TouchableOpacity
            key={index}
            style={[
              styles.monthDateItem,
              !isCurrentMonth(date) && styles.monthDateItemOtherMonth,
              isSelectedDate(date) && styles.selectedMonthDateItem
            ]}
            onPress={() => setSelectedDate(date)}
          >
            <View style={[
              styles.monthDateCircle,
              isToday(date) && { backgroundColor: colors.textLight },
              isSelectedDate(date) && { backgroundColor: colors.primary }
            ]}>
              <Text style={[
                styles.monthDateText,
                { color: colors.text },
                !isCurrentMonth(date) && { color: colors.border },
                isToday(date) && { color: '#FFFFFF' },
                isSelectedDate(date) && { color: colors.buttonText, fontWeight: '600' }
              ]}>
                {date.getDate()}
              </Text>
            </View>
            {getInterventionsForDate(date).length > 0 && (
              <View style={[styles.monthDot, { backgroundColor: colors.primary }]} />
            )}
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  const renderAgendaView = () => (
    <ScrollView style={styles.agendaContainer}>
      {isLoading && !refreshing ? (
        <LoadingSpinner 
          apiStatus={apiStatus}
          message={
            apiStatus === 'connecting' ? 'Connexion à l\'API...' :
            apiStatus === 'retrying' ? 'Nouvelle tentative...' :
            apiStatus === 'timeout' ? 'Chargement des données locales...' :
            'Chargement...'
          }
        />
      ) : interventions.length === 0 ? (
        <EmptyState
          title="Aucune intervention planifiée"
          description="Vos prochaines interventions apparaîtront ici"
          icon="calendar"
        />
      ) : (
        <>
          {interventions.map((intervention) => (
            <TouchableOpacity
              key={intervention.id}
              style={[styles.agendaItem, { backgroundColor: colors.card, borderColor: colors.border }]}
              onPress={() => {
                setSelectedIntervention(intervention);
                setShowInterventionModal(true);
              }}
            >
              <View style={styles.agendaDate}>
                <Text style={[styles.agendaDateDay, { color: colors.primary }]}>
                  {intervention.scheduledDate ? new Date(intervention.scheduledDate).getDate() : '?'}
                </Text>
                <Text style={[styles.agendaDateMonth, { color: colors.textLight }]}>
                  {intervention.scheduledDate ? 
                    months[language][new Date(intervention.scheduledDate).getMonth()].slice(0, 3) : 
                    '---'
                  }
                </Text>
              </View>
              <View style={styles.agendaContent}>
                <Text style={[styles.agendaTitle, { color: colors.text }]}>
                  {intervention.serviceType}
                </Text>
                <View style={styles.agendaInfo}>
                  <User size={14} color={colors.textLight} />
                  <Text style={[styles.agendaInfoText, { color: colors.textLight }]}>
                    {intervention.clientName}
                  </Text>
                </View>
                <View style={styles.agendaInfo}>
                  <MapPin size={14} color={colors.textLight} />
                  <Text style={[styles.agendaInfoText, { color: colors.textLight }]}>
                    {intervention.shortAddress || intervention.address}
                  </Text>
                </View>
                {intervention.scheduledTime && (
                  <View style={styles.agendaInfo}>
                    <Clock size={14} color={colors.textLight} />
                    <Text style={[styles.agendaInfoText, { color: colors.textLight }]}>
                      {intervention.scheduledTime}
                    </Text>
                  </View>
                )}
              </View>
            </TouchableOpacity>
          ))}
          
          {/* Pagination pour l'agenda */}
          {paginationMeta && paginationMeta.totalPages > 1 && (
            <View style={[styles.paginationContainer, { backgroundColor: colors.card }]}>
              <Text style={[styles.paginationText, { color: colors.textLight }]}>
                Page {paginationMeta.currentPage} sur {paginationMeta.totalPages}
              </Text>
              <View style={styles.paginationButtons}>
                <TouchableOpacity
                  style={[
                    styles.paginationButton,
                    { backgroundColor: colors.background, borderColor: colors.border },
                    paginationMeta.currentPage === 1 && { opacity: 0.5 }
                  ]}
                  onPress={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={paginationMeta.currentPage === 1}
                >
                  <ChevronLeft size={16} color={colors.text} />
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.paginationButton,
                    { backgroundColor: colors.background, borderColor: colors.border },
                    paginationMeta.currentPage === paginationMeta.totalPages && { opacity: 0.5 }
                  ]}
                  onPress={() => setCurrentPage(prev => Math.min(paginationMeta.totalPages, prev + 1))}
                  disabled={paginationMeta.currentPage === paginationMeta.totalPages}
                >
                  <ChevronRight size={16} color={colors.text} />
                </TouchableOpacity>
              </View>
            </View>
          )}
        </>
      )}
    </ScrollView>
  );

  const InterventionModal = () => (
    <Modal
      visible={showInterventionModal}
      transparent
      animationType="slide"
      onRequestClose={() => setShowInterventionModal(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
          {selectedIntervention && (
            <>
              <Text style={[styles.modalTitle, { color: colors.text }]}>
                {selectedIntervention.serviceType}
              </Text>
              <View style={styles.modalInfo}>
                <User size={20} color={colors.primary} />
                <Text style={[styles.modalInfoText, { color: colors.text }]}>
                  {selectedIntervention.clientName}
                </Text>
              </View>
              <View style={styles.modalInfo}>
                <MapPin size={20} color={colors.primary} />
                <Text style={[styles.modalInfoText, { color: colors.text }]}>
                  {selectedIntervention.address}
                </Text>
              </View>
              {selectedIntervention.scheduledTime && (
                <View style={styles.modalInfo}>
                  <Clock size={20} color={colors.primary} />
                  <Text style={[styles.modalInfoText, { color: colors.text }]}>
                    {selectedIntervention.scheduledTime}
                  </Text>
                </View>
              )}
              <Text style={[styles.modalDescription, { color: colors.textLight }]}>
                {selectedIntervention.description}
              </Text>
            </>
          )}
          <TouchableOpacity
            style={[styles.closeModalButton, { backgroundColor: colors.text }]}
            onPress={() => setShowInterventionModal(false)}
          >
            <Text style={[styles.closeModalButtonText, { color: colors.primary }]}>
              Fermer
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );

  const dynamicStyles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    viewSelector: {
      flexDirection: 'row',
      backgroundColor: colors.card,
      marginHorizontal: 16,
      marginVertical: 8,
      borderRadius: 8,
      padding: 4,
    },
    viewButton: {
      flex: 1,
      paddingVertical: 8,
      alignItems: 'center',
      borderRadius: 6,
    },
    viewButtonActive: {
      backgroundColor: colors.primary,
    },
    viewButtonText: {
      fontSize: 14,
      color: colors.textLight,
      fontWeight: '500',
    },
    viewButtonTextActive: {
      color: colors.buttonText,
      fontWeight: '600',
    },
    calendarHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: 20,
      paddingVertical: 10,
      backgroundColor: colors.card,
    },
    monthYearText: {
      fontSize: 18,
      fontWeight: '600',
      color: colors.text,
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
    divider: {
      height: 1,
      backgroundColor: colors.border,
    },
    listContainer: {
      padding: 16,
      paddingBottom: 100,
    },
  });
  
  return (
    <SafeAreaView style={dynamicStyles.container} edges={['top']}>
      <HeaderBar 
        title={showSearch ? '' : t.calendar}
        rightButtons={[
          {
            icon: <Search size={24} color={colors.text} />,
            onPress: toggleSearch
          },
          {
            icon: <RefreshCw size={24} color={colors.text} />,
            onPress: onRefresh
          },
          {
            icon: <Plus size={24} color={colors.text} />,
            onPress: () => {}
          }
        ]}
      />

      {showSearch && (
        <View style={dynamicStyles.searchContainer}>
          <TextInput
            style={dynamicStyles.searchInput}
            placeholder="Rechercher des interventions planifiées..."
            placeholderTextColor={colors.textLight}
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoFocus
          />
        </View>
      )}
      
      {/* View selector */}
      <View style={dynamicStyles.viewSelector}>
        {(['week', 'month', 'agenda'] as CalendarView[]).map((view) => (
          <TouchableOpacity
            key={view}
            style={[
              dynamicStyles.viewButton,
              calendarView === view && dynamicStyles.viewButtonActive
            ]}
            onPress={() => setCalendarView(view)}
          >
            <Text style={[
              dynamicStyles.viewButtonText,
              calendarView === view && dynamicStyles.viewButtonTextActive
            ]}>
              {view === 'week' ? 'Semaine' : view === 'month' ? 'Mois' : 'Agenda'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
      
      {calendarView !== 'agenda' && (
        <View style={dynamicStyles.calendarHeader}>
          <TouchableOpacity onPress={goToPrevious}>
            <ChevronLeft size={24} color={colors.text} />
          </TouchableOpacity>
          
          <Text style={dynamicStyles.monthYearText}>{formatMonthYear()}</Text>
          
          <TouchableOpacity onPress={goToNext}>
            <ChevronRight size={24} color={colors.text} />
          </TouchableOpacity>
        </View>
      )}
      
      {calendarView === 'week' && renderWeekView()}
      {calendarView === 'month' && renderMonthView()}
      {calendarView === 'agenda' && renderAgendaView()}
      
      {calendarView !== 'agenda' && (
        <>
          <View style={dynamicStyles.divider} />
          
          {isLoading && !refreshing ? (
            <LoadingSpinner 
              apiStatus={apiStatus}
              message={
                apiStatus === 'connecting' ? 'Connexion à l\'API...' :
                apiStatus === 'retrying' ? 'Nouvelle tentative...' :
                apiStatus === 'timeout' ? 'Chargement des données locales...' :
                'Chargement...'
              }
            />
          ) : (
            <FlatList
              data={selectedDateInterventions}
              renderItem={({ item }) => (
                <InterventionCard intervention={item} showTime={true} />
              )}
              keyExtractor={(item) => item.id}
              contentContainerStyle={dynamicStyles.listContainer}
              ListEmptyComponent={
                <EmptyState
                  title={t.noScheduledInterventions}
                  description={`Aucune intervention prévue le ${selectedDate.getDate()} ${months[language][selectedDate.getMonth()]}`}
                  icon="calendar"
                />
              }
            />
          )}
        </>
      )}

      <InterventionModal />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  weekDaysContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 10,
  },
  dateItem: {
    alignItems: 'center',
    paddingVertical: 8,
    width: 45,
  },
  selectedDateItem: {
    backgroundColor: 'transparent',
  },
  dayOfWeekText: {
    fontSize: 12,
    marginBottom: 5,
  },
  dateCircle: {
    width: 35,
    height: 35,
    borderRadius: 17.5,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dateText: {
    fontSize: 16,
    fontWeight: '500',
  },
  dotContainer: {
    height: 6,
    marginTop: 4,
    alignItems: 'center',
    flexDirection: 'row',
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  dotCount: {
    fontSize: 10,
    fontWeight: 'bold',
    marginLeft: 2,
  },
  monthContainer: {
    paddingHorizontal: 16,
  },
  monthHeader: {
    flexDirection: 'row',
    paddingVertical: 8,
  },
  monthHeaderDay: {
    flex: 1,
    textAlign: 'center',
    fontSize: 12,
    fontWeight: '600',
  },
  monthGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  monthDateItem: {
    width: '14.28%',
    aspectRatio: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 4,
  },
  monthDateItemOtherMonth: {
    opacity: 0.3,
  },
  selectedMonthDateItem: {
    backgroundColor: 'transparent',
  },
  monthDateCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  monthDateText: {
    fontSize: 14,
    fontWeight: '500',
  },
  monthDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    position: 'absolute',
    bottom: 2,
  },
  agendaContainer: {
    flex: 1,
    padding: 16,
  },
  agendaItem: {
    flexDirection: 'row',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderWidth: 1,
  },
  agendaDate: {
    alignItems: 'center',
    marginRight: 16,
    minWidth: 50,
  },
  agendaDateDay: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  agendaDateMonth: {
    fontSize: 12,
    textTransform: 'uppercase',
  },
  agendaContent: {
    flex: 1,
  },
  agendaTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  agendaInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  agendaInfoText: {
    fontSize: 14,
    marginLeft: 8,
    flex: 1,
  },
  paginationContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    marginTop: 16,
    borderRadius: 12,
  },
  paginationText: {
    fontSize: 14,
  },
  paginationButtons: {
    flexDirection: 'row',
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  modalContent: {
    borderRadius: 16,
    padding: 20,
    width: '100%',
    maxWidth: 350,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
  },
  modalInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  modalInfoText: {
    fontSize: 16,
    marginLeft: 12,
    flex: 1,
  },
  modalDescription: {
    fontSize: 14,
    lineHeight: 20,
    marginVertical: 16,
  },
  closeModalButton: {
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
  },
  closeModalButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
});