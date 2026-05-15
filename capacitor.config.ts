import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'dev.simonprell.fffunk',
  appName: 'FFFunk',
  webDir: 'dist',
  server: {
    androidScheme: 'https',
  },
};

export default config;
