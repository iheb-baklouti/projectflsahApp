import React, { createContext, useState, useEffect } from 'react';
import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';

type LanguageType = 'en' | 'fr';

type LanguageContextType = {
  language: LanguageType;
  toggleLanguage: () => void;
  setLanguage: (lang: LanguageType) => void;
};

// Default value
const defaultValue: LanguageContextType = {
  language: 'en',
  toggleLanguage: () => {},
  setLanguage: () => {},
};

// Storage key
const LANGUAGE_STORAGE_KEY = 'app_language';

// Create context
export const LanguageContext = createContext<LanguageContextType>(defaultValue);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<LanguageType>('en');

  // Load stored language on mount
  useEffect(() => {
    const loadStoredLanguage = async () => {
      try {
        let storedLanguage;
        
        if (Platform.OS === 'web') {
          storedLanguage = localStorage.getItem(LANGUAGE_STORAGE_KEY);
        } else {
          storedLanguage = await SecureStore.getItemAsync(LANGUAGE_STORAGE_KEY);
        }
        
        if (storedLanguage === 'en' || storedLanguage === 'fr') {
          setLanguageState(storedLanguage);
        }
      } catch (error) {
        console.error('Error loading language preference:', error);
      }
    };

    loadStoredLanguage();
  }, []);

  // Save language preference
  const saveLanguage = async (lang: LanguageType) => {
    try {
      if (Platform.OS === 'web') {
        localStorage.setItem(LANGUAGE_STORAGE_KEY, lang);
      } else {
        await SecureStore.setItemAsync(LANGUAGE_STORAGE_KEY, lang);
      }
    } catch (error) {
      console.error('Error saving language preference:', error);
    }
  };

  // Set language
  const setLanguage = (lang: LanguageType) => {
    setLanguageState(lang);
    saveLanguage(lang);
  };

  // Toggle between en and fr
  const toggleLanguage = () => {
    const newLanguage = language === 'en' ? 'fr' : 'en';
    setLanguageState(newLanguage);
    saveLanguage(newLanguage);
  };

  return (
    <LanguageContext.Provider
      value={{
        language,
        toggleLanguage,
        setLanguage,
      }}
    >
      {children}
    </LanguageContext.Provider>
  );
};