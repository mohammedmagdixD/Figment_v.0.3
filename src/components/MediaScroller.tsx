import React, { useState, useRef, useEffect, lazy, Suspense } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronRight, GripHorizontal, Plus, Play, Pause, ListPlus } from 'lucide-react';
import { MediaCard } from './MediaCard';
import { Album } from '../services/api';

const MediaDetailsModal = lazy(() => import('./MediaDetailsModal').then(module => ({ default: module.MediaDetailsModal })));
const AddToAlbumModal = lazy(() => import('./AddToAlbumModal').then(module => ({ default: module.AddToAlbumModal })));

interface MediaScrollerProps {
  section: any;
  dragControls?: any;
  isFirstSection?: boolean;
  onAddClick?: () => void;
  onSeeAllClick?: () => void;
  onLogEpisode?: (episode: any, rating: number, date: string, liked: boolean, rewatched: boolean, podcast: any) => void;
  albums?: Album[];
  onAddToAlbum?: (albumId: string, item: any) => void;
  onCreateAlbum?: (title: string, description: string, coverImage: string, firstItem: any) => void;
  viewingUserId?: string;
}

export const MediaScroller = React.memo(function MediaScroller({ section, dragControls, isFirstSection = false, onAddClick, onSeeAllClick, onLogEpisode, albums = [], onAddToAlbum, onCreateAlbum, viewingUserId }: MediaScrollerProps) {
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [selectedItem, setSelectedItem] = useState<any | null>(null);
  const [addingToAlbumItem, setAddingToAlbumItem] = useState<any | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const togglePlay = (url: string, id: string, title?: string, artist?: string, artworkUrl?: string) => {
    if (playingId === id) {
      audioRef.current?.pause();
      setPlayingId(null);
    } else {
      if (audioRef.current) {
        audioRef.current.pause();
      }

      // Pause all other audio elements on the page
      document.querySelectorAll('audio').forEach(audio => {
        if (audio !== audioRef.current) {
          audio.pause();
        }
      });
      window.dispatchEvent(new CustomEvent('pause-all-audio'));

      const audio = new Audio(url);
      audioRef.current = audio;
      audio.play();
      
      if ('mediaSession' in navigator) {
        navigator.mediaSession.metadata = new MediaMetadata({
          title: title || 'Unknown Title',
          artist: artist || 'Unknown Artist',
          artwork: artworkUrl ? [
            { src: artworkUrl, sizes: '96x96', type: 'image/jpeg' },
            { src: artworkUrl, sizes: '128x128', type: 'image/jpeg' },
            { src: artworkUrl, sizes: '192x192', type: 'image/jpeg' },
            { src: artworkUrl, sizes: '256x256', type: 'image/jpeg' },
            { src: artworkUrl, sizes: '384x384', type: 'image/jpeg' },
            { src: artworkUrl, sizes: '512x512', type: 'image/jpeg' },
          ] : []
        });
      }

      setPlayingId(id);
      audio.onended = () => setPlayingId(null);
      audio.onpause = () => setPlayingId(null);
      audio.onplay = () => setPlayingId(id);
    }
  };

  useEffect(() => {
    const handlePauseAll = () => {
      if (playingId && audioRef.current) {
        audioRef.current.pause();
        setPlayingId(null);
      }
    };
    window.addEventListener('pause-all-audio', handlePauseAll);
    return () => window.removeEventListener('pause-all-audio', handlePauseAll);
  }, [playingId]);

  return (
    <section className="py-2 bg-transparent">
      <div className="flex items-center justify-between px-4 mb-3">
        <div className="flex items-center gap-2">
          {dragControls && (
            <div 
              className="cursor-grab active:cursor-grabbing text-secondary-label hover:text-label transition-colors p-1 -ml-1 touch-none"
              onPointerDown={(e) => dragControls.start(e)}
            >
              <GripHorizontal className="w-5 h-5" />
            </div>
          )}
          <h2 className="font-serif text-xl font-semibold leading-relaxed text-label">
            {section.title}
          </h2>
        </div>
        <div className="flex items-center gap-2">
          {onAddClick && (
            <button 
              onClick={onAddClick}
              className="w-7 h-7 rounded-full bg-system-background flex items-center justify-center text-label hover:bg-secondary-system-background transition-colors active:scale-95"
            >
              <Plus className="w-4 h-4" />
            </button>
          )}
          {section.items.length > 0 && onSeeAllClick && (
            <button 
              onClick={onSeeAllClick}
              className="text-secondary-label hover:text-label flex items-center font-sans text-base font-medium leading-relaxed active:opacity-70 transition-colors"
            >
              See All <ChevronRight className="w-4 h-4 ml-0.5" />
            </button>
          )}
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
          <Suspense fallback={null}>
            <MediaDetailsModal 
              item={{...selectedItem, type: section.type}} 
              onClose={() => setSelectedItem(null)} 
              onLogEpisode={onLogEpisode ? ((episode, rating, date, liked, rewatched) => onLogEpisode(episode, rating, date, liked, rewatched, selectedItem)) : undefined}
              viewingUserId={viewingUserId}
            />
          </Suspense>
        )}
        {addingToAlbumItem && onAddToAlbum && onCreateAlbum && (
          <Suspense fallback={null}>
            <AddToAlbumModal
              item={addingToAlbumItem}
              albums={albums}
              onClose={() => setAddingToAlbumItem(null)}
              onAddToAlbum={onAddToAlbum}
              onCreateAlbum={onCreateAlbum}
            />
          </Suspense>
        )}
      </AnimatePresence>
    </section>
  );
});
