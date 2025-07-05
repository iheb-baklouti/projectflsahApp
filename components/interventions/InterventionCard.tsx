import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { router } from 'expo-router';
import { Intervention } from '@/types/intervention';
import { useLanguage } from '@/hooks/useLanguage';
import { useInterventions } from '@/hooks/useInterventions';
import { useTheme } from '@/hooks/useTheme';
import { translations } from '@/constants/Translations';
import { STATUS_COLORS, STATUS_BG_COLORS, COLORS, DARK_COLORS } from '@/constants/Colors';
import { MapPin, Clock, CalendarClock, Zap, CircleCheck as CheckCircle2, Lock, User, Hash, Wrench, TriangleAlert as AlertTriangle } from 'lucide-react-native';

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
  const { canAccessInterventionDetails } = useInterventions();
  const { theme } = useTheme();
  const t = translations[language];
  const colors = theme === 'dark' ? DARK_COLORS : COLORS;
  
  // Vérifier si l'utilisateur peut accéder aux détails
  const canAccess = canAccessInterventionDetails(intervention);
  console.log('canAccess', canAccess);
  console.log('intervention', intervention);
  
  // ✅ Logique d'affichage selon les spécifications
  const isInterventionTaken = intervention.technicianId !== null || 
                             ['COMPLETED', 'DONE', 'CANCELLED'].includes(intervention.status);
  
  const shouldShowTakeButton = intervention.technicianId === undefined && intervention.status === 'NEW';
  
  const handlePress = () => {
    if (!canAccess) return;
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
  
  // ✅ Affichage conditionnel selon les spécifications
  const displayAddress = isInterventionTaken 
    ? `${intervention.addressDetails.city}, ${intervention.addressDetails.citycode}`
    : intervention.addressDetails.city;

  return (
    <TouchableOpacity
      style={[
        styles.container,
        { 
          backgroundColor: colors.card,
          borderColor: colors.border,
          shadowColor: colors.shadow,
        },
        isHistorical && styles.historicalContainer,
        !canAccess && styles.lockedContainer
      ]}
      onPress={handlePress}
      activeOpacity={canAccess ? 0.7 : 1}
      disabled={!canAccess}
    >
      {/* ✅ Badge urgent moderne */}
      {intervention.isUrgent && (
        <View style={styles.urgentBadge}>
          <Zap size={12} color="#FFFFFF" />
          <Text style={styles.urgentText}>URGENT</Text>
        </View>
      )}
      
      {/* ✅ Indicateur de verrouillage pour les interventions non accessibles */}
      {!canAccess && intervention.status === 'NEW' && (
        <View style={styles.lockIndicator}>
          <Lock size={14} color="#999" />
          <Text style={styles.lockText}>Non prise</Text>
        </View>
      )}
      
      {/* ✅ Header moderne avec design Uber/Bolt */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          {/* Icône de spécialité */}
          <View style={[styles.specialtyIcon, { backgroundColor: colors.primary + '20' }]}>
            <Wrench size={16} color={colors.primary} />
          </View>
          
          <View style={styles.headerInfo}>
            {/* ✅ Numéro d'intervention */}
            <View style={styles.numberRow}>
              <Hash size={12} color={colors.textLight} />
              <Text style={[styles.interventionNumber, { color: colors.textLight }]}>
                {intervention.number}
              </Text>
            </View>
            
            {/* ✅ Spécialité */}
            <Text style={[styles.specialtyLabel, { color: colors.text }]}>
              {intervention.specialtyLabel}
            </Text>
            
            {/* ✅ Nom du client */}
            <Text style={[styles.clientName, { color: colors.text }]}>
              {intervention.clientName}
            </Text>
          </View>
        </View>
        
        {/* ✅ Badge de statut moderne */}
        <View style={[styles.statusBadge, { backgroundColor: statusBgColor }]}>
          <Text style={[styles.statusText, { color: statusColor }]}>
            {getStatusText(intervention.status)}
          </Text>
        </View>
      </View>
      
      {/* ✅ Informations d'adresse */}
      <View style={styles.infoRow}>
        <MapPin size={14} color={colors.textLight} style={styles.infoIcon} />
        <Text style={[styles.infoText, { color: colors.textLight }]} numberOfLines={1}>
          {displayAddress}
        </Text>
      </View>
      
      {/* ✅ Affichage conditionnel des détails selon si l'intervention est prise */}
      {isInterventionTaken && (
        <>
          {/* Technicien assigné */}
          {intervention.technicianName && (
            <View style={styles.infoRow}>
              <User size={14} color={colors.textLight} style={styles.infoIcon} />
              <Text style={[styles.infoText, { color: colors.textLight }]}>
                {intervention.technicianName}
              </Text>
            </View>
          )}
          
          {/* Adresse complète */}
          <View style={styles.infoRow}>
            <MapPin size={14} color={colors.textLight} style={styles.infoIcon} />
            <Text style={[styles.infoText, { color: colors.textLight }]} numberOfLines={2}>
              {intervention.addressDetails.label}
            </Text>
          </View>
        </>
      )}
      
      {/* ✅ Heure planifiée */}
      {intervention.scheduledTime && (showTime || intervention.isUrgent === false) && (
        <View style={styles.infoRow}>
          <Clock size={14} color={colors.textLight} style={styles.infoIcon} />
          <Text style={[styles.infoText, { color: colors.textLight }]}>
            {formatTime(intervention.scheduledTime)}
          </Text>
        </View>
      )}
      
      {/* ✅ Date planifiée */}
      {intervention.scheduledDate && (
        <View style={styles.infoRow}>
          <CalendarClock size={14} color={colors.textLight} style={styles.infoIcon} />
          <Text style={[styles.infoText, { color: colors.textLight }]}>
            {formatDate(intervention.scheduledDate)}
          </Text>
        </View>
      )}
      
      {/* ✅ Description preview pour les détails */}
      {showDetails && (
        <View style={styles.descriptionContainer}>
          <Text style={[styles.descriptionLabel, { color: colors.text }]}>
            {t.description}:
          </Text>
          <Text style={[styles.description, { color: colors.textLight }]} numberOfLines={2}>
            {intervention.description}
          </Text>
        </View>
      )}
      
      {/* ✅ Statut de paiement pour l'historique */}
      {isHistorical && intervention.paymentStatus && (
        <View style={styles.paymentStatus}>
          {intervention.paymentStatus === 'PAID' && (
            <>
              <CheckCircle2 size={14} color="#34C759" style={styles.infoIcon} />
              <Text style={[styles.paymentStatusText, { color: '#34C759' }]}>Payé</Text>
            </>
          )}
          {intervention.paymentStatus === 'PENDING' && (
            <>
              <Clock size={14} color="#FF9500" style={styles.infoIcon} />
              <Text style={[styles.paymentStatusText, { color: '#FF9500' }]}>En attente</Text>
            </>
          )}
          {intervention.paymentStatus === 'FAILED' && (
            <>
              <AlertTriangle size={14} color="#FF3B30" style={styles.infoIcon} />
              <Text style={[styles.paymentStatusText, { color: '#FF3B30' }]}>Échec</Text>
            </>
          )}
        </View>
      )}
      
      {/* ✅ Bouton "Prendre" moderne */}
      {shouldShowTakeButton && isTakeable && (
        <TouchableOpacity
          style={[styles.takeButton, { backgroundColor: colors.primary }]}
          onPress={onTake}
          activeOpacity={0.8}
        >
          <Text style={[styles.takeButtonText, { color: colors.buttonText }]}>
            {t.takeIntervention}
          </Text>
        </TouchableOpacity>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    position: 'relative',
    // Ombre moderne inspirée d'Uber
    ...Platform.select({
      ios: {
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
      },
      android: {
        elevation: 6,
      },
      web: {
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
      },
    }),
  },
  historicalContainer: {
    opacity: 0.85,
  },
  lockedContainer: {
    opacity: 0.6,
    backgroundColor: '#F8F8F8',
    borderColor: '#E0E0E0',
  },
  
  // ✅ Badge urgent moderne
  urgentBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: '#FF3B30',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    zIndex: 1,
  },
  urgentText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  
  // ✅ Indicateur de verrouillage
  lockIndicator: {
    position: 'absolute',
    top: 12,
    left: 12,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(153, 153, 153, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  lockText: {
    color: '#999',
    fontSize: 10,
    fontWeight: '500',
  },
  
  // ✅ Header moderne style Uber/Bolt
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    flex: 1,
    gap: 12,
  },
  specialtyIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerInfo: {
    flex: 1,
  },
  
  // ✅ Numéro d'intervention
  numberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
    gap: 4,
  },
  interventionNumber: {
    fontSize: 11,
    fontWeight: '500',
    letterSpacing: 0.3,
  },
  
  // ✅ Spécialité et client
  specialtyLabel: {
    fontSize: 13,
    fontWeight: '500',
    marginBottom: 2,
    opacity: 0.8,
  },
  clientName: {
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  
  // ✅ Badge de statut moderne
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    alignSelf: 'flex-start',
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  
  // ✅ Lignes d'information
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
  },
  infoIcon: {
    opacity: 0.7,
  },
  infoText: {
    fontSize: 14,
    flex: 1,
    lineHeight: 20,
  },
  
  // ✅ Description
  descriptionContainer: {
    marginTop: 8,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0, 0, 0, 0.05)',
  },
  descriptionLabel: {
    fontSize: 13,
    fontWeight: '500',
    marginBottom: 4,
  },
  description: {
    fontSize: 14,
    lineHeight: 20,
  },
  
  // ✅ Statut de paiement
  paymentStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0, 0, 0, 0.05)',
    gap: 8,
  },
  paymentStatusText: {
    fontSize: 13,
    fontWeight: '500',
  },
  
  // ✅ Bouton "Prendre" moderne style Uber
  takeButton: {
    marginTop: 16,
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12, 
    backgroundColor: COLORS.primary, 
    marginBottom: 12,
    // Ombre pour le bouton
    ...Platform.select({
      ios: {
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
      },
      android: {
        elevation: 4,
      },
      web: {
        boxShadow: '0 2px 4px rgba(0, 0, 0, 0.2)',
      },
    }),
  },
  takeButtonText: {
    fontSize: 15,
    letterSpacing: 0.3, 
    fontWeight: 'bold' 
  },
});