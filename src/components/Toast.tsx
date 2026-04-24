import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';

export const showToast = (message: string, isError = false) => {
  window.dispatchEvent(new CustomEvent('app-toast', { detail: { message, isError } }));
};

export function ToastProvider() {
  const [toast, setToast] = useState<{ message: string; isError: boolean } | null>(null);

  useEffect(() => {
    const handleToast = (e: Event) => {
      const customEvent = e as CustomEvent;
      setToast(customEvent.detail);
      setTimeout(() => setToast(null), 3000);
    };

    window.addEventListener('app-toast', handleToast);
    return () => window.removeEventListener('app-toast', handleToast);
  }, []);

  return (
    <AnimatePresence>
      {toast && (
        <motion.div
          initial={{ opacity: 0, y: 50, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.95 }}
          transition={{ type: 'spring', stiffness: 500, damping: 30 }}
          className="fixed bottom-24 left-0 right-0 z-[9999] pointer-events-none flex justify-center"
        >
          <div className={`backdrop-blur-xl border px-4 py-3 rounded-2xl shadow-xl font-medium text-sm flex items-center gap-2 ${toast.isError ? 'bg-ios-red/90 border-ios-red text-white' : 'bg-secondary-system-background/90 border-separator text-label'}`}>
            {toast.message}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
