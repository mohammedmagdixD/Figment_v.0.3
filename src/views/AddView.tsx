import React, { useState, useEffect, useRef, useCallback, Suspense, lazy } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Search, ArrowLeft, Music, Headphones, Book, Film, Tv, Clock, Star } from 'lucide-react';
import { MediaType, SearchResult, searchMedia } from '../services/api';
import { haptics } from '../utils/haptics';
import { useSearchHistory } from '../hooks/useSearchHistory';
import { useLongPress } from '../hooks/useLongPress';
import { LogMediaModal } from '../components/LogMediaModal';
import { ConfirmDeleteModal } from '../components/ConfirmDeleteModal';
import { SearchBar } from '../components/SearchBar';
import { MediaCard } from '../components/MediaCard';
import { useAuth } from '../contexts/AuthContext';
import { handleAddToList } from '../utils/listManager';

const MediaDetailsModal = lazy(() => import('../components/MediaDetailsModal').then(module => ({ default: module.MediaDetailsModal })));

const MEDIA_TYPES: { id: MediaType; label: string; icon: React.ReactNode }[] = [
  { id: 'movie', label: 'Films', icon: <Film className="w-4 h-4" /> },
  { id: 'tv', label: 'TV Shows', icon: <Tv className="w-4 h-4" /> },
  { id: 'music', label: 'Music', icon: <Music className="w-4 h-4" /> },
  { id: 'anime', label: 'Anime', icon: <Tv className="w-4 h-4" /> },
  { id: 'manga', label: 'Manga', icon: <Book className="w-4 h-4" /> },
  { id: 'book', label: 'Books', icon: <Book className="w-4 h-4" /> },
  { id: 'podcast', label: 'Podcasts', icon: <Headphones className="w-4 h-4" /> },
  { id: 'webnovel', label: 'Webnovels', icon: <Book className="w-4 h-4" /> },
];

const HistoryItem: React.FC<{ 
  item: any; 
  onLongPress: () => void; 
  onClick: () => void; 
}> = ({ 
  item, 
  onLongPress, 
  onClick 
}) => {
  const longPressProps = useLongPress({
    onLongPress
  });

  return (
    <div 
      {...longPressProps}
      className="flex items-center justify-between py-3 px-2 hover:bg-tertiary-system-background transition-colors cursor-pointer group select-none"
      onClick={onClick}
    >
      <div className="flex items-center gap-3 overflow-hidden">
        <Clock className="w-4 h-4 text-secondary-label shrink-0" />
        <span className="font-sans text-label truncate select-none">{item.query}</span>
      </div>
      <div className="flex items-center gap-2 shrink-0 pl-2">
        <span className="text-xs font-medium px-3 py-1 rounded-full border border-separator bg-transparent text-secondary-label select-none">
          {MEDIA_TYPES.find(t => t.id === item.mediaType)?.label || item.mediaType}
        </span>
      </div>
    </div>
  );
}

