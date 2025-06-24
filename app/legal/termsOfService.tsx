import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { HeaderBar } from '@/components/ui/HeaderBar';
import { useLanguage } from '@/hooks/useLanguage';
import { translations } from '@/constants/Translations';

export default function TermsOfService() {
  const { language } = useLanguage();
  const t = translations[language];

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <HeaderBar title={t.termsOfService} showBack />
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.section}>
          <Text style={styles.title}>1. Acceptation des conditions</Text>
          <Text style={styles.text}>
            En accédant et en utilisant l'application Flash, vous acceptez d'être lié par ces conditions d'utilisation. Si vous n'acceptez pas ces conditions, veuillez ne pas utiliser l'application.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.title}>2. Description du service</Text>
          <Text style={styles.text}>
            Flash est une plateforme de mise en relation entre techniciens qualifiés et clients pour des interventions techniques. L'application facilite la gestion des interventions, la communication et le paiement.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.title}>3. Inscription et compte</Text>
          <Text style={styles.text}>
            Pour utiliser Flash, vous devez créer un compte en fournissant des informations exactes et à jour. Vous êtes responsable de maintenir la confidentialité de vos identifiants de connexion.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.title}>4. Responsabilités</Text>
          <Text style={styles.text}>
            En tant que technicien, vous êtes responsable de:
            {'\n'}- Fournir des services professionnels de qualité
            {'\n'}- Respecter les horaires d'intervention
            {'\n'}- Maintenir à jour vos qualifications
            {'\n'}- Communiquer professionnellement avec les clients
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.title}>5. Paiements</Text>
          <Text style={styles.text}>
            Les paiements sont traités de manière sécurisée via notre plateforme. Les commissions et frais de service sont clairement indiqués avant chaque transaction.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.title}>6. Modifications</Text>
          <Text style={styles.text}>
            Nous nous réservons le droit de modifier ces conditions à tout moment. Les modifications entrent en vigueur dès leur publication dans l'application.
          </Text>
        </View>

        <View style={[styles.section, styles.lastSection]}>
          <Text style={styles.title}>7. Contact</Text>
          <Text style={styles.text}>
            Pour toute question concernant ces conditions, contactez notre support à support@flash-app.com
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
    padding: 16,
  },
  section: {
    marginBottom: 24,
  },
  lastSection: {
    marginBottom: 40,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333333',
    marginBottom: 12,
  },
  text: {
    fontSize: 16,
    lineHeight: 24,
    color: '#666666',
  },
});