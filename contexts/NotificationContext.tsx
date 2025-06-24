import React, { createContext, useState, useEffect, useCallback } from 'react';
import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';

export type NotificationType = 'NEW_INTERVENTION' | 'STATUS_CHANGE' | 'PAYMENT' | 'SYSTEM';

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  body: string;
  data?: any;
  read: boolean;
  createdAt: string;
}

interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  enableSound: boolean;
  enableVibration: boolean;
  setEnableSound: (value: boolean) => void;
  setEnableVibration: (value: boolean) => void;
  registerForPushNotifications: () => Promise<void>;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  clearAll: () => void;
  isPermissionGranted: boolean;
}

export const NotificationContext = createContext<NotificationContextType>({
  notifications: [],
  unreadCount: 0,
  enableSound: true,
  enableVibration: true,
  setEnableSound: () => {},
  setEnableVibration: () => {},
  registerForPushNotifications: async () => {},
  markAsRead: () => {},
  markAllAsRead: () => {},
  clearAll: () => {},
  isPermissionGranted: false,
});

// Configuration globale des notifications
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isPermissionGranted, setIsPermissionGranted] = useState(false);
  const [enableSound, setEnableSound] = useState(true);
  const [enableVibration, setEnableVibration] = useState(true);

  const unreadCount = notifications.filter(n => !n.read).length;

  const registerForPushNotifications = useCallback(async () => {
    if (Platform.OS === 'web') {
      setIsPermissionGranted(true);
      return;
    }

    try {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== 'granted') {
        console.warn('Permission de notification refusée');
        setIsPermissionGranted(false);
        return;
      }

      setIsPermissionGranted(true);

      // Obtenir le token pour les notifications push
      try {
        const token = (await Notifications.getExpoPushTokenAsync()).data;
        console.log('Push token:', token);
      } catch (tokenError) {
        console.warn('Erreur lors de l\'obtention du token:', tokenError);
      }
    } catch (error) {
      console.error('Erreur lors de l\'enregistrement des notifications:', error);
      setIsPermissionGranted(false);
    }
  }, []);

  useEffect(() => {
    if (Platform.OS === 'web') return;

    // Écouter les notifications reçues quand l'app est au premier plan
    const foregroundSubscription = Notifications.addNotificationReceivedListener(notification => {
      console.log('Notification reçue au premier plan:', notification);
      
      const { title, body, data } = notification.request.content;

      const newNotification: Notification = {
        id: Date.now().toString(),
        type: (data?.type as NotificationType) || 'SYSTEM',
        title: title || 'Notification',
        body: body || '',
        data: data || {},
        read: false,
        createdAt: new Date().toISOString()
      };

      setNotifications(prev => [newNotification, ...prev]);
    });

    // Écouter les interactions avec les notifications
    const responseSubscription = Notifications.addNotificationResponseReceivedListener(response => {
      console.log('Interaction avec notification:', response);
      
      const { title, body, data } = response.notification.request.content;

      const newNotification: Notification = {
        id: Date.now().toString(),
        type: (data?.type as NotificationType) || 'SYSTEM',
        title: title || 'Notification',
        body: body || '',
        data: data || {},
        read: false,
        createdAt: new Date().toISOString()
      };

      setNotifications(prev => [newNotification, ...prev]);
    });

    return () => {
      foregroundSubscription.remove();
      responseSubscription.remove();
    };
  }, []);

  const markAsRead = useCallback((id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  }, []);

  const markAllAsRead = useCallback(() => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  }, []);

  const clearAll = useCallback(() => {
    setNotifications([]);
  }, []);

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        enableSound,
        enableVibration,
        setEnableSound,
        setEnableVibration,
        registerForPushNotifications,
        markAsRead,
        markAllAsRead,
        clearAll,
        isPermissionGranted,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};