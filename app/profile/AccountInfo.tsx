import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, Alert, Modal, FlatList, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { HeaderBar } from '@/components/ui/HeaderBar';
import { useLanguage } from '@/hooks/useLanguage';
import { useAuth } from '@/hooks/useAuth';
import { useTheme } from '@/hooks/useTheme';
import { translations } from '@/constants/Translations';
import { COLORS, DARK_COLORS } from '@/constants/Colors';
import { User, Lock, Mail, Phone, MapPin, CreditCard as Edit3, Save, Eye, EyeOff, Plus, X, Search, Star, Users, Building2, CircleCheck as CheckCircle } from 'lucide-react-native';
import ApiService, { isApiAvailable, SpecialtyOption, ZoneSearchResult } from '@/services/apiService';

const availableSkills = [
  'Plombier', 'Électricien', 'Serrurier', 'Chauffagiste', 'Peintre', 'Menuisier',
  'Vitrier', 'Carreleur', 'Technicien alarme', 'Technicien clim', 'Mécanicien', 'Fibre optique',
  'Maçon', 'Couvreur', 'Jardinier', 'Nettoyage', 'Déménagement', 'Réparation TV',
  'Installation satellite', 'Dépannage informatique'
];

export default function AccountInfoScreen() {
  const { language } = useLanguage();
  const { theme } = useTheme();
  const t = translations[language];
  const { user, updateProfile } = useAuth();
  
  const [isEditing, setIsEditing] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [apiAvailable, setApiAvailable] = useState(false);
  
  const colors = theme === 'dark' ? DARK_COLORS : COLORS;
  
  // Form states - Suppression du code postal, zones à la place de ville
  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: user?.phone || '',
    skills: user?.skills || [],
    zones: user?.zones || [],
  });
  
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  // États pour les données API
  const [availableSpecialties, setAvailableSpecialties] = useState<SpecialtyOption[]>([]);
  const [zoneSearchResults, setZoneSearchResults] = useState<ZoneSearchResult[]>([]);
  const [searchingZones, setSearchingZones] = useState(false);
  const [zoneQuery, setZoneQuery] = useState('');
  const [selectedZones, setSelectedZones] = useState<ZoneSearchResult[]>([]);
  const [selectedSpecialties, setSelectedSpecialties] = useState<SpecialtyOption[]>([]);

  // Vérifier la disponibilité de l'API au chargement
  useEffect(() => {
    const checkApiAvailability = async () => {
      const available = await isApiAvailable();
      setApiAvailable(available);
      
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
        const specialtiesWithIds = response.data.map((specialty, index) => ({
          ...specialty,
          id: index + 1
        }));
        setAvailableSpecialties(specialtiesWithIds);
        
        // Mapper les compétences actuelles de l'utilisateur
        const userSpecialties = specialtiesWithIds.filter(s => 
          user?.skills?.includes(s.label)
        );
        setSelectedSpecialties(userSpecialties);
      }
    } catch (error) {
      console.error('Erreur lors du chargement des spécialités:', error);
      // Fallback avec des spécialités par défaut
      const defaultSpecialties = availableSkills.map((skill, index) => ({
        id: index + 1,
        value: skill.toLowerCase().replace(/\s+/g, '_'),
        label: skill
      }));
      setAvailableSpecialties(defaultSpecialties);
      
      const userSpecialties = defaultSpecialties.filter(s => 
        user?.skills?.includes(s.label)
      );
      setSelectedSpecialties(userSpecialties);
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
    }
  }, [zoneQuery, apiAvailable]);

  const searchZones = async (query: string) => {
    if (!apiAvailable) return;
    
    setSearchingZones(true);
    try {
      const response = await ApiService.searchZones(query);
      if (response.success && response.data) {
        setZoneSearchResults(response.data);
      }
    } catch (error) {
      console.error('Erreur lors de la recherche de zones:', error);
    } finally {
      setSearchingZones(false);
    }
  };

  const selectZone = (zone: ZoneSearchResult) => {
    if (!selectedZones.find(z => z.id === zone.id)) {
      setSelectedZones(prev => [...prev, zone]);
    }
    setZoneQuery('');
    setZoneSearchResults([]);
  };

  const removeZone = (zoneId: number) => {
    setSelectedZones(prev => prev.filter(z => z.id !== zoneId));
  };

  const toggleSpecialty = (specialty: SpecialtyOption) => {
    setSelectedSpecialties(prev => {
      const exists = prev.find(s => s.id === specialty.id);
      if (exists) {
        return prev.filter(s => s.id !== specialty.id);
      } else {
        return [...prev, specialty];
      }
    });
  };

  const removeSpecialty = (specialtyId: number) => {
    setSelectedSpecialties(prev => prev.filter(s => s.id !== specialtyId));
  };

  const handleSaveInfo = async () => {
    if (!user) return;

    setIsLoading(true);
    try {
      const updatedData = {
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        skills: selectedSpecialties.map(s => s.label),
        zones: selectedZones.map(z => z.nom),
      };

      await updateProfile(updatedData);

      Alert.alert(
        t.informationUpdated,
        t.informationUpdatedMessage,
        [{ text: 'OK', onPress: () => setIsEditing(false) }]
      );
    } catch (error) {
      Alert.alert(
        t.error,
        error instanceof Error ? error.message : 'Erreur lors de la mise à jour'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleChangePassword = () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      Alert.alert(t.error, t.passwordsDoNotMatch);
      return;
    }
    
    if (passwordData.newPassword.length < 8) {
      Alert.alert(t.error, t.passwordTooShort);
      return;
    }

    Alert.alert(
      t.passwordChanged,
      t.passwordChangedMessage,
      [{ 
        text: 'OK', 
        onPress: () => {
          setIsChangingPassword(false);
          setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
        }
      }]
    );
  };

  // Fonction pour obtenir l'emoji correspondant à chaque spécialité
  const getSpecialtyEmoji = (value: string) => {
    const emojiMap: Record<string, string> = {
      'plombier': '🔧',
      'électricien': '⚡',
      'serrurier': '🔐',
      'chauffagiste': '❄️',
      'peintre': '🎨',
      'menuisier': '🪚',
      'vitrier': '🪟',
      'carreleur': '🧱',
      'technicien_alarme': '🚨',
      'technicien_clim': '❄️',
      'mécanicien': '🔧',
      'fibre_optique': '🌐',
      'maçon': '🧱',
      'couvreur': '🏠',
      'jardinier': '🌱',
      'nettoyage': '🧽',
      'déménagement': '📦',
      'réparation_tv': '📺',
      'installation_satellite': '📡',
      'dépannage_informatique': '💻',
    };
    return emojiMap[value.toLowerCase().replace(/\s+/g, '_')] || '🔨';
  };

  const dynamicStyles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    content: {
      flex: 1,
      padding: 16,
    },
    section: {
      backgroundColor: colors.card,
      borderRadius: 12,
      padding: 16,
      marginBottom: 16,
      shadowColor: colors.shadow,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3,
    },
    sectionHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 16,
    },
    sectionTitle: {
      fontSize: 18,
      fontWeight: 'bold',
      color: colors.text,
      marginLeft: 12,
      flex: 1,
    },
    editButton: {
      padding: 8,
    },
    formGroup: {
      marginBottom: 16,
    },
    label: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.text,
      marginBottom: 8,
    },
    input: {
      borderWidth: 1,
      borderColor: colors.primary,
      borderRadius: 8,
      padding: 12,
      fontSize: 16,
      backgroundColor: colors.card,
      color: colors.text,
    },
    inputDisabled: {
      backgroundColor: colors.border,
      color: colors.textLight,
    },
    inputWithIcon: {
      flexDirection: 'row',
      alignItems: 'center',
      borderWidth: 1,
      borderColor: colors.primary,
      borderRadius: 8,
      backgroundColor: colors.card,
    },
    inputIcon: {
      marginLeft: 12,
    },
    inputWithIconText: {
      flex: 1,
      padding: 12,
      fontSize: 16,
      color: colors.text,
    },
    saveButton: {
      backgroundColor: colors.primary,
      paddingVertical: 12,
      borderRadius: 8,
      alignItems: 'center',
      marginTop: 8,
    },
    saveButtonText: {
      color: colors.buttonText,
      fontSize: 16,
      fontWeight: 'bold',
    },
    
    // Styles pour les sections modernes
    modernSectionContainer: {
      marginBottom: 24,
    },
    modernSectionHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 16,
      paddingBottom: 8,
      borderBottomWidth: 2,
      borderBottomColor: colors.primary,
    },
    modernSectionTitle: {
      fontSize: 18,
      fontWeight: 'bold',
      color: colors.text,
      marginLeft: 8,
    },
    
    // Styles pour les éléments sélectionnés
    selectedContainer: {
      backgroundColor: colors.primary + '20',
      borderRadius: 12,
      padding: 16,
      marginBottom: 16,
      borderWidth: 1,
      borderColor: colors.primary,
    },
    selectedLabel: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.text,
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
      backgroundColor: colors.primary,
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
      color: colors.buttonText,
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
      backgroundColor: colors.card,
      borderRadius: 12,
      padding: 16,
      marginBottom: 16,
      borderWidth: 1.5,
      borderColor: colors.border,
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
      color: colors.text,
    },
    searchLoader: {
      marginLeft: 8,
    },
    
    // Styles pour les résultats de zones
    modernResultsContainer: {
      gap: 12,
    },
    modernZoneCard: {
      backgroundColor: colors.card,
      borderRadius: 12,
      padding: 16,
      borderWidth: 1.5,
      borderColor: colors.border,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.05,
      shadowRadius: 8,
      elevation: 2,
    },
    modernZoneCardSelected: {
      borderColor: colors.primary,
      backgroundColor: colors.primary + '10',
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
      backgroundColor: colors.primary + '20',
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 12,
    },
    zoneCardIconSelected: {
      backgroundColor: colors.primary,
    },
    zoneCardInfo: {
      flex: 1,
    },
    zoneCardTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.text,
      marginBottom: 2,
    },
    zoneCardTitleSelected: {
      color: colors.text,
    },
    zoneCardSubtitle: {
      fontSize: 13,
      color: colors.textLight,
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
      backgroundColor: colors.border,
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 12,
      gap: 4,
    },
    populationText: {
      fontSize: 12,
      color: colors.textLight,
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
      backgroundColor: colors.card,
      borderRadius: 12,
      padding: 16,
      alignItems: 'center',
      borderWidth: 1.5,
      borderColor: colors.border,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.05,
      shadowRadius: 8,
      elevation: 2,
      position: 'relative',
    },
    modernSpecialtyCardSelected: {
      borderColor: colors.primary,
      backgroundColor: colors.primary + '10',
    },
    specialtyCardIcon: {
      width: 48,
      height: 48,
      borderRadius: 24,
      backgroundColor: colors.border,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 12,
    },
    specialtyCardIconSelected: {
      backgroundColor: colors.primary,
    },
    specialtyEmoji: {
      fontSize: 24,
    },
    specialtyCardText: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.text,
      textAlign: 'center',
    },
    specialtyCardTextSelected: {
      color: colors.text,
    },
    specialtySelectedBadge: {
      position: 'absolute',
      top: 8,
      right: 8,
    },
    
    passwordButton: {
      backgroundColor: colors.border,
      paddingVertical: 12,
      paddingHorizontal: 16,
      borderRadius: 8,
      alignItems: 'center',
      borderWidth: 1,
      borderColor: colors.border,
    },
    passwordButtonText: {
      color: colors.primary,
      fontSize: 16,
      fontWeight: '600',
    },
    passwordSection: {
      marginTop: 16,
      paddingTop: 16,
      borderTopWidth: 1,
      borderTopColor: colors.border,
    },
    passwordInputContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      borderWidth: 1,
      borderColor: colors.primary,
      borderRadius: 8,
      backgroundColor: colors.card,
    },
    passwordInput: {
      flex: 1,
      padding: 12,
      fontSize: 16,
      color: colors.text,
    },
    eyeButton: {
      padding: 12,
    },
    changePasswordButton: {
      backgroundColor: colors.text,
      paddingVertical: 12,
      borderRadius: 8,
      alignItems: 'center',
      marginTop: 8,
    },
    changePasswordButtonText: {
      color: colors.primary,
      fontSize: 16,
      fontWeight: 'bold',
    },
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: 20,
    },
    modalContent: {
      backgroundColor: colors.card,
      borderRadius: 16,
      padding: 20,
      width: '100%',
      maxWidth: 400,
      maxHeight: '80%',
    },
    modalTitle: {
      fontSize: 20,
      fontWeight: 'bold',
      color: colors.text,
      marginBottom: 16,
      textAlign: 'center',
    },
    closeModalButton: {
      backgroundColor: colors.text,
      paddingVertical: 12,
      borderRadius: 8,
      alignItems: 'center',
      marginTop: 16,
    },
    closeModalButtonText: {
      color: colors.primary,
      fontSize: 16,
      fontWeight: 'bold',
    },
    loadingButton: {
      opacity: 0.6,
    },
    addButton: {
      backgroundColor: colors.border,
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: colors.primary,
      borderStyle: 'dashed',
      flexDirection: 'row',
      alignItems: 'center',
    },
    addButtonText: {
      color: colors.primary,
      fontSize: 14,
      fontWeight: '500',
      marginLeft: 4,
    },
  });

  return (
    <SafeAreaView style={dynamicStyles.container} edges={['top']}>
      <HeaderBar title={t.accountInfo} showBack />
      
      <ScrollView style={dynamicStyles.content} showsVerticalScrollIndicator={false}>
        {/* Section Informations personnelles avec zones et spécialités intégrées */}
        <View style={dynamicStyles.section}>
          <View style={dynamicStyles.sectionHeader}>
            <User size={24} color={colors.primary} />
            <Text style={dynamicStyles.sectionTitle}>{t.personalInformation}</Text>
            <TouchableOpacity 
              onPress={() => setIsEditing(!isEditing)}
              style={dynamicStyles.editButton}
              disabled={isLoading}
            >
              {isEditing ? (
                <Save size={20} color={colors.primary} />
              ) : (
                <Edit3 size={20} color={colors.primary} />
              )}
            </TouchableOpacity>
          </View>

          <View style={dynamicStyles.formGroup}>
            <Text style={dynamicStyles.label}>{t.fullName}</Text>
            <TextInput
              style={[dynamicStyles.input, !isEditing && dynamicStyles.inputDisabled]}
              value={formData.name}
              onChangeText={(text) => setFormData({...formData, name: text})}
              editable={isEditing}
              placeholder={t.fullName}
              placeholderTextColor={colors.textLight}
            />
          </View>

          <View style={dynamicStyles.formGroup}>
            <Text style={dynamicStyles.label}>{t.email}</Text>
            <View style={dynamicStyles.inputWithIcon}>
              <Mail size={20} color={colors.textLight} style={dynamicStyles.inputIcon} />
              <TextInput
                style={[dynamicStyles.inputWithIconText, !isEditing && dynamicStyles.inputDisabled]}
                value={formData.email}
                onChangeText={(text) => setFormData({...formData, email: text})}
                editable={isEditing}
                placeholder={t.email}
                placeholderTextColor={colors.textLight}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>
          </View>

          <View style={dynamicStyles.formGroup}>
            <Text style={dynamicStyles.label}>{t.phone}</Text>
            <View style={dynamicStyles.inputWithIcon}>
              <Phone size={20} color={colors.textLight} style={dynamicStyles.inputIcon} />
              <TextInput
                style={[dynamicStyles.inputWithIconText, !isEditing && dynamicStyles.inputDisabled]}
                value={formData.phone}
                onChangeText={(text) => setFormData({...formData, phone: text})}
                editable={isEditing}
                placeholder={t.phone}
                placeholderTextColor={colors.textLight}
                keyboardType="phone-pad"
              />
            </View>
          </View>

          {/* Section Zones de travail intégrée */}
          <View style={dynamicStyles.modernSectionContainer}>
            <View style={dynamicStyles.modernSectionHeader}>
              <MapPin size={20} color={colors.primary} />
              <Text style={dynamicStyles.modernSectionTitle}>Zones de travail</Text>
            </View>
            
            {/* Zones sélectionnées */}
            {selectedZones.length > 0 && (
              <View style={dynamicStyles.selectedContainer}>
                <Text style={dynamicStyles.selectedLabel}>
                  {selectedZones.length} zone{selectedZones.length > 1 ? 's' : ''} sélectionnée{selectedZones.length > 1 ? 's' : ''}
                </Text>
                <View style={dynamicStyles.selectedChips}>
                  {selectedZones.map((zone) => (
                    <View key={zone.id} style={dynamicStyles.selectedChip}>
                      <Text style={dynamicStyles.selectedChipText}>{zone.nom}</Text>
                      {isEditing && (
                        <TouchableOpacity
                          style={dynamicStyles.removeChipButton}
                          onPress={() => removeZone(zone.id)}
                        >
                          <X size={12} color={colors.buttonText} />
                        </TouchableOpacity>
                      )}
                    </View>
                  ))}
                </View>
              </View>
            )}

            {isEditing && (
              <>
                {/* Recherche de zones */}
                <View style={dynamicStyles.modernSearchContainer}>
                  <Search size={18} color={colors.textLight} />
                  <TextInput
                    style={dynamicStyles.modernSearchInput}
                    placeholder="Rechercher des zones (Paris, Lyon, Marseille...)"
                    value={zoneQuery}
                    onChangeText={setZoneQuery}
                    placeholderTextColor={colors.textLight}
                  />
                  {searchingZones && (
                    <View style={dynamicStyles.searchLoader}>
                      <ActivityIndicator size="small" color={colors.primary} />
                    </View>
                  )}
                </View>

                {/* Résultats de recherche de zones */}
                {zoneSearchResults.length > 0 && (
                  <View style={dynamicStyles.modernResultsContainer}>
                    {zoneSearchResults.slice(0, 6).map((zone) => {
                      const isSelected = selectedZones.find(z => z.id === zone.id);
                      return (
                        <TouchableOpacity
                          key={zone.id}
                          style={[
                            dynamicStyles.modernZoneCard,
                            isSelected && dynamicStyles.modernZoneCardSelected
                          ]}
                          onPress={() => selectZone(zone)}
                          disabled={!!isSelected}
                        >
                          <View style={dynamicStyles.zoneCardHeader}>
                            <View style={[
                              dynamicStyles.zoneCardIcon,
                              isSelected && dynamicStyles.zoneCardIconSelected
                            ]}>
                              <Building2 size={16} color={isSelected ? colors.buttonText : colors.primary} />
                            </View>
                            <View style={dynamicStyles.zoneCardInfo}>
                              <Text style={[
                                dynamicStyles.zoneCardTitle,
                                isSelected && dynamicStyles.zoneCardTitleSelected
                              ]}>
                                {zone.nom}
                              </Text>
                              <Text style={dynamicStyles.zoneCardSubtitle}>
                                {zone.codes_postaux.slice(0, 3).join(', ')}
                                {zone.codes_postaux.length > 3 && '...'}
                              </Text>
                            </View>
                            {isSelected && (
                              <View style={dynamicStyles.selectedBadge}>
                                <CheckCircle size={16} color={colors.primary} />
                              </View>
                            )}
                          </View>
                          <View style={dynamicStyles.zoneCardFooter}>
                            <View style={dynamicStyles.populationBadge}>
                              <Users size={12} color={colors.textLight} />
                              <Text style={dynamicStyles.populationText}>
                                {zone.population.toLocaleString()} hab.
                              </Text>
                            </View>
                          </View>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                )}
              </>
            )}
          </View>

          {/* Section Spécialités intégrée */}
          <View style={dynamicStyles.modernSectionContainer}>
            <View style={dynamicStyles.modernSectionHeader}>
              <Star size={20} color={colors.primary} />
              <Text style={dynamicStyles.modernSectionTitle}>{t.skills}</Text>
            </View>
            
            {/* Spécialités sélectionnées */}
            {selectedSpecialties.length > 0 && (
              <View style={dynamicStyles.selectedContainer}>
                <Text style={dynamicStyles.selectedLabel}>
                  {selectedSpecialties.length} spécialité{selectedSpecialties.length > 1 ? 's' : ''} sélectionnée{selectedSpecialties.length > 1 ? 's' : ''}
                </Text>
                <View style={dynamicStyles.selectedChips}>
                  {selectedSpecialties.map((specialty) => (
                    <View key={specialty.id} style={dynamicStyles.selectedChip}>
                      <Text style={dynamicStyles.selectedChipText}>{specialty.label}</Text>
                      {isEditing && (
                        <TouchableOpacity
                          style={dynamicStyles.removeChipButton}
                          onPress={() => removeSpecialty(specialty.id)}
                        >
                          <X size={12} color={colors.buttonText} />
                        </TouchableOpacity>
                      )}
                    </View>
                  ))}
                </View>
              </View>
            )}

            {/* Grille des spécialités */}
            {isEditing && (
              <View style={dynamicStyles.modernSpecialtiesGrid}>
                {availableSpecialties.map((specialty) => {
                  const isSelected = selectedSpecialties.find(s => s.id === specialty.id);
                  return (
                    <TouchableOpacity
                      key={specialty.id}
                      style={[
                        dynamicStyles.modernSpecialtyCard,
                        isSelected && dynamicStyles.modernSpecialtyCardSelected
                      ]}
                      onPress={() => toggleSpecialty(specialty)}
                    >
                      <View style={[
                        dynamicStyles.specialtyCardIcon,
                        isSelected && dynamicStyles.specialtyCardIconSelected
                      ]}>
                        <Text style={dynamicStyles.specialtyEmoji}>
                          {getSpecialtyEmoji(specialty.value)}
                        </Text>
                      </View>
                      <Text style={[
                        dynamicStyles.specialtyCardText,
                        isSelected && dynamicStyles.specialtyCardTextSelected
                      ]}>
                        {specialty.label}
                      </Text>
                      {isSelected && (
                        <View style={dynamicStyles.specialtySelectedBadge}>
                          <CheckCircle size={14} color={colors.primary} />
                        </View>
                      )}
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}
          </View>

          {isEditing && (
            <TouchableOpacity 
              style={[dynamicStyles.saveButton, isLoading && dynamicStyles.loadingButton]} 
              onPress={handleSaveInfo}
              disabled={isLoading}
            >
              <Text style={dynamicStyles.saveButtonText}>
                {isLoading ? 'Enregistrement...' : t.saveChanges}
              </Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Section Sécurité */}
        <View style={dynamicStyles.section}>
          <View style={dynamicStyles.sectionHeader}>
            <Lock size={24} color={colors.primary} />
            <Text style={dynamicStyles.sectionTitle}>{t.security}</Text>
          </View>

          <TouchableOpacity 
            style={dynamicStyles.passwordButton}
            onPress={() => setIsChangingPassword(!isChangingPassword)}
          >
            <Text style={dynamicStyles.passwordButtonText}>
              {isChangingPassword ? t.cancel : t.changePassword}
            </Text>
          </TouchableOpacity>

          {isChangingPassword && (
            <View style={dynamicStyles.passwordSection}>
              <View style={dynamicStyles.formGroup}>
                <Text style={dynamicStyles.label}>{t.currentPassword}</Text>
                <View style={dynamicStyles.passwordInputContainer}>
                  <TextInput
                    style={dynamicStyles.passwordInput}
                    value={passwordData.currentPassword}
                    onChangeText={(text) => setPasswordData({...passwordData, currentPassword: text})}
                    placeholder={t.currentPassword}
                    placeholderTextColor={colors.textLight}
                    secureTextEntry={!showCurrentPassword}
                  />
                  <TouchableOpacity 
                    onPress={() => setShowCurrentPassword(!showCurrentPassword)}
                    style={dynamicStyles.eyeButton}
                  >
                    {showCurrentPassword ? (
                      <EyeOff size={20} color={colors.textLight} />
                    ) : (
                      <Eye size={20} color={colors.textLight} />
                    )}
                  </TouchableOpacity>
                </View>
              </View>

              <View style={dynamicStyles.formGroup}>
                <Text style={dynamicStyles.label}>{t.newPassword}</Text>
                <View style={dynamicStyles.passwordInputContainer}>
                  <TextInput
                    style={dynamicStyles.passwordInput}
                    value={passwordData.newPassword}
                    onChangeText={(text) => setPasswordData({...passwordData, newPassword: text})}
                    placeholder={t.newPassword}
                    placeholderTextColor={colors.textLight}
                    secureTextEntry={!showNewPassword}
                  />
                  <TouchableOpacity 
                    onPress={() => setShowNewPassword(!showNewPassword)}
                    style={dynamicStyles.eyeButton}
                  >
                    {showNewPassword ? (
                      <EyeOff size={20} color={colors.textLight} />
                    ) : (
                      <Eye size={20} color={colors.textLight} />
                    )}
                  </TouchableOpacity>
                </View>
              </View>

              <View style={dynamicStyles.formGroup}>
                <Text style={dynamicStyles.label}>{t.confirmNewPassword}</Text>
                <View style={dynamicStyles.passwordInputContainer}>
                  <TextInput
                    style={dynamicStyles.passwordInput}
                    value={passwordData.confirmPassword}
                    onChangeText={(text) => setPasswordData({...passwordData, confirmPassword: text})}
                    placeholder={t.confirmNewPassword}
                    placeholderTextColor={colors.textLight}
                    secureTextEntry={!showConfirmPassword}
                  />
                  <TouchableOpacity 
                    onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                    style={dynamicStyles.eyeButton}
                  >
                    {showConfirmPassword ? (
                      <EyeOff size={20} color={colors.textLight} />
                    ) : (
                      <Eye size={20} color={colors.textLight} />
                    )}
                  </TouchableOpacity>
                </View>
              </View>

              <TouchableOpacity style={dynamicStyles.changePasswordButton} onPress={handleChangePassword}>
                <Text style={dynamicStyles.changePasswordButtonText}>{t.changePassword}</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}