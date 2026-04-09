import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, ArrowLeft } from 'lucide-react';
import { SearchResult } from '../services/api';
import { RatingModule } from './RatingModule';
import { haptics } from '../utils/haptics';
import { useScrollLock } from '../hooks/useScrollLock';

interface LogMediaModalProps {
  isOpen: boolean;
  onClose: () => void;
  item: SearchResult | null;
  onSave: (item: SearchResult, details: { rating: number, date: string, liked: boolean, rewatched: boolean }) => void;
}

export function LogMediaModal({ isOpen, onClose, item, onSave }: LogMediaModalProps) {
  useScrollLock(isOpen);

  const [rating, setRating] = useState(0);
  const [liked, setLiked] = useState(false);
  const [rewatched, setRewatched] = useState(false);
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);

  useEffect(() => {
    if (!isOpen) {
      setRating(0);
      setLiked(false);
      setRewatched(false);
      setDate(new Date().toISOString().split('T')[0]);
    }
  }, [isOpen]);

  const handleSave = () => {
    if (!item) return;
    if (rating === 0) {
      haptics.error();
      return;
    }
    haptics.success();
    onSave(item, { rating, date, liked, rewatched });
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && item && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ type: "spring", stiffness: 400, damping: 30 }}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[60]"
            onClick={onClose}
            onTouchMove={(e) => e.preventDefault()}
            onWheel={(e) => e.preventDefault()}
          />
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: "spring", stiffness: 400, damping: 30 }}
            drag="y"
            dragConstraints={{ top: 0 }}
            onDragEnd={(e, { offset, velocity }) => {
              if (offset.y > 120 || velocity.y > 500) {
                haptics.light();
                onClose();
              }
            }}
            onClick={(e) => e.stopPropagation()}
            onTouchMove={(e) => e.stopPropagation()}
            onWheel={(e) => e.stopPropagation()}
            className="fixed inset-x-0 bottom-0 z-[60] bg-[var(--system-background)] rounded-t-3xl shadow-2xl h-[85vh] flex flex-col sm:max-w-[428px] sm:mx-auto pb-[env(safe-area-inset-bottom)]"
          >
            <div className="w-full flex justify-center pt-3 pb-1 shrink-0">
              <div className="w-10 h-1 bg-[var(--separator)] rounded-full" />
            </div>
            
            <div className="flex-1 overflow-y-auto p-2 hide-scrollbar overlay-content">
              <div className="p-3 flex flex-col h-full">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-4">
                    <button onClick={onClose} className="w-11 h-11 flex items-center justify-center bg-[var(--secondary-system-background)] rounded-full text-[var(--secondary-label)] hover:text-[var(--label)] transition-colors">
                      <ArrowLeft className="w-5 h-5" />
                    </button>
                    <h2 className="font-serif text-xl font-semibold text-[var(--label)]">Log Activity</h2>
                  </div>
                  <motion.button 
                    whileTap={{ scale: 0.95 }}
                    onClick={onClose}
                    className="w-11 h-11 flex items-center justify-center bg-[var(--secondary-system-background)] rounded-full text-[var(--secondary-label)] hover:text-[var(--label)] transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </motion.button>
                </div>
                
                <div className="flex gap-4 mb-8 bg-[var(--secondary-system-background)] p-4 rounded-2xl border border-[var(--separator)]">
                  <img src={item.image || undefined} alt={item.title} className="w-16 h-24 object-cover rounded-lg shadow-sm bg-[var(--tertiary-system-background)]" />
                  <div className="flex-1 min-w-0 py-1">
                    <h3 className="font-sans font-semibold text-base text-[var(--label)] line-clamp-2 mb-1">{item.title}</h3>
                    <p className="font-sans text-sm text-[var(--secondary-label)] line-clamp-2">{item.subtitle}</p>
                  </div>
                </div>

                <div className="mb-auto px-1">
                  <RatingModule
                    rating={rating}
                    onRatingChange={setRating}
                    liked={liked}
                    onLikedChange={setLiked}
                    date={date}
                    onDateChange={setDate}
                    showRewatch={item.type === 'movie' || item.type === 'tv' || item.type === 'anime'}
                    rewatched={rewatched}
                    onRewatchedChange={setRewatched}
                  />
                </div>

                <button 
                  onClick={handleSave}
                  className="w-full bg-[var(--label)] text-[var(--system-background)] rounded-xl py-4 font-medium text-base hover:opacity-90 transition-opacity mt-4"
                >
                  Save to Diary
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
