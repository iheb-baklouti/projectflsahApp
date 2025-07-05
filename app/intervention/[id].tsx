import React, { useEffect, useRef, useState } from 'react';
import {
  View, Text, StyleSheet, Platform, ActivityIndicator, TouchableOpacity,
  Dimensions, Linking, Animated, ScrollView, Modal, TextInput, Alert
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { HeaderBar } from '@/components/ui/HeaderBar';
import { useInterventions } from '@/hooks/useInterventions';
import { useInvoices } from '@/hooks/useInvoices';
import { useTheme } from '@/hooks/useTheme';
import { useLanguage } from '@/hooks/useLanguage';
import { translations } from '@/constants/Translations';
import { COLORS, DARK_COLORS } from '@/constants/Colors';
import { MapPin, Phone, Clock, User, ArrowLeft, Navigation, Plus, X, FileText, Download, Mail, Hash, Wrench, Settings } from 'lucide-react-native';
import { Intervention, InvoiceFormData } from '@/types/intervention';
import { StatusUpdateModal } from '@/components/interventions/StatusUpdateModal';
import * as Location from 'expo-location';

const screenHeight = Dimensions.get('window').height;

export default function InterventionDetails() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { interventions, updateInterventionStatus, loadInterventions } = useInterventions();
  const { createInvoice, downloadInvoice, isLoading: invoiceLoading } = useInvoices();
  const { theme } = useTheme();
  const { language } = useLanguage();
  const t = translations[language];
  const colors = theme === 'dark' ? DARK_COLORS : COLORS;
  
  const [MapComponents, setMapComponents] = useState<null | {
    MapView: any;
    Marker: any;
    PROVIDER_GOOGLE: any;
    MapViewDirections: any;
  }>(null);

  const [technicianLocation, setTechnicianLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [eta, setEta] = useState<number | null>(null);
  const [arrived, setArrived] = useState<boolean>(false);
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false); // ✅ Nouveau state pour le modal de statut
  const [invoiceForm, setInvoiceForm] = useState<InvoiceFormData>({
    amount_ht: '',
    vat_rate: '20.00',
    description: ['Main d\'oeuvre'],
    payment_terms: 'Net 30'
  });
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const sheetAnim = useRef(new Animated.Value(screenHeight)).current;

  // Trouver l'intervention correspondante
  const intervention = interventions.find(int => int.id === id);

  useEffect(() => {
    
    if (Platform.OS !== 'web') {
      (async () => {
        const Maps = await import('react-native-maps');
        const Directions = await import('react-native-maps-directions');
        setMapComponents({
          MapView: Maps.default,
          Marker: Maps.Marker,
          PROVIDER_GOOGLE: Maps.PROVIDER_GOOGLE,
          MapViewDirections: Directions.default,
        });
      })();
    }
  }, []);

  useEffect(() => {
    
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') return;

      const subscription = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.High,
          distanceInterval: 10,
          timeInterval: 5000,
        },
        (location) => {
          const current = {
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
          };
          setTechnicianLocation(current);
          
          if (intervention) {
            const distance = getDistanceFromLatLonInKm(
              current.latitude,
              current.longitude,
              intervention.coordinates.latitude,
              intervention.coordinates.longitude
            );

            if (distance < 0.03 && !arrived && intervention.status === 'EN_ROUTE') {
              setArrived(true);
              handleStatusUpdate('ON_SITE');
            }
          }
        }
      );

      return () => subscription.remove();
    })();
  }, [intervention, arrived]);

  useEffect(() => {
    Animated.timing(sheetAnim, {
      toValue: 0,
      duration: 400,
      useNativeDriver: true,
    }).start();
  }, []);

  // ✅ Fonction pour mettre à jour le statut
  const handleStatusUpdate = async (newStatus: Intervention['status']) => {
    if (!intervention) return;
    
    setIsUpdatingStatus(true);
    try {
      await updateInterventionStatus(intervention.id, newStatus);
      
      if (newStatus === 'ON_SITE') {
        setArrived(true);
      }
    } catch (error) {
      Alert.alert('Erreur', 'Impossible de mettre à jour le statut');
    } finally {
      await loadInterventions();
      setIsUpdatingStatus(false);
     
    }
  };

  const handleManualArrival = () => {
    handleStatusUpdate('ON_SITE');
  };

  const handleCompleteIntervention = async () => {
   // setShowInvoiceModal(true);
   await handleStatusUpdate('COMPLETED');
   router.push('/feed');
  };

  const handleCallClient = () => {
    if (intervention?.clientPhone) {
      Linking.openURL(`tel:${intervention.clientPhone}`);
    }
  };

  const handleEmailClient = () => {
    if (intervention?.clientEmail) {
      Linking.openURL(`mailto:${intervention.clientEmail}`);
    }
  };

  const handleGetDirections = () => {
    if (intervention) {
      const url = Platform.select({
        ios: `maps:0,0?q=${intervention.coordinates.latitude},${intervention.coordinates.longitude}`,
        android: `geo:0,0?q=${intervention.coordinates.latitude},${intervention.coordinates.longitude}`,
        default: `https://www.google.com/maps/search/?api=1&query=${intervention.coordinates.latitude},${intervention.coordinates.longitude}`
      });
      Linking.openURL(url);
    }
  };

  const addDescriptionItem = () => {
    setInvoiceForm(prev => ({
      ...prev,
      description: [...prev.description, '']
    }));
  };

  const updateDescriptionItem = (index: number, value: string) => {
    setInvoiceForm(prev => ({
      ...prev,
      description: prev.description.map((item, i) => i === index ? value : item)
    }));
  };

  const removeDescriptionItem = (index: number) => {
    setInvoiceForm(prev => ({
      ...prev,
      description: prev.description.filter((_, i) => i !== index)
    }));
  };

  const calculateTTC = () => {
    const ht = parseFloat(invoiceForm.amount_ht) || 0;
    const vat = parseFloat(invoiceForm.vat_rate) || 0;
    return ht * (1 + vat / 100);
  };

  const handleCreateInvoice = async () => {
    if (!intervention) return;

    if (!invoiceForm.amount_ht || parseFloat(invoiceForm.amount_ht) <= 0) {
      Alert.alert('Erreur', 'Veuillez entrer un montant valide');
      return;
    }

    if (invoiceForm.description.filter(d => d.trim()).length === 0) {
      Alert.alert('Erreur', 'Veuillez ajouter au moins un élément de description');
      return;
    }

    try {
      // D'abord, marquer l'intervention comme terminée
      await handleStatusUpdate('COMPLETED');
      
      // Ensuite, créer la facture
      const invoiceData = {
        intervention_id: intervention.id,
        amount_ht: invoiceForm.amount_ht,
        vat_rate: invoiceForm.vat_rate,
        description: JSON.stringify(invoiceForm.description.filter(d => d.trim())),
        payment_terms: invoiceForm.payment_terms
      };

      const invoice = await createInvoice(invoiceData);
      
      if (invoice) {
        setShowInvoiceModal(false);
        router.push('/feed');
        downloadInvoice(invoice.id);
        Alert.alert(
          'Facture créée',
          'La facture a été créée avec succès. Souhaitez-vous la télécharger ?',
          [
            { text: 'Plus tard', style: 'cancel' },
            { 
              text: 'Télécharger', 
              onPress: () => downloadInvoice(invoice.id)
            }
          ]
        );
        
        // Retourner à la liste des interventions
        router.back();
      }
    } catch (error) {
      Alert.alert('Erreur', 'Impossible de créer la facture');
    }
  };

  function getDistanceFromLatLonInKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371;
    const dLat = deg2rad(lat2 - lat1);
    const dLon = deg2rad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  function deg2rad(deg: number): number {
    return deg * (Math.PI / 180);
  }

  if (!intervention) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <HeaderBar title="Intervention introuvable" showBack />
        <View style={styles.errorContainer}>
          <Text style={[styles.errorText, { color: colors.error }]}>Cette intervention n'existe pas.</Text>
          <TouchableOpacity 
            style={[styles.backButton, { backgroundColor: colors.primary }]}
            onPress={() => router.back()}
          >
            <Text style={[styles.backButtonText, { color: colors.buttonText }]}>Retour</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const renderMap = () => {
    if (Platform.OS === 'web') {
      return (
        <View style={[styles.webMapPlaceholder, { backgroundColor: colors.border }]}>
          <Text style={[styles.webMapText, { color: colors.textLight }]}>🗺️ Carte non disponible sur le web</Text>
          <Text style={[styles.webMapAddress, { color: colors.text }]}>{intervention.addressDetails.label}</Text>
        </View>
      );
    }

    if (!MapComponents || !technicianLocation) {
      return (
        <View style={[styles.loadingContainer, { backgroundColor: colors.border }]}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.textLight }]}>Chargement de la carte...</Text>
        </View>
      );
    }

    const { MapView, Marker, PROVIDER_GOOGLE, MapViewDirections } = MapComponents;

    return (
      <MapView
        style={styles.map}
        provider={PROVIDER_GOOGLE}
        showsUserLocation
        followsUserLocation
        initialRegion={{
          latitude: technicianLocation.latitude,
          longitude: technicianLocation.longitude,
          latitudeDelta: 0.05,
          longitudeDelta: 0.05,
        }}
      >
        <Marker coordinate={technicianLocation} title="Technicien" pinColor="black" />
        <Marker coordinate={intervention.coordinates} title="Client" pinColor="yellow" />

        <MapViewDirections
          origin={technicianLocation}
          destination={intervention.coordinates}
          apikey="TA_CLE_GOOGLE_MAPS"
          strokeWidth={4}
          strokeColor={colors.primary}
          onReady={(result: any) => {
            setEta(result.duration);
          }}
        />
      </MapView>
    );
  };

  const renderProgress = () => {
    const steps = [
      { key: 'ACCEPTED', label: '📍 Acceptée', active: ['ACCEPTED', 'ASSIGNED', 'EN_ROUTE', 'ON_SITE', 'DONE', 'COMPLETED'].includes(intervention.status) },
      { key: 'EN_ROUTE', label: '🚗 En route', active: ['EN_ROUTE', 'ON_SITE', 'DONE', 'COMPLETED'].includes(intervention.status) },
      { key: 'ON_SITE', label: '🏠 Sur place', active: ['ON_SITE', 'DONE', 'COMPLETED'].includes(intervention.status) },
      { key: 'COMPLETED', label: '✅ Terminée', active: ['DONE', 'COMPLETED'].includes(intervention.status) },
    ];

    return (
      <View style={[styles.progressContainer, { backgroundColor: colors.border }]}>
        {steps.map((step, index) => (
          <React.Fragment key={step.key}>
            <Text style={[
              styles.step,
              { color: step.active ? colors.primary : colors.textLight },
              step.active && styles.stepActive
            ]}>
              {step.label}
            </Text>
            {index < steps.length - 1 && (
              <Text style={[styles.separator, { color: colors.textLight }]}>➡️</Text>
            )}
          </React.Fragment>
        ))}
      </View>
    );
  };

  const InvoiceModal = () => (
    <Modal
      visible={showInvoiceModal}
      transparent
      animationType="slide"
      onRequestClose={() => setShowInvoiceModal(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
          <ScrollView showsVerticalScrollIndicator={false}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>{t.createInvoice}</Text>
              <TouchableOpacity onPress={() => setShowInvoiceModal(false)}>
                <X size={24} color={colors.textLight} />
              </TouchableOpacity>
            </View>

            <View style={styles.invoiceForm}>
              <View style={styles.formGroup}>
                <Text style={[styles.formLabel, { color: colors.text }]}>{t.amountHT}</Text>
                <TextInput
                  style={[styles.formInput, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border }]}
                  value={invoiceForm.amount_ht}
                  onChangeText={(text) => setInvoiceForm(prev => ({ ...prev, amount_ht: text }))}
                  placeholder="100.00"
                  placeholderTextColor={colors.textLight}
                  keyboardType="numeric"
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={[styles.formLabel, { color: colors.text }]}>{t.vatRate}</Text>
                <TextInput
                  style={[styles.formInput, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border }]}
                  value={invoiceForm.vat_rate}
                  onChangeText={(text) => setInvoiceForm(prev => ({ ...prev, vat_rate: text }))}
                  placeholder="20.00"
                  placeholderTextColor={colors.textLight}
                  keyboardType="numeric"
                />
              </View>

              <View style={styles.formGroup}>
                <View style={styles.descriptionHeader}>
                  <Text style={[styles.formLabel, { color: colors.text }]}>{t.invoiceDescription}</Text>
                  <TouchableOpacity onPress={addDescriptionItem} style={[styles.addButton, { backgroundColor: colors.primary }]}>
                    <Plus size={16} color={colors.buttonText} />
                  </TouchableOpacity>
                </View>
                {invoiceForm.description.map((item, index) => (
                  <View key={index} style={styles.descriptionItem}>
                    <TextInput
                      style={[styles.formInput, { flex: 1, backgroundColor: colors.background, color: colors.text, borderColor: colors.border }]}
                      value={item}
                      onChangeText={(text) => updateDescriptionItem(index, text)}
                      placeholder={`Élément ${index + 1}`}
                      placeholderTextColor={colors.textLight}
                    />
                    {invoiceForm.description.length > 1 && (
                      <TouchableOpacity onPress={() => removeDescriptionItem(index)} style={styles.removeButton}>
                        <X size={16} color={colors.error} />
                      </TouchableOpacity>
                    )}
                  </View>
                ))}
              </View>

              <View style={styles.formGroup}>
                <Text style={[styles.formLabel, { color: colors.text }]}>{t.paymentTerms}</Text>
                <TextInput
                  style={[styles.formInput, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border }]}
                  value={invoiceForm.payment_terms}
                  onChangeText={(text) => setInvoiceForm(prev => ({ ...prev, payment_terms: text }))}
                  placeholder="Net 30"
                  placeholderTextColor={colors.textLight}
                />
              </View>

              <View style={[styles.summaryContainer, { backgroundColor: colors.background }]}>
                <View style={styles.summaryRow}>
                  <Text style={[styles.summaryLabel, { color: colors.text }]}>Montant HT:</Text>
                  <Text style={[styles.summaryValue, { color: colors.text }]}>{invoiceForm.amount_ht || '0.00'}€</Text>
                </View>
                <View style={styles.summaryRow}>
                  <Text style={[styles.summaryLabel, { color: colors.text }]}>TVA ({invoiceForm.vat_rate}%):</Text>
                  <Text style={[styles.summaryValue, { color: colors.text }]}>
                    {((parseFloat(invoiceForm.amount_ht) || 0) * (parseFloat(invoiceForm.vat_rate) || 0) / 100).toFixed(2)}€
                  </Text>
                </View>
                <View style={[styles.summaryRow, styles.summaryTotal]}>
                  <Text style={[styles.summaryLabel, styles.summaryTotalText, { color: colors.text }]}>Montant TTC:</Text>
                  <Text style={[styles.summaryValue, styles.summaryTotalText, { color: colors.primary }]}>
                    {calculateTTC().toFixed(2)}€
                  </Text>
                </View>
              </View>

              <TouchableOpacity
                style={[styles.createInvoiceButton, { backgroundColor: colors.primary }]}
                onPress={handleCreateInvoice}
                disabled={invoiceLoading}
              >
                {invoiceLoading ? (
                  <ActivityIndicator color={colors.buttonText} />
                ) : (
                  <>
                    <FileText size={20} color={colors.buttonText} />
                    <Text style={[styles.createInvoiceButtonText, { color: colors.buttonText }]}>
                      {t.createAndDownload}
                    </Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );

  const dynamicStyles = StyleSheet.create({
    bottomSheet: {
      flex: 1,
      backgroundColor: colors.card,
      borderTopLeftRadius: 20,
      borderTopRightRadius: 20,
      padding: 20,
      elevation: 10,
      shadowColor: colors.shadow,
      shadowOffset: { width: 0, height: -2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
    },
    sheetHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      marginBottom: 20,
    },
    headerLeft: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      flex: 1,
      gap: 12,
    },
    specialtyIcon: {
      width: 48,
      height: 48,
      borderRadius: 12,
      backgroundColor: colors.primary + '20',
      justifyContent: 'center',
      alignItems: 'center',
    },
    headerInfo: {
      flex: 1,
    },
    numberRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 4,
      gap: 4,
    },
    interventionNumber: {
      fontSize: 12,
      color: colors.textLight,
      fontWeight: '500',
    },
    specialtyLabel: {
      fontSize: 14,
      color: colors.textLight,
      marginBottom: 4,
    },
    sheetTitle: { 
      fontSize: 20, 
      fontWeight: 'bold', 
      color: colors.text,
    },
    urgentBadge: {
      backgroundColor: colors.error,
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 12,
      alignSelf: 'flex-start',
    },
    urgentText: {
      color: '#fff',
      fontSize: 10,
      fontWeight: 'bold',
    },
    infoSection: {
      marginBottom: 20,
    },
    infoRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 12,
    },
    infoText: { 
      fontSize: 16, 
      color: colors.text, 
      marginLeft: 12,
      flex: 1,
    },
    descriptionSection: {
      marginBottom: 20,
    },
    descriptionTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: colors.text,
      marginBottom: 8,
    },
    descriptionText: {
      fontSize: 16,
      color: colors.textLight,
      lineHeight: 24,
    },
    etaText: { 
      fontSize: 16, 
      fontWeight: '600', 
      color: colors.primary, 
      textAlign: 'center',
      marginBottom: 20,
    },
    buttonContainer: {
      flexDirection: 'row',
      gap: 12,
      marginBottom: 16,
    },
    directionsButton: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: '#007AFF',
      paddingVertical: 14,
      borderRadius: 12,
      gap: 8,
    },
    directionsButtonText: {
      color: '#fff',
      fontSize: 16,
      fontWeight: 'bold',
    },
    callButton: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: '#34C759',
      paddingVertical: 14,
      borderRadius: 12,
      gap: 8,
    },
    callButtonText: { 
      fontWeight: 'bold', 
      fontSize: 16, 
      color: '#fff' 
    },
    emailButton: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: '#FF9500',
      paddingVertical: 14,
      borderRadius: 12,
      gap: 8,
    },
    emailButtonText: { 
      fontWeight: 'bold', 
      fontSize: 16, 
      color: '#fff' 
    },
    // ✅ Nouveau bouton pour changer le statut
    statusButton: {
      backgroundColor: colors.info,
      paddingVertical: 16,
      borderRadius: 12,
      alignItems: 'center',
      marginBottom: 16,
      flexDirection: 'row',
      justifyContent: 'center',
      gap: 8,
    },
    statusButtonText: { 
      fontWeight: 'bold', 
      fontSize: 16, 
      color: '#fff'
    },
    arrivalButton: {
      backgroundColor: colors.primary,
      paddingVertical: 16,
      borderRadius: 12,
      alignItems: 'center',
      marginBottom: 16,
    },
    arrivalButtonText: { 
      fontWeight: 'bold', 
      fontSize: 16, 
      color: colors.buttonText
    },
    completeButton: {
      backgroundColor: colors.primary,
      paddingVertical: 16,
      borderRadius: 12,
      alignItems: 'center',
      marginBottom: 16,
      flexDirection: 'row',
      justifyContent: 'center',
      gap: 8,
    },
    completeButtonText: { 
      fontWeight: 'bold', 
      fontSize: 16, 
      color: '#fff'
    },
    arrivedStatus: {
      backgroundColor: colors.success + '20',
      padding: 16,
      borderRadius: 12,
      alignItems: 'center',
      borderWidth: 1,
      borderColor: colors.success,
    },
    arrivedStatusText: { 
      fontSize: 16, 
      color: colors.success, 
      fontWeight: 'bold' 
    },
  });

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <HeaderBar title="Détails de l'intervention" showBack />
      
      {renderMap()}

      <Animated.View style={[dynamicStyles.bottomSheet, { transform: [{ translateY: sheetAnim }] }]}>
        <ScrollView showsVerticalScrollIndicator={false}>
          <View style={dynamicStyles.sheetHeader}>
            <View style={dynamicStyles.headerLeft}>
              {/* ✅ Icône de spécialité */}
              <View style={dynamicStyles.specialtyIcon}>
                <Wrench size={20} color={colors.primary} />
              </View>
              
              <View style={dynamicStyles.headerInfo}>
                {/* ✅ Numéro d'intervention */}
                <View style={dynamicStyles.numberRow}>
                  <Hash size={12} color={colors.textLight} />
                  <Text style={dynamicStyles.interventionNumber}>
                    {intervention.number}
                  </Text>
                </View>
                
                {/* ✅ Spécialité */}
                <Text style={dynamicStyles.specialtyLabel}>
                  {intervention.specialtyLabel}
                </Text>
                
                {/* ✅ Titre principal */}
                <Text style={dynamicStyles.sheetTitle}>
                  {intervention.description}
                </Text>
              </View>
            </View>
            
            {/* ✅ Badge urgent */}
            {intervention.isUrgent && (
              <View style={dynamicStyles.urgentBadge}>
                <Text style={dynamicStyles.urgentText}>URGENT</Text>
              </View>
            )}
          </View>

          <View style={dynamicStyles.infoSection}>
            {/* ✅ Nom du client */}
            <View style={dynamicStyles.infoRow}>
              <User size={20} color={colors.primary} />
              <Text style={dynamicStyles.infoText}>{intervention.clientName}</Text>
            </View>
            
            {/* ✅ Téléphone du client */}
            <View style={dynamicStyles.infoRow}>
              <Phone size={20} color={colors.primary} />
              <Text style={dynamicStyles.infoText}>{intervention.clientPhone}</Text>
            </View>

            {/* ✅ Email du client */}
            <View style={dynamicStyles.infoRow}>
              <Mail size={20} color={colors.primary} />
              <Text style={dynamicStyles.infoText}>{intervention.clientEmail}</Text>
            </View>
            
            {/* ✅ Adresse complète */}
            <View style={dynamicStyles.infoRow}>
              <MapPin size={20} color={colors.primary} />
              <Text style={dynamicStyles.infoText}>{intervention.addressDetails.label}</Text>
            </View>

            {/* ✅ Heure planifiée */}
            {intervention.scheduledTime && (
              <View style={dynamicStyles.infoRow}>
                <Clock size={20} color={colors.primary} />
                <Text style={dynamicStyles.infoText}>{intervention.scheduledTime}</Text>
              </View>
            )}
          </View>

          <View style={dynamicStyles.descriptionSection}>
            <Text style={dynamicStyles.descriptionTitle}>Description</Text>
            <Text style={dynamicStyles.descriptionText}>{intervention.description}</Text>
          </View>

          {renderProgress()}

          {eta && (
            <Text style={dynamicStyles.etaText}>🕒 Temps estimé : {Math.round(eta)} min</Text>
          )}

          <View style={dynamicStyles.buttonContainer}>
            <TouchableOpacity style={dynamicStyles.directionsButton} onPress={handleGetDirections}>
              <Navigation size={20} color="#fff" />
              <Text style={dynamicStyles.directionsButtonText}>Itinéraire</Text>
            </TouchableOpacity>

            <TouchableOpacity style={dynamicStyles.callButton} onPress={handleCallClient}>
              <Phone size={20} color="#fff" />
              <Text style={dynamicStyles.callButtonText}>Appeler</Text>
            </TouchableOpacity>

            <TouchableOpacity style={dynamicStyles.emailButton} onPress={handleEmailClient}>
              <Mail size={20} color="#fff" />
              <Text style={dynamicStyles.emailButtonText}>Email</Text>
            </TouchableOpacity>
          </View>

          {/* ✅ NOUVEAU BOUTON: Changer le statut */}
          {intervention.status !== 'ON_SITE' && (
          <TouchableOpacity 
            style={dynamicStyles.statusButton} 
            onPress={() => setShowStatusModal(true)}
            disabled={isUpdatingStatus}
          >
           
            {isUpdatingStatus ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Settings size={20} color="#fff" />
                <Text style={dynamicStyles.statusButtonText}>Changer le statut</Text>
              </>
            )}
          </TouchableOpacity>
          )}

          {intervention.status === 'EN_ROUTE' && !arrived && (
            <TouchableOpacity 
              style={dynamicStyles.arrivalButton} 
              onPress={handleManualArrival}
              disabled={isUpdatingStatus}
            >
              {isUpdatingStatus ? (
                <ActivityIndicator color={colors.buttonText} />
              ) : (
                <Text style={dynamicStyles.arrivalButtonText}>{t.iHaveArrived}</Text>
              )}
            </TouchableOpacity>
          )}

          {intervention.status === 'ON_SITE' && (
            <TouchableOpacity 
              style={dynamicStyles.completeButton} 
              onPress={handleCompleteIntervention}
              disabled={isUpdatingStatus}
            >
              {isUpdatingStatus ? (
                <ActivityIndicator color={colors.buttonText} />
              ) : (
                <>
                  <FileText size={20} color="#000" />
                  {/*<Text style={dynamicStyles.arrivalButtonText}>{t.completeAndCreateInvoice}</Text>*/}
                  <Text style={dynamicStyles.arrivalButtonText}>{t.completed}</Text>
                </>
              )}
            </TouchableOpacity>
          )}

         {/* {(intervention.status === 'ON_SITE' || intervention.status === 'DONE' || intervention.status === 'COMPLETED') && (
            <View style={dynamicStyles.arrivedStatus}>
              <Text style={dynamicStyles.arrivedStatusText}>✅ Technicien sur place</Text>
            </View>
          )} */}
        </ScrollView>
      </Animated.View>

      <InvoiceModal />
      
      {/* ✅ NOUVEAU MODAL: Changement de statut */}
      <StatusUpdateModal
        visible={showStatusModal}
        intervention={intervention}
        onClose={() => setShowStatusModal(false)}
        onUpdateStatus={handleStatusUpdate}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1,
  },
  map: { 
    height: screenHeight * 0.4 
  },
  progressContainer: {
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'center',
    marginVertical: 20,
    padding: 16,
    borderRadius: 12,
    flexWrap: 'wrap',
  },
  step: { 
    fontSize: 14, 
    fontWeight: '500',
    textAlign: 'center',
  },
  stepActive: { 
    fontWeight: 'bold' 
  },
  separator: { 
    marginHorizontal: 8, 
    fontSize: 14 
  },
  loadingContainer: { 
    height: screenHeight * 0.4, 
    justifyContent: 'center', 
    alignItems: 'center',
  },
  loadingText: { 
    marginTop: 12,
    fontSize: 16,
  },
  webMapPlaceholder: {
    height: screenHeight * 0.4, 
    justifyContent: 'center',
    alignItems: 'center', 
    padding: 20,
  },
  webMapText: { 
    fontSize: 18, 
    fontWeight: '600', 
    marginBottom: 12, 
  },
  webMapAddress: { 
    fontSize: 16, 
    textAlign: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 18,
    marginBottom: 20,
    textAlign: 'center',
  },
  backButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  backButtonText: {
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
    borderRadius: 16,
    padding: 20,
    width: '100%',
    maxWidth: 400,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  invoiceForm: {
    gap: 16,
  },
  formGroup: {
    gap: 8,
  },
  formLabel: {
    fontSize: 16,
    fontWeight: '600',
  },
  formInput: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  descriptionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  addButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  descriptionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  removeButton: {
    padding: 8,
  },
  summaryContainer: {
    padding: 16,
    borderRadius: 12,
    marginTop: 8,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  summaryLabel: {
    fontSize: 14,
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: '600',
  },
  summaryTotal: {
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
    paddingTop: 8,
    marginTop: 8,
  },
  summaryTotalText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  createInvoiceButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
    marginTop: 16,
  },
  createInvoiceButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
});