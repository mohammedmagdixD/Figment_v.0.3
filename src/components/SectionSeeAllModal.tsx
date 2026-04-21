import React, { useState, useRef, useEffect, lazy, Suspense, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowLeft, Search, ArrowDownAZ, ArrowUpZA, LayoutGrid, List, GalleryVerticalEnd, BookOpen, Play, Pause, SlidersHorizontal, Check, X } from 'lucide-react';
import { MediaCard } from './MediaCard';
import { SearchBar } from './SearchBar';
import { Album } from '../services/api';
import { haptics } from '../utils/haptics';

const MediaDetailsModal = lazy(() => import('./MediaDetailsModal').then(module => ({ default: module.MediaDetailsModal })));
const AddToAlbumModal = lazy(() => import('./AddToAlbumModal').then(module => ({ default: module.AddToAlbumModal })));

interface SectionSeeAllModalProps {
  section: any;
  onClose: () => void;
  onLogEpisode?: (episode: any, rating: number, date: string, liked: boolean, rewatched: boolean, podcast: any) => void;
  albums?: Album[];
  onAddToAlbum?: (albumId: string, item: any) => void;
  onCreateAlbum?: (title: string, description: string, coverImage: string, firstItem: any) => void;
  viewingUserId?: string;
}

type SortOrder = 'default' | 'alphaAsc' | 'alphaDesc' | 'newest' | 'oldest';
type ViewMode = 'grid' | 'list' | 'carousel' | 'diary';

