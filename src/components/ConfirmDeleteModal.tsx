import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface ConfirmDeleteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
}

export function ConfirmDeleteModal({ isOpen, onClose, onConfirm, title, message }: ConfirmDeleteModalProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-overlay backdrop-blur-sm" onClick={onClose}>
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-system-background rounded-2xl p-6 max-w-sm w-full shadow-xl border border-separator/30"
            onClick={e => e.stopPropagation()}
          >
            <h3 className="text-lg font-semibold text-label mb-2">{title}</h3>
            <p className="text-secondary-label mb-6">{message}</p>
            <div className="flex gap-3">
              <button 
                className="flex-1 py-3 rounded-xl bg-secondary-system-background text-label font-medium hover:opacity-80 transition-opacity"
                onClick={onClose}
              >
                Cancel
              </button>
              <button 
                className="flex-1 py-3 rounded-xl bg-ios-red text-system-background font-medium hover:opacity-90 transition-opacity"
                onClick={() => {
                  onConfirm();
                  onClose();
                }}
              >
                Delete
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
