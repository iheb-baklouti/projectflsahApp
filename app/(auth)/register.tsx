// ✅ Écran Register avec intégration API et fallback mock
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, KeyboardAvoidingView, Platform, ActivityIndicator, FlatList, Modal, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useAuth } from '@/hooks/useAuth';
import { frenchCities } from '@/assets/data/frenchCities';
import irisData from '@/assets/data/iris_zones_full_france.json';
import { Eye, EyeOff, Info, CircleCheck as CheckCircle, Circle as XCircle } from 'lucide-react-native';
import { AnimatedCircularProgress } from 'react-native-circular-progress';
import ApiService, { isApiAvailable, ApiError, TechnicianRegistrationData } from '@/services/apiService';

const skillOptions = [
  'Plombier', 'Électricien', 'Serrurier', 'Chauffagiste', 'Peintre', 'Menuisier',
  'Vitrier', 'Carreleur', 'Technicien alarme', 'Technicien clim', 'Mécanicien', 'Fibre optique'
];

const dynamicZones = (ville) => {
  const match = irisData.find(item => ville.toLowerCase().includes(item.ville.toLowerCase()));
  return match ? match.iris : ['Centre-ville', 'Banlieue Nord', 'Banlieue Sud'];
};

const evaluatePassword = (password) => {
  const checklist = {
    length: password.length >= 8,
    uppercase: /[A-Z]/.test(password),
    number: /[0-9]/.test(password),
    special: /[^a-zA-Z0-9]/.test(password),
  };
  const score = Object.values(checklist).filter(Boolean).length;
  return { checklist, score };
};

