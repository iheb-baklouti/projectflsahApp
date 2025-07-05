import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Switch, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLanguage } from '@/hooks/useLanguage';
import { useAuth } from '@/hooks/useAuth';
import { useTheme } from '@/hooks/useTheme';
import { translations } from '@/constants/Translations';
import { COLORS, DARK_COLORS } from '@/constants/Colors';
import { NotificationContext } from '@/contexts/NotificationContext';
import React, { useContext } from 'react';
import { Settings, LogOut, Bell, Globe, CreditCard, ShieldCheck, CircleHelp as HelpCircle, ChevronRight, Moon, UserCog, FileText, Upload, TriangleAlert as AlertTriangle } from 'lucide-react-native';
import { router } from 'expo-router';

export default function ProfileScreen() {
  const { language, toggleLanguage } = useLanguage();
  const { user, logout } = useAuth();
  const { theme, setThemePreference, themePreference } = useTheme();
  const t = translations[language];
  
  const colors = theme === 'dark' ? DARK_COLORS : COLORS;
  
  const [notificationsEnabled, setNotificationsEnabled] = React.useState(true);
  const {
    enableSound,
    enableVibration,
    setEnableSound,
    setEnableVibration
  } = useContext(NotificationContext);

  const toggleNotifications = () => setNotificationsEnabled(previous => !previous);
  const toggleDarkMode = () => {
    const newPreference = themePreference === 'dark' ? 'light' : 'dark';
    setThemePreference(newPreference);
  };
  
  const handleLogout = () => {
   logout();
    Alert.alert(
      t.logoutTitle,
      t.logoutMessage,
      [
        {
          text: t.cancel,
          style: 'cancel'
        },
        {
          text: t.logout,
          onPress: () => logout(),
          style: 'destructive'
        }
      ]
    );
  };
  
  const handleLanguageChange = () => {
    toggleLanguage();
  };

  const navigateToLegal = (route: string) => {
    router.push(`/legal/${route}`);
  };

  const navigateToAccountInfo = () => {
    router.push('/profile/AccountInfo');
  };

  const dynamicStyles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: 20,
      paddingVertical: 15,
      backgroundColor: colors.card,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    title: {
      fontSize: 18,
      fontWeight: 'bold',
      color: colors.text,
    },
    scrollView: {
      flex: 1,
    },
    profileCard: {
      backgroundColor: colors.card,
      flexDirection: 'row',
      padding: 20,
      marginVertical: 16,
      marginHorizontal: 16,
      borderRadius: 12,
      shadowColor: colors.shadow,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.05,
      shadowRadius: 3.84,
      elevation: 3,
    },
    profileImageContainer: {
      width: 70,
      height: 70,
      borderRadius: 35,
      backgroundColor: colors.primary,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 16,
    },
    profileImagePlaceholder: {
      fontSize: 28,
      fontWeight: 'bold',
      color: colors.buttonText,
    },
    profileInfo: {
      flex: 1,
      justifyContent: 'center',
    },
    profileName: {
      fontSize: 18,
      fontWeight: 'bold',
      color: colors.text,
      marginBottom: 4,
    },
    profileEmail: {
      fontSize: 14,
      color: colors.textLight,
      marginBottom: 8,
    },
    badgesContainer: {
      flexDirection: 'row',
      flexWrap: 'wrap',
    },
    badge: {
      backgroundColor: `${colors.primary}20`,
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 12,
      marginRight: 8,
      marginBottom: 4,
      borderWidth: 1,
      borderColor: colors.primary,
    },
    badgeText: {
      color: colors.primary,
      fontSize: 12,
      fontWeight: '500',
    },
    sectionTitle: {
      paddingHorizontal: 20,
      paddingVertical: 10,
    },
    sectionTitleText: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.textLight,
    },
    section: {
      backgroundColor: colors.card,
      borderRadius: 12,
      marginHorizontal: 16,
      marginBottom: 16,
      shadowColor: colors.shadow,
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 2.22,
      elevation: 2,
      overflow: 'hidden',
    },
    menuItem: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 16,
      paddingHorizontal: 16,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    menuItemIconContainer: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: colors.background,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 16,
    },
    menuItemContent: {
      flex: 1,
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    menuItemText: {
      fontSize: 16,
      color: colors.text,
    },
    menuItemRightText: {
      fontSize: 16,
      color: colors.textLight,
    },
    logoutButton: {
      backgroundColor: colors.error,
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
      marginHorizontal: 16,
      paddingVertical: 16,
      borderRadius: 12,
      marginTop: 8,
      marginBottom: 16,
    },
    logoutButtonText: {
      color: '#FFFFFF',
      fontSize: 16,
      fontWeight: 'bold',
      marginLeft: 8,
    },
    versionContainer: {
      paddingVertical: 16,
      alignItems: 'center',
      marginBottom: 40,
    },
    versionText: {
      fontSize: 12,
      color: colors.textLight,
    },
  });
  
  return (
    <SafeAreaView style={dynamicStyles.container} edges={['top']}>
      <View style={dynamicStyles.header}>
        <Text style={dynamicStyles.title}>{t.profile}</Text>
        <TouchableOpacity>
          <Settings size={24} color={colors.text} />
        </TouchableOpacity>
      </View>
      
      <ScrollView style={dynamicStyles.scrollView}>
        <View style={dynamicStyles.profileCard}>
          <View style={dynamicStyles.profileImageContainer}>
            <Text style={dynamicStyles.profileImagePlaceholder}>
              {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
            </Text>
          </View>
          <View style={dynamicStyles.profileInfo}>
            <Text style={dynamicStyles.profileName}>{user?.name || 'User'}</Text>
            <Text style={dynamicStyles.profileEmail}>{user?.email || 'user@example.com'}</Text>
            <View style={dynamicStyles.badgesContainer}>
              {user?.skills?.map((skill, index) => (
                <View key={index} style={dynamicStyles.badge}>
                  <Text style={dynamicStyles.badgeText}>{skill}</Text>
                </View>
              ))}
            </View>
          </View>
        </View>
        
        <View style={dynamicStyles.sectionTitle}>
          <Text style={dynamicStyles.sectionTitleText}>{t.accountSettings}</Text>
        </View>
        
        <View style={dynamicStyles.section}>
          <TouchableOpacity style={dynamicStyles.menuItem} onPress={navigateToAccountInfo}>
            <View style={dynamicStyles.menuItemIconContainer}>
              <UserCog size={20} color={colors.primary} />
            </View>
            <View style={dynamicStyles.menuItemContent}>
              <Text style={dynamicStyles.menuItemText}>{t.accountInfo}</Text>
              <ChevronRight size={20} color={colors.textLight} />
            </View>
          </TouchableOpacity>
          
          <TouchableOpacity style={dynamicStyles.menuItem}>
            <View style={dynamicStyles.menuItemIconContainer}>
              <CreditCard size={20} color="#5856D6" />
            </View>
            <View style={dynamicStyles.menuItemContent}>
              <Text style={dynamicStyles.menuItemText}>{t.paymentMethods}</Text>
              <ChevronRight size={20} color={colors.textLight} />
            </View>
          </TouchableOpacity>
          
          <TouchableOpacity style={dynamicStyles.menuItem}>
            <View style={dynamicStyles.menuItemIconContainer}>
              <FileText size={20} color="#FF9500" />
            </View>
            <View style={dynamicStyles.menuItemContent}>
              <Text style={dynamicStyles.menuItemText}>{t.invoicingInfo}</Text>
              <ChevronRight size={20} color={colors.textLight} />
            </View>
          </TouchableOpacity>
        </View>
        
        <View style={dynamicStyles.sectionTitle}>
          <Text style={dynamicStyles.sectionTitleText}>{t.appSettings}</Text>
        </View>
        
        <View style={dynamicStyles.section}>
          <View style={dynamicStyles.menuItem}>
            <View style={dynamicStyles.menuItemIconContainer}>
              <Bell size={20} color="#FF3B30" />
            </View>
            <View style={dynamicStyles.menuItemContent}>
              <Text style={dynamicStyles.menuItemText}>{t.notifications}</Text>
              <Switch
                trackColor={{ false: colors.border, true: colors.primary }}
                thumbColor="#FFFFFF"
                ios_backgroundColor={colors.border}
                onValueChange={toggleNotifications}
                value={notificationsEnabled}
              />
            </View>
          </View>
          
          <View style={dynamicStyles.menuItem}>
            <View style={dynamicStyles.menuItemIconContainer}>
              <Bell size={20} color="#34C759" />
            </View>
            <View style={dynamicStyles.menuItemContent}>
              <Text style={dynamicStyles.menuItemText}>{t.notificationSound}</Text>
              <Switch
                trackColor={{ false: colors.border, true: colors.primary }}
                thumbColor="#FFFFFF"
                ios_backgroundColor={colors.border}
                onValueChange={setEnableSound}
                value={enableSound}
              />
            </View>
          </View>

          <View style={dynamicStyles.menuItem}>
            <View style={dynamicStyles.menuItemIconContainer}>
              <Bell size={20} color="#FF9500" />
            </View>
            <View style={dynamicStyles.menuItemContent}>
              <Text style={dynamicStyles.menuItemText}>{t.vibration}</Text>
              <Switch
                trackColor={{ false: colors.border, true: colors.primary }}
                thumbColor="#FFFFFF"
                ios_backgroundColor={colors.border}
                onValueChange={setEnableVibration}
                value={enableVibration}
              />
            </View>
          </View>
          
          <TouchableOpacity style={dynamicStyles.menuItem} onPress={handleLanguageChange}>
            <View style={dynamicStyles.menuItemIconContainer}>
              <Globe size={20} color="#5AC8FA" />
            </View>
            <View style={dynamicStyles.menuItemContent}>
              <Text style={dynamicStyles.menuItemText}>{t.language}</Text>
              <Text style={dynamicStyles.menuItemRightText}>
                {language === 'en' ? 'English' : 'Français'}
              </Text>
            </View>
          </TouchableOpacity>
          
          <View style={dynamicStyles.menuItem}>
            <View style={dynamicStyles.menuItemIconContainer}>
              <Moon size={20} color={colors.textLight} />
            </View>
            <View style={dynamicStyles.menuItemContent}>
              <Text style={dynamicStyles.menuItemText}>{t.darkMode}</Text>
              <Switch
                trackColor={{ false: colors.border, true: colors.primary }}
                thumbColor="#FFFFFF"
                ios_backgroundColor={colors.border}
                onValueChange={toggleDarkMode}
                value={themePreference === 'dark'}
              />
            </View>
          </View>
        </View>
        
        <View style={dynamicStyles.sectionTitle}>
          <Text style={dynamicStyles.sectionTitleText}>{t.documents}</Text>
        </View>
        
        <View style={dynamicStyles.section}>
          <TouchableOpacity style={dynamicStyles.menuItem}>
            <View style={dynamicStyles.menuItemIconContainer}>
              <Upload size={20} color="#34C759" />
            </View>
            <View style={dynamicStyles.menuItemContent}>
              <Text style={dynamicStyles.menuItemText}>{t.uploadDocuments}</Text>
              <ChevronRight size={20} color={colors.textLight} />
            </View>
          </TouchableOpacity>
        </View>
        
        <View style={dynamicStyles.sectionTitle}>
          <Text style={dynamicStyles.sectionTitleText}>{t.supportAndSecurity}</Text>
        </View>
        
        <View style={dynamicStyles.section}>
          <TouchableOpacity 
            style={dynamicStyles.menuItem}
            onPress={() => navigateToLegal('helpAndSupport')}
          >
            <View style={dynamicStyles.menuItemIconContainer}>
              <HelpCircle size={20} color="#007AFF" />
            </View>
            <View style={dynamicStyles.menuItemContent}>
              <Text style={dynamicStyles.menuItemText}>{t.helpAndSupport}</Text>
              <ChevronRight size={20} color={colors.textLight} />
            </View>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={dynamicStyles.menuItem}
            onPress={() => navigateToLegal('privacyAndSecurity')}
          >
            <View style={dynamicStyles.menuItemIconContainer}>
              <ShieldCheck size={20} color="#4CD964" />
            </View>
            <View style={dynamicStyles.menuItemContent}>
              <Text style={dynamicStyles.menuItemText}>{t.privacyAndSecurity}</Text>
              <ChevronRight size={20} color={colors.textLight} />
            </View>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={dynamicStyles.menuItem}
            onPress={() => navigateToLegal('termsOfService')}
          >
            <View style={dynamicStyles.menuItemIconContainer}>
              <AlertTriangle size={20} color="#FF9500" />
            </View>
            <View style={dynamicStyles.menuItemContent}>
              <Text style={dynamicStyles.menuItemText}>{t.termsOfService}</Text>
              <ChevronRight size={20} color={colors.textLight} />
            </View>
          </TouchableOpacity>
        </View>
        
        <TouchableOpacity style={dynamicStyles.logoutButton} onPress={handleLogout}>
          <LogOut size={20} color="#FFFFFF" />
          <Text style={dynamicStyles.logoutButtonText}>{t.logout}</Text>
        </TouchableOpacity>
        
        <View style={dynamicStyles.versionContainer}>
          <Text style={dynamicStyles.versionText}>Flash v1.0.0</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}