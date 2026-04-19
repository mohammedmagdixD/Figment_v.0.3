import { registerSW } from 'virtual:pwa-register';

export const updateSW = registerSW({
  onNeedRefresh() {
    console.log('App update ready');
  },
  onOfflineReady() {
    console.log('App is completely cached for offline use');
  },
});
