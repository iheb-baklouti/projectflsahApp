import React from 'react';
import { Tabs } from 'expo-router';
import { useLanguage } from '@/hooks/useLanguage';
import { translations } from '@/constants/Translations';
import { Redirect } from 'expo-router';
import { useAuth } from '@/hooks/useAuth';
import { Platform, StyleSheet } from 'react-native';
import { BlurView } from 'expo-blur';
import { Chrome as Home, Calendar, Clock, User, Plus } from 'lucide-react-native';
import { TouchableOpacity, View } from 'react-native';
import { COLORS } from '@/constants/Colors';

export default function TabsLayout() {
  const { isAuthenticated, isLoading } = useAuth();
  const { language } = useLanguage();
  const t = translations[language];

  // If not authenticated, redirect to login
  if (!isAuthenticated && !isLoading) {
    return <Redirect href="/login" />;
  }

  if (isLoading) {
    return null;
  }

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: true,
        tabBarActiveTintColor: COLORS.primary,
        tabBarInactiveTintColor: '#8E8E93',
        tabBarStyle: styles.tabBar,
        tabBarBackground: () => (
          <BlurView intensity={80} tint="light" style={StyleSheet.absoluteFill} />
        ),
      }}
    >
      <Tabs.Screen
        name="feed"
        options={{
          title: t.feed,
          tabBarIcon: ({ color, size }) => <Home size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="history"
        options={{
          title: t.history,
          tabBarIcon: ({ color, size }) => <Clock size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="create"
        options={{
          title: '',
          tabBarButton: (props) => <CustomTabButton {...props} />,
        }}
      />
      <Tabs.Screen
        name="calendar"
        options={{
          title: t.calendar,
          tabBarIcon: ({ color, size }) => <Calendar size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: t.profile,
          tabBarIcon: ({ color, size }) => <User size={size} color={color} />,
        }}
      />
    </Tabs>
  );
}

function CustomTabButton(props: any) {
  return (
    <TouchableOpacity
      {...props}
      style={styles.customButton}
      onPress={() => {
        // Handle center button action
      }}
    >
      <View style={styles.customButtonInner}>
        <Plus size={24} color="#FFFFFF" />
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    position: 'absolute',
    borderTopWidth: 0,
    elevation: 0,
    height: 80,
    backgroundColor: Platform.OS === 'ios' ? 'transparent' : 'rgba(255, 255, 255, 0.8)',
  },
  customButton: {
    top: -20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  customButtonInner: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
    elevation: 8,
  },
});