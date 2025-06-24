import * as Location from 'expo-location';
import * as TaskManager from 'expo-task-manager';
import { Platform } from 'react-native';
import { GEOFENCE_TASK } from '../tasks/geofenceTask';

const ZONES = [
  {
    identifier: 'Zone 1 - Champs Elysées',
    latitude: 48.8698,
    longitude: 2.3076,
    radius: 150,
  },
  {
    identifier: 'Zone 2 - Gare de Lyon',
    latitude: 48.8443,
    longitude: 2.3744,
    radius: 150,
  },
];

export async function setupGeofencing() {
  if (Platform.OS === 'web') return;

  const { status } = await Location.requestForegroundPermissionsAsync();
  if (status !== 'granted') {
    console.warn('Permission de localisation non accordée');
    return;
  }

  const { status: bgStatus } = await Location.requestBackgroundPermissionsAsync();
  if (bgStatus !== 'granted') {
    console.warn('Permission de localisation en arrière-plan non accordée');
    return;
  }

  await Location.startGeofencingAsync(GEOFENCE_TASK, ZONES);
  console.log('⛳️ Surveillance des zones géographiques activée');
}

export async function isGeofencingActive(): Promise<boolean> {
  if (Platform.OS === 'web') return false;
  
  try {
    const tasks = await TaskManager.getRegisteredTasksAsync();
    return tasks.some(task => task.taskName === GEOFENCE_TASK);
  } catch (error) {
    console.error('Error checking geofencing status:', error);
    return false;
  }
}

export async function toggleGeofencing(): Promise<boolean> {
  if (Platform.OS === 'web') return false;

  try {
    const active = await isGeofencingActive();
    if (active) {
      await Location.stopGeofencingAsync(GEOFENCE_TASK);
      return false;
    } else {
      await setupGeofencing();
      return true;
    }
  } catch (error) {
    console.error('Error toggling geofencing:', error);
    return false;
  }
}