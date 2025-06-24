import React, { createContext, useState, useEffect } from 'react';
import { Platform, useColorScheme } from 'react-native';
import * as SecureStore from 'expo-secure-store';

type ThemeType = 'light' | 'dark';
type ThemePreference = 'system' | 'light' | 'dark';

type ThemeContextType = {
  theme: ThemeType;
  themePreference: ThemePreference;
  setThemePreference: (preference: ThemePreference) => void;
};

// Default value
const defaultValue: ThemeContextType = {
  theme: 'light',
  themePreference: 'system',
  setThemePreference: () => {},
};

// Storage key
const THEME_PREFERENCE_KEY = 'theme_preference';

// Create context
export const ThemeContext = createContext<ThemeContextType>(defaultValue);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const systemColorScheme = useColorScheme() as ThemeType || 'light';
  const [themePreference, setThemePreferenceState] = useState<ThemePreference>('system');
  const [theme, setTheme] = useState<ThemeType>(systemColorScheme);

  // Load stored theme preference on mount
  useEffect(() => {
    const loadStoredThemePreference = async () => {
      try {
        let storedPreference;
        
        if (Platform.OS === 'web') {
          storedPreference = localStorage.getItem(THEME_PREFERENCE_KEY);
        } else {
          storedPreference = await SecureStore.getItemAsync(THEME_PREFERENCE_KEY);
        }
        
        if (storedPreference === 'system' || storedPreference === 'light' || storedPreference === 'dark') {
          setThemePreferenceState(storedPreference as ThemePreference);
        }
      } catch (error) {
        console.error('Error loading theme preference:', error);
      }
    };

    loadStoredThemePreference();
  }, []);

  // Update theme based on preference and system theme
  useEffect(() => {
    if (themePreference === 'system') {
      setTheme(systemColorScheme);
    } else {
      setTheme(themePreference as ThemeType);
    }
  }, [themePreference, systemColorScheme]);

  // Save theme preference
  const saveThemePreference = async (preference: ThemePreference) => {
    try {
      if (Platform.OS === 'web') {
        localStorage.setItem(THEME_PREFERENCE_KEY, preference);
      } else {
        await SecureStore.setItemAsync(THEME_PREFERENCE_KEY, preference);
      }
    } catch (error) {
      console.error('Error saving theme preference:', error);
    }
  };

  // Set theme preference
  const setThemePreference = (preference: ThemePreference) => {
    setThemePreferenceState(preference);
    saveThemePreference(preference);
  };

  return (
    <ThemeContext.Provider
      value={{
        theme,
        themePreference,
        setThemePreference,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
};