import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useAuth } from '@/hooks/useAuth';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useLanguage } from '@/hooks/useLanguage';
import { translations } from '@/constants/Translations';

export default function VerifyCodeScreen() {
  const { verifyCode, isLoading } = useAuth();
  const [code, setCode] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { language } = useLanguage();
  const t = translations[language];

  const handleVerify = async () => {
    setVerifying(true);
    setError(null);
    const success = await verifyCode(code);
    if (success) {
      router.replace('/');
    } else {
      setError(t.invalidVerificationCode);
    }
    setVerifying(false);
  };

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>{t.verifyAccount}</Text>
      <Text style={styles.subtitle}>{t.enterVerificationCode}</Text>

      <TextInput
        style={styles.input}
        value={code}
        onChangeText={setCode}
        keyboardType="numeric"
        placeholder={t.sixDigitCode}
        maxLength={6}
      />

      {error && <Text style={styles.error}>{error}</Text>}

      <TouchableOpacity style={styles.button} onPress={handleVerify} disabled={verifying}>
        {verifying ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>{t.verify}</Text>}
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#000',
  },
  subtitle: {
    fontSize: 14,
    marginBottom: 20,
    color: '#666',
  },
  input: {
    borderWidth: 1,
    borderColor: '#FFD700',
    padding: 14,
    borderRadius: 10,
    fontSize: 18,
    textAlign: 'center',
    letterSpacing: 8,
  },
  button: {
    marginTop: 30,
    backgroundColor: '#000',
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
  },
  buttonText: {
    color: '#FFD700',
    fontWeight: 'bold',
  },
  error: {
    color: 'red',
    marginTop: 10,
    textAlign: 'center',
  },
});