export const COLORS = {
  // Primary colors - Retour au design précédent
  primary: '#FFD700', // Yellow from the image
  primaryLight: '#FFE55C',
  primaryDark: '#E6C200',
  
  // Status colors
  new: '#FFD700', // Yellow
  accepted: '#FF9500', // Orange
  enRoute: '#AF52DE', // Purple
  onSite: '#64D2FF', // Light Blue
  done: '#34C759', // Green
  needsReturn: '#FF9500', // Amber
  cancelled: '#FF3B30', // Red
  
  // Text colors - Design précédent
  text: '#1A1A1A',
  textLight: '#666666',
  
  // UI colors - Design précédent
  background: '#F6F6F6', // Retour au gris clair
  card: '#FFFFFF',
  border: '#E0E0E0',
  
  // Button colors
  button: '#FFD700',
  buttonText: '#1A1A1A',
  
  // Effect colors
  shadow: 'rgba(0, 0, 0, 0.1)',
  
  // Special states
  success: '#34C759',
  warning: '#FF9500',
  error: '#FF3B30',
  info: '#0A84FF',
};

export const DARK_COLORS = {
  // Primary colors (keep yellow for brand consistency)
  primary: '#FFD700',
  primaryLight: '#FFE55C',
  primaryDark: '#E6C200',
  
  // Status colors (same as light mode)
  new: '#FFD700',
  accepted: '#FF9500',
  enRoute: '#AF52DE',
  onSite: '#64D2FF',
  done: '#34C759',
  needsReturn: '#FF9500',
  cancelled: '#FF3B30',
  
  // Text colors - Amélioration pour dark mode
  text: '#FFFFFF',
  textLight: '#B0B0B0',
  
  // UI colors - Design moderne pour dark mode
  background: '#0A0A0A', // Noir profond
  card: '#1C1C1E', // Gris très foncé
  border: '#2C2C2E', // Bordures subtiles
  
  // Button colors
  button: '#FFD700',
  buttonText: '#000000',
  
  // Effect colors
  shadow: 'rgba(255, 255, 255, 0.05)',
  
  // Special states - Versions adaptées pour dark mode
  success: '#30D158',
  warning: '#FF9F0A',
  error: '#FF453A',
  info: '#64D2FF',
};

export const STATUS_COLORS = {
  NEW: COLORS.new,
  ACCEPTED: COLORS.accepted,
  EN_ROUTE: COLORS.enRoute,
  ON_SITE: COLORS.onSite,
  DONE: COLORS.done,
  JE_DOIS_REPASSER: COLORS.needsReturn,
  ANNULÉE: COLORS.cancelled,
};

export const STATUS_BG_COLORS = {
  NEW: 'rgba(255, 215, 0, 0.1)',
  ACCEPTED: 'rgba(255, 149, 0, 0.1)',
  EN_ROUTE: 'rgba(175, 82, 222, 0.1)',
  ON_SITE: 'rgba(100, 210, 255, 0.1)',
  DONE: 'rgba(52, 199, 89, 0.1)',
  JE_DOIS_REPASSER: 'rgba(255, 149, 0, 0.1)',
  ANNULÉE: 'rgba(255, 59, 48, 0.1)',
};