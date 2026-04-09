import React, { useState, useRef } from 'react';
import { MediaType } from '../services/api';
import { Star, Heart, Repeat } from 'lucide-react';
import { motion } from 'motion/react';
import { haptics } from '../utils/haptics';

export interface DiaryEntry {
  id: string;
  date: string;
  rating: number;
  liked?: boolean;
  rewatched?: boolean;
  media: {
    id: string;
    title: string;
    subtitle: string;
    image: string;
    type: MediaType;
    description?: string;
  };
}

const DiaryViewComponent = ({ entries }: { entries: DiaryEntry[] }) => {
  const [filter, setFilter] = useState<MediaType | 'all'>('all');
  const parentRef = useRef<HTMLDivElement>(null);

  const filtered = filter === 'all' ? entries : entries.filter(e => e.media.type === filter);
  const sorted = [...filtered].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const filters = ['all', 'movie', 'book', 'anime', 'manga', 'music', 'podcast', 'webnovel'];

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="px-4 py-2 shrink-0">
        <div className="flex gap-2 overflow-x-auto hide-scrollbar mb-2 pb-2">
          {filters.map(t => (
            <motion.button
              key={t}
              whileTap={{ scale: 0.95 }}
              transition={{ type: "spring", stiffness: 600, damping: 35 }}
              onClick={() => {
                haptics.light();
                setFilter(t as any);
              }}
              className={`px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap capitalize transition-colors ${filter === t ? 'bg-[var(--label)] text-[var(--system-background)]' : 'bg-[var(--secondary-system-background)] dark:bg-[var(--tertiary-system-background)] text-[var(--secondary-label)] hover:text-[var(--label)]'}`}
            >
              {t}
            </motion.button>
          ))}
        </div>
      </div>

      <div ref={parentRef} className="flex-1 overflow-y-auto px-4 hide-scrollbar scroll-container">
        <div className="flex flex-col">
          {sorted.map((entry) => {
            return (
              <div key={entry.id}>
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ type: "spring", stiffness: 400, damping: 30 }}
                  className="flex gap-4 items-start pb-4 mb-4 border-b border-[var(--separator)] group"
                >
                  <div className="w-12 shrink-0 pt-1 text-center">
                    <div className="text-xs uppercase tracking-wider text-[var(--secondary-label)] font-semibold">
                      {new Date(entry.date).toLocaleDateString('en-US', { month: 'short', timeZone: 'UTC' })}
                    </div>
                    <div className="text-xl font-serif font-semibold text-[var(--label)] leading-none my-0.5">
                      {new Date(entry.date).getUTCDate()}
                    </div>
                    <div className="text-xs text-[var(--secondary-label)] opacity-70">
                      {new Date(entry.date).getUTCFullYear()}
                    </div>
                  </div>

                  <div className="w-12 h-16 shrink-0 rounded-md overflow-hidden bg-[var(--secondary-system-background)] border border-[var(--separator)] shadow-sm">
                    <img src={entry.media.image || undefined} alt={entry.media.title} className="w-full h-full object-cover" referrerPolicy="no-referrer" loading="lazy" />
                  </div>

                  <div className="flex-1 min-w-0 pt-1">
                    <h3 className="font-sans font-semibold text-base text-[var(--label)] truncate">
                      {entry.media.title}
                    </h3>
                    <p className="font-sans text-sm text-[var(--secondary-label)] truncate mb-1">
                      {entry.media.subtitle}
                    </p>
                    {entry.rating > 0 && (
                      <div className="flex items-center gap-2">
                        <div className="flex items-center gap-0.5 text-[var(--label)]">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <div key={star} className="relative w-3.5 h-3.5">
                              <Star className="absolute inset-0 w-3.5 h-3.5 text-[var(--separator)] fill-transparent" />
                              <div 
                                className="absolute inset-0 overflow-hidden" 
                                style={{ width: entry.rating >= star ? '100%' : entry.rating >= star - 0.5 ? '50%' : '0%' }}
                              >
                                <Star className="w-3.5 h-3.5 text-[var(--label)] fill-[var(--label)] max-w-none" />
                              </div>
                            </div>
                          ))}
                        </div>
                        {entry.liked && <Heart className="w-3.5 h-3.5 text-red-500 fill-red-500" />}
                        {entry.rewatched && <Repeat className="w-3.5 h-3.5 text-[var(--ios-blue)]" />}
                      </div>
                    )}
                    {entry.rating === 0 && (entry.liked || entry.rewatched) && (
                      <div className="flex items-center gap-2 mt-1">
                        {entry.liked && <Heart className="w-3.5 h-3.5 text-red-500 fill-red-500" />}
                        {entry.rewatched && <Repeat className="w-3.5 h-3.5 text-[var(--ios-blue)]" />}
                      </div>
                    )}
                  </div>
                </motion.div>
              </div>
            );
          })}
          {sorted.length === 0 && (
            <div className="text-center py-12 text-[var(--secondary-label)] text-sm font-sans">
              No diary entries found.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export const DiaryView = React.memo(DiaryViewComponent);
