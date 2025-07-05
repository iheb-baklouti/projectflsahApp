declare global {
  namespace NodeJS {
    interface ProcessEnv {
      EXPO_PUBLIC_API_URL: string;
      EXPO_PUBLIC_API_KEY: string;
      EXPO_PUBLIC_APP_ENV: 'development' | 'staging' | 'production';
      EXPO_PUBLIC_FCM_SENDER_ID: string;
      EXPO_PUBLIC_FCM_PROJECT_ID: string;
    }
  }
}

// Ensure this file is treated as a module
export {};