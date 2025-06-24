import React from 'react';
import { View, StyleSheet } from 'react-native';
import { COLORS } from '@/constants/Colors';

interface FlashLogoProps {
  size?: number;
  color?: string;
}

export const FlashLogo: React.FC<FlashLogoProps> = ({ 
  size = 60, 
  color = COLORS.primary 
}) => {
  return (
    <View style={[
      styles.container, 
      { 
        width: size, 
        height: size,
      }
    ]}>
      <View style={[
        styles.bolt,
        {
          width: size * 0.7,
          height: size * 0.8,
          backgroundColor: color
        }
      ]} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  bolt: {
    clipPath: 'polygon(45% 0%, 90% 50%, 55% 50%, 100% 100%, 10% 50%, 45% 50%)',
    transform: [{ rotate: '0deg' }]
  }
});