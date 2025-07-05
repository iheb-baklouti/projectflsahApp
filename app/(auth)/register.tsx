// ✅ Écran Register avec design moderne pour zones et spécialités
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, KeyboardAvoidingView, Platform, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useAuth } from '@/hooks/useAuth';
import { Eye, EyeOff, Info, CircleCheck as CheckCircle, Circle as XCircle, Search, MapPin, X, Star, Users, Building2 } from 'lucide-react-native';
import { AnimatedCircularProgress } from 'react-native-circular-progress';
import ApiService, { isApiAvailable, ApiError, TechnicianRegistrationData, SpecialtyOption, ZoneSearchResult } from '@/services/apiService';

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
  const [zoneQuery, setZoneQuery] = useState('');
  const [licenseNumber, setLicenseNumber] = useState('');
  const [supervisorEmail, setSupervisorEmail] = useState('');
  const [note, setNote] = useState('');
  const [specialties, setSpecialties] = useState([]);
  const [zones, setZones] = useState([]);
  const [verificationMethod, setVerificationMethod] = useState('sms');
  const [showTooltip, setShowTooltip] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [apiAvailable, setApiAvailable] = useState(false);
  const [registrationLoading, setRegistrationLoading] = useState(false);
  const [apiError, setApiError] = useState(null);

  // États pour les données API
  const [availableSpecialties, setAvailableSpecialties] = useState<SpecialtyOption[]>([]);
  const [zoneSearchResults, setZoneSearchResults] = useState<ZoneSearchResult[]>([]);
  const [searchingZones, setSearchingZones] = useState(false);
  const [showZoneResults, setShowZoneResults] = useState(false);

  const { checklist, score } = evaluatePassword(password);

  // Vérifier la disponibilité de l'API au chargement
  useEffect(() => {
    const checkApiAvailability = async () => {
      const available = await isApiAvailable();
      setApiAvailable(available);
      console.log('API disponible:', available);
      
      if (available) {
        loadSpecialties();
      }
    };
    
    checkApiAvailability();
  }, []);

  // Charger les spécialités depuis l'API
  const loadSpecialties = async () => {
    try {
      const response = await ApiService.getSpecialties();
      if (response.success && response.data) {
        // Ajouter des IDs aux spécialités basés sur leur index
        const specialtiesWithIds = response.data.map((specialty, index) => ({
          ...specialty,
          id: index + 1
        }));
        setAvailableSpecialties(specialtiesWithIds);
      }
    } catch (error) {
      console.error('Erreur lors du chargement des spécialités:', error);
      // Fallback avec des spécialités par défaut
      setAvailableSpecialties([
        { id: 1, value: 'plumbing', label: 'Plomberie' },
        { id: 2, value: 'electricity', label: 'Électricité' },
        { id: 3, value: 'locksmith', label: 'Serrurerie' },
        { id: 4, value: 'hvac', label: 'CVC' },
        { id: 5, value: 'painting', label: 'Peinture' },
        { id: 6, value: 'carpentry', label: 'Menuiserie' },
        { id: 7, value: 'masonry', label: 'Maçonnerie' },
        { id: 8, value: 'roofing', label: 'Toiture' },
      ]);
    }
  };

  // Recherche de zones avec debounce
  useEffect(() => {
    if (zoneQuery.length >= 2 && apiAvailable) {
      const timeoutId = setTimeout(() => {
        searchZones(zoneQuery);
      }, 500);
      
      return () => clearTimeout(timeoutId);
    } else {
      setZoneSearchResults([]);
      setShowZoneResults(false);
    }
  }, [zoneQuery, apiAvailable]);

  const searchZones = async (query: string) => {
    if (!apiAvailable) return;
    
    setSearchingZones(true);
    try {
      const response = await ApiService.searchZones(query);
      if (response.success && response.data) {
        setZoneSearchResults(response.data);
        setShowZoneResults(true);
      }
    } catch (error) {
      console.error('Erreur lors de la recherche de zones:', error);
    } finally {
      setSearchingZones(false);
    }
  };

  const selectZone = (zone: ZoneSearchResult) => {
    // Vérifier si la zone n'est pas déjà sélectionnée
    if (!zones.find(z => z.id === zone.id)) {
      setZones(prev => [...prev, zone]);
    }
    setZoneQuery('');
    setZoneSearchResults([]);
    setShowZoneResults(false);
  };

  const removeZone = (zoneId: number) => {
    setZones(prev => prev.filter(z => z.id !== zoneId));
  };

  const toggleSpecialty = (specialty: SpecialtyOption) => {
    setSpecialties(prev => {
      const exists = prev.find(s => s.id === specialty.id);
      if (exists) {
        return prev.filter(s => s.id !== specialty.id);
      } else {
        return [...prev, specialty];
      }
    });
  };

  const removeSpecialty = (specialtyId: number) => {
    setSpecialties(prev => prev.filter(s => s.id !== specialtyId));
  };

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
    if (specialties.length === 0) {
      Alert.alert('Erreur', 'Veuillez sélectionner au moins une spécialité');
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
      const registrationData: TechnicianRegistrationData = {
        name: name.trim(),
        email: email.trim().toLowerCase(),
        password,
        password_confirmation: confirmPassword,
        phone: phone.trim(),
        specialties: specialties.map(s => s.id),
        zones: zones.map(z => z.id.toString()),
        license_number: licenseNumber.trim() || undefined,
        supervisor_email: supervisorEmail.trim() || undefined,
        note: note.trim() || undefined,
      };

      console.log('Envoi des données à l\'API:', registrationData);

      const response = await ApiService.registerTechnician(registrationData);
      console.log('Réponse de l\'API:', response.data);
      
      if (response) {
        router.push('/login');
        console.log('Réponse 1 de l\'API:', response);
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
      const mockSkills = specialties.map(s => s.label);
      const mockZones = zones.map(z => z.nom);
      await register(name, email, password, phone, 'Paris', '75001', mockSkills, mockZones, verificationMethod);
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
              {apiAvailable ? '🌐 Mode API (Local)' : '🔧 Mode Local'}
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
            <TouchableOpacity onPress={() => setShowTooltip(!showTooltip)} style={styles.eyeButton}>
              <Info size={20} color="#FFD700" />
            </TouchableOpacity>
          </View>

          {showTooltip && (
            <View style={styles.tooltipContainer}>
              <Text style={styles.tooltipText}>🔒 Votre mot de passe doit contenir :
- 8 caractères minimum
- 1 majuscule
- 1 chiffre
- 1 caractère spécial</Text>
            </View>
          )}

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
                placeholder="Email du superviseur (optionnel)" 
                keyboardType="email-address"
                autoCapitalize="none"
                value={supervisorEmail} 
                onChangeText={setSupervisorEmail} 
              />
              <TextInput 
                style={[styles.input, styles.textArea]}
                placeholder="Note (optionnel)" 
                value={note} 
                onChangeText={setNote}
                multiline
                numberOfLines={3}
              />
            </>
          )}

          {/* Section Zones de travail */}
          {apiAvailable && (
            <View style={styles.sectionContainer}>
              <View style={styles.sectionHeader}>
                <MapPin size={20} color="#FFD700" />
                <Text style={styles.sectionTitle}>Zones de travail</Text>
              </View>
              
              {/* Zones sélectionnées */}
              {zones.length > 0 && (
                <View style={styles.selectedContainer}>
                  <Text style={styles.selectedLabel}>
                    {zones.length} zone{zones.length > 1 ? 's' : ''} sélectionnée{zones.length > 1 ? 's' : ''}
                  </Text>
                  <View style={styles.selectedChips}>
                    {zones.map((zone) => (
                      <View key={zone.id} style={styles.selectedChip}>
                        <Text style={styles.selectedChipText}>{zone.nom}</Text>
                        <TouchableOpacity
                          style={styles.removeChipButton}
                          onPress={() => removeZone(zone.id)}
                        >
                          <X size={12} color="#000" />
                        </TouchableOpacity>
                      </View>
                    ))}
                  </View>
                </View>
              )}

              {/* Recherche de zones */}
              <View style={styles.modernSearchContainer}>
                <Search size={18} color="#666" />
                <TextInput
                  style={styles.modernSearchInput}
                  placeholder="Rechercher des zones (Paris, Lyon, Marseille...)"
                  value={zoneQuery}
                  onChangeText={setZoneQuery}
                  placeholderTextColor="#999"
                />
                {searchingZones && (
                  <View style={styles.searchLoader}>
                    <ActivityIndicator size="small" color="#FFD700" />
                  </View>
                )}
              </View>

              {/* Résultats de recherche de zones */}
              {showZoneResults && zoneSearchResults.length > 0 && (
                <View style={styles.modernResultsContainer}>
                  {zoneSearchResults.slice(0, 6).map((zone) => {
                    const isSelected = zones.find(z => z.id === zone.id);
                    return (
                      <TouchableOpacity
                        key={zone.id}
                        style={[
                          styles.modernZoneCard,
                          isSelected && styles.modernZoneCardSelected
                        ]}
                        onPress={() => selectZone(zone)}
                        disabled={!!isSelected}
                      >
                        <View style={styles.zoneCardHeader}>
                          <View style={[
                            styles.zoneCardIcon,
                            isSelected && styles.zoneCardIconSelected
                          ]}>
                            <Building2 size={16} color={isSelected ? "#000" : "#FFD700"} />
                          </View>
                          <View style={styles.zoneCardInfo}>
                            <Text style={[
                              styles.zoneCardTitle,
                              isSelected && styles.zoneCardTitleSelected
                            ]}>
                              {zone.nom}
                            </Text>
                            <Text style={styles.zoneCardSubtitle}>
                              {zone.codes_postaux.slice(0, 3).join(', ')}
                              {zone.codes_postaux.length > 3 && '...'}
                            </Text>
                          </View>
                          {isSelected && (
                            <View style={styles.selectedBadge}>
                              <CheckCircle size={16} color="#000" />
                            </View>
                          )}
                        </View>
                        <View style={styles.zoneCardFooter}>
                          <View style={styles.populationBadge}>
                            <Users size={12} color="#666" />
                            <Text style={styles.populationText}>
                              {zone.population.toLocaleString()} hab.
                            </Text>
                          </View>
                        </View>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              )}
            </View>
          )}

          {/* Section Spécialités */}
          <View style={styles.sectionContainer}>
            <View style={styles.sectionHeader}>
              <Star size={20} color="#FFD700" />
              <Text style={styles.sectionTitle}>Spécialités</Text>
            </View>
            
            {/* Spécialités sélectionnées */}
            {specialties.length > 0 && (
              <View style={styles.selectedContainer}>
                <Text style={styles.selectedLabel}>
                  {specialties.length} spécialité{specialties.length > 1 ? 's' : ''} sélectionnée{specialties.length > 1 ? 's' : ''}
                </Text>
                <View style={styles.selectedChips}>
                  {specialties.map((specialty) => (
                    <View key={specialty.id} style={styles.selectedChip}>
                      <Text style={styles.selectedChipText}>{specialty.label}</Text>
                      <TouchableOpacity
                        style={styles.removeChipButton}
                        onPress={() => removeSpecialty(specialty.id)}
                      >
                        <X size={12} color="#000" />
                      </TouchableOpacity>
                    </View>
                  ))}
                </View>
              </View>
            )}

            {/* Grille des spécialités */}
            <View style={styles.modernSpecialtiesGrid}>
              {availableSpecialties.map((specialty) => {
                const isSelected = specialties.find(s => s.id === specialty.id);
                return (
                  <TouchableOpacity
                    key={specialty.id}
                    style={[
                      styles.modernSpecialtyCard,
                      isSelected && styles.modernSpecialtyCardSelected
                    ]}
                    onPress={() => toggleSpecialty(specialty)}
                  >
                    <View style={[
                      styles.specialtyCardIcon,
                      isSelected && styles.specialtyCardIconSelected
                    ]}>
                      <Text style={styles.specialtyEmoji}>
                        {getSpecialtyEmoji(specialty.value)}
                      </Text>
                    </View>
                    <Text style={[
                      styles.specialtyCardText,
                      isSelected && styles.specialtyCardTextSelected
                    ]}>
                      {specialty.label}
                    </Text>
                    {isSelected && (
                      <View style={styles.specialtySelectedBadge}>
                        <CheckCircle size={14} color="#000" />
                      </View>
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

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

// Fonction pour obtenir l'emoji correspondant à chaque spécialité
const getSpecialtyEmoji = (value: string) => {
  const emojiMap = {
    'plumbing': '🔧',
    'electricity': '⚡',
    'locksmith': '🔐',
    'hvac': '❄️',
    'painting': '🎨',
    'carpentry': '🪚',
    'masonry': '🧱',
    'roofing': '🏠',
  };
  return emojiMap[value] || '🔨';
};

const styles = StyleSheet.create({
  container: { 
    padding: 20,
    paddingBottom: 40,
  },
  title: { 
    fontSize: 28, 
    fontWeight: 'bold', 
    marginBottom: 24,
    color: '#1a1a1a',
    textAlign: 'center',
  },
  modeIndicator: {
    padding: 12,
    borderRadius: 12,
    marginBottom: 20,
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
  input: { 
    borderWidth: 1.5, 
    borderColor: '#FFD700', 
    borderRadius: 12, 
    padding: 16, 
    marginBottom: 16,
    fontSize: 16,
    backgroundColor: '#fafafa',
  },
  textArea: { 
    height: 80, 
    textAlignVertical: 'top' 
  },
  inputPassword: { 
    flex: 1, 
    padding: 16,
    fontSize: 16,
  },
  passwordRow: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    borderWidth: 1.5, 
    borderColor: '#FFD700', 
    borderRadius: 12, 
    marginBottom: 16, 
    paddingRight: 8,
    backgroundColor: '#fafafa',
  },
  eyeButton: { 
    padding: 8 
  },
  tooltipContainer: {
    backgroundColor: '#fff8e1',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#FFD700',
  },
  tooltipText: { 
    fontSize: 14,
    color: '#333',
    lineHeight: 20,
  },
  passwordScoreRow: { 
    flexDirection: 'row', 
    alignItems: 'flex-start', 
    marginBottom: 24,
    backgroundColor: '#f8f9fa',
    padding: 16,
    borderRadius: 12,
  },
  checkItem: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    marginBottom: 6 
  },
  
  // Styles pour les sections modernes
  sectionContainer: {
    marginBottom: 32,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    paddingBottom: 8,
    borderBottomWidth: 2,
    borderBottomColor: '#FFD700',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginLeft: 8,
  },
  
  // Styles pour les éléments sélectionnés
  selectedContainer: {
    backgroundColor: '#fff8e1',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#FFD700',
  },
  selectedLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  selectedChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  selectedChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFD700',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  selectedChipText: {
    color: '#000',
    fontSize: 14,
    fontWeight: '600',
    marginRight: 6,
  },
  removeChipButton: {
    padding: 2,
  },
  
  // Styles pour la recherche moderne
  modernSearchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1.5,
    borderColor: '#e0e0e0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  modernSearchInput: {
    flex: 1,
    fontSize: 16,
    marginLeft: 12,
    color: '#333',
  },
  searchLoader: {
    marginLeft: 8,
  },
  
  // Styles pour les résultats de zones
  modernResultsContainer: {
    gap: 12,
  },
  modernZoneCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1.5,
    borderColor: '#e0e0e0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  modernZoneCardSelected: {
    borderColor: '#FFD700',
    backgroundColor: '#fff8e1',
  },
  zoneCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  zoneCardIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#fff8e1',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  zoneCardIconSelected: {
    backgroundColor: '#FFD700',
  },
  zoneCardInfo: {
    flex: 1,
  },
  zoneCardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 2,
  },
  zoneCardTitleSelected: {
    color: '#000',
  },
  zoneCardSubtitle: {
    fontSize: 13,
    color: '#666',
  },
  selectedBadge: {
    marginLeft: 8,
  },
  zoneCardFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  populationBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  populationText: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
  },
  
  // Styles pour la grille des spécialités
  modernSpecialtiesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  modernSpecialtyCard: {
    width: '47%',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#e0e0e0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    position: 'relative',
  },
  modernSpecialtyCardSelected: {
    borderColor: '#FFD700',
    backgroundColor: '#fff8e1',
  },
  specialtyCardIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#f8f9fa',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  specialtyCardIconSelected: {
    backgroundColor: '#FFD700',
  },
  specialtyEmoji: {
    fontSize: 24,
  },
  specialtyCardText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    textAlign: 'center',
  },
  specialtyCardTextSelected: {
    color: '#000',
  },
  specialtySelectedBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
  },
  
  submitBtn: { 
    backgroundColor: '#000', 
    padding: 18, 
    borderRadius: 12, 
    alignItems: 'center',
    marginTop: 32,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  submitText: { 
    color: '#FFD700', 
    fontWeight: 'bold', 
    fontSize: 16 
  },
  label: { 
    fontWeight: '600', 
    marginBottom: 8, 
    color: '#111',
    fontSize: 16,
  },
  radioGroup: { 
    flexDirection: 'row', 
    gap: 16, 
    marginBottom: 24 
  },
  radio: { 
    borderWidth: 1, 
    borderColor: '#FFD700', 
    padding: 12, 
    borderRadius: 8,
    minWidth: 80,
    alignItems: 'center',
  },
  radioSelected: { 
    backgroundColor: '#FFD700', 
    borderColor: '#FFD700' 
  },
  radioText: { 
    color: '#000',
    fontSize: 14,
    fontWeight: '500',
  },
  loginLink: {
    alignItems: 'center',
    marginTop: 24,
  },
  loginLinkText: {
    color: '#FFD700',
    fontSize: 16,
    fontWeight: '600',
  },
});