export const AddView = React.memo(function AddView({ onAddItem, initialType }: { onAddItem: (item: SearchResult, details: { rating: number, date: string, liked: boolean, rewatched: boolean }) => void, initialType?: MediaType }) {
  const { user } = useAuth();
  const [isFocused, setIsFocused] = useState(false);
  const [query, setQuery] = useState('');
  const [activeType, setActiveType] = useState<MediaType>(initialType || 'movie');

  useEffect(() => {
    if (initialType) {
      setActiveType(initialType);
    }
  }, [initialType]);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [selectedItem, setSelectedItem] = useState<SearchResult | null>(null);
  const [detailItem, setDetailItem] = useState<SearchResult | null>(null);

  const { history, addToHistory, removeFromHistory } = useSearchHistory();

  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const handleSearch = useCallback(async (searchQuery: string, overrideType?: MediaType) => {
    if (!searchQuery.trim()) return;
    
    const typeToSearch = overrideType || activeType;
    
    setIsLoading(true);
    setHasSearched(true);
    setResults([]);
    addToHistory(searchQuery, typeToSearch);

    try {
      const data = await searchMedia(searchQuery, typeToSearch);
      setResults(data);
    } catch (error) {
      console.error('Search failed:', error);
      setResults([]);
    } finally {
      setIsLoading(false);
    }
  }, [activeType, addToHistory]);

  const handleHistoryClick = (historyQuery: string, historyType: MediaType) => {
    setQuery(historyQuery);
    setActiveType(historyType);
    handleSearch(historyQuery, historyType);
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header / Search Bar Area */}
      <div className="px-4 pt-4 pb-2 z-10">
        <SearchBar
          query={query}
          onQueryChange={setQuery}
          onSearch={handleSearch}
          isFocused={isFocused}
          onFocusChange={setIsFocused}
          showBackButton={isFocused || hasSearched}
          onBackClick={() => {
            setIsFocused(false);
            setHasSearched(false);
            setQuery('');
            setTimeout(() => {
              setResults([]);
            }, 400); // Wait for transition to finish before destroying results
          }}
          placeholder="Search..."
        />

        {/* Media Type Selector */}
        <div className="flex gap-2 overflow-x-auto pb-2 pt-3 -mx-4 px-4 hide-scrollbar">
          {MEDIA_TYPES.map((type) => (
            <motion.button
              key={type.id}
              whileTap={{ scale: 0.95 }}
              transition={{ type: "spring", stiffness: 600, damping: 35 }}
              onClick={() => {
                haptics.light();
                setActiveType(type.id);
                if (query.trim()) {
                  handleSearch(query, type.id);
                } else {
                  setHasSearched(false);
                  setResults([]);
                }
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full whitespace-nowrap transition-all duration-300 ${
                activeType === type.id
                  ? 'bg-label text-system-background shadow-sm scale-105 ring-1 ring-label ring-offset-1 ring-offset-system-background'
                  : 'bg-tertiary-system-background text-secondary-label hover:bg-secondary-system-background hover:scale-105'
              }`}
            >
              <div className="[&>svg]:w-3.5 [&>svg]:h-3.5 flex items-center justify-center">
                {type.icon}
              </div>
              <span className="text-xs font-medium">{type.label}</span>
            </motion.button>
          ))}
        </div>
      </div>

      {/* Content Area */}
      <div 
        className="flex-1 overflow-y-auto px-4 hide-scrollbar pb-28"
        onClick={() => isFocused && setIsFocused(false)}
      >
        <AnimatePresence mode="wait">
          {!hasSearched && !isLoading ? (
            <motion.div
              key="history"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="py-4"
            >
              {history.length > 0 ? (
                <div className="space-y-0">
                  <h3 className="text-sm font-medium text-secondary-label mb-2 px-2">Recent Searches</h3>
                  {history.map((item) => (
                    <HistoryItem 
                      key={item.id}
                      item={item}
                      onLongPress={() => {
                        haptics.medium();
                        setDeleteConfirmId(item.id);
                      }}
                      onClick={() => !deleteConfirmId && handleHistoryClick(item.query, item.mediaType)}
                    />
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-40 text-secondary-label">
                  <Search className="w-8 h-8 mb-3 opacity-50" />
                  <p className="text-sm font-medium">Search for {MEDIA_TYPES.find(t => t.id === activeType)?.label}</p>
                </div>
              )}
            </motion.div>
          ) : (
            <motion.div
              key="results"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="py-4"
            >
              {results.map((item, index) => (
                <MediaCard 
                  key={item.id || index}
                  item={item}
                  viewMode="search-result"
                  sectionType={item.type}
                  onItemClick={setDetailItem}
                  onLogClick={setSelectedItem}
                  onAddToListClick={() => handleAddToList(user?.id, item)}
                />
              ))}
              
              {isLoading && (
                <div className="flex justify-center py-4">
                  <div className="w-6 h-6 border-2 border-secondary-label border-t-transparent rounded-full animate-spin" />
                </div>
              )}
              
              {!isLoading && results.length === 0 && hasSearched && (
                <div className="flex flex-col items-center justify-center h-40 text-secondary-label">
                  <p className="text-sm font-medium">No results found</p>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <Suspense fallback={<div />}>
        {detailItem && (
          <MediaDetailsModal
            item={detailItem}
            onClose={() => setDetailItem(null)}
            fullScreen={true}
            onRateClick={() => {
              if (detailItem) {
                setSelectedItem(detailItem);
              }
            }}
            onAddToListClick={() => handleAddToList(user?.id, detailItem)}
          />
        )}
      </Suspense>

      <LogMediaModal 
        isOpen={!!selectedItem}
        onClose={() => setSelectedItem(null)}
        item={selectedItem}
        onSave={async (item, details) => {
          await onAddItem(item, details);
          setSelectedItem(null);
        }}
      />

      {/* Delete History Confirmation */}
      <ConfirmDeleteModal
        isOpen={!!deleteConfirmId}
        onClose={() => setDeleteConfirmId(null)}
        onConfirm={() => {
          if (deleteConfirmId) {
            removeFromHistory(deleteConfirmId);
          }
        }}
        title="Delete Search History"
        message="Are you sure you want to remove this item from your search history?"
      />
    </div>
  );
});
