import type { CapacitorConfig } from '@capacitor/cli'

const config: CapacitorConfig = {
  appId: 'com.sustansyabox.app',
  appName: 'SustansyaBox',
  webDir: 'dist',
  server: {
    url: 'http://192.168.254.119:5173/SustansyaBox/frontend/',
    cleartext: true,
  },
}

export default config