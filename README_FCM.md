# Configuration Firebase Cloud Messaging (FCM) pour React Native

## 📱 Configuration Mobile Complète

### 1. Installation des Dépendances

Les dépendances FCM ont été ajoutées au `package.json` :
```bash
npm install @react-native-firebase/app @react-native-firebase/messaging
```

### 2. Configuration Firebase

#### Android
1. **Créez un projet Firebase** sur [Firebase Console](https://console.firebase.google.com/)
2. **Ajoutez votre app Android** avec le package name de votre app
3. **Téléchargez `google-services.json`** et placez-le à la racine du projet
4. **Activez Cloud Messaging** dans la console Firebase

#### iOS
1. **Ajoutez votre app iOS** dans le même projet Firebase
2. **Téléchargez `GoogleService-Info.plist`** et placez-le à la racine du projet
3. **Configurez les certificats APNs** dans Firebase Console

### 3. Structure du Système FCM

#### 🔧 **FCMService** (`services/fcmService.ts`)
- Service singleton pour gérer FCM
- Gestion des permissions
- Handlers pour foreground/background/quit state
- Effets sonores et vibrations
- Transformation des messages Firebase

#### 🎯 **FCMContext** (`contexts/FCMContext.tsx`)
- Context React pour l'état FCM global
- Gestion des notifications reçues
- Interface pour les composants

#### 🎨 **FCMNotificationPopup** (`components/notifications/FCMNotificationPopup.tsx`)
- Popup moderne pour les notifications FCM
- Animations fluides
- Actions d'acceptation/rejet

### 4. Fonctionnalités Implémentées

#### ✅ **Réception en Temps Réel**
- **Foreground** : Popup immédiate + effets
- **Background** : Notification système
- **App fermée** : Notification système + ouverture app

#### ✅ **Gestion des États**
- Auto-initialisation à la connexion
- Envoi du token au serveur
- Listeners pour nouvelles notifications

#### ✅ **Interface Utilisateur**
- Popup contextuelle avec détails intervention
- Boutons d'action (Accepter/Ignorer)
- Animations et effets visuels
- Support thème sombre/clair

#### ✅ **Tests et Debug**
- Bouton test FCM dans l'app
- Affichage du statut de connexion
- Logs détaillés pour debug

### 5. Utilisation

#### Dans votre composant :
```typescript
import { useFCM } from '@/contexts/FCMContext';

const { 
  isInitialized, 
  fcmToken, 
  currentNotification,
  testFCMNotification 
} = useFCM();
```

#### Test des notifications :
```typescript
// Test local
await testFCMNotification();
```

### 6. Format des Notifications FCM

#### Structure attendue du backend Laravel :
```json
{
  "to": "FCM_TOKEN_DU_TECHNICIEN",
  "notification": {
    "title": "🚨 Nouvelle Intervention Urgente",
    "body": "Fuite d'eau - 123 Rue de la Paix, Paris"
  },
  "data": {
    "type": "NEW_INTERVENTION",
    "interventionId": "123",
    "clientName": "Marie Dupont",
    "address": "123 Rue de la Paix, 75001 Paris",
    "serviceType": "Plomberie",
    "description": "Fuite d'eau urgente",
    "isUrgent": "true",
    "scheduledDate": "2024-01-15T14:30:00Z",
    "scheduledTime": "14:30",
    "coordinates": "{\"latitude\":48.8566,\"longitude\":2.3522}"
  }
}
```

### 7. API Backend Requise

#### Endpoint pour enregistrer le token :
```
POST /api/fcm/register-token
{
  "fcm_token": "TOKEN_FCM",
  "user_id": "123",
  "platform": "android|ios"
}
```

#### Endpoint pour envoyer une notification :
```
POST /api/fcm/send-notification
{
  "user_id": "123",
  "title": "Titre",
  "body": "Message",
  "data": { ... }
}
```

### 8. Prochaines Étapes

1. **Configurez Firebase** avec vos certificats
2. **Implémentez l'API Laravel** pour l'envoi FCM
3. **Testez** avec de vraies notifications depuis l'admin
4. **Déployez** et testez en production

### 9. Debug et Logs

L'app affiche des logs détaillés :
- `✅` : Succès
- `⚠️` : Avertissement  
- `❌` : Erreur
- `📱` : Message FCM reçu

### 10. Sécurité

- Tokens FCM automatiquement renouvelés
- Validation côté serveur recommandée
- Chiffrement des données sensibles

---

**🚀 Votre app est maintenant prête pour recevoir des notifications push en temps réel !**