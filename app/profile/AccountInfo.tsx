import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, Alert, Modal, FlatList } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { HeaderBar } from '@/components/ui/HeaderBar';
import { useLanguage } from '@/hooks/useLanguage';
import { useAuth } from '@/hooks/useAuth';
import { useTheme } from '@/hooks/useTheme';
import { translations } from '@/constants/Translations';
import { COLORS, DARK_COLORS } from '@/constants/Colors';
import { User, Lock, Mail, Phone, MapPin, CreditCard as Edit3, Save, Eye, EyeOff, Plus, X } from 'lucide-react-native';

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
  const [showSkillsModal, setShowSkillsModal] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  const colors = theme === 'dark' ? DARK_COLORS : COLORS;
  
  // Form states
  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: user?.phone || '',
    ville: user?.ville || '',
    codePostal: user?.codePostal || '',
    skills: user?.skills || [],
  });
  
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const handleSaveInfo = async () => {
    if (!user) return;

    setIsLoading(true);
    try {
      await updateProfile({
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        ville: formData.ville,
        codePostal: formData.codePostal,
        skills: formData.skills,
      });

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

  const toggleSkill = (skill: string) => {
    setFormData(prev => ({
      ...prev,
      skills: prev.skills.includes(skill)
        ? prev.skills.filter(s => s !== skill)
        : [...prev.skills, skill]
    }));
  };

  const removeSkill = (skill: string) => {
    setFormData(prev => ({
      ...prev,
      skills: prev.skills.filter(s => s !== skill)
    }));
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
    skillsContainer: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
    },
    skillBadge: {
      backgroundColor: `${colors.primary}20`,
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: colors.primary,
      flexDirection: 'row',
      alignItems: 'center',
    },
    skillText: {
      color: colors.primary,
      fontSize: 14,
      fontWeight: '500',
    },
    removeSkillButton: {
      marginLeft: 8,
      padding: 2,
    },
    addSkillButton: {
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
    addSkillText: {
      color: colors.primary,
      fontSize: 14,
      fontWeight: '500',
      marginLeft: 4,
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
    skillOption: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 12,
      paddingHorizontal: 16,
      borderRadius: 8,
      marginBottom: 8,
      backgroundColor: colors.background,
    },
    skillOptionSelected: {
      backgroundColor: colors.primary,
    },
    skillOptionText: {
      fontSize: 16,
      color: colors.text,
    },
    skillOptionTextSelected: {
      color: colors.buttonText,
      fontWeight: '600',
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
  });

  const SkillsModal = () => (
    <Modal
      visible={showSkillsModal}
      transparent
      animationType="slide"
      onRequestClose={() => setShowSkillsModal(false)}
    >
      <View style={dynamicStyles.modalOverlay}>
        <View style={dynamicStyles.modalContent}>
          <Text style={dynamicStyles.modalTitle}>{t.selectSkills}</Text>
          
          <FlatList
            data={availableSkills}
            keyExtractor={(item) => item}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[
                  dynamicStyles.skillOption,
                  formData.skills.includes(item) && dynamicStyles.skillOptionSelected
                ]}
                onPress={() => toggleSkill(item)}
              >
                <Text style={[
                  dynamicStyles.skillOptionText,
                  formData.skills.includes(item) && dynamicStyles.skillOptionTextSelected
                ]}>
                  {item}
                </Text>
              </TouchableOpacity>
            )}
            showsVerticalScrollIndicator={false}
          />

          <TouchableOpacity
            style={dynamicStyles.closeModalButton}
            onPress={() => setShowSkillsModal(false)}
          >
            <Text style={dynamicStyles.closeModalButtonText}>{t.close}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );

  return (
    <SafeAreaView style={dynamicStyles.container} edges={['top']}>
      <HeaderBar title={t.accountInfo} showBack />
      
      <ScrollView style={dynamicStyles.content} showsVerticalScrollIndicator={false}>
        {/* Section Informations personnelles */}
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

          <View style={dynamicStyles.formGroup}>
            <Text style={dynamicStyles.label}>{t.city}</Text>
            <View style={dynamicStyles.inputWithIcon}>
              <MapPin size={20} color={colors.textLight} style={dynamicStyles.inputIcon} />
              <TextInput
                style={[dynamicStyles.inputWithIconText, !isEditing && dynamicStyles.inputDisabled]}
                value={formData.ville}
                onChangeText={(text) => setFormData({...formData, ville: text})}
                editable={isEditing}
                placeholder={t.city}
                placeholderTextColor={colors.textLight}
              />
            </View>
          </View>

          <View style={dynamicStyles.formGroup}>
            <Text style={dynamicStyles.label}>{t.postalCode}</Text>
            <TextInput
              style={[dynamicStyles.input, !isEditing && dynamicStyles.inputDisabled]}
              value={formData.codePostal}
              onChangeText={(text) => setFormData({...formData, codePostal: text})}
              editable={isEditing}
              placeholder={t.postalCode}
              placeholderTextColor={colors.textLight}
              keyboardType="numeric"
              maxLength={5}
            />
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

        {/* Section Compétences */}
        <View style={dynamicStyles.section}>
          <Text style={dynamicStyles.sectionTitle}>{t.skills}</Text>
          <View style={dynamicStyles.skillsContainer}>
            {formData.skills.map((skill, index) => (
              <View key={index} style={dynamicStyles.skillBadge}>
                <Text style={dynamicStyles.skillText}>{skill}</Text>
                {isEditing && (
                  <TouchableOpacity
                    style={dynamicStyles.removeSkillButton}
                    onPress={() => removeSkill(skill)}
                  >
                    <X size={14} color={colors.primary} />
                  </TouchableOpacity>
                )}
              </View>
            ))}
            {isEditing && (
              <TouchableOpacity
                style={dynamicStyles.addSkillButton}
                onPress={() => setShowSkillsModal(true)}
              >
                <Plus size={16} color={colors.primary} />
                <Text style={dynamicStyles.addSkillText}>{t.addSkill}</Text>
              </TouchableOpacity>
            )}
          </View>
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

      <SkillsModal />
    </SafeAreaView>
  );
}