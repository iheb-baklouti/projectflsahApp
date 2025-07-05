import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, Alert } from 'react-native';
import { useTheme } from '@/hooks/useTheme';
import { useLanguage } from '@/hooks/useLanguage';
import { translations } from '@/constants/Translations';
import { COLORS, DARK_COLORS } from '@/constants/Colors';
import { X, CircleCheck as CheckCircle, Clock, Navigation, MapPin, TriangleAlert as AlertTriangle } from 'lucide-react-native';
import { Intervention } from '@/types/intervention';

interface StatusUpdateModalProps {
  visible: boolean;
  intervention: Intervention;
  onClose: () => void;
  onUpdateStatus: (status: Intervention['status']) => Promise<void>;
}

export const StatusUpdateModal: React.FC<StatusUpdateModalProps> = ({
  visible,
  intervention,
  onClose,
  onUpdateStatus,
}) => {
  const { theme } = useTheme();
  const { language } = useLanguage();
  const t = translations[language];
  const colors = theme === 'dark' ? DARK_COLORS : COLORS;
  const [isUpdating, setIsUpdating] = useState(false);

  const statusOptions = [
    {
      status: 'ACCEPTED' as const,
      label: 'Acceptée',
      icon: <CheckCircle size={20} color="#34C759" />,
      description: 'Intervention acceptée par le technicien',
      color: '#34C759',
      available: intervention.status === 'NEW'
    },
    {
      status: 'EN_ROUTE' as const,
      label: 'En route',
      icon: <Navigation size={20} color="#007AFF" />,
      description: 'Technicien en route vers le client',
      color: '#007AFF',
      available: ['ACCEPTED', 'ASSIGNED'].includes(intervention.status)
    },
    {
      status: 'ON_SITE' as const,
      label: 'Sur place',
      icon: <MapPin size={20} color="#FF9500" />,
      description: 'Technicien arrivé chez le client',
      color: '#FF9500',
      available: intervention.status === 'EN_ROUTE'
    },
    {
      status: 'COMPLETED' as const,
      label: 'Terminée',
      icon: <CheckCircle size={20} color="#30D158" />,
      description: 'Intervention terminée avec succès',
      color: '#30D158',
      available: intervention.status === 'ON_SITE'
    },
    {
      status: 'CANCELLED' as const,
      label: 'Annulée',
      icon: <AlertTriangle size={20} color="#FF3B30" />,
      description: 'Intervention annulée',
      color: '#FF3B30',
      available: !['COMPLETED', 'CANCELLED'].includes(intervention.status)
    }
  ];

  const availableStatuses = statusOptions.filter(option => option.available);

  const handleStatusUpdate = async (newStatus: Intervention['status']) => {
    try {
      setIsUpdating(true);
      
      // Confirmation pour les statuts critiques
      if (newStatus === 'CANCELLED') {
        Alert.alert(
          'Confirmer l\'annulation',
          'Êtes-vous sûr de vouloir annuler cette intervention ?',
          [
            { text: 'Non', style: 'cancel' },
            { 
              text: 'Oui, annuler', 
              style: 'destructive',
              onPress: async () => {
                await onUpdateStatus(newStatus);
                onClose();
              }
            }
          ]
        );
        return;
      }

      if (newStatus === 'COMPLETED') {
        await onUpdateStatus(newStatus);
                onClose();
        Alert.alert(
          'Terminer l\'intervention',
          'Marquer cette intervention comme terminée ?',
          [
            { text: 'Non', style: 'cancel' },
            { 
              text: 'Oui, terminer', 
              onPress: async () => {
                await onUpdateStatus(newStatus);
                onClose();
              }
            }
          ]
        );
        return;
      }

      // Pour les autres statuts, mise à jour directe
      await onUpdateStatus(newStatus);
      onClose();
      
    } catch (error) {
      Alert.alert('Erreur', 'Impossible de mettre à jour le statut');
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
          <View style={styles.modalHeader}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>
              Changer le statut
            </Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <X size={24} color={colors.textLight} />
            </TouchableOpacity>
          </View>

          <View style={styles.currentStatus}>
            <Text style={[styles.currentStatusLabel, { color: colors.textLight }]}>
              Statut actuel:
            </Text>
            <View style={[styles.currentStatusBadge, { backgroundColor: colors.primary + '20' }]}>
              <Text style={[styles.currentStatusText, { color: colors.primary }]}>
                {statusOptions.find(s => s.status === intervention.status)?.label || intervention.status}
              </Text>
            </View>
          </View>

          <View style={styles.statusList}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Statuts disponibles:
            </Text>
            
            {availableStatuses.map((option) => (
              <TouchableOpacity
                key={option.status}
                style={[
                  styles.statusOption,
                  { 
                    backgroundColor: colors.background,
                    borderColor: colors.border 
                  }
                ]}
                onPress={() => handleStatusUpdate(option.status)}
                disabled={isUpdating}
              >
                <View style={styles.statusOptionLeft}>
                  <View style={[styles.statusIconContainer, { backgroundColor: option.color + '20' }]}>
                    {option.icon}
                  </View>
                  <View style={styles.statusInfo}>
                    <Text style={[styles.statusLabel, { color: colors.text }]}>
                      {option.label}
                    </Text>
                    <Text style={[styles.statusDescription, { color: colors.textLight }]}>
                      {option.description}
                    </Text>
                  </View>
                </View>
                <View style={[styles.statusArrow, { borderLeftColor: colors.textLight }]} />
              </TouchableOpacity>
            ))}
          </View>

          {availableStatuses.length === 0 && (
            <View style={styles.noOptionsContainer}>
              <Text style={[styles.noOptionsText, { color: colors.textLight }]}>
                Aucun changement de statut disponible pour cette intervention.
              </Text>
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
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
    maxWidth: 400,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  closeButton: {
    padding: 4,
  },
  currentStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
    gap: 12,
  },
  currentStatusLabel: {
    fontSize: 16,
    fontWeight: '500',
  },
  currentStatusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  currentStatusText: {
    fontSize: 14,
    fontWeight: '600',
  },
  statusList: {
    gap: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  statusOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  statusOptionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  statusIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  statusInfo: {
    flex: 1,
  },
  statusLabel: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  statusDescription: {
    fontSize: 14,
    lineHeight: 18,
  },
  statusArrow: {
    width: 0,
    height: 0,
    borderLeftWidth: 6,
    borderTopWidth: 4,
    borderBottomWidth: 4,
    borderTopColor: 'transparent',
    borderBottomColor: 'transparent',
  },
  noOptionsContainer: {
    padding: 20,
    alignItems: 'center',
  },
  noOptionsText: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 22,
  },
});