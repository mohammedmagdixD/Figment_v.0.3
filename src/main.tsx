import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import './pwa.ts';
import { ThemeProvider } from './components/ThemeProvider.tsx';
import { AuthProvider } from './contexts/AuthContext.tsx';
import { PWAGatekeeper } from './components/PWAGatekeeper.tsx';
import { SWRConfig } from 'swr';
import { swrLocalStorageProvider } from './utils/swrCache.ts';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AuthProvider>
      <ThemeProvider defaultTheme="system" storageKey="shelve-theme">
        <PWAGatekeeper>
          <SWRConfig 
            value={{
              provider: swrLocalStorageProvider,
              revalidateOnFocus: false, // Stop network jitter on tab switch
              dedupingInterval: 60000, // 1 minute deduplication cache
              fetcher: (resource, init) => fetch(resource, init).then(res => res.json())
            }}
          >
            <App />
          </SWRConfig>
        </PWAGatekeeper>
      </ThemeProvider>
    </AuthProvider>
  </StrictMode>,
);
