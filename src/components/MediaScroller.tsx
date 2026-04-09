import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronRight, GripHorizontal, Plus, Play, Pause, ListPlus } from 'lucide-react';
import { MediaDetailsModal } from './MediaDetailsModal';
import { AddToAlbumModal } from './AddToAlbumModal';
import { MediaCard } from './MediaCard';
import { Album } from '../services/api';

interface MediaScrollerProps {
  section: any;
  dragControls?: any;
  isFirstSection?: boolean;
  onAddClick?: () => void;
  onLogEpisode?: (episode: any, rating: number, date: string, liked: boolean, rewatched: boolean, podcast: any) => void;
  albums?: Album[];
  onAddToAlbum?: (albumId: string, item: any) => void;
  onCreateAlbum?: (title: string, description: string, coverImage: string, firstItem: any) => void;
}

export function MediaScroller({ section, dragControls, isFirstSection = false, onAddClick, onLogEpisode, albums = [], onAddToAlbum, onCreateAlbum }: MediaScrollerProps) {
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [selectedItem, setSelectedItem] = useState<any | null>(null);
  const [addingToAlbumItem, setAddingToAlbumItem] = useState<any | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const togglePlay = (url: string, id: string) => {
    if (playingId === id) {
      audioRef.current?.pause();
      setPlayingId(null);
    } else {
      if (audioRef.current) {
        audioRef.current.pause();
      }
      const audio = new Audio(url);
      audioRef.current = audio;
      audio.play();
      setPlayingId(id);
      audio.onended = () => setPlayingId(null);
    }
  };
  const getAspectRatioClass = (type: string) => {
    switch (type) {
      case 'podcast':
      case 'music':
        return 'card-square';
      case 'movie':
      case 'book':
      case 'anime':
      case 'manga':
      case 'webnovel':
      default:
        return 'card-vertical';
    }
  };

  return (
    <section className="py-2 bg-transparent">
      <div className="flex items-center justify-between px-4 mb-3">
        <div className="flex items-center gap-2">
          {dragControls && (
            <div 
              className="cursor-grab active:cursor-grabbing text-[var(--secondary-label)] hover:text-[var(--label)] transition-colors p-1 -ml-1 touch-none"
              onPointerDown={(e) => dragControls.start(e)}
            >
              <GripHorizontal className="w-5 h-5" />
            </div>
          )}
          <h2 className="font-serif text-xl font-semibold leading-relaxed text-[var(--label)]">
            {section.title}
          </h2>
        </div>
        <div className="flex items-center gap-2">
          {onAddClick && (
            <button 
              onClick={onAddClick}
              className="w-7 h-7 rounded-full bg-[var(--system-background)] flex items-center justify-center text-[var(--label)] hover:bg-black/5 dark:hover:bg-white/10 transition-colors active:scale-95"
            >
              <Plus className="w-4 h-4" />
            </button>
          )}
          <button className="text-[var(--secondary-label)] hover:text-[var(--label)] flex items-center font-sans text-base font-medium leading-relaxed active:opacity-70 transition-colors">
            See All <ChevronRight className="w-4 h-4 ml-0.5" />
          </button>
        </div>
      </div>
      
      {/* Horizontal Scroller */}
      <div className="horizontal-scroll-container hide-scrollbar snap-x snap-mandatory">
        {section.items.map((item: any, index: number) => (
          <MediaCard
            key={item.id}
            item={item}
            sectionType={section.type}
            index={index}
            playingId={playingId}
            isPriority={isFirstSection && index < 4}
            onItemClick={setSelectedItem}
            onPlayToggle={togglePlay}
            onAddToAlbum={(section.type === 'music' && onAddToAlbum) ? setAddingToAlbumItem : undefined}
          />
        ))}
      </div>

      <AnimatePresence>
        {selectedItem && (
          <MediaDetailsModal 
            item={{...selectedItem, type: section.type}} 
            onClose={() => setSelectedItem(null)} 
            onLogEpisode={onLogEpisode ? ((episode, rating, date, liked, rewatched) => onLogEpisode(episode, rating, date, liked, rewatched, selectedItem)) : undefined}
          />
        )}
        {addingToAlbumItem && onAddToAlbum && onCreateAlbum && (
          <AddToAlbumModal
            item={addingToAlbumItem}
            albums={albums}
            onClose={() => setAddingToAlbumItem(null)}
            onAddToAlbum={onAddToAlbum}
            onCreateAlbum={onCreateAlbum}
          />
        )}
      </AnimatePresence>
    </section>
  );
}
