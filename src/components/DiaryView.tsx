import React, { useState, useRef } from 'react';
import { MediaType } from '../services/api';
import { motion } from 'motion/react';
import { haptics } from '../utils/haptics';
import { MediaCard } from './MediaCard';

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
                if (parentRef.current) {
                  parentRef.current.scrollTo({ top: 0, behavior: 'instant' });
                }
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
          {sortedAndFiltered.map((entry) => (
            <div key={entry.id}>
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "0px 0px 50px 0px" }}
                transition={{ type: "spring", stiffness: 400, damping: 30 }}
              >
                <MediaCard
                  item={entry}
                  viewMode="diary"
                  sectionType={entry.media?.type}
                />
              </motion.div>
            </div>
          ))}
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
