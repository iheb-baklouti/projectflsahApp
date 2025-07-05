import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated, Dimensions, Platform } from 'react-native';
import { BlurView } from 'expo-blur';
import { COLORS } from '@/constants/Colors';
import { MapPin, Clock, User, Phone, X, Zap, CircleCheck as CheckCircle } from 'lucide-react-native';
import { FCMNotification } from '@/services/fcmService';
import { Intervention } from '@/types/intervention';

interface Props {
  notification: FCMNotification;
  onAccept: () => void;
  onDismiss: () => void;
}

const screenWidth = Dimensions.get('window').width;
const screenHeight = Dimensions.get('window').height;

export const FCMNotificationPopup: React.FC<Props> = ({ notification, onAccept, onDismiss }) => {
  const slideAnim = useRef(new Animated.Value(screenHeight)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // Animation d'entrée sophistiquée
    Animated.parallel([
      Animated.spring(slideAnim, {
        toValue: 0,
        useNativeDriver: true,
        tension: 80,
        friction: 8,
      }),
      Animated.timing(opacityAnim, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        useNativeDriver: true,
        tension: 100,
        friction: 8,
      })
    ]).start();

    // Animation de pulsation pour l'urgence
    if (notification.data.isUrgent) {
      const pulse = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.05,
            duration: 800,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 800,
            useNativeDriver: true,
          })
        ])
      );
      pulse.start();
    }

    // Auto-hide après 15 secondes
    const timeout = setTimeout(() => {
      hidePopup();
    }, 15000);

    return () => clearTimeout(timeout);
  }, []);

  const hidePopup = () => {
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: screenHeight,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 0.9,
        useNativeDriver: true,
        tension: 100,
        friction: 8,
      })
    ]).start(() => onDismiss());
  };

  const handleAccept = () => {
    onAccept();
    hidePopup();
  };

  // Fonction pour formater l'adresse (ville + quartier seulement)
  const formatShortAddress = (fullAddress?: string) => {
    if (!fullAddress) return 'Adresse non spécifiée';
    
    const parts = fullAddress.split(',');
    if (parts.length >= 2) {
      return parts.slice(-2).join(',').trim();
    }
    return fullAddress;
  };

  return (
    <Animated.View 
      style={[
        styles.overlay, 
        { 
          opacity: opacityAnim,
        }
      ]}
    >
      {Platform.OS === 'ios' ? (
        <BlurView intensity={30} tint="dark" style={StyleSheet.absoluteFill} />
      ) : (
        <View style={[StyleSheet.absoluteFill, styles.androidBlur]} />
      )}
      
      <Animated.View 
        style={[
          styles.container, 
          { 
            transform: [
              { translateY: slideAnim },
              { scale: scaleAnim }
            ] 
          }
        ]}
      >
        <Animated.View 
          style={[
            styles.inner,
            notification.data.isUrgent && {
              transform: [{ scale: pulseAnim }]
            }
          ]}
        >
          {/* Header moderne avec gradient */}
          <View style={styles.header}>
            <View style={styles.headerContent}>
              {notification.data.isUrgent && (
                <View style={styles.urgentBadge}>
                  <Zap size={16} color="#000" />
                  <Text style={styles.urgentText}>URGENT</Text>
                </View>
              )}
              <Text style={styles.headerTitle}>{notification.title}</Text>
            </View>
            <TouchableOpacity onPress={hidePopup} style={styles.closeButton}>
              <X size={20} color="#FFD700" />
            </TouchableOpacity>
          </View>

          {/* Contenu principal avec design moderne */}
          <View style={styles.content}>
            <View style={styles.serviceTypeContainer}>
              <Text style={styles.serviceType}>
                {notification.data.serviceType || 'Nouvelle Intervention'}
              </Text>
              {notification.data.isUrgent && (
                <View style={styles.urgentIndicator}>
                  <Text style={styles.urgentIndicatorText}>🚨</Text>
                </View>
              )}
            </View>
            
            <Text style={styles.description} numberOfLines={2}>
              {notification.body || notification.data.description || 'Nouvelle intervention disponible'}
            </Text>
            
            <View style={styles.infoContainer}>
              {notification.data.clientName && (
                <View style={styles.infoRow}>
                  <View style={styles.iconContainer}>
                    <User size={16} color="#FFD700" />
                  </View>
                  <Text style={styles.infoText}>{notification.data.clientName}</Text>
                </View>
              )}
              
              {notification.data.address && (
                <View style={styles.infoRow}>
                  <View style={styles.iconContainer}>
                    <MapPin size={16} color="#FFD700" />
                  </View>
                  <Text style={styles.infoText} numberOfLines={1}>
                    {formatShortAddress(notification.data.address)}
                  </Text>
                </View>
              )}

              {notification.data.scheduledTime && (
                <View style={styles.infoRow}>
                  <View style={styles.iconContainer}>
                    <Clock size={16} color="#FFD700" />
                  </View>
                  <Text style={styles.infoText}>{notification.data.scheduledTime}</Text>
                </View>
              )}
            </View>
          </View>

          {/* Boutons d'action modernes */}
          <View style={styles.buttons}>
            <TouchableOpacity style={styles.dismissButton} onPress={hidePopup}>
              <Text style={styles.dismissButtonText}>Ignorer</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.acceptButton} onPress={handleAccept}>
              <CheckCircle size={20} color="#000" />
              <Text style={styles.acceptButtonText}>Accepter</Text>
            </TouchableOpacity>
          </View>

          {/* Indicateur de temps moderne */}
          <View style={styles.timeIndicator}>
            <View style={styles.timeIndicatorDot} />
            <Text style={styles.timeText}>Se ferme automatiquement dans 15s</Text>
          </View>
        </Animated.View>
      </Animated.View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1000,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  androidBlur: {
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
  },
  container: {
    width: '100%',
    maxWidth: 380,
  },
  inner: {
    backgroundColor: '#fff',
    borderRadius: 20,
    overflow: 'hidden',
    elevation: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 15 },
    shadowOpacity: 0.4,
    shadowRadius: 25,
    borderWidth: 3,
    borderColor: '#FFD700',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#000',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  headerContent: {
    flex: 1,
    alignItems: 'center',
  },
  urgentBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFD700',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 8,
  },
  urgentText: {
    color: '#000',
    fontWeight: 'bold',
    fontSize: 12,
    marginLeft: 4,
  },
  headerTitle: {
    color: '#FFD700',
    fontWeight: 'bold',
    fontSize: 16,
    textAlign: 'center',
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 215, 0, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    padding: 24,
    backgroundColor: '#fff',
  },
  serviceTypeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  serviceType: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#000',
    flex: 1,
  },
  urgentIndicator: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FFD700',
    justifyContent: 'center',
    alignItems: 'center',
  },
  urgentIndicatorText: {
    fontSize: 16,
  },
  description: {
    fontSize: 16,
    color: '#333',
    marginBottom: 20,
    lineHeight: 24,
  },
  infoContainer: {
    gap: 12,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 215, 0, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  infoText: {
    fontSize: 15,
    color: '#333',
    flex: 1,
    fontWeight: '500',
  },
  buttons: {
    flexDirection: 'row',
    paddingHorizontal: 24,
    paddingBottom: 24,
    gap: 12,
    backgroundColor: '#fff',
  },
  acceptButton: {
    flex: 2,
    backgroundColor: '#FFD700',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    elevation: 3,
    shadowColor: '#FFD700',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  acceptButtonText: {
    color: '#000',
    fontWeight: 'bold',
    fontSize: 16,
  },
  dismissButton: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  dismissButtonText: {
    color: '#666',
    fontWeight: '600',
    fontSize: 16,
  },
  timeIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f8f8f8',
    paddingVertical: 12,
    gap: 8,
  },
  timeIndicatorDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#FFD700',
  },
  timeText: {
    fontSize: 12,
    color: '#666',
    fontStyle: 'italic',
  },
});