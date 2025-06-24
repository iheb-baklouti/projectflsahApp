import React, { useEffect, useRef, useState } from 'react';
import {
  View, Text, StyleSheet, Platform, ActivityIndicator, TouchableOpacity,
  Dimensions, Linking, Animated, ScrollView
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { HeaderBar } from '@/components/ui/HeaderBar';
import { useInterventions } from '@/hooks/useInterventions';
import { MapPin, Phone, Clock, User, ArrowLeft, Navigation } from 'lucide-react-native';
import { COLORS } from '@/constants/Colors';
import * as Location from 'expo-location';

const screenHeight = Dimensions.get('window').height;

export default function InterventionDetails() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { interventions } = useInterventions();
  const [MapComponents, setMapComponents] = useState<null | {
    MapView: any;
    Marker: any;
    PROVIDER_GOOGLE: any;
    MapViewDirections: any;
  }>(null);

  const [technicianLocation, setTechnicianLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [eta, setEta] = useState<number | null>(null);
  const [arrived, setArrived] = useState<boolean>(false);
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

            if (distance < 0.03 && !arrived) {
              setArrived(true);
              console.log("✅ Changement automatique à ON_SITE");
            }
          }
        }
      );

      return () => subscription.remove();
    })();
  }, [intervention]);

  useEffect(() => {
    Animated.timing(sheetAnim, {
      toValue: 0,
      duration: 400,
      useNativeDriver: true,
    }).start();
  }, []);

  const handleManualArrival = () => {
    setArrived(true);
    console.log("🔘 Technicien a cliqué sur 'Je suis arrivé'");
  };

  const handleCallClient = () => {
    if (intervention?.clientPhone) {
      Linking.openURL(`tel:${intervention.clientPhone}`);
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
      <SafeAreaView style={styles.container}>
        <HeaderBar title="Intervention introuvable" showBack />
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Cette intervention n'existe pas.</Text>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Text style={styles.backButtonText}>Retour</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const renderMap = () => {
    if (Platform.OS === 'web') {
      return (
        <View style={styles.webMapPlaceholder}>
          <Text style={styles.webMapText}>🗺️ Carte non disponible sur le web</Text>
          <Text style={styles.webMapAddress}>{intervention.address}</Text>
        </View>
      );
    }

    if (!MapComponents || !technicianLocation) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Chargement de la carte...</Text>
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
          apikey="TA_CLE_GOOGLE_MAPS" // Remplace par ta vraie clé
          strokeWidth={4}
          strokeColor={COLORS.primary}
          onReady={(result: any) => {
            setEta(result.duration);
          }}
        />
      </MapView>
    );
  };

  const renderProgress = () => {
    return (
      <View style={styles.progressContainer}>
        <Text style={styles.step}>📍 En route</Text>
        <Text style={styles.separator}>➡️</Text>
        <Text style={[styles.step, arrived && styles.stepActive]}>🏠 Sur place</Text>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <HeaderBar title="Détails de l'intervention" showBack />
      
      {renderMap()}

      <Animated.View style={[styles.bottomSheet, { transform: [{ translateY: sheetAnim }] }]}>
        <ScrollView showsVerticalScrollIndicator={false}>
          <View style={styles.sheetHeader}>
            <Text style={styles.sheetTitle}>{intervention.serviceType}</Text>
            {intervention.isUrgent && (
              <View style={styles.urgentBadge}>
                <Text style={styles.urgentText}>URGENT</Text>
              </View>
            )}
          </View>

          <View style={styles.infoSection}>
            <View style={styles.infoRow}>
              <User size={20} color={COLORS.primary} />
              <Text style={styles.infoText}>{intervention.clientName}</Text>
            </View>
            
            <View style={styles.infoRow}>
              <MapPin size={20} color={COLORS.primary} />
              <Text style={styles.infoText}>{intervention.address}</Text>
            </View>

            <View style={styles.infoRow}>
              <Phone size={20} color={COLORS.primary} />
              <Text style={styles.infoText}>{intervention.clientPhone}</Text>
            </View>

            {intervention.scheduledTime && (
              <View style={styles.infoRow}>
                <Clock size={20} color={COLORS.primary} />
                <Text style={styles.infoText}>{intervention.scheduledTime}</Text>
              </View>
            )}
          </View>

          <View style={styles.descriptionSection}>
            <Text style={styles.descriptionTitle}>Description</Text>
            <Text style={styles.descriptionText}>{intervention.description}</Text>
          </View>

          {renderProgress()}

          {eta && (
            <Text style={styles.etaText}>🕒 Temps estimé : {Math.round(eta)} min</Text>
          )}

          <View style={styles.buttonContainer}>
            <TouchableOpacity style={styles.directionsButton} onPress={handleGetDirections}>
              <Navigation size={20} color="#fff" />
              <Text style={styles.directionsButtonText}>Itinéraire</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.callButton} onPress={handleCallClient}>
              <Phone size={20} color="#fff" />
              <Text style={styles.callButtonText}>Appeler</Text>
            </TouchableOpacity>
          </View>

          {!arrived && (
            <TouchableOpacity style={styles.arrivalButton} onPress={handleManualArrival}>
              <Text style={styles.arrivalButtonText}>Je suis arrivé</Text>
            </TouchableOpacity>
          )}

          {arrived && (
            <View style={styles.arrivedStatus}>
              <Text style={styles.arrivedStatusText}>✅ Technicien sur place</Text>
            </View>
          )}
        </ScrollView>
      </Animated.View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1,
    backgroundColor: '#F6F6F6',
  },
  map: { 
    height: screenHeight * 0.4 
  },
  bottomSheet: {
    flex: 1,
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  sheetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  sheetTitle: { 
    fontSize: 22, 
    fontWeight: 'bold', 
    color: '#000',
    flex: 1,
  },
  urgentBadge: {
    backgroundColor: '#FF3B30',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  urgentText: {
    color: '#fff',
    fontSize: 12,
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
    color: '#333', 
    marginLeft: 12,
    flex: 1,
  },
  descriptionSection: {
    marginBottom: 20,
  },
  descriptionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  descriptionText: {
    fontSize: 16,
    color: '#666',
    lineHeight: 24,
  },
  progressContainer: {
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'center',
    marginVertical: 20,
    padding: 16,
    backgroundColor: '#f8f8f8',
    borderRadius: 12,
  },
  step: { 
    fontSize: 16, 
    color: '#999',
    fontWeight: '500',
  },
  stepActive: { 
    color: COLORS.primary, 
    fontWeight: 'bold' 
  },
  separator: { 
    marginHorizontal: 12, 
    fontSize: 16 
  },
  etaText: { 
    fontSize: 16, 
    fontWeight: '600', 
    color: COLORS.primary, 
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
  arrivalButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 16,
  },
  arrivalButtonText: { 
    fontWeight: 'bold', 
    fontSize: 16, 
    color: '#000' 
  },
  arrivedStatus: {
    backgroundColor: '#E8F5E8',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#34C759',
  },
  arrivedStatusText: { 
    fontSize: 16, 
    color: '#34C759', 
    fontWeight: 'bold' 
  },
  loadingContainer: { 
    height: screenHeight * 0.4, 
    justifyContent: 'center', 
    alignItems: 'center',
    backgroundColor: '#f8f8f8',
  },
  loadingText: { 
    color: '#666', 
    marginTop: 12,
    fontSize: 16,
  },
  webMapPlaceholder: {
    height: screenHeight * 0.4, 
    backgroundColor: '#f0f0f0', 
    justifyContent: 'center',
    alignItems: 'center', 
    padding: 20,
  },
  webMapText: { 
    fontSize: 18, 
    fontWeight: '600', 
    marginBottom: 12, 
    color: '#666' 
  },
  webMapAddress: { 
    fontSize: 16, 
    color: '#333',
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
    color: '#666',
    marginBottom: 20,
    textAlign: 'center',
  },
  backButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  backButtonText: {
    color: '#000',
    fontSize: 16,
    fontWeight: 'bold',
  },
});