export const SectionSeeAllModal = React.memo(function SectionSeeAllModal({ section, onClose, onLogEpisode, albums = [], onAddToAlbum, onCreateAlbum, viewingUserId }: SectionSeeAllModalProps) {
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [selectedItem, setSelectedItem] = useState<any | null>(null);
  const [addingToAlbumItem, setAddingToAlbumItem] = useState<any | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [sortOrder, setSortOrder] = useState<SortOrder>('default');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [activeMediaFilter, setActiveMediaFilter] = useState<string | null>(null);
  const [isAdvancedFilterOpen, setIsAdvancedFilterOpen] = useState(false);

  const processedItems = useMemo(() => {
    let result = [...(section.items || [])];

    // Filter by Media Type Search Pill
    if (activeMediaFilter) {
      result = result.filter(item => {
        const type = item.media_items?.media_type || item.mediaType || item.type;
        return type === activeMediaFilter;
      });
    }

    // Filter by Text Search
    if (searchQuery.trim() !== '') {
      const q = searchQuery.toLowerCase();
      result = result.filter(item => 
        (item.title && item.title.toLowerCase().includes(q)) || 
        (item.subtitle && item.subtitle.toLowerCase().includes(q)) ||
        (item.header?.title && item.header.title.toLowerCase().includes(q)) ||
        (item.header?.subtitle && item.header.subtitle.toLowerCase().includes(q))
      );
    }

    // Sort
    if (sortOrder === 'alphaAsc') {
      result.sort((a, b) => {
        const titleA = a.header?.title || a.title || '';
        const titleB = b.header?.title || b.title || '';
        return titleA.localeCompare(titleB);
      });
    } else if (sortOrder === 'alphaDesc') {
      result.sort((a, b) => {
        const titleA = a.header?.title || a.title || '';
        const titleB = b.header?.title || b.title || '';
        return titleB.localeCompare(titleA);
      });
    } else if (sortOrder === 'newest') {
      result.sort((a, b) => {
        const dateA = a.addedAt || a.media_items?.created_at || new Date(0).toISOString();
        const dateB = b.addedAt || b.media_items?.created_at || new Date(0).toISOString();
        return new Date(dateB).getTime() - new Date(dateA).getTime();
      });
    } else if (sortOrder === 'oldest') {
      result.sort((a, b) => {
        const dateA = a.addedAt || a.media_items?.created_at || new Date(0).toISOString();
        const dateB = b.addedAt || b.media_items?.created_at || new Date(0).toISOString();
        return new Date(dateA).getTime() - new Date(dateB).getTime();
      });
    }

    return result;
  }, [section.items, searchQuery, sortOrder, activeMediaFilter]);

  // Remove toggleSort from here since advanced filter menu will handle it

  const togglePlay = (url: string, id: string, title?: string, artist?: string, artworkUrl?: string) => {
    if (playingId === id) {
      audioRef.current?.pause();
      setPlayingId(null);
    } else {
      if (audioRef.current) {
        audioRef.current.pause();
      }

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

  useEffect(() => {
    // Implement native back gesture by pushing history state and listening to pop
    window.history.pushState({ modal: 'seeAll' }, '');
    const handlePop = () => {
      onClose();
    };
    window.addEventListener('popstate', handlePop);
    return () => {
      window.removeEventListener('popstate', handlePop);
    };
  }, [onClose]);

  const handleClose = () => {
    haptics.light();
    window.history.back(); // This triggers the popstate event, calling onClose safely
    onClose(); // Fallback if browser ignores
  };

  const [isSearchFocused, setIsSearchFocused] = useState(false);

  return (
    <motion.div
      initial={{ x: '100%' }}
      animate={{ x: 0 }}
      exit={{ x: '100%' }}
      transition={{ type: "spring", bounce: 0, duration: 0.35 }}
      className="fixed inset-0 z-50 bg-system-background flex flex-col pt-safe-top overflow-hidden"
    >
      {/* Header and Search Area matching AddMediaView style */}
      <div className="flex-none bg-system-background/80 backdrop-blur-xl z-20 sticky top-0 border-b border-separator/50 pb-2">
        
        {/* Title Bar - Only visible when not searching */}
        <AnimatePresence>
          {!isSearchFocused && !searchQuery && (
            <motion.div 
              initial={{ height: 0, opacity: 0, overflow: 'hidden' }}
              animate={{ height: 'auto', opacity: 1, overflow: 'visible' }}
              exit={{ height: 0, opacity: 0, overflow: 'hidden' }}
              className="flex items-center gap-3 px-4 pt-3 pb-1"
            >
              <button 
                onClick={handleClose}
                className="w-8 h-8 flex items-center justify-center rounded-full bg-tertiary-system-background text-label shrink-0 hover:bg-secondary-system-background transition-colors active:scale-95"
              >
                <ArrowLeft className="w-5 h-5 shrink-0" />
              </button>
              
              <h2 className="font-serif xl:font-sans text-xl font-semibold leading-relaxed text-label flex-1 truncate">
                {section.title}
              </h2>

              <button 
                onClick={() => { haptics.light(); setIsAdvancedFilterOpen(true); }}
                className="w-8 h-8 flex items-center justify-center rounded-full bg-tertiary-system-background text-label shrink-0 hover:bg-secondary-system-background transition-colors active:scale-95"
              >
                <SlidersHorizontal className="w-4 h-4 shrink-0" />
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="px-4 pt-2 pb-1 z-10 w-full flex">
          <SearchBar
            query={searchQuery}
            onQueryChange={setSearchQuery}
            isFocused={isSearchFocused}
            onFocusChange={setIsSearchFocused}
            showBackButton={isSearchFocused || searchQuery.length > 0}
            onBackClick={() => {
              setIsSearchFocused(false);
              setSearchQuery('');
            }}
            placeholder="Search in list..."
          />
        </div>

        {/* Quick Filters / Pill Bar */}
        <div className="flex gap-2 w-full overflow-x-auto pb-1 pt-3 px-4 hide-scrollbar">
          {Array.from(new Set((section.items || []).map((i: any) => i.media_items?.media_type || i.mediaType || i.type))).length > 1 && (
            <motion.button
              whileTap={{ scale: 0.95 }}
              transition={{ type: "spring", stiffness: 600, damping: 35 }}
              onClick={() => {
                haptics.light();
                setActiveMediaFilter(null);
              }}
              className={`shrink-0 flex items-center justify-center px-4 py-1.5 rounded-full whitespace-nowrap transition-all duration-300 ${
                activeMediaFilter === null
                  ? 'bg-label text-system-background shadow-sm scale-105 ring-1 ring-label ring-offset-1 ring-offset-system-background'
                  : 'bg-tertiary-system-background text-secondary-label hover:bg-secondary-system-background hover:scale-105'
              }`}
            >
              <span className="text-xs font-semibold">All</span>
            </motion.button>
          )}

          {/* Quick Filter: Media Types (dynamically populated) */}
          {Array.from(new Set((section.items || []).map((i: any) => i.media_items?.media_type || i.mediaType || i.type))).length > 1 && Array.from(new Set((section.items || []).map((i: any) => i.media_items?.media_type || i.mediaType || i.type))).map((type: any) => {
            if (!type) return null;
            const isActive = activeMediaFilter === type;
            return (
              <motion.button
                key={type}
                whileTap={{ scale: 0.95 }}
                transition={{ type: "spring", stiffness: 600, damping: 35 }}
                onClick={() => {
                   haptics.light();
                   setActiveMediaFilter(type);
                }}
                className={`shrink-0 flex items-center gap-1.5 px-4 py-1.5 rounded-full whitespace-nowrap transition-all duration-300 ${
                  isActive 
                  ? 'bg-label text-system-background shadow-sm scale-105 ring-1 ring-label ring-offset-1 ring-offset-system-background' 
                  : 'bg-tertiary-system-background text-secondary-label hover:bg-secondary-system-background hover:scale-105'
                }`}
              >
                <span className="text-xs font-semibold capitalize">{type}</span>
              </motion.button>
            )
          })}
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto overflow-x-hidden hide-scrollbar">
        {processedItems.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-center px-6">
            <Search className="w-12 h-12 text-tertiary-label mb-3" />
            <p className="text-secondary-label font-medium">No results found.</p>
            {searchQuery && <p className="text-tertiary-label text-sm mt-1">Try adjusting your search.</p>}
          </div>
        ) : (
          <div className="pb-[env(safe-area-inset-bottom)]">
            {viewMode === 'grid' && (
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3 p-4">
                {processedItems.map((item: any, index: number) => (
                  <div key={item.id} className="w-full">
                    <MediaCard
                      item={item}
                      sectionType={section.type}
                      index={index}
                      playingId={playingId}
                      isPriority={index < 8}
                      onItemClick={setSelectedItem}
                      onPlayToggle={togglePlay}
                      onAddToAlbum={(section.type === 'music' && onAddToAlbum) ? setAddingToAlbumItem : undefined}
                    />
                  </div>
                ))}
              </div>
            )}
            {viewMode === 'list' && (
              <div className="flex flex-col p-4">
                {processedItems.map((item: any, i: number) => (
                  <MediaCard 
                    key={item.id} 
                    item={item} 
                    sectionType={section.type} 
                    index={i} 
                    onItemClick={setSelectedItem}
                    viewMode="list"
                  />
                ))}
              </div>
            )}
            {viewMode === 'carousel' && (
              <div className="flex flex-col px-4 py-6 gap-8">
                {processedItems.map((item: any, i: number) => (
                  <MediaCard 
                    key={item.id} 
                    item={item} 
                    sectionType={section.type} 
                    index={i} 
                    onItemClick={setSelectedItem}
                    viewMode="carousel"
                  />
                ))}
              </div>
            )}
            {viewMode === 'diary' && (
              <div className="flex flex-col px-4 pt-4">
                {processedItems.map((item: any, i: number) => (
                  <MediaCard 
                    key={item.id} 
                    item={item} 
                    sectionType={section.type} 
                    index={i} 
                    onItemClick={setSelectedItem}
                    viewMode="diary"
                  />
                ))}
              </div>
            )}
          </div>
        )}
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

      {/* Advanced Filter / Sort Menu */}
      <AnimatePresence>
        {isAdvancedFilterOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsAdvancedFilterOpen(false)}
              className="absolute inset-0 z-[60] bg-black/40 backdrop-blur-sm"
            />
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: "spring", damping: 30, stiffness: 400 }}
              className="absolute bottom-0 left-0 right-0 z-[60] bg-system-background rounded-t-3xl pt-2 pb-[env(safe-area-inset-bottom)] px-4 flex flex-col shadow-2xl"
              // Ensure tap propagation correctly
              onClick={(e) => e.stopPropagation()}
            >
              <div className="w-10 h-1.5 rounded-full bg-separator mx-auto mb-4" />
              <div className="flex justify-between items-center mb-6">
                <h3 className="font-serif xl:font-sans text-xl font-bold">List Layout</h3>
                <button onClick={() => setIsAdvancedFilterOpen(false)} className="w-8 h-8 rounded-full bg-tertiary-system-background flex items-center justify-center">
                  <X className="w-5 h-5 text-label" />
                </button>
              </div>

              <div className="space-y-6">
                 <div>
                    <h4 className="text-secondary-label text-sm font-semibold mb-3 uppercase tracking-wider">Layout Style</h4>
                    <div className="grid grid-cols-4 gap-2">
                       {(['grid', 'list', 'carousel', 'diary'] as ViewMode[]).map((mode) => {
                          let Icon = LayoutGrid;
                          if (mode === 'list') Icon = List;
                          if (mode === 'carousel') Icon = GalleryVerticalEnd;
                          if (mode === 'diary') Icon = BookOpen;
                          return (
                            <button 
                              key={mode}
                              onClick={() => {
                                haptics.light();
                                setViewMode(mode);
                              }}
                              className={`flex flex-col items-center justify-center p-3 rounded-2xl transition-all ${viewMode === mode ? 'bg-label text-system-background shadow-md' : 'bg-tertiary-system-background text-secondary-label hover:text-label hover:bg-secondary-system-background'}`}
                            >
                              <Icon className="w-6 h-6 mb-1.5" />
                              <span className={`text-[10px] font-semibold tracking-wide uppercase ${viewMode === mode ? 'text-system-background/90' : ''}`}>{mode}</span>
                            </button>
                          )
                        })}
                    </div>
                 </div>

                 <div>
                    <h4 className="text-secondary-label text-sm font-semibold mb-3 uppercase tracking-wider">Sort Order</h4>
                    <div className="space-y-2">
                      {[
                        { id: 'default', label: 'Original Order' },
                        { id: 'alphaAsc', label: 'Alphabetical: A to Z' },
                        { id: 'alphaDesc', label: 'Alphabetical: Z to A' },
                        { id: 'newest', label: 'Recently Added' },
                        { id: 'oldest', label: 'Added Longest Ago' },
                      ].map((sortOption) => (
                        <button
                          key={sortOption.id}
                          onClick={() => {
                            haptics.light();
                            setSortOrder(sortOption.id as SortOrder);
                          }}
                          className={`w-full flex items-center justify-between px-4 py-3 rounded-xl transition-colors ${sortOrder === sortOption.id ? 'bg-secondary-system-background font-semibold' : 'hover:bg-tertiary-system-background'}`}
                        >
                          <span className={`${sortOrder === sortOption.id ? 'text-label' : 'text-secondary-label'}`}>{sortOption.label}</span>
                          {sortOrder === sortOption.id && <Check className="w-5 h-5 text-label" />}
                        </button>
                      ))}
                    </div>
                 </div>
              </div>
              <div className="h-8" />
            </motion.div>
          </>
        )}
      </AnimatePresence>

    </motion.div>
  );
});
