import React, { useState, useEffect, ReactNode } from 'react';
import { motion } from 'motion/react';
import { Share, PlusSquare, MoreVertical } from 'lucide-react';

interface PWAGatekeeperProps {
  children: ReactNode;
}

export function PWAGatekeeper({ children }: PWAGatekeeperProps) {
  const [isMobile, setIsMobile] = useState(false);
  const [isStandalone, setIsStandalone] = useState(true); // Default to true to prevent flash
  const [isIOS, setIsIOS] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    
    // Detect mobile
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIOSDevice = /iphone|ipad|ipod/.test(userAgent);
    const isAndroidDevice = /android/.test(userAgent);
    
    setIsMobile(isIOSDevice || isAndroidDevice);
    setIsIOS(isIOSDevice);

    // Detect standalone
    const isStandaloneMode = window.matchMedia('(display-mode: standalone)').matches || 
                             (window.navigator as any).standalone === true;
    
    setIsStandalone(isStandaloneMode);

    // Check if prompt was already captured
    if ((window as any).deferredPrompt) {
      setDeferredPrompt((window as any).deferredPrompt);
    }

    // Listen for beforeinstallprompt on Android
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    const handleCustomPrompt = (e: any) => {
      setDeferredPrompt(e.detail);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('pwa-prompt-ready', handleCustomPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('pwa-prompt-ready', handleCustomPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === 'accepted') {
      setDeferredPrompt(null);
    }
  };

  // Don't render anything until we've checked the environment
  if (!isMounted) return null;

  // If already installed, show the app
  if (isStandalone) {
    return <>{children}</>;
  }

  // Otherwise, show the gatekeeper
  return (
    <div className="fixed inset-0 z-[9999] bg-[var(--system-background)] dark:bg-[var(--secondary-system-background)] flex flex-col items-center justify-center p-6 text-[var(--label)]">
      <motion.div
        initial={{ opacity: 0, y: 40, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ type: "spring", damping: 25, stiffness: 300 }}
        className="w-full max-w-sm flex flex-col items-center text-center"
      >
        <h1 className="text-2xl font-serif font-bold mb-3 tracking-tight">Install Figment</h1>
        <p className="text-[var(--secondary-label)] mb-8 leading-relaxed">
          For the best experience, please install Figment to your home screen.
        </p>

        {isIOS ? (
          <div className="w-full text-left">
            <ol className="space-y-4 text-[var(--label)] font-medium">
              <li className="flex items-center gap-3">
                <span className="flex items-center justify-center w-6 h-6 rounded-full bg-[var(--label)] text-[var(--system-background)] text-sm font-bold shrink-0">1</span>
                <span>Tap the <Share className="inline-block w-5 h-5 mx-1 text-ios-blue" /> Share icon below</span>
              </li>
              <li className="flex items-center gap-3">
                <span className="flex items-center justify-center w-6 h-6 rounded-full bg-[var(--label)] text-[var(--system-background)] text-sm font-bold shrink-0">2</span>
                <span>Scroll down and tap <br/><span className="flex items-center gap-2 mt-1 text-ios-blue"><PlusSquare className="w-5 h-5" /> Add to Home Screen</span></span>
              </li>
            </ol>
          </div>
        ) : (
          <div className="w-full flex flex-col gap-4">
            <button
              onClick={handleInstallClick}
              disabled={!deferredPrompt}
              className="w-full py-4 px-6 bg-[var(--label)] text-[var(--system-background)] rounded-full font-semibold text-lg hover:opacity-90 transition-opacity shadow-md disabled:opacity-50"
            >
              Install Figment
            </button>
            {!deferredPrompt && (
              <div className="text-xs text-red-500 mt-4 text-left bg-red-500/10 p-3 rounded-lg">
                <p className="font-bold mb-1">Debug Info:</p>
                <p>• beforeinstallprompt hasn't fired.</p>
                <p>• Check if you are in Incognito mode (install is blocked).</p>
                <p>• Check if the app is already installed.</p>
                <p>• Ensure manifest and icons are valid.</p>
              </div>
            )}
          </div>
        )}
      </motion.div>
    </div>
  );
}
