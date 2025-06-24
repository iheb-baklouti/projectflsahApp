import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Camera, CameraType } from 'expo-camera';
import { manipulateAsync } from 'expo-image-manipulator';
import * as FileSystem from 'expo-file-system';
import { useLanguage } from '@/hooks/useLanguage';
import { translations } from '@/constants/Translations';

export const PhotoCapture = () => {
  const { language } = useLanguage();
  const t = translations[language];
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [type, setType] = useState<CameraType>(Camera.Constants.Type.back);
  const [loading, setLoading] = useState(false);
  const cameraRef = useRef<Camera | null>(null);

  useEffect(() => {
    (async () => {
      const { status } = await Camera.requestCameraPermissionsAsync();
      setHasPermission(status === 'granted');
    })();
  }, []);

  const takePicture = async () => {
    try {
      if (cameraRef.current) {
        setLoading(true);
        const photo = await cameraRef.current.takePictureAsync({ quality: 0.7 });
        const optimizedPhoto = await manipulateAsync(
          photo.uri,
          [{ resize: { width: 1024 } }],
          { compress: 0.7, format: 'jpeg' }
        );

        const fileName = `receipt_${Date.now()}.jpg`;
        const directory = `${FileSystem.documentDirectory}receipts/`;
        await FileSystem.makeDirectoryAsync(directory, { intermediates: true });
        await FileSystem.copyAsync({
          from: optimizedPhoto.uri,
          to: `${directory}${fileName}`,
        });

        // Exécute une fonction OCR ici si besoin
        // await processOCR(optimizedPhoto.uri);

        setLoading(false);
      }
    } catch (error) {
      console.error('Erreur lors de la capture ou sauvegarde :', error);
      setLoading(false);
    }
  };

  if (hasPermission === null) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (hasPermission === false) {
    return (
      <View style={styles.center}>
        <Text>{t?.noCameraPermission || 'Permission caméra refusée.'}</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Camera style={styles.camera} type={type} ref={(ref) => (cameraRef.current = ref)}>
        <View style={styles.buttonContainer}>
          <TouchableOpacity style={styles.captureButton} onPress={takePicture} disabled={loading}>
            <View style={styles.captureButtonInner} />
          </TouchableOpacity>
        </View>
      </Camera>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  camera: {
    flex: 1,
  },
  buttonContainer: {
    flex: 1,
    backgroundColor: 'transparent',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'absolute',
    bottom: 30,
    width: '100%',
  },
  captureButton: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  captureButtonInner: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#fff',
  },
});
