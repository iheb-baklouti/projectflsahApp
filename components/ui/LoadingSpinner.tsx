import React from 'react';
import { View, ActivityIndicator, Text, StyleSheet } from 'react-native';
import { useTheme } from '@/hooks/useTheme';
import { COLORS, DARK_COLORS } from '@/constants/Colors';

interface LoadingSpinnerProps {
  size?: 'small' | 'large';
  message?: string;
  fullScreen?: boolean;
  transparent?: boolean;
  apiStatus?: 'loading' | 'connecting' | 'retrying' | 'timeout';
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 'large',
  message,
  fullScreen = false,
  transparent = false,
  apiStatus = 'loading'
}) => {
  const { theme } = useTheme();
  const colors = theme === 'dark' ? DARK_COLORS : COLORS;

  // Déterminer le message en fonction du statut API
  const getStatusMessage = () => {
    switch (apiStatus) {
      case 'connecting':
        return 'Connexion à l\'API...';
      case 'retrying':
        return 'Nouvelle tentative...';
      case 'timeout':
        return 'Délai dépassé, utilisation des données locales...';
      default:
        return message || 'Chargement...';
    }
  };

  // Déterminer la couleur en fonction du statut API
  const getStatusColor = () => {
    switch (apiStatus) {
      case 'connecting':
        return colors.info;
      case 'retrying':
        return colors.warning;
      case 'timeout':
        return colors.error;
      default:
        return colors.primary;
    }
  };

  return (
    <View style={[
      styles.container,
      fullScreen && styles.fullScreen,
      transparent && styles.transparent,
      { backgroundColor: transparent ? 'rgba(0,0,0,0.3)' : colors.background }
    ]}>
      <View style={[styles.spinnerContainer, { backgroundColor: colors.card }]}>
        <ActivityIndicator size={size} color={getStatusColor()} />
        {getStatusMessage() && (
          <Text style={[styles.message, { color: colors.text }]}>
            {getStatusMessage()}
          </Text>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
  },
  fullScreen: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1000,
  },
  transparent: {
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  spinnerContainer: {
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 120,
    minHeight: 120,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
  },
  message: {
    marginTop: 12,
    fontSize: 14,
    textAlign: 'center',
  }
});