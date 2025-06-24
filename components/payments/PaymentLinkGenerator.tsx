import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Share } from 'react-native';
import { useLanguage } from '@/hooks/useLanguage';
import { translations } from '@/constants/Translations';
import { COLORS } from '@/constants/Colors';

export const PaymentLinkGenerator = () => {
  const { language } = useLanguage();
  const t = translations[language];
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [generatedLink, setGeneratedLink] = useState('');

  const generateLink = () => {
    // Ici, vous devrez intégrer votre logique de génération de lien de paiement
    // avec votre service de paiement (Stripe, etc.)
    const baseUrl = 'https://votre-domaine.com/pay';
    const link = `${baseUrl}?amount=${amount}&description=${encodeURIComponent(description)}`;
    setGeneratedLink(link);
  };

  const shareLink = async () => {
    try {
      await Share.share({
        message: generatedLink,
        title: t.paymentLink,
      });
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{t.generatePaymentLink}</Text>

      <View style={styles.form}>
        <TextInput
          style={styles.input}
          placeholder={t.amount}
          value={amount}
          onChangeText={setAmount}
          keyboardType="numeric"
        />

        <TextInput
          style={[styles.input, styles.textArea]}
          placeholder={t.description}
          value={description}
          onChangeText={setDescription}
          multiline
          numberOfLines={4}
        />

        <TouchableOpacity 
          style={styles.generateButton}
          onPress={generateLink}
          disabled={!amount || !description}
        >
          <Text style={styles.generateButtonText}>{t.generateLink}</Text>
        </TouchableOpacity>

        {generatedLink ? (
          <View style={styles.linkContainer}>
            <Text style={styles.linkText}>{generatedLink}</Text>
            <TouchableOpacity style={styles.shareButton} onPress={shareLink}>
              <Text style={styles.shareButtonText}>{t.shareLink}</Text>
            </TouchableOpacity>
          </View>
        ) : null}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 24,
  },
  form: {
    gap: 16,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  generateButton: {
    backgroundColor: COLORS.primary,
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  generateButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  linkContainer: {
    marginTop: 24,
    padding: 16,
    backgroundColor: '#f8f8f8',
    borderRadius: 8,
  },
  linkText: {
    fontSize: 14,
    color: '#333',
    marginBottom: 16,
  },
  shareButton: {
    backgroundColor: '#34C759',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  shareButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
});