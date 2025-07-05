import { Platform } from 'react-native';
import messaging, { FirebaseMessagingTypes } from '@react-native-firebase/messaging';
import * as Notifications from 'expo-notifications';
import { Audio } from 'expo-av';
import { Vibration } from 'react-native';

export interface FCMNotificationData {
  type: 'NEW_INTERVENTION' | 'STATUS_CHANGE' | 'PAYMENT' | 'SYSTEM';
  interventionId?: string;
  clientName?: string;
  address?: string;
  serviceType?: string;
  description?: string;
  isUrgent?: boolean;
  scheduledDate?: string;
  scheduledTime?: string;
  coordinates?: {
    latitude: number;
    longitude: number;
  };
}

export interface FCMNotification {
  id: string;
  title: string;
  body: string;
  data: FCMNotificationData;
  receivedAt: string;
  read: boolean;
}

class FCMService {
  private static instance: FCMService;
  private soundObject: Audio.Sound | null = null;
  private notificationListeners: ((notification: FCMNotification) => void)[] = [];
  private isInitialized = false;

  static getInstance(): FCMService {
    if (!FCMService.instance) {
      FCMService.instance = new FCMService();
    }
    return FCMService.instance;
  }

  async initialize(): Promise<void> {
    if (this.isInitialized || Platform.OS === 'web') {
      return;
    }

    try {
      // Demander les permissions
      await this.requestPermissions();
      
      // Initialiser le son de notification
      await this.initializeSound();
      
      // Configurer les handlers de messages
      this.setupMessageHandlers();
      
      // Obtenir le token FCM
      const token = await this.getFCMToken();
      console.log('FCM Token:', token);
      
      this.isInitialized = true;
      console.log('✅ FCM Service initialisé avec succès');
      
    } catch (error) {
      console.error('❌ Erreur lors de l\'initialisation FCM:', error);
    }
  }

  private async requestPermissions(): Promise<boolean> {
    try {
      const authStatus = await messaging().requestPermission();
      const enabled =
        authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
        authStatus === messaging.AuthorizationStatus.PROVISIONAL;

      if (!enabled) {
        console.warn('⚠️ Permissions FCM refusées');
        return false;
      }

      console.log('✅ Permissions FCM accordées');
      return true;
    } catch (error) {
      console.error('❌ Erreur permissions FCM:', error);
      return false;
    }
  }

  private async initializeSound(): Promise<void> {
    try {
      const { sound } = await Audio.Sound.createAsync(
        require('@/assets/sounds/notification.mp3')
      );
      this.soundObject = sound;
      console.log('✅ Son de notification initialisé');
    } catch (error) {
      console.warn('⚠️ Erreur lors de l\'initialisation du son:', error);
    }
  }

  private setupMessageHandlers(): void {
    // Messages reçus en foreground
    messaging().onMessage(async (remoteMessage) => {
      console.log('📱 Message FCM reçu en foreground:', remoteMessage);
      await this.handleForegroundMessage(remoteMessage);
    });

    // Messages reçus en background/quit state
    messaging().onNotificationOpenedApp((remoteMessage) => {
      console.log('📱 App ouverte via notification:', remoteMessage);
      this.handleNotificationOpen(remoteMessage);
    });

    // Vérifier si l'app a été ouverte via une notification
    messaging()
      .getInitialNotification()
      .then((remoteMessage) => {
        if (remoteMessage) {
          console.log('📱 App ouverte via notification initiale:', remoteMessage);
          this.handleNotificationOpen(remoteMessage);
        }
      });

    // Handler pour les messages en background
    messaging().setBackgroundMessageHandler(async (remoteMessage) => {
      console.log('📱 Message FCM reçu en background:', remoteMessage);
      await this.handleBackgroundMessage(remoteMessage);
    });
  }

  private async handleForegroundMessage(
    remoteMessage: FirebaseMessagingTypes.RemoteMessage
  ): Promise<void> {
    const notification = this.transformRemoteMessage(remoteMessage);
    
    // Jouer le son et vibrer
    await this.playNotificationEffects();
    
    // Notifier les listeners (pour afficher la popup)
    this.notifyListeners(notification);
    
    // Afficher aussi une notification système
    await this.showLocalNotification(notification);
  }

  private async handleBackgroundMessage(
    remoteMessage: FirebaseMessagingTypes.RemoteMessage
  ): Promise<void> {
    console.log('Traitement message background:', remoteMessage);
    // Le message sera automatiquement affiché par le système
    // On peut faire du traitement de données ici si nécessaire
  }

