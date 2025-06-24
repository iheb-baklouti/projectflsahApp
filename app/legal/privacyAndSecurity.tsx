import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { HeaderBar } from '@/components/ui/HeaderBar';
import { useLanguage } from '@/hooks/useLanguage';
import { translations } from '@/constants/Translations';
import { Shield, Lock, Eye, Bell, MapPin, CreditCard } from 'lucide-react-native';

export default function PrivacyAndSecurity() {
  const { language } = useLanguage();
  const t = translations[language];

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <HeaderBar title={t.privacyAndSecurity} showBack />
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Shield size={48} color="#FFD700" />
          <Text style={styles.headerTitle}>Protection de vos données</Text>
          <Text style={styles.headerSubtitle}>
            Nous prenons la sécurité et la confidentialité de vos données très au sérieux
          </Text>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Lock size={24} color="#333" />
            <Text style={styles.sectionTitle}>Sécurité des données</Text>
          </View>
          <Text style={styles.text}>
            Toutes vos données sont chiffrées avec les standards les plus élevés. Nous utilisons le chiffrement SSL/TLS pour toutes les transmissions de données.
          </Text>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Eye size={24} color="#333" />
            <Text style={styles.sectionTitle}>Confidentialité</Text>
          </View>
          <Text style={styles.text}>
            Vos informations personnelles ne sont jamais partagées avec des tiers sans votre consentement explicite. Nous collectons uniquement les données nécessaires au fonctionnement du service.
          </Text>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Bell size={24} color="#333" />
            <Text style={styles.sectionTitle}>Notifications</Text>
          </View>
          <Text style={styles.text}>
            Vous contrôlez les notifications que vous recevez. Configurez vos préférences dans les paramètres de l'application.
          </Text>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <MapPin size={24} color="#333" />
            <Text style={styles.sectionTitle}>Données de localisation</Text>
          </View>
          <Text style={styles.text}>
            La géolocalisation n'est utilisée que pendant vos interventions et peut être désactivée à tout moment dans les paramètres.
          </Text>
        </View>

        <View style={[styles.section, styles.lastSection]}>
          <View style={styles.sectionHeader}>
            <CreditCard size={24} color="#333" />
            <Text style={styles.sectionTitle}>Paiements sécurisés</Text>
          </View>
          <Text style={styles.text}>
            Toutes les transactions sont sécurisées via des processeurs de paiement certifiés PCI DSS. Nous ne stockons jamais vos informations de carte bancaire.
          </Text>
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
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#666666',
    textAlign: 'center',
    paddingHorizontal: 32,
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
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333333',
    marginLeft: 12,
  },
  text: {
    fontSize: 16,
    lineHeight: 24,
    color: '#666666',
  },
});