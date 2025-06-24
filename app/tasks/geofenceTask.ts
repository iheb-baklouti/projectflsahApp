import * as TaskManager from 'expo-task-manager';
import * as Notifications from 'expo-notifications';
import * as Location from 'expo-location';

export const GEOFENCE_TASK = 'GEOFENCE_TASK';

export default function GeofenceTask() {
  return null; // This is a task definition, not a React component
}

TaskManager.defineTask(GEOFENCE_TASK, ({ data: { eventType, region }, error }) => {
  if (error) {
    console.error(error);
    return;
  }

  if (eventType === Location.GeofencingEventType.Enter) {
    Notifications.scheduleNotificationAsync({
      content: {
        title: '📍 Nouvelle intervention disponible',
        body: `Tu viens d'entrer dans la zone : ${region.identifier}`,
        data: { zone: region.identifier }
      },
      trigger: null
    });
  }
});