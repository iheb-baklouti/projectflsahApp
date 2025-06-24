import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { HeaderBar } from '@/components/ui/HeaderBar';
import { useLanguage } from '@/hooks/useLanguage';
import { translations } from '@/constants/Translations';
import { MessageCircle, Phone, Mail, Book, CircleHelp as HelpCircle, ChevronRight, Youtube, FileText } from 'lucide-react-native';

export default function HelpAndSupport() {
  const { language } = useLanguage();
  const t = translations[language];

  const handleContact = (type: 'chat' | 'phone' | 'email') => {
    switch (type) {
      case 'chat':
        // Implement chat support
        break;
      case 'phone':
        Linking.openURL('tel:+33123456789');
        break;
      case 'email':
        Linking.openURL('mailto:support@flash-app.com');
        break;
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <HeaderBar title={t.helpAndSupport} showBack />
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <HelpCircle size={48} color="#FFD700" />
          <Text style={styles.headerTitle}>Comment pouvons-nous vous aider ?</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Nous contacter</Text>
          
          <TouchableOpacity 
            style={styles.contactOption}
            onPress={() => handleContact('chat')}
          >
            <View style={styles.contactIconContainer}>
              <MessageCircle size={24} color="#FFD700" />
            </View>
            <View style={styles.contactInfo}>
              <Text style={styles.contactTitle}>Chat en direct</Text>
              <Text style={styles.contactSubtitle}>Réponse en quelques minutes</Text>
            </View>
            <ChevronRight size={20} color="#999" />
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.contactOption}
            onPress={() => handleContact('phone')}
          >
            <View style={styles.contactIconContainer}>
              <Phone size={24} color="#34C759" />
            </View>
            <View style={styles.contactInfo}>
              <Text style={styles.contactTitle}>Assistance téléphonique</Text>
              <Text style={styles.contactSubtitle}>Lun-Ven, 9h-18h</Text>
            </View>
            <ChevronRight size={20} color="#999" />
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.contactOption}
            onPress={() => handleContact('email')}
          >
            <View style={styles.contactIconContainer}>
              <Mail size={24} color="#007AFF" />
            </View>
            <View style={styles.contactInfo}>
              <Text style={styles.contactTitle}>Email</Text>
              <Text style={styles.contactSubtitle}>Réponse sous 24h</Text>
            </View>
            <ChevronRight size={20} color="#999" />
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Ressources</Text>

          <TouchableOpacity style={styles.resource}>
            <Book size={24} color="#FFD700" />
            <View style={styles.resourceInfo}>
              <Text style={styles.resourceTitle}>Guide du technicien</Text>
              <Text style={styles.resourceSubtitle}>Tout savoir sur l'utilisation de Flash</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity style={styles.resource}>
            <Youtube size={24} color="#FF3B30" />
            <View style={styles.resourceInfo}>
              <Text style={styles.resourceTitle}>Tutoriels vidéo</Text>
              <Text style={styles.resourceSubtitle}>Apprenez en images</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity style={styles.resource}>
            <FileText size={24} color="#5856D6" />
            <View style={styles.resourceInfo}>
              <Text style={styles.resourceTitle}>FAQ</Text>
              <Text style={styles.resourceSubtitle}>Questions fréquentes</Text>
            </View>
          </TouchableOpacity>
        </View>

        <View style={[styles.section, styles.lastSection]}>
          <Text style={styles.sectionTitle}>Urgence</Text>
          <View style={styles.emergencyContainer}>
            <Text style={styles.emergencyText}>
              Pour toute urgence technique nécessitant une assistance immédiate
            </Text>
            <TouchableOpacity 
              style={styles.emergencyButton}
              onPress={() => Linking.openURL('tel:+33123456789')}
            >
              <Text style={styles.emergencyButtonText}>Appeler la hotline 24/7</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  content: {
    flex: 1,
  },
  header: {
    alignItems: 'center',
    padding: 24,
    backgroundColor: '#FFFDF5',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333333',
    marginTop: 16,
    textAlign: 'center',
  },
  section: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  lastSection: {
    borderBottomWidth: 0,
    marginBottom: 40,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333333',
    marginBottom: 16,
  },
  contactOption: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F8F8',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  contactIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  contactInfo: {
    flex: 1,
  },
  contactTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333333',
  },
  contactSubtitle: {
    fontSize: 14,
    color: '#666666',
    marginTop: 2,
  },
  resource: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#F8F8F8',
    borderRadius: 12,
    marginBottom: 12,
  },
  resourceInfo: {
    marginLeft: 12,
    flex: 1,
  },
  resourceTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333333',
  },
  resourceSubtitle: {
    fontSize: 14,
    color: '#666666',
    marginTop: 2,
  },
  emergencyContainer: {
    backgroundColor: '#FFF5F5',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  emergencyText: {
    fontSize: 14,
    color: '#FF3B30',
    textAlign: 'center',
    marginBottom: 12,
  },
  emergencyButton: {
    backgroundColor: '#FF3B30',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  emergencyButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
});