import React, { useEffect, useState, useCallback, useRef, useContext } from 'react';
import { View, Text, StyleSheet, FlatList, RefreshControl, ActivityIndicator, TouchableOpacity, Vibration, Platform, Switch } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLanguage } from '@/hooks/useLanguage';
import { useInterventions } from '@/hooks/useInterventions';
import { useTheme } from '@/hooks/useTheme';
import { translations } from '@/constants/Translations';
import { COLORS, DARK_COLORS } from '@/constants/Colors';
import { InterventionCard } from '@/components/interventions/InterventionCard';
import { InterventionFilter } from '@/components/interventions/InterventionFilter';
import { EmptyState } from '@/components/ui/EmptyState';
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'expo-router';
import * as Notifications from 'expo-notifications';
import { Audio } from 'expo-av';
import { Intervention } from '@/types/intervention';
import { NewInterventionPopup } from '@/components/interventions/NewInterventionPopup';
import { Ionicons } from '@expo/vector-icons';
import { NotificationContext } from '@/contexts/NotificationContext';

// Configuration des notifications
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export default function FeedScreen() {
  const { language } = useLanguage();
  const { theme } = useTheme();
  const t = translations[language];
  const { user } = useAuth();
  const router = useRouter();
  const colors = theme === 'dark' ? DARK_COLORS : COLORS;
  
  const {
    notifications,
    unreadCount,
    registerForPushNotifications,
    isPermissionGranted,
    enableSound,
    enableVibration
  } = useContext(NotificationContext);

  const {
    interventions,
    isLoading,
    error,
    refreshInterventions,
    takeIntervention
  } = useInterventions();

  const [refreshing, setRefreshing] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [filteredInterventions, setFilteredInterventions] = useState<Intervention[]>([]);
  const [popupIntervention, setPopupIntervention] = useState<Intervention | null>(null);
  const [autoTestEnabled, setAutoTestEnabled] = useState(false);
  const [testCounter, setTestCounter] = useState(0);
  
  const previousNotificationCount = useRef(0);
  const autoTestInterval = useRef<NodeJS.Timeout | null>(null);
  const soundObject = useRef<Audio.Sound | null>(null);

  // Initialiser le son
  useEffect(() => {
    const initializeSound = async () => {
      try {
        const { sound } = await Audio.Sound.createAsync(
          require('@/assets/sounds/notification.mp3')
        );
        soundObject.current = sound;
      } catch (error) {
        console.warn("Erreur lors de l'initialisation du son:", error);
      }
    };

    initializeSound();

    return () => {
      if (soundObject.current) {
        soundObject.current.unloadAsync();
      }
    };
  }, []);

  const playNotificationSound = async () => {
    try {
      if (enableSound && soundObject.current) {
        await soundObject.current.replayAsync();
      }
      if (enableVibration && Platform.OS !== 'web') {
        Vibration.vibrate([100, 200, 300]);
      }
    } catch (error) {
      console.warn("Erreur de son ou vibration:", error);
    }
  };

  const createTestIntervention = (counter: number): Intervention => {
    const testInterventions = [
      {
        title: "Fuite d'eau urgente",
        description: "Fuite importante dans la salle de bain",
        address: "123 Rue de la Paix, Paris",
        shortAddress: "République, Paris",
        clientName: "Marie Dupont"
      },
      {
        title: "Serrure bloquée",
        description: "Client enfermé dehors",
        address: "456 Avenue Victor Hugo, Lyon",
        shortAddress: "Part-Dieu, Lyon",
        clientName: "Jean Martin"
      },
      {
        title: "Panne électrique",
        description: "Coupure de courant dans l'appartement",
        address: "789 Boulevard Haussmann, Marseille",
        shortAddress: "Vieux-Port, Marseille",
        clientName: "Sophie Bernard"
      }
    ];

    const testData = testInterventions[counter % testInterventions.length];
    
    return {
      id: `test_${Date.now()}_${counter}`,
      ...testData,
      serviceType: "Intervention Test",
      status: 'NEW',
      isUrgent: true,
      coordinates: {
        latitude: 48.8566 + (Math.random() - 0.5) * 0.1,
        longitude: 2.3522 + (Math.random() - 0.5) * 0.1
      },
      clientPhone: "+33123456789",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
  };

  const triggerTestNotification = useCallback((isAuto = false) => {
    const counter = isAuto ? testCounter : Date.now();
    const testIntervention = createTestIntervention(counter);
    
    // Afficher le popup directement
    setPopupIntervention(testIntervention);
    
    // Jouer le son et vibration
    playNotificationSound();
    
    // Programmer une notification système aussi
    Notifications.scheduleNotificationAsync({
      content: {
        title: "🚨 " + testIntervention.title,
        body: `${testIntervention.description} - ${testIntervention.shortAddress}`,
        data: {
          type: 'NEW_INTERVENTION',
          interventionId: testIntervention.id,
          address: testIntervention.shortAddress
        }
      },
      trigger: null
    });

    if (isAuto) {
      setTestCounter(prev => prev + 1);
    }
  }, [testCounter, enableSound, enableVibration]);

  // Système de test automatique
  useEffect(() => {
    if (autoTestEnabled) {
      autoTestInterval.current = setInterval(() => {
        triggerTestNotification(true);
      }, 10000); // Toutes les 10 secondes
    } else {
      if (autoTestInterval.current) {
        clearInterval(autoTestInterval.current);
        autoTestInterval.current = null;
      }
    }

    return () => {
      if (autoTestInterval.current) {
        clearInterval(autoTestInterval.current);
      }
    };
  }, [autoTestEnabled, triggerTestNotification]);

  useEffect(() => {
    registerForPushNotifications();
  }, []);

  useEffect(() => {
    if (selectedFilter === 'all') {
      setFilteredInterventions(interventions);
    } else {
      setFilteredInterventions(
        interventions.filter(intervention => intervention.status === selectedFilter)
      );
    }
  }, [interventions, selectedFilter]);

  // Écouter les nouvelles notifications
  useEffect(() => {
    if (notifications.length > previousNotificationCount.current) {
      const latest = notifications[0];
      if (latest.type === 'NEW_INTERVENTION') {
        const newIntervention: Intervention = {
          id: latest.data?.interventionId || Date.now().toString(),
          title: latest.title,
          description: latest.body,
          address: latest.data?.address || 'Adresse non spécifiée',
          shortAddress: latest.data?.address || 'Zone non spécifiée',
          clientName: 'Client Notification',
          clientPhone: '+33123456789',
          serviceType: 'Notification',
          status: 'NEW',
          isUrgent: true,
          coordinates: {
            latitude: 48.8566,
            longitude: 2.3522
          },
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        
        setPopupIntervention(newIntervention);
        playNotificationSound();
      }
    }
    previousNotificationCount.current = notifications.length;
  }, [notifications]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refreshInterventions();
    setRefreshing(false);
  }, [refreshInterventions]);

  const handleTakeIntervention = async (id: string) => {
    if (id.startsWith('test_')) {
      // Pour les interventions de test, juste fermer le popup
      setPopupIntervention(null);
      return;
    }
    
    await takeIntervention(id);
    setPopupIntervention(null);
  };

  const renderItem = ({ item }: { item: Intervention }) => (
    <InterventionCard
      intervention={item}
      onTake={() => handleTakeIntervention(item.id)}
      isTakeable={item.status === 'NEW'}
    />
  );

  const dynamicStyles = StyleSheet.create({
    container: { 
      flex: 1, 
      backgroundColor: colors.background 
    },
    headerRow: { 
      flexDirection: 'row', 
      justifyContent: 'space-between', 
      alignItems: 'center', 
      paddingHorizontal: 16, 
      paddingVertical: 12,
      backgroundColor: colors.card,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
      // Ombre pour le mode sombre
      ...(theme === 'dark' && {
        shadowColor: colors.shadow,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
        elevation: 5,
      })
    },
    headerTitle: { 
      fontSize: 22, 
      fontWeight: 'bold',
      color: colors.text,
    },
    bellIcon: { 
      position: 'relative' 
    },
    badge: { 
      position: 'absolute', 
      top: -6, 
      right: -6, 
      backgroundColor: colors.error, 
      borderRadius: 8, 
      paddingHorizontal: 5, 
      paddingVertical: 2, 
      minWidth: 16, 
      alignItems: 'center', 
      justifyContent: 'center' 
    },
    badgeText: { 
      color: '#fff', 
      fontSize: 10, 
      fontWeight: 'bold' 
    },
    testSection: {
      backgroundColor: colors.card,
      margin: 16,
      padding: 16,
      borderRadius: 12,
      shadowColor: colors.shadow,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: theme === 'dark' ? 0.3 : 0.1,
      shadowRadius: 4,
      elevation: 3,
      // Bordure subtile pour le mode sombre
      ...(theme === 'dark' && {
        borderWidth: 1,
        borderColor: colors.border,
      })
    },
    testBtn: { 
      padding: 12, 
      borderRadius: 8, 
      backgroundColor: colors.primary, 
      alignItems: 'center',
      marginBottom: 12,
    },
    testBtnText: { 
      color: colors.buttonText, 
      fontWeight: 'bold' 
    },
    autoTestRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 8,
    },
    autoTestLabel: {
      fontSize: 16,
      fontWeight: '500',
      color: colors.text,
    },
    testCounter: {
      fontSize: 14,
      color: colors.textLight,
      textAlign: 'center',
      fontStyle: 'italic',
    },
    listContainer: { 
      padding: 16, 
      paddingBottom: 100 
    },
    loadingContainer: { 
      flex: 1, 
      justifyContent: 'center', 
      alignItems: 'center' 
    },
    errorContainer: { 
      flex: 1, 
      justifyContent: 'center', 
      alignItems: 'center', 
      padding: 20 
    },
    errorText: { 
      color: colors.error, 
      fontSize: 16, 
      textAlign: 'center', 
      marginBottom: 16 
    },
    retryButton: { 
      backgroundColor: colors.info, 
      paddingHorizontal: 20, 
      paddingVertical: 10, 
      borderRadius: 8 
    },
    retryButtonText: { 
      color: '#FFFFFF', 
      fontWeight: 'bold' 
    },
  });

  return (
    <SafeAreaView style={dynamicStyles.container} edges={['top']}>
      <View style={dynamicStyles.headerRow}>
        <Text style={dynamicStyles.headerTitle}>{t.interventions}</Text>
        <TouchableOpacity onPress={() => router.push('/notifications/NotificationCenter')} style={dynamicStyles.bellIcon}>
          <Ionicons name="notifications-outline" size={24} color={colors.text} />
          {unreadCount > 0 && (
            <View style={dynamicStyles.badge}>
              <Text style={dynamicStyles.badgeText}>{unreadCount}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {/* Zone de test */}
      <View style={dynamicStyles.testSection}>
        <TouchableOpacity onPress={() => triggerTestNotification(false)} style={dynamicStyles.testBtn}>
          <Text style={dynamicStyles.testBtnText}>📢 {t.testNotification || 'Tester une notification'}</Text>
        </TouchableOpacity>

        <View style={dynamicStyles.autoTestRow}>
          <Text style={dynamicStyles.autoTestLabel}>{t.autoTest || 'Test automatique (10s)'}</Text>
          <Switch 
            value={autoTestEnabled} 
            onValueChange={setAutoTestEnabled}
            trackColor={{ false: colors.border, true: colors.primary }}
            thumbColor={autoTestEnabled ? colors.buttonText : '#f4f3f4'}
          />
        </View>

        {autoTestEnabled && (
          <Text style={dynamicStyles.testCounter}>{t.testsSent || 'Tests envoyés'}: {testCounter}</Text>
        )}
      </View>

      {/* Popup de nouvelle intervention */}
      {popupIntervention && (
        <NewInterventionPopup
          intervention={popupIntervention}
          onTake={() => handleTakeIntervention(popupIntervention.id)}
          onDismiss={() => setPopupIntervention(null)}
        />
      )}

      <InterventionFilter
        selectedFilter={selectedFilter}
        onFilterChange={setSelectedFilter}
      />

      {isLoading && !refreshing ? (
        <View style={dynamicStyles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : error ? (
        <View style={dynamicStyles.errorContainer}>
          <Text style={dynamicStyles.errorText}>{error}</Text>
          <TouchableOpacity style={dynamicStyles.retryButton} onPress={refreshInterventions}>
            <Text style={dynamicStyles.retryButtonText}>{t.retry}</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={filteredInterventions}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={dynamicStyles.listContainer}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          ListEmptyComponent={
            <EmptyState
              title={t.noInterventions}
              description={t.noInterventionsDescription}
              icon="inbox"
            />
          }
        />
      )}
    </SafeAreaView>
  );
}