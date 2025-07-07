const { withAndroidManifest } = require('@expo/config-plugins');

function withAndroidManifestFix(config) {
  return withAndroidManifest(config, async config => {
    const androidManifest = config.modResults;
    
    // Trouver l'élément application
    const application = androidManifest.manifest.application[0];
    
    if (application && application['meta-data']) {
      // Chercher et modifier les meta-data Firebase
      application['meta-data'].forEach(metaData => {
        if (metaData.$['android:name'] === 'com.google.firebase.messaging.default_notification_color') {
          // Ajouter l'attribut tools:replace
          metaData.$['tools:replace'] = 'android:resource';
          // S'assurer que la valeur est correcte
          metaData.$['android:resource'] = '@color/notification_icon_color';
        }
        
        if (metaData.$['android:name'] === 'com.google.firebase.messaging.default_notification_icon') {
          // Ajouter l'attribut tools:replace pour l'icône aussi
          metaData.$['tools:replace'] = 'android:resource';
        }
      });
    }
    
    // S'assurer que le namespace tools est déclaré
    if (!androidManifest.manifest.$['xmlns:tools']) {
      androidManifest.manifest.$['xmlns:tools'] = 'http://schemas.android.com/tools';
    }
    
    return config;
  });
}

module.exports = withAndroidManifestFix;