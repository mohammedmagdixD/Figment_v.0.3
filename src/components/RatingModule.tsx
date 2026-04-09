import React, { useRef } from 'react';
import { motion } from 'motion/react';
import { Star, Heart, Repeat } from 'lucide-react';
import { IOSDatePicker } from './IOSDatePicker';
import { haptics } from '../utils/haptics';

interface RatingModuleProps {
  rating: number;
  onRatingChange: (rating: number) => void;
  liked: boolean;
  onLikedChange: (liked: boolean) => void;
  date: string;
  onDateChange: (date: string) => void;
  showRewatch?: boolean;
  rewatched?: boolean;
  onRewatchedChange?: (rewatched: boolean) => void;
}

export function RatingModule({
  rating,
  onRatingChange,
  liked,
  onLikedChange,
  date,
  onDateChange,
  showRewatch = false,
  rewatched = false,
  onRewatchedChange
}: RatingModuleProps) {
  const starsRef = useRef<HTMLDivElement>(null);

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!starsRef.current) return;
    const rect = starsRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const width = rect.width;
    const percent = Math.max(0, Math.min(1, x / width));
    
    const rawRating = percent * 5;
    let newRating = Math.ceil(rawRating * 2) / 2;
    if (newRating < 0) newRating = 0;
    if (newRating > 5) newRating = 5;
    
    if (newRating !== rating) {
      haptics.light();
      onRatingChange(newRating);
    }
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    handlePointerMove(e);
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div className="flex flex-col">
          <label className="text-sm font-medium text-[var(--label)] mb-3">Rating</label>
          <div 
            ref={starsRef}
            className="flex gap-1.5 touch-none cursor-pointer"
            onPointerDown={handlePointerDown}
            onPointerMove={(e) => {
              if (e.buttons > 0) {
                handlePointerMove(e);
              }
            }}
          >
            {[1, 2, 3, 4, 5].map((star) => (
              <div key={star} className="relative w-8 h-8">
                <Star className="absolute inset-0 w-8 h-8 text-[var(--separator)] fill-transparent" />
                <div 
                  className="absolute inset-0 overflow-hidden" 
                  style={{ width: rating >= star ? '100%' : rating >= star - 0.5 ? '50%' : '0%' }}
                >
                  <Star className="w-8 h-8 text-[var(--label)] fill-[var(--label)] max-w-none" />
                </div>
              </div>
            ))}
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="flex flex-col items-center">
            <label className="text-xs font-medium text-[var(--secondary-label)] mb-2">Like</label>
            <motion.button
              whileTap={{ scale: 0.8 }}
              onClick={() => {
                haptics.light();
                onLikedChange(!liked);
              }}
              className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${liked ? 'bg-ios-red/10' : 'bg-[var(--secondary-system-background)]'}`}
            >
              <Heart className={`w-5 h-5 ${liked ? 'fill-ios-red text-ios-red' : 'text-[var(--secondary-label)]'}`} />
            </motion.button>
          </div>

          {showRewatch && onRewatchedChange && (
            <div className="flex flex-col items-center">
              <label className="text-xs font-medium text-[var(--secondary-label)] mb-2">Rewatch</label>
              <motion.button
                whileTap={{ scale: 0.8 }}
                onClick={() => {
                  haptics.light();
                  onRewatchedChange(!rewatched);
                }}
                className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${rewatched ? 'bg-ios-blue/10' : 'bg-[var(--secondary-system-background)]'}`}
              >
                <Repeat className={`w-5 h-5 ${rewatched ? 'text-ios-blue' : 'text-[var(--secondary-label)]'}`} />
              </motion.button>
            </div>
          )}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-[var(--label)] mb-3">Date</label>
        <IOSDatePicker 
          value={date} 
          onChange={onDateChange}
        />
      </div>
    </div>
  );
}
