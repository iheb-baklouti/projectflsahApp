import { ConfigPlugin, withAndroidManifest } from '@expo/config-plugins';

const withOverrideNotificationColor: ConfigPlugin = (config) => {
  return withAndroidManifest(config, (modConfig) => {
    const application = modConfig.modResults.manifest.application?.[0];

    if (!application) return modConfig;

    if (!application['meta-data']) {
      application['meta-data'] = [];
    }

    const existingMeta = application['meta-data'].find(
      (meta) =>
        meta.$['android:name'] === 'com.google.firebase.messaging.default_notification_color'
    );

    if (existingMeta) {
      existingMeta.$['android:resource'] = '@color/notification_icon_color';
      existingMeta.$['tools:replace'] = 'android:resource';
    } else {
      application['meta-data'].push({
        $: {
          'android:name': 'com.google.firebase.messaging.default_notification_color',
          'android:resource': '@color/notification_icon_color',
          'tools:replace': 'android:resource'
        }
      });
    }

    // Ajoute xmlns:tools si manquant
    if (!application.$['xmlns:tools']) {
      application.$['xmlns:tools'] = 'http://schemas.android.com/tools';
    }

    return modConfig;
  });
};

export default withOverrideNotificationColor;
