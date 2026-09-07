import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.venapictures.app',
  appName: 'weddfin',
  webDir: 'dist',
  server: {
    url: 'https://keuanganvendor.netlify.app',
    cleartext: false
  }
};

export default config;