export default function RegisterScreen() {
  const { register, isLoading, error } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [ville, setVille] = useState('');
  const [villeQuery, setVilleQuery] = useState('');
  const [codePostal, setCodePostal] = useState('');
  const [address, setAddress] = useState('');
  const [licenseNumber, setLicenseNumber] = useState('');
  const [insuranceNumber, setInsuranceNumber] = useState('');
  const [insuranceExpiry, setInsuranceExpiry] = useState('');
  const [zoneManagerEmail, setZoneManagerEmail] = useState('');
  const [skills, setSkills] = useState([]);
  const [zones, setZones] = useState([]);
  const [availableZones, setAvailableZones] = useState([]);
  const [verificationMethod, setVerificationMethod] = useState('sms');
  const [showTooltip, setShowTooltip] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [apiAvailable, setApiAvailable] = useState(false);
  const [registrationLoading, setRegistrationLoading] = useState(false);
  const [apiError, setApiError] = useState(null);

  const filteredCities = frenchCities.filter(city => city.toLowerCase().includes(villeQuery.toLowerCase())).slice(0, 10);
  const { checklist, score } = evaluatePassword(password);

  // Vérifier la disponibilité de l'API au chargement
  useEffect(() => {
    const checkApiAvailability = async () => {
      const available = await isApiAvailable();
      setApiAvailable(available);
      console.log('API disponible:', available);
    };
    
    checkApiAvailability();
  }, []);

  useEffect(() => {
    if (ville) setAvailableZones(dynamicZones(ville));
    else setAvailableZones([]);
  }, [ville]);

  const toggleSkill = (s) => setSkills(prev => prev.includes(s) ? prev.filter(i => i !== s) : [...prev, s]);
  const toggleZone = (z) => setZones(prev => prev.includes(z) ? prev.filter(i => i !== z) : [...prev, z]);

  const validateForm = () => {
    if (!name.trim()) {
      Alert.alert('Erreur', 'Le nom est requis');
      return false;
    }
    if (!email.trim() || !/\S+@\S+\.\S+/.test(email)) {
      Alert.alert('Erreur', 'Email invalide');
      return false;
    }
    if (password !== confirmPassword) {
      Alert.alert('Erreur', 'Les mots de passe ne correspondent pas');
      return false;
    }
    if (score < 3) {
      Alert.alert('Erreur', 'Mot de passe trop faible. Veuillez en choisir un plus sécurisé');
      return false;
    }
    if (!phone.trim()) {
      Alert.alert('Erreur', 'Le téléphone est requis');
      return false;
    }
    if (!ville.trim()) {
      Alert.alert('Erreur', 'La ville est requise');
      return false;
    }
    if (!codePostal.trim()) {
      Alert.alert('Erreur', 'Le code postal est requis');
      return false;
    }
    if (skills.length === 0) {
      Alert.alert('Erreur', 'Veuillez sélectionner au moins une compétence');
      return false;
    }
    if (zones.length === 0) {
      Alert.alert('Erreur', 'Veuillez sélectionner au moins une zone de travail');
      return false;
    }
    return true;
  };

  const handleApiRegistration = async () => {
    try {
      const fullAddress = `${address || ''} ${ville} ${codePostal}`.trim();
      
      const registrationData: TechnicianRegistrationData = {
        name: name.trim(),
        email: email.trim().toLowerCase(),
        password,
        phone: phone.trim(),
        sectors: skills, // Les compétences correspondent aux secteurs
        zones,
        address: fullAddress,
        zone_manager_email: zoneManagerEmail.trim() || undefined,
        license_number: licenseNumber.trim() || undefined,
        insurance_number: insuranceNumber.trim() || undefined,
        insurance_expiry: insuranceExpiry.trim() || undefined,
      };

      console.log('Envoi des données à l\'API:', registrationData);

      const response = await ApiService.registerTechnician(registrationData);
      
      if (response.success) {
        Alert.alert(
          'Inscription réussie',
          response.message || 'Votre inscription a été envoyée. En attente de validation par l\'administrateur.',
          [
            {
              text: 'OK',
              onPress: () => router.replace('/login')
            }
          ]
        );
      } else {
        throw new Error(response.message || 'Erreur lors de l\'inscription');
      }
    } catch (error) {
      console.error('Erreur API:', error);
      
      if (error instanceof ApiError) {
        if (error.errors) {
          // Afficher les erreurs de validation
          const errorMessages = Object.entries(error.errors)
            .map(([field, messages]) => `${field}: ${messages.join(', ')}`)
            .join('\n');
          
          Alert.alert('Erreur de validation', errorMessages);
        } else {
          Alert.alert('Erreur', error.message);
        }
        setApiError(error.message);
      } else {
        Alert.alert('Erreur', 'Erreur de connexion. Tentative avec le système local...');
        setApiError('Erreur de connexion');
        // Fallback vers le système mock
        return handleMockRegistration();
      }
    }
  };

  const handleMockRegistration = async () => {
    try {
      console.log('Utilisation du système mock pour l\'inscription');
      await register(name, email, password, phone, ville, codePostal, skills, zones, verificationMethod);
      router.push('/VerifyCodeScreen');
    } catch (error) {
      console.error('Erreur mock:', error);
      Alert.alert('Erreur', 'Erreur lors de l\'inscription');
    }
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setRegistrationLoading(true);
    setApiError(null);

    try {
      if (apiAvailable) {
        await handleApiRegistration();
      } else {
        console.log('API non disponible, utilisation du système mock');
        await handleMockRegistration();
      }
    } catch (error) {
      console.error('Erreur générale:', error);
      Alert.alert('Erreur', 'Une erreur inattendue s\'est produite');
    } finally {
      setRegistrationLoading(false);
    }
  };

  const renderChecklistItem = (label, valid) => (
    <View style={styles.checkItem}>
      {valid ? <CheckCircle size={16} color="#00C851" /> : <XCircle size={16} color="#FF4444" />}
      <Text style={{ marginLeft: 6 }}>{label}</Text>
    </View>
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#fff' }}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
          <Text style={styles.title}>Créer un compte</Text>
          
          {/* Indicateur de mode API/Mock */}
          <View style={[styles.modeIndicator, { backgroundColor: apiAvailable ? '#E8F5E8' : '#FFF3CD' }]}>
            <Text style={[styles.modeText, { color: apiAvailable ? '#155724' : '#856404' }]}>
              {apiAvailable ? '🌐 Mode API' : '🔧 Mode Local'}
            </Text>
          </View>

          {/* Erreur API */}
          {apiError && (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>{apiError}</Text>
            </View>
          )}

          <TextInput style={styles.input} placeholder="Nom complet" value={name} onChangeText={setName} />
          <TextInput style={styles.input} placeholder="Email" keyboardType="email-address" autoCapitalize="none" value={email} onChangeText={setEmail} />

          <View style={styles.passwordRow}>
            <TextInput style={styles.inputPassword} placeholder="Mot de passe" secureTextEntry={!showPassword} value={password} onChangeText={setPassword} />
            <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeButton}>
              {showPassword ? <EyeOff size={20} color="#FFD700" /> : <Eye size={20} color="#FFD700" />}
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setShowTooltip(true)} style={styles.eyeButton}>
              <Info size={20} color="#FFD700" />
            </TouchableOpacity>
          </View>

          <Modal visible={showTooltip} transparent animationType="fade">
            <TouchableOpacity style={styles.modalOverlay} onPress={() => setShowTooltip(false)}>
              <View style={styles.tooltipBox}>
                <Text style={styles.tooltipText}>🔒 Votre mot de passe doit contenir :
