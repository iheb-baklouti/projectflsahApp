import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { HeaderBar } from '@/components/ui/HeaderBar';
import { useLanguage } from '@/hooks/useLanguage';
import { translations } from '@/constants/Translations';

// This screen is not directly accessible from the tabs
// It will be opened when the center FAB button is pressed
export default function CreateScreen() {
  const { language } = useLanguage();
  const t = translations[language];

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <HeaderBar title={t.createAccount} showBack />
      <View style={styles.content}>
        <Text>This screen will implement action selection</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F6F6F6',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
});