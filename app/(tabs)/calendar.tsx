import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Modal, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLanguage } from '@/hooks/useLanguage';
import { translations } from '@/constants/Translations';
import { HeaderBar } from '@/components/ui/HeaderBar';
import { useInterventions } from '@/hooks/useInterventions';
import { CalendarDays, ChevronLeft, ChevronRight, Plus, Clock, MapPin, User } from 'lucide-react-native';
import { InterventionCard } from '@/components/interventions/InterventionCard';
import { COLORS } from '@/constants/Colors';
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
  const t = translations[language];
  const { scheduledInterventions, interventions } = useInterventions();
  
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [calendarView, setCalendarView] = useState<CalendarView>('week');
  const [showInterventionModal, setShowInterventionModal] = useState(false);
  const [selectedIntervention, setSelectedIntervention] = useState<Intervention | null>(null);
  
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
    return scheduledInterventions.filter(intervention => {
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

  // Get upcoming interventions for agenda view
  const getUpcomingInterventions = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    return scheduledInterventions
      .filter(intervention => {
        if (!intervention.scheduledDate) return false;
        const interventionDate = new Date(intervention.scheduledDate);
        return interventionDate >= today;
      })
      .sort((a, b) => {
        const dateA = new Date(a.scheduledDate!);
        const dateB = new Date(b.scheduledDate!);
        return dateA.getTime() - dateB.getTime();
      })
      .slice(0, 10); // Limit to next 10 interventions
  };

  const upcomingInterventions = getUpcomingInterventions();

  const renderWeekView = () => (
    <View style={styles.weekDaysContainer}>
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
            isSelectedDate(date) && styles.selectedDateText
          ]}>
            {daysOfWeek[language][date.getDay()]}
          </Text>
          <View style={[
            styles.dateCircle,
            isToday(date) && styles.todayCircle,
            isSelectedDate(date) && styles.selectedDateCircle
          ]}>
            <Text style={[
              styles.dateText,
              isToday(date) && styles.todayText,
              isSelectedDate(date) && styles.selectedDateCircleText
            ]}>
              {date.getDate()}
            </Text>
          </View>
          {getInterventionsForDate(date).length > 0 && (
            <View style={styles.dotContainer}>
              <View style={styles.dot} />
              {getInterventionsForDate(date).length > 1 && (
                <Text style={styles.dotCount}>{getInterventionsForDate(date).length}</Text>
              )}
            </View>
          )}
        </TouchableOpacity>
      ))}
    </View>
  );

  const renderMonthView = () => (
    <View style={styles.monthContainer}>
      <View style={styles.monthHeader}>
        {daysOfWeek[language].map((day, index) => (
          <Text key={index} style={styles.monthHeaderDay}>{day}</Text>
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
              isToday(date) && styles.todayCircle,
              isSelectedDate(date) && styles.selectedDateCircle
            ]}>
              <Text style={[
                styles.monthDateText,
                !isCurrentMonth(date) && styles.monthDateTextOtherMonth,
                isToday(date) && styles.todayText,
                isSelectedDate(date) && styles.selectedDateCircleText
              ]}>
                {date.getDate()}
              </Text>
            </View>
            {getInterventionsForDate(date).length > 0 && (
              <View style={styles.monthDot} />
            )}
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  const renderAgendaView = () => (
    <ScrollView style={styles.agendaContainer}>
      {upcomingInterventions.length === 0 ? (
        <EmptyState
          title="Aucune intervention planifiée"
          description="Vos prochaines interventions apparaîtront ici"
          icon="calendar"
        />
      ) : (
        upcomingInterventions.map((intervention) => (
          <TouchableOpacity
            key={intervention.id}
            style={styles.agendaItem}
            onPress={() => {
              setSelectedIntervention(intervention);
              setShowInterventionModal(true);
            }}
          >
            <View style={styles.agendaDate}>
              <Text style={styles.agendaDateDay}>
                {new Date(intervention.scheduledDate!).getDate()}
              </Text>
              <Text style={styles.agendaDateMonth}>
                {months[language][new Date(intervention.scheduledDate!).getMonth()].slice(0, 3)}
              </Text>
            </View>
            <View style={styles.agendaContent}>
              <Text style={styles.agendaTitle}>{intervention.serviceType}</Text>
              <View style={styles.agendaInfo}>
                <User size={14} color="#666" />
                <Text style={styles.agendaInfoText}>{intervention.clientName}</Text>
              </View>
              <View style={styles.agendaInfo}>
                <MapPin size={14} color="#666" />
                <Text style={styles.agendaInfoText}>{intervention.address}</Text>
              </View>
              {intervention.scheduledTime && (
                <View style={styles.agendaInfo}>
                  <Clock size={14} color="#666" />
                  <Text style={styles.agendaInfoText}>{intervention.scheduledTime}</Text>
                </View>
              )}
            </View>
          </TouchableOpacity>
        ))
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
        <View style={styles.modalContent}>
          {selectedIntervention && (
            <>
              <Text style={styles.modalTitle}>{selectedIntervention.serviceType}</Text>
              <View style={styles.modalInfo}>
                <User size={20} color={COLORS.primary} />
                <Text style={styles.modalInfoText}>{selectedIntervention.clientName}</Text>
              </View>
              <View style={styles.modalInfo}>
                <MapPin size={20} color={COLORS.primary} />
                <Text style={styles.modalInfoText}>{selectedIntervention.address}</Text>
              </View>
              {selectedIntervention.scheduledTime && (
                <View style={styles.modalInfo}>
                  <Clock size={20} color={COLORS.primary} />
                  <Text style={styles.modalInfoText}>{selectedIntervention.scheduledTime}</Text>
                </View>
              )}
              <Text style={styles.modalDescription}>{selectedIntervention.description}</Text>
            </>
          )}
          <TouchableOpacity
            style={styles.closeModalButton}
            onPress={() => setShowInterventionModal(false)}
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
        title={t.calendar}
        rightButtons={[
          {
            icon: <Plus size={24} color="#333" />,
            onPress: () => {}
          }
        ]}
      />
      
      {/* View selector */}
      <View style={styles.viewSelector}>
        {(['week', 'month', 'agenda'] as CalendarView[]).map((view) => (
          <TouchableOpacity
            key={view}
            style={[
              styles.viewButton,
              calendarView === view && styles.viewButtonActive
            ]}
            onPress={() => setCalendarView(view)}
          >
            <Text style={[
              styles.viewButtonText,
              calendarView === view && styles.viewButtonTextActive
            ]}>
              {view === 'week' ? 'Semaine' : view === 'month' ? 'Mois' : 'Agenda'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
      
      {calendarView !== 'agenda' && (
        <View style={styles.calendarHeader}>
          <TouchableOpacity onPress={goToPrevious}>
            <ChevronLeft size={24} color={COLORS.text} />
          </TouchableOpacity>
          
          <Text style={styles.monthYearText}>{formatMonthYear()}</Text>
          
          <TouchableOpacity onPress={goToNext}>
            <ChevronRight size={24} color={COLORS.text} />
          </TouchableOpacity>
        </View>
      )}
      
      {calendarView === 'week' && renderWeekView()}
      {calendarView === 'month' && renderMonthView()}
      {calendarView === 'agenda' && renderAgendaView()}
      
      {calendarView !== 'agenda' && (
        <>
          <View style={styles.divider} />
          
          <FlatList
            data={selectedDateInterventions}
            renderItem={({ item }) => (
              <InterventionCard intervention={item} showTime={true} />
            )}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listContainer}
            ListEmptyComponent={
              <EmptyState
                title={t.noScheduledInterventions}
                description={`Aucune intervention prévue le ${selectedDate.getDate()} ${months[language][selectedDate.getMonth()]}`}
                icon="calendar"
              />
            }
          />
        </>
      )}

      <InterventionModal />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F6F6F6',
  },
  viewSelector: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
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
    backgroundColor: COLORS.primary,
  },
  viewButtonText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  viewButtonTextActive: {
    color: '#000',
    fontWeight: '600',
  },
  calendarHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: '#FFFFFF',
  },
  monthYearText: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text,
  },
  weekDaysContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 10,
    backgroundColor: '#FFFFFF',
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
    color: COLORS.textLight,
    marginBottom: 5,
  },
  selectedDateText: {
    color: COLORS.primary,
    fontWeight: '600',
  },
  dateCircle: {
    width: 35,
    height: 35,
    borderRadius: 17.5,
    justifyContent: 'center',
    alignItems: 'center',
  },
  todayCircle: {
    backgroundColor: COLORS.textLight,
  },
  selectedDateCircle: {
    backgroundColor: COLORS.primary,
  },
  dateText: {
    fontSize: 16,
    fontWeight: '500',
  },
  todayText: {
    color: '#FFFFFF',
  },
  selectedDateCircleText: {
    color: '#000',
    fontWeight: '600',
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
    backgroundColor: COLORS.primary,
  },
  dotCount: {
    fontSize: 10,
    color: COLORS.primary,
    fontWeight: 'bold',
    marginLeft: 2,
  },
  monthContainer: {
    backgroundColor: '#FFFFFF',
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
    color: COLORS.textLight,
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
  monthDateTextOtherMonth: {
    color: '#ccc',
  },
  monthDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: COLORS.primary,
    position: 'absolute',
    bottom: 2,
  },
  agendaContainer: {
    flex: 1,
    padding: 16,
  },
  agendaItem: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  agendaDate: {
    alignItems: 'center',
    marginRight: 16,
    minWidth: 50,
  },
  agendaDateDay: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  agendaDateMonth: {
    fontSize: 12,
    color: '#666',
    textTransform: 'uppercase',
  },
  agendaContent: {
    flex: 1,
  },
  agendaTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  agendaInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  agendaInfoText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 8,
    flex: 1,
  },
  divider: {
    height: 1,
    backgroundColor: '#E0E0E0',
  },
  listContainer: {
    padding: 16,
    paddingBottom: 100,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    width: '100%',
    maxWidth: 350,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
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
    color: '#333',
    marginLeft: 12,
    flex: 1,
  },
  modalDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginVertical: 16,
  },
  closeModalButton: {
    backgroundColor: '#000',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
  },
  closeModalButtonText: {
    color: COLORS.primary,
    fontSize: 16,
    fontWeight: 'bold',
  },
});