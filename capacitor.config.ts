import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'tech.compliai.app',
  appName: 'CompliAI',
  webDir: 'public',
  server: {
    url: 'https://compliai.tech/mobile', // Point directly to mobile app
    allowNavigation: ['compliai.tech', '*.compliai.tech'],
    cleartext: true
  }
};

export default config;