- 8 caractères
- 1 majuscule
- 1 chiffre
- 1 caractère spécial</Text>
              </View>
            </TouchableOpacity>
          </Modal>

          <View style={styles.passwordScoreRow}>
            <AnimatedCircularProgress size={40} width={5} fill={(score / 4) * 100} tintColor={score >= 3 ? '#00C851' : '#FFBB33'} backgroundColor="#eee" />
            <View style={{ marginLeft: 10 }}>{Object.entries({
              '8 caractères min.': checklist.length,
              'Majuscule': checklist.uppercase,
              'Chiffre': checklist.number,
              'Spécial': checklist.special
            }).map(([label, valid]) => renderChecklistItem(label, valid))}</View>
          </View>

          <View style={styles.passwordRow}>
            <TextInput style={styles.inputPassword} placeholder="Confirmer le mot de passe" secureTextEntry={!showConfirmPassword} value={confirmPassword} onChangeText={setConfirmPassword} />
            <TouchableOpacity onPress={() => setShowConfirmPassword(!showConfirmPassword)} style={styles.eyeButton}>
              {showConfirmPassword ? <EyeOff size={20} color="#FFD700" /> : <Eye size={20} color="#FFD700" />}
            </TouchableOpacity>
          </View>

          <TextInput style={styles.input} placeholder="Téléphone" keyboardType="phone-pad" value={phone} onChangeText={setPhone} />
          
          {/* Adresse complète pour l'API */}
          {apiAvailable && (
            <TextInput 
              style={styles.input} 
              placeholder="Adresse complète" 
              value={address} 
              onChangeText={setAddress}
              multiline
            />
          )}
          
          <TextInput style={styles.input} placeholder="Ville" value={villeQuery} onChangeText={setVilleQuery} />

          {villeQuery.length > 0 && (
            <FlatList data={filteredCities} keyExtractor={(item) => item} renderItem={({ item }) => (
              <TouchableOpacity onPress={() => { setVille(item); setVilleQuery(item); }} style={styles.suggestionItem}>
                <Text>{item}</Text>
              </TouchableOpacity>
            )} style={styles.suggestionList} />
          )}

          <TextInput style={styles.input} placeholder="Code postal" keyboardType="numeric" value={codePostal} onChangeText={setCodePostal} />

          {/* Champs supplémentaires pour l'API */}
          {apiAvailable && (
            <>
              <TextInput 
                style={styles.input} 
                placeholder="Numéro de licence (optionnel)" 
                value={licenseNumber} 
                onChangeText={setLicenseNumber} 
              />
              <TextInput 
                style={styles.input} 
                placeholder="Numéro d'assurance (optionnel)" 
                value={insuranceNumber} 
                onChangeText={setInsuranceNumber} 
              />
              <TextInput 
                style={styles.input} 
                placeholder="Date d'expiration assurance (YYYY-MM-DD)" 
                value={insuranceExpiry} 
                onChangeText={setInsuranceExpiry} 
              />
              <TextInput 
                style={styles.input} 
                placeholder="Email du responsable de zone (optionnel)" 
                keyboardType="email-address"
                autoCapitalize="none"
                value={zoneManagerEmail} 
                onChangeText={setZoneManagerEmail} 
              />
            </>
          )}

          {ville && availableZones.length > 0 && (
            <>
              <Text style={styles.label}>Zones de travail :</Text>
              <View style={styles.tagContainer}>{availableZones.map(zone => (
                <TouchableOpacity key={zone} style={[styles.tag, zones.includes(zone) && styles.tagSelected]} onPress={() => toggleZone(zone)}>
                  <Text style={[styles.tagText, zones.includes(zone) && styles.tagTextSelected]}>{zone}</Text>
                </TouchableOpacity>
              ))}</View>
            </>
          )}

          <Text style={styles.label}>Compétences :</Text>
          <View style={styles.tagContainer}>{skillOptions.map(skill => (
            <TouchableOpacity key={skill} style={[styles.tag, skills.includes(skill) && styles.tagSelected]} onPress={() => toggleSkill(skill)}>
              <Text style={[styles.tagText, skills.includes(skill) && styles.tagTextSelected]}>{skill}</Text>
            </TouchableOpacity>
          ))}</View>

          {/* Méthode de vérification seulement pour le mode mock */}
          {!apiAvailable && (
            <>
              <Text style={styles.label}>Méthode de vérification :</Text>
              <View style={styles.radioGroup}>
                <TouchableOpacity style={[styles.radio, verificationMethod === 'sms' && styles.radioSelected]} onPress={() => setVerificationMethod('sms')}>
                  <Text style={styles.radioText}>SMS</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.radio, verificationMethod === 'whatsapp' && styles.radioSelected]} onPress={() => setVerificationMethod('whatsapp')}>
                  <Text style={styles.radioText}>WhatsApp</Text>
                </TouchableOpacity>
              </View>
            </>
          )}

          {error && <Text style={{ color: 'red' }}>{error}</Text>}
          
          <TouchableOpacity style={styles.submitBtn} onPress={handleSubmit} disabled={registrationLoading || isLoading}>
            {(registrationLoading || isLoading) ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitText}>S'inscrire</Text>}
          </TouchableOpacity>

          <TouchableOpacity onPress={() => router.push('/login')} style={styles.loginLink}>
            <Text style={styles.loginLinkText}>Déjà un compte ? Se connecter</Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20 },
  title: { fontSize: 26, fontWeight: 'bold', marginBottom: 20 },
  modeIndicator: {
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    alignItems: 'center',
  },
  modeText: {
    fontSize: 14,
    fontWeight: '600',
  },
  errorContainer: {
    backgroundColor: '#ffebee',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#f44336',
  },
  errorText: {
    color: '#c62828',
    fontSize: 14,
  },
  input: { borderWidth: 1, borderColor: '#FFD700', borderRadius: 10, padding: 12, marginBottom: 12 },
  inputPassword: { flex: 1, padding: 12 },
  passwordRow: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: '#FFD700', borderRadius: 10, marginBottom: 12, paddingRight: 6 },
  eyeButton: { padding: 6 },
  modalOverlay: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.5)' },
  tooltipBox: { backgroundColor: '#fff', padding: 15, borderRadius: 10, maxWidth: '80%' },
  tooltipText: { fontSize: 14 },
  passwordScoreRow: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 20 },
  checkItem: { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
  submitBtn: { backgroundColor: '#000', padding: 16, borderRadius: 10, alignItems: 'center' },
  submitText: { color: '#FFD700', fontWeight: 'bold', fontSize: 16 },
  suggestionList: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#FFD700', borderRadius: 8, maxHeight: 200 },
  suggestionItem: { padding: 10, borderBottomWidth: 1, borderBottomColor: '#eee' },
  label: { fontWeight: '600', marginBottom: 6, color: '#111' },
  tagContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 16 },
  tag: { padding: 10, borderWidth: 1, borderColor: '#FFD700', borderRadius: 20, backgroundColor: '#fff' },
  tagSelected: { backgroundColor: '#FFD700', borderColor: '#FFD700' },
  tagText: { color: '#111' },
  tagTextSelected: { color: '#000' },
  radioGroup: { flexDirection: 'row', gap: 16, marginBottom: 24 },
  radio: { borderWidth: 1, borderColor: '#FFD700', padding: 10, borderRadius: 8 },
  radioSelected: { backgroundColor: '#FFD700', borderColor: '#FFD700' },
  radioText: { color: '#000' },
  loginLink: {
    alignItems: 'center',
    marginTop: 16,
  },
  loginLinkText: {
    color: '#FFD700',
    fontSize: 16,
    fontWeight: '600',
  },
});