  private handleNotificationOpen(
    remoteMessage: FirebaseMessagingTypes.RemoteMessage
  ): void {
    const notification = this.transformRemoteMessage(remoteMessage);
    
    // Notifier les listeners pour navigation ou actions spécifiques
    this.notifyListeners(notification);
  }

  private transformRemoteMessage(
    remoteMessage: FirebaseMessagingTypes.RemoteMessage
  ): FCMNotification {
    const data = remoteMessage.data as any;
    
    return {
      id: remoteMessage.messageId || Date.now().toString(),
      title: remoteMessage.notification?.title || 'Nouvelle notification',
      body: remoteMessage.notification?.body || '',
      data: {
        type: data?.type || 'SYSTEM',
        interventionId: data?.interventionId,
        clientName: data?.clientName,
        address: data?.address,
        serviceType: data?.serviceType,
        description: data?.description,
        isUrgent: data?.isUrgent === 'true',
        scheduledDate: data?.scheduledDate,
        scheduledTime: data?.scheduledTime,
        coordinates: data?.coordinates ? JSON.parse(data.coordinates) : undefined,
      },
      receivedAt: new Date().toISOString(),
      read: false,
    };
  }

  private async playNotificationEffects(): Promise<void> {
    try {
      // Jouer le son
      if (this.soundObject) {
        await this.soundObject.replayAsync();
      }
      
      // Vibrer
      if (Platform.OS !== 'web') {
        Vibration.vibrate([100, 200, 300]);
      }
    } catch (error) {
      console.warn('⚠️ Erreur effets notification:', error);
    }
  }

  private async showLocalNotification(notification: FCMNotification): Promise<void> {
    try {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: notification.title,
          body: notification.body,
          data: notification.data,
          sound: 'notification.mp3',
        },
        trigger: null,
      });
    } catch (error) {
      console.warn('⚠️ Erreur notification locale:', error);
    }
  }

  async getFCMToken(): Promise<string | null> {
    try {
      if (Platform.OS === 'web') {
        return null;
      }

      const token = await messaging().getToken();
      console.log('🔑 Token FCM obtenu:', token);
      return token;
    } catch (error) {
      console.error('❌ Erreur obtention token FCM:', error);
      return null;
    }
  }

  async sendTokenToServer(token: string, userId: string): Promise<void> {
    try {
      // Ici vous enverrez le token à votre backend Laravel
      const response = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/api/fcm/register-token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`, // Token d'auth utilisateur
        },
        body: JSON.stringify({
          fcm_token: token,
          user_id: userId,
          platform: Platform.OS,
        }),
      });

      if (response.ok) {
        console.log('✅ Token FCM envoyé au serveur');
      } else {
        console.warn('⚠️ Erreur envoi token au serveur');
      }
    } catch (error) {
      console.error('❌ Erreur envoi token:', error);
    }
  }

  // Méthodes pour les listeners
  addNotificationListener(callback: (notification: FCMNotification) => void): void {
    this.notificationListeners.push(callback);
  }

  removeNotificationListener(callback: (notification: FCMNotification) => void): void {
    this.notificationListeners = this.notificationListeners.filter(
      listener => listener !== callback
    );
  }

  private notifyListeners(notification: FCMNotification): void {
    this.notificationListeners.forEach(listener => {
      try {
        listener(notification);
      } catch (error) {
        console.error('❌ Erreur listener notification:', error);
      }
    });
  }

  // Méthode pour tester les notifications
  async testNotification(): Promise<void> {
    const testNotification: FCMNotification = {
      id: `test_${Date.now()}`,
      title: '🚨 Test Notification FCM',
      body: 'Ceci est un test de notification push',
      data: {
        type: 'NEW_INTERVENTION',
        interventionId: 'test_123',
        clientName: 'Client Test',
        address: '123 Rue de Test, Paris',
        serviceType: 'Test Service',
        description: 'Description de test',
        isUrgent: true,
      },
      receivedAt: new Date().toISOString(),
      read: false,
    };

    await this.playNotificationEffects();
    this.notifyListeners(testNotification);
    await this.showLocalNotification(testNotification);
  }

  // Cleanup
  async cleanup(): Promise<void> {
    if (this.soundObject) {
      await this.soundObject.unloadAsync();
      this.soundObject = null;
    }
    this.notificationListeners = [];
  }
}

export default FCMService;