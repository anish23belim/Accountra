import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.accountra.app',
  appName: 'Accountra',
  webDir: 'public',
  server: {
    url: 'https://accountra-6ymb-five.vercel.app',
    cleartext: true
  }
};

export default config;
