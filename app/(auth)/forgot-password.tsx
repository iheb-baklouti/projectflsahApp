import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, KeyboardAvoidingView, Platform, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useLanguage } from '@/hooks/useLanguage';
import { translations } from '@/constants/Translations';
import { FlashLogo } from '@/components/ui/FlashLogo';
import { Mail, MessageSquare, Phone, ArrowLeft, CircleCheck as CheckCircle } from 'lucide-react-native';

type VerificationMethod = 'email' | 'sms' | 'whatsapp';

export default function ForgotPasswordScreen() {
  const { language } = useLanguage();
  const t = translations[language];
  
  const [step, setStep] = useState<'email' | 'method' | 'code' | 'reset'>('email');
  const [email, setEmail] = useState('');
  const [verificationMethod, setVerificationMethod] = useState<VerificationMethod>('email');
  const [verificationCode, setVerificationCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleEmailSubmit = async () => {
    if (!email) {
      setError('Veuillez entrer votre email');
      return;
    }

    setIsLoading(true);
    setError(null);
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));
      setStep('method');
    } catch (err) {
      setError('Email non trouvé');
    } finally {
      setIsLoading(false);
    }
  };

  const handleMethodSelection = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Simulate sending verification code
      await new Promise(resolve => setTimeout(resolve, 1500));
      console.log(`Code de vérification envoyé via ${verificationMethod}`);
      setStep('code');
    } catch (err) {
      setError('Erreur lors de l\'envoi du code');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCodeVerification = async () => {
    if (verificationCode !== '123456') {
      setError('Code de vérification incorrect');
      return;
    }

    setIsLoading(true);
    setError(null);
    
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      setStep('reset');
    } catch (err) {
      setError('Erreur lors de la vérification');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePasswordReset = async () => {
    if (newPassword !== confirmPassword) {
      setError('Les mots de passe ne correspondent pas');
      return;
    }

    if (newPassword.length < 8) {
      setError('Le mot de passe doit contenir au moins 8 caractères');
      return;
    }

    setIsLoading(true);
    setError(null);
    
    try {
      await new Promise(resolve => setTimeout(resolve, 1500));
      // Password reset successful
      router.replace('/login');
    } catch (err) {
      setError('Erreur lors de la réinitialisation');
    } finally {
      setIsLoading(false);
    }
  };

  const renderEmailStep = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>Mot de passe oublié ?</Text>
      <Text style={styles.stepSubtitle}>
        Entrez votre adresse email pour recevoir les instructions de réinitialisation
      </Text>

      <View style={styles.inputContainer}>
        <Mail color="#666" size={20} />
        <TextInput
          style={styles.input}
          placeholder="Votre adresse email"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
        />
      </View>

      <TouchableOpacity
        style={[styles.primaryButton, (!email || isLoading) && styles.buttonDisabled]}
        onPress={handleEmailSubmit}
        disabled={!email || isLoading}
      >
        {isLoading ? (
          <ActivityIndicator color="#000" />
        ) : (
          <Text style={styles.primaryButtonText}>Continuer</Text>
        )}
      </TouchableOpacity>
    </View>
  );

  const renderMethodStep = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>Choisir la méthode</Text>
      <Text style={styles.stepSubtitle}>
        Comment souhaitez-vous recevoir le code de vérification ?
      </Text>

      <View style={styles.methodsContainer}>
        <TouchableOpacity
          style={[styles.methodOption, verificationMethod === 'email' && styles.methodSelected]}
          onPress={() => setVerificationMethod('email')}
        >
          <Mail size={24} color={verificationMethod === 'email' ? '#000' : '#666'} />
          <View style={styles.methodInfo}>
            <Text style={[styles.methodTitle, verificationMethod === 'email' && styles.methodTitleSelected]}>
              Email
            </Text>
            <Text style={styles.methodSubtitle}>
              Recevoir le code par email
            </Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.methodOption, verificationMethod === 'sms' && styles.methodSelected]}
          onPress={() => setVerificationMethod('sms')}
        >
          <MessageSquare size={24} color={verificationMethod === 'sms' ? '#000' : '#666'} />
          <View style={styles.methodInfo}>
            <Text style={[styles.methodTitle, verificationMethod === 'sms' && styles.methodTitleSelected]}>
              SMS
            </Text>
            <Text style={styles.methodSubtitle}>
              Recevoir le code par SMS
            </Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.methodOption, verificationMethod === 'whatsapp' && styles.methodSelected]}
          onPress={() => setVerificationMethod('whatsapp')}
        >
          <Phone size={24} color={verificationMethod === 'whatsapp' ? '#000' : '#666'} />
          <View style={styles.methodInfo}>
            <Text style={[styles.methodTitle, verificationMethod === 'whatsapp' && styles.methodTitleSelected]}>
              WhatsApp
            </Text>
            <Text style={styles.methodSubtitle}>
              Recevoir le code par WhatsApp
            </Text>
          </View>
        </TouchableOpacity>
      </View>

      <TouchableOpacity
        style={[styles.primaryButton, isLoading && styles.buttonDisabled]}
        onPress={handleMethodSelection}
        disabled={isLoading}
      >
        {isLoading ? (
          <ActivityIndicator color="#000" />
        ) : (
          <Text style={styles.primaryButtonText}>Envoyer le code</Text>
        )}
      </TouchableOpacity>
    </View>
  );

  const renderCodeStep = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>Code de vérification</Text>
      <Text style={styles.stepSubtitle}>
        Entrez le code à 6 chiffres envoyé via {verificationMethod === 'email' ? 'email' : verificationMethod === 'sms' ? 'SMS' : 'WhatsApp'}
      </Text>

      <TextInput
        style={styles.codeInput}
        value={verificationCode}
        onChangeText={setVerificationCode}
        keyboardType="numeric"
        placeholder="000000"
        maxLength={6}
        textAlign="center"
      />

      <TouchableOpacity
        style={[styles.primaryButton, (verificationCode.length !== 6 || isLoading) && styles.buttonDisabled]}
        onPress={handleCodeVerification}
        disabled={verificationCode.length !== 6 || isLoading}
      >
        {isLoading ? (
          <ActivityIndicator color="#000" />
        ) : (
          <Text style={styles.primaryButtonText}>Vérifier</Text>
        )}
      </TouchableOpacity>

      <TouchableOpacity style={styles.resendButton}>
        <Text style={styles.resendButtonText}>Renvoyer le code</Text>
      </TouchableOpacity>
    </View>
  );

  const renderResetStep = () => (
    <View style={styles.stepContainer}>
      <View style={styles.successIcon}>
        <CheckCircle size={48} color="#34C759" />
      </View>
      <Text style={styles.stepTitle}>Nouveau mot de passe</Text>
      <Text style={styles.stepSubtitle}>
        Créez un nouveau mot de passe sécurisé
      </Text>

      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          placeholder="Nouveau mot de passe"
          value={newPassword}
          onChangeText={setNewPassword}
          secureTextEntry
        />
      </View>

      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          placeholder="Confirmer le mot de passe"
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          secureTextEntry
        />
      </View>

      <TouchableOpacity
        style={[styles.primaryButton, (!newPassword || !confirmPassword || isLoading) && styles.buttonDisabled]}
        onPress={handlePasswordReset}
        disabled={!newPassword || !confirmPassword || isLoading}
      >
        {isLoading ? (
          <ActivityIndicator color="#000" />
        ) : (
          <Text style={styles.primaryButtonText}>Réinitialiser</Text>
        )}
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView contentContainerStyle={styles.scrollContainer}>
          <View style={styles.header}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
              <ArrowLeft size={24} color="#333" />
            </TouchableOpacity>
          </View>

          <View style={styles.logoContainer}>
            <FlashLogo size={60} />
            <Text style={styles.appTitle}>Flash</Text>
          </View>

          {error && (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          {step === 'email' && renderEmailStep()}
          {step === 'method' && renderMethodStep()}
          {step === 'code' && renderCodeStep()}
          {step === 'reset' && renderResetStep()}

          <View style={styles.footer}>
            <TouchableOpacity onPress={() => router.push('/login')}>
              <Text style={styles.footerText}>
                Retour à la <Text style={styles.footerLink}>connexion</Text>
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  keyboardView: {
    flex: 1,
  },
  scrollContainer: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  header: {
    paddingTop: 20,
    marginBottom: 20,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f8f8f8',
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  appTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    marginTop: 10,
    color: '#FFD700',
  },
  stepContainer: {
    width: '100%',
    marginBottom: 30,
  },
  stepTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#333',
    textAlign: 'center',
  },
  stepSubtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 30,
    textAlign: 'center',
    lineHeight: 22,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#FFD700',
    borderRadius: 12,
    paddingHorizontal: 15,
    marginBottom: 16,
    height: 55,
    backgroundColor: '#f8f8f8',
  },
  input: {
    flex: 1,
    marginLeft: 10,
    fontSize: 16,
    color: '#333',
  },
  codeInput: {
    borderWidth: 1,
    borderColor: '#FFD700',
    borderRadius: 12,
    paddingVertical: 15,
    fontSize: 24,
    fontWeight: 'bold',
    letterSpacing: 8,
    marginBottom: 20,
    backgroundColor: '#f8f8f8',
  },
  methodsContainer: {
    marginBottom: 30,
  },
  methodOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 12,
    marginBottom: 12,
    backgroundColor: '#f8f8f8',
  },
  methodSelected: {
    borderColor: '#FFD700',
    backgroundColor: '#fff',
  },
  methodInfo: {
    marginLeft: 16,
    flex: 1,
  },
  methodTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
  },
  methodTitleSelected: {
    color: '#000',
  },
  methodSubtitle: {
    fontSize: 14,
    color: '#999',
    marginTop: 2,
  },
  primaryButton: {
    backgroundColor: '#FFD700',
    paddingVertical: 15,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    height: 55,
  },
  buttonDisabled: {
    backgroundColor: '#999',
  },
  primaryButtonText: {
    color: '#000',
    fontSize: 16,
    fontWeight: 'bold',
  },
  resendButton: {
    alignItems: 'center',
    marginTop: 16,
  },
  resendButtonText: {
    color: '#FFD700',
    fontSize: 14,
    fontWeight: '600',
  },
  successIcon: {
    alignItems: 'center',
    marginBottom: 20,
  },
  errorContainer: {
    backgroundColor: '#ffebee',
    padding: 12,
    borderRadius: 8,
    marginBottom: 20,
    borderLeftWidth: 4,
    borderLeftColor: '#f44336',
  },
  errorText: {
    color: '#c62828',
    fontSize: 14,
    textAlign: 'center',
  },
  footer: {
    alignItems: 'center',
    marginTop: 30,
  },
  footerText: {
    fontSize: 14,
    color: '#666',
  },
  footerLink: {
    color: '#FFD700',
    fontWeight: '600',
  },
});