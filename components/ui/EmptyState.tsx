import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Inbox, Clipboard, Calendar, CircleAlert as AlertCircle } from 'lucide-react-native';
import { COLORS } from '@/constants/Colors';

interface EmptyStateProps {
  title: string;
  description: string;
  icon?: 'inbox' | 'clipboard' | 'calendar' | 'alert';
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title,
  description,
  icon = 'inbox'
}) => {
  const renderIcon = () => {
    const iconSize = 60;
    const iconColor = COLORS.textLight;
    
    switch (icon) {
      case 'inbox':
        return <Inbox size={iconSize} color={iconColor} />;
      case 'clipboard':
        return <Clipboard size={iconSize} color={iconColor} />;
      case 'calendar':
        return <Calendar size={iconSize} color={iconColor} />;
      case 'alert':
        return <AlertCircle size={iconSize} color={iconColor} />;
      default:
        return <Inbox size={iconSize} color={iconColor} />;
    }
  };
  
  return (
    <View style={styles.container}>
      <View style={styles.iconContainer}>
        {renderIcon()}
      </View>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.description}>{description}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    minHeight: 300,
  },
  iconContainer: {
    marginBottom: 16,
    opacity: 0.5,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 8,
    textAlign: 'center',
  },
  description: {
    fontSize: 14,
    color: COLORS.textLight,
    textAlign: 'center',
    maxWidth: 250,
  },
});