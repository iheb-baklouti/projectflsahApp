import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, StatusBar } from 'react-native';
import { Bell, ArrowLeft } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from 'expo-router';

interface HeaderButton {
  icon: React.ReactNode;
  onPress: () => void;
}

interface HeaderBarProps {
  title?: string;
  showBack?: boolean;
  showNotifications?: boolean;
  rightButtons?: HeaderButton[];
  onNotificationsPress?: () => void;
}

export const HeaderBar: React.FC<HeaderBarProps> = ({
  title,
  showBack = false,
  showNotifications = true,
  rightButtons,
  onNotificationsPress,
}) => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();

  const handleBackPress = () => {
    if (navigation.canGoBack()) {
      navigation.goBack();
    }
  };

  const handleNotificationsPress = () => {
    if (onNotificationsPress) {
      onNotificationsPress();
    }
  };

  return (
    <View
      style={[
        styles.container,
        { paddingTop: insets.top > 0 ? 10 : StatusBar.currentHeight || 10 },
      ]}
    >
      <View style={styles.leftSection}>
        {showBack && (
          <TouchableOpacity style={styles.backButton} onPress={handleBackPress}>
            <ArrowLeft size={24} color="#333" />
          </TouchableOpacity>
        )}
        {title && <Text style={styles.title}>{title}</Text>}
      </View>

      <View style={styles.rightSection}>
        {rightButtons?.map((button, index) => (
          <TouchableOpacity key={index} style={styles.iconButton} onPress={button.onPress}>
            {button.icon}
          </TouchableOpacity>
        ))}
        
        {showNotifications && !rightButtons && (
          <TouchableOpacity style={styles.iconButton} onPress={handleNotificationsPress}>
            <Bell size={24} color="#333" />
            {/* Notification badge could go here */}
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#EEEEEE',
  },
  leftSection: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rightSection: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    marginRight: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333333',
  },
  iconButton: {
    padding: 8,
    marginLeft: 8,
  },
});