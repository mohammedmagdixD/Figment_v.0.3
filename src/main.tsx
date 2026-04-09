import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { ThemeProvider } from './components/ThemeProvider.tsx';
import { AuthProvider } from './contexts/AuthContext.tsx';
import { PWAGatekeeper } from './components/PWAGatekeeper.tsx';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AuthProvider>
      <ThemeProvider defaultTheme="dark" storageKey="shelve-theme">
        <PWAGatekeeper>
          <App />
        </PWAGatekeeper>
      </ThemeProvider>
    </AuthProvider>
  </StrictMode>,
);
