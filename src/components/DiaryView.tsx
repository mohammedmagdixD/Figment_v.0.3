import React, { useState, useRef } from 'react';
import { MediaType } from '../services/api';
import { Star, Heart, Repeat, EyeOff } from 'lucide-react';
import { motion } from 'motion/react';
import { haptics } from '../utils/haptics';

export interface DiaryEntry {
  id: string;
  date: string;
  rating: number;
  liked?: boolean;
  rewatched?: boolean;
  reviewText: string | null;
  hasSpoilers: boolean;
  media: {
    id: string;
    title: string;
    subtitle: string;
    image: string;
    type: MediaType;
    description?: string;
  };
}

import DOMPurify from 'dompurify';
import { marked } from 'marked';

const ReviewContent = ({ text, hasSpoilers }: { text: string, hasSpoilers: boolean }) => {
  const [revealed, setRevealed] = useState(!hasSpoilers);

  if (!revealed) {
    return (
      <button 
        onClick={() => { haptics.light(); setRevealed(true); }}
        className="mt-3 text-sm text-secondary-label font-sans bg-tertiary-system-background px-3 py-1.5 rounded-lg w-fit flex items-center gap-2 hover:bg-secondary-system-background transition-colors"
      >
        <EyeOff className="w-4 h-4" />
        This review contains spoilers. Tap to reveal.
      </button>
    );
  }

  return (
    <div 
      className="mt-3 text-sm text-label font-serif prose prose-sm dark:prose-invert max-w-none"
      dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(marked.parse(text) as string) }}
    />
  );
};

const DiaryViewComponent = ({ entries }: { entries: DiaryEntry[] }) => {
  const [filter, setFilter] = useState<MediaType | 'all'>('all');
  const parentRef = useRef<HTMLDivElement>(null);

  const sortedAndFiltered = React.useMemo(() => {
    const arr = filter === 'all' ? entries : entries.filter(e => e.media.type === filter);
    return [...arr].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [entries, filter]);

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
              className={`px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap capitalize transition-colors ${filter === t ? 'bg-label text-system-background' : 'bg-secondary-system-background  text-secondary-label hover:text-label'}`}
            >
              {t}
            </motion.button>
          ))}
        </div>
      </div>

      <div ref={parentRef} className="flex-1 overflow-y-auto px-4 hide-scrollbar scroll-container pb-28">
        <div className="flex flex-col">
          {sortedAndFiltered.map((entry) => {
            return (
              <div key={entry.id}>
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ type: "spring", stiffness: 400, damping: 30 }}
                  className="flex gap-4 items-start pb-4 mb-4 border-b border-separator group"
                >
                  <div className="w-12 shrink-0 pt-1 text-center">
                    <div className="text-xs uppercase tracking-wider text-secondary-label font-semibold">
                      {new Date(entry.date).toLocaleDateString('en-US', { month: 'short', timeZone: 'UTC' })}
                    </div>
                    <div className="text-xl font-serif font-semibold text-label leading-none my-0.5">
                      {new Date(entry.date).getUTCDate()}
                    </div>
                    <div className="text-xs text-secondary-label opacity-70">
                      {new Date(entry.date).getUTCFullYear()}
                    </div>
                  </div>

                  <div className="w-12 h-16 shrink-0 rounded-md overflow-hidden bg-secondary-system-background border border-separator shadow-sm">
                    <img src={entry.media.image || undefined} alt={entry.media.title} className="w-full h-full object-cover" referrerPolicy="no-referrer" loading="lazy" />
                  </div>

                  <div className="flex-1 min-w-0 pt-1">
                    <h3 className="font-sans font-semibold text-base text-label truncate">
                      {entry.media.title}
                    </h3>
                    <p className="font-sans text-sm text-secondary-label truncate mb-1">
                      {entry.media.subtitle}
                    </p>
                    {entry.rating > 0 && (
                      <div className="flex items-center gap-2">
                        <div className="flex items-center gap-0.5 text-label">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <div key={star} className="relative w-3.5 h-3.5">
                              <Star className="absolute inset-0 w-3.5 h-3.5 text-separator fill-transparent" />
                              <div 
                                className="absolute inset-0 overflow-hidden" 
                                style={{ width: entry.rating >= star ? '100%' : entry.rating >= star - 0.5 ? '50%' : '0%' }}
                              >
                                <Star className="w-3.5 h-3.5 text-label fill-label max-w-none" />
                              </div>
                            </div>
                          ))}
                        </div>
                        {entry.liked && <Heart className="w-3.5 h-3.5 text-red-500 fill-red-500" />}
                        {entry.rewatched && <Repeat className="w-3.5 h-3.5 text-ios-blue" />}
                      </div>
                    )}
                    {entry.rating === 0 && (entry.liked || entry.rewatched) && (
                      <div className="flex items-center gap-2 mt-1">
                        {entry.liked && <Heart className="w-3.5 h-3.5 text-red-500 fill-red-500" />}
                        {entry.rewatched && <Repeat className="w-3.5 h-3.5 text-ios-blue" />}
                      </div>
                    )}
                    {entry.reviewText && (
                      <ReviewContent text={entry.reviewText} hasSpoilers={entry.hasSpoilers} />
                    )}
                  </div>
                </motion.div>
              </div>
            );
          })}
          {sortedAndFiltered.length === 0 && (
            <div className="text-center py-12 text-secondary-label text-sm font-sans">
              No diary entries found.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export const DiaryView = React.memo(DiaryViewComponent);
