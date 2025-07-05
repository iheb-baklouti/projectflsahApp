import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useLanguage } from '@/hooks/useLanguage';
import { translations } from '@/constants/Translations';
import { STATUS_COLORS } from '@/constants/Colors';

type FilterOption = 'all' | 'NEW' | 'ACCEPTED' | 'ASSIGNED' | 'EN_ROUTE' | 'ON_SITE' | 'DONE' | 'COMPLETED' | 'CANCELLED';

interface InterventionFilterProps {
  selectedFilter: string;
  onFilterChange: (filter: string) => void;
}

export const InterventionFilter: React.FC<InterventionFilterProps> = ({
  selectedFilter,
  onFilterChange,
}) => {
  const { language } = useLanguage();
  const t = translations[language];
  
  const filters: { id: FilterOption; label: string; color: string }[] = [
    { id: 'all', label: t.allInterventions, color: '#0055FF' },
    { id: 'NEW', label: t.newInterventions, color: STATUS_COLORS.NEW },
    { id: 'ACCEPTED', label: t.acceptedInterventions, color: STATUS_COLORS.ACCEPTED },
    { id: 'ASSIGNED', label: t.assignedInterventions, color: STATUS_COLORS.ASSIGNED },
    { id: 'EN_ROUTE', label: t.enRouteInterventions, color: STATUS_COLORS.EN_ROUTE },
    { id: 'ON_SITE', label: t.onSiteInterventions, color: STATUS_COLORS.ON_SITE },
    { id: 'DONE', label: t.doneInterventions, color: STATUS_COLORS.DONE },
    { id: 'COMPLETED', label: t.completedInterventions, color: STATUS_COLORS.COMPLETED },
    { id: 'CANCELLED', label: t.cancelledInterventions, color: STATUS_COLORS.CANCELLED },
  ];
  
  return (
    <View style={styles.container}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {filters.map((filter) => (
          <TouchableOpacity
            key={filter.id}
            style={[
              styles.filterButton,
              selectedFilter === filter.id && [
                styles.selectedFilter,
                { borderColor: filter.color }
              ]
            ]}
            onPress={() => onFilterChange(filter.id)}
          >
            <Text
              style={[
                styles.filterText,
                selectedFilter === filter.id && [
                  styles.selectedFilterText,
                  { color: filter.color }
                ]
              ]}
            >
              {filter.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#EEEEEE',
  },
  scrollContent: {
    paddingHorizontal: 16,
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#EEEEEE',
    backgroundColor: '#F6F6F6',
  },
  filterText: {
    fontSize: 14,
    color: '#666666',
  },
  selectedFilter: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
  },
  selectedFilterText: {
    fontWeight: '600',
  },
});