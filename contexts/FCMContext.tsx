import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { Platform } from 'react-native';
import FCMService, { FCMNotification } from '@/services/fcmService';
import { useAuth } from '@/hooks/useAuth';
import { Intervention } from '@/types/intervention';

interface FCMContextType {
  isInitialized: boolean;
  fcmToken: string | null;
  notifications: FCMNotification[];
  unreadCount: number;
  currentNotification: FCMNotification | null;
  initializeFCM: () => Promise<void>;
  markAsRead: (notificationId: string) => void;
  markAllAsRead: () => void;
  clearNotifications: () => void;
  dismissCurrentNotification: () => void;
  testFCMNotification: () => Promise<void>;
}

const FCMContext = createContext<FCMContextType>({
  isInitialized: false,
  fcmToken: null,
  notifications: [],
  unreadCount: 0,
  currentNotification: null,
  initializeFCM: async () => {},
  markAsRead: () => {},
  markAllAsRead: () => {},
  clearNotifications: () => {},
  dismissCurrentNotification: () => {},
  testFCMNotification: async () => {},
});

export const useFCM = () => useContext(FCMContext);

export const FCMProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isInitialized, setIsInitialized] = useState(false);
  const [fcmToken, setFcmToken] = useState<string | null>(null);
  const [notifications, setNotifications] = useState<FCMNotification[]>([]);
  const [currentNotification, setCurrentNotification] = useState<FCMNotification | null>(null);
  const { user, token } = useAuth();

  const fcmService = FCMService.getInstance();

  // Initialiser FCM quand l'utilisateur est connecté
  useEffect(() => {
    if (user && token && Platform.OS !== 'web') {
      initializeFCM();
    }
  }, [user, token]);

  const initializeFCM = useCallback(async () => {
    try {
      console.log('🚀 Initialisation FCM...');
      
      // Initialiser le service FCM
      await fcmService.initialize();
      
      // Obtenir le token FCM
      const token = await fcmService.getFCMToken();
      setFcmToken(token);
      
      // Envoyer le token au serveur si disponible
      if (token && user?.id) {
        await fcmService.sendTokenToServer(token, user.id);
      }
      
      // Ajouter le listener pour les nouvelles notifications
      fcmService.addNotificationListener(handleNewNotification);
      
      setIsInitialized(true);
      console.log('✅ FCM initialisé avec succès');
      
    } catch (error) {
      console.error('❌ Erreur initialisation FCM:', error);
    }
  }, [user, fcmService]);

  const handleNewNotification = useCallback((notification: FCMNotification) => {
    console.log('📱 Nouvelle notification FCM reçue:', notification);
    
    // Ajouter à la liste des notifications
    setNotifications(prev => [notification, ...prev]);
    
    // Si c'est une nouvelle intervention, l'afficher immédiatement
    if (notification.data.type === 'NEW_INTERVENTION') {
      setCurrentNotification(notification);
    }
  }, []);

  const markAsRead = useCallback((notificationId: string) => {
    setNotifications(prev =>
      prev.map(notif =>
        notif.id === notificationId ? { ...notif, read: true } : notif
      )
    );
  }, []);

  const markAllAsRead = useCallback(() => {
    setNotifications(prev =>
      prev.map(notif => ({ ...notif, read: true }))
    );
  }, []);

  const clearNotifications = useCallback(() => {
    setNotifications([]);
  }, []);

  const dismissCurrentNotification = useCallback(() => {
    setCurrentNotification(null);
  }, []);

  const testFCMNotification = useCallback(async () => {
    await fcmService.testNotification();
  }, [fcmService]);

  // Calculer le nombre de notifications non lues
  const unreadCount = notifications.filter(notif => !notif.read).length;

  // Cleanup à la déconnexion
  useEffect(() => {
    return () => {
      if (isInitialized) {
        fcmService.removeNotificationListener(handleNewNotification);
        fcmService.cleanup();
      }
    };
  }, [isInitialized, handleNewNotification, fcmService]);

  const value: FCMContextType = {
    isInitialized,
    fcmToken,
    notifications,
    unreadCount,
    currentNotification,
    initializeFCM,
    markAsRead,
    markAllAsRead,
    clearNotifications,
    dismissCurrentNotification,
    testFCMNotification,
  };

  return (
    <FCMContext.Provider value={value}>
      {children}
    </FCMContext.Provider>
  );
};