import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { router } from 'expo-router';
import { Intervention } from '@/types/intervention';
import { useLanguage } from '@/hooks/useLanguage';
import { translations } from '@/constants/Translations';
import { STATUS_COLORS, STATUS_BG_COLORS } from '@/constants/Colors';
import { MapPin, Clock, CalendarClock, Zap, CircleCheck as CheckCircle2 } from 'lucide-react-native';

interface InterventionCardProps {
  intervention: Intervention;
  onTake?: () => void;
  isTakeable?: boolean;
  showDetails?: boolean;
  isHistorical?: boolean;
  showTime?: boolean;
}

export const InterventionCard: React.FC<InterventionCardProps> = ({
  intervention,
  onTake,
  isTakeable = false,
  showDetails = false,
  isHistorical = false,
  showTime = false,
}) => {
  const { language } = useLanguage();
  const t = translations[language];
  
  const handlePress = () => {
    // Navigate to intervention details
    router.push(`/intervention/${intervention.id}`);
  };
  
  // Format intervention time
  const formatTime = (timeString?: string) => {
    if (!timeString) return '';
    return timeString;
  };
  
  // Format intervention date
  const formatDate = (dateString?: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString(language === 'fr' ? 'fr-FR' : 'en-US', { 
      day: '2-digit', 
      month: 'short',
      year: 'numeric'
    });
  };
  
  // Get status text
  const getStatusText = (status: Intervention['status']) => {
    return t[status];
  };
  
  const statusColor = STATUS_COLORS[intervention.status];
  const statusBgColor = STATUS_BG_COLORS[intervention.status];
  
  // Utiliser l'adresse courte si disponible, sinon l'adresse complète
  const displayAddress = intervention.shortAddress || intervention.address;
  
  return (
    <TouchableOpacity
      style={[styles.container, isHistorical && styles.historicalContainer]}
      onPress={handlePress}
      activeOpacity={0.7}
    >
      {/* Urgent tag */}
      {intervention.isUrgent && (
        <View style={styles.urgentTag}>
          <Zap size={14} color="#FFFFFF" />
          <Text style={styles.urgentText}>{t.urgent}</Text>
        </View>
      )}
      
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.serviceType}>{intervention.serviceType}</Text>
          <Text style={styles.clientName}>{intervention.clientName}</Text>
        </View>
        
        <View style={[styles.statusBadge, { backgroundColor: statusBgColor }]}>
          <Text style={[styles.statusText, { color: statusColor }]}>
            {getStatusText(intervention.status)}
          </Text>
        </View>
      </View>
      
      {/* Address */}
      <View style={styles.infoRow}>
        <MapPin size={16} color="#666" style={styles.infoIcon} />
        <Text style={styles.infoText}>{displayAddress}</Text>
      </View>
      
      {/* Time */}
      {intervention.scheduledTime && (showTime || intervention.isUrgent === false) && (
        <View style={styles.infoRow}>
          <Clock size={16} color="#666" style={styles.infoIcon} />
          <Text style={styles.infoText}>{formatTime(intervention.scheduledTime)}</Text>
        </View>
      )}
      
      {/* Date */}
      {intervention.scheduledDate && (
        <View style={styles.infoRow}>
          <CalendarClock size={16} color="#666" style={styles.infoIcon} />
          <Text style={styles.infoText}>{formatDate(intervention.scheduledDate)}</Text>
        </View>
      )}
      
      {/* Description preview */}
      {showDetails && (
        <View style={styles.descriptionContainer}>
          <Text style={styles.descriptionLabel}>{t.description}:</Text>
          <Text style={styles.description} numberOfLines={2}>{intervention.description}</Text>
        </View>
      )}
      
      {/* Payment status */}
      {isHistorical && intervention.paymentStatus && (
        <View style={styles.paymentStatus}>
          {intervention.paymentStatus === 'PAID' && (
            <>
              <CheckCircle2 size={16} color="#34C759" style={styles.infoIcon} />
              <Text style={[styles.paymentStatusText, { color: '#34C759' }]}>Payé</Text>
            </>
          )}
          {intervention.paymentStatus === 'PENDING' && (
            <>
              <Clock size={16} color="#FF9500" style={styles.infoIcon} />
              <Text style={[styles.paymentStatusText, { color: '#FF9500' }]}>En attente</Text>
            </>
          )}
        </View>
      )}
      
      {/* Take button */}
      {isTakeable && (
        <TouchableOpacity
          style={styles.takeButton}
          onPress={onTake}
          activeOpacity={0.8}
        >
          <Text style={styles.takeButtonText}>{t.takeIntervention}</Text>
        </TouchableOpacity>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 3,
    position: 'relative',
  },
  historicalContainer: {
    opacity: 0.85,
  },
  urgentTag: {
    position: 'absolute',
    top: 0,
    right: 0,
    backgroundColor: '#FF3B30',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderTopRightRadius: 12,
    borderBottomLeftRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  urgentText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  serviceType: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  clientName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 16,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  infoIcon: {
    marginRight: 8,
  },
  infoText: {
    fontSize: 14,
    color: '#666',
    flex: 1,
  },
  descriptionContainer: {
    marginTop: 4,
  },
  descriptionLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
    marginBottom: 4,
  },
  description: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  paymentStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  paymentStatusText: {
    fontSize: 14,
    fontWeight: '500',
  },
  takeButton: {
    backgroundColor: '#0055FF',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 12,
  },
  takeButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 14,
  },
});