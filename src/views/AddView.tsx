import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Search, ArrowLeft, Music, Headphones, Book, Film, Tv, Clock, Star } from 'lucide-react';
import { MediaType, SearchResult, searchMedia } from '../services/api';
import { haptics } from '../utils/haptics';
import { useSearchHistory } from '../hooks/useSearchHistory';
import { useLongPress } from '../hooks/useLongPress';
import { LogMediaModal } from '../components/LogMediaModal';
import { MediaDetailsModal } from '../components/MediaDetailsModal';
import { ConfirmDeleteModal } from '../components/ConfirmDeleteModal';

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
      className="flex items-center justify-between py-3 px-2 hover:bg-[var(--tertiary-system-background)] transition-colors cursor-pointer group select-none"
      onClick={onClick}
    >
      <div className="flex items-center gap-3 overflow-hidden">
        <Clock className="w-4 h-4 text-[var(--secondary-label)] shrink-0" />
        <span className="font-sans text-[var(--label)] truncate select-none">{item.query}</span>
      </div>
      <div className="flex items-center gap-2 shrink-0 pl-2">
        <span className="text-xs font-medium px-3 py-1 rounded-full border border-[var(--separator)] bg-transparent text-[var(--secondary-label)] select-none">
          {MEDIA_TYPES.find(t => t.id === item.mediaType)?.label || item.mediaType}
        </span>
      </div>
    </div>
  );
}

export const AddView = React.memo(function AddView({ onAddItem, initialType }: { onAddItem: (item: SearchResult, details: { rating: number, date: string, liked: boolean, rewatched: boolean }) => void, initialType?: MediaType }) {
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
  const inputRef = useRef<HTMLInputElement>(null);

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

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      inputRef.current?.blur();
      handleSearch(query);
    }
  };

  const handleClearFocus = () => {
    setIsFocused(false);
    inputRef.current?.blur();
  };

  const handleHistoryClick = (historyQuery: string, historyType: MediaType) => {
    setQuery(historyQuery);
    setActiveType(historyType);
    handleSearch(historyQuery, historyType);
  };

  return (
    <div className="flex flex-col h-full bg-[var(--system-background)] dark:bg-[var(--secondary-system-background)]">
      {/* Header / Search Bar Area */}
      <div className="px-4 pt-4 pb-2 z-10 bg-[var(--system-background)] dark:bg-[var(--secondary-system-background)]">
        <div className="flex items-center">
          <AnimatePresence>
            {(isFocused || hasSearched) && (
              <motion.button
                initial={{ opacity: 0, width: 0, marginRight: 0, scale: 0.8 }}
                animate={{ opacity: 1, width: 36, marginRight: 12, scale: 1 }}
                exit={{ opacity: 0, width: 0, marginRight: 0, scale: 0.8 }}
                transition={{ type: "spring", stiffness: 500, damping: 30 }}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => {
                  handleClearFocus();
                  setHasSearched(false);
                  setQuery('');
                  setResults([]);
                }}
                className="flex-shrink-0 h-9 flex items-center justify-center rounded-full bg-[var(--tertiary-system-background)] text-[var(--label)] overflow-hidden"
              >
                <ArrowLeft className="w-4 h-4 shrink-0" />
              </motion.button>
            )}
          </AnimatePresence>
          
          <div className="relative flex-1">
            <Search 
              className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--secondary-label)] cursor-pointer" 
              onClick={() => {
                inputRef.current?.blur();
                handleSearch(query);
              }}
            />
            <input
              ref={inputRef}
              type="text"
              placeholder="Search..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
              onKeyDown={handleKeyDown}
              className="w-full bg-[var(--tertiary-system-background)] border border-[var(--separator)] rounded-full py-2.5 pl-10 pr-4 text-sm font-sans text-[var(--label)] placeholder:text-[var(--secondary-label)] focus:outline-none focus:ring-2 focus:ring-[var(--label)]/10 transition-all shadow-sm"
            />
          </div>
        </div>

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
                  ? 'bg-[var(--label)] text-[var(--system-background)] shadow-sm scale-105 ring-1 ring-[var(--label)] ring-offset-1 ring-offset-[var(--system-background)]'
                  : 'bg-[var(--tertiary-system-background)] text-[var(--secondary-label)] hover:bg-[var(--secondary-system-background)] hover:scale-105'
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
        onClick={() => isFocused && handleClearFocus()}
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
                  <h3 className="text-sm font-medium text-[var(--secondary-label)] mb-2 px-2">Recent Searches</h3>
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
                <div className="flex flex-col items-center justify-center h-40 text-[var(--secondary-label)]">
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
              className="py-4 space-y-3"
            >
              {results.map((item) => (
                <div 
                  key={item.id} 
                  className="flex items-center gap-4 py-3 px-2 border-b border-[var(--separator)] last:border-0 cursor-pointer hover:bg-[var(--tertiary-system-background)] transition-colors group"
                  onClick={() => setDetailItem(item)}
                >
                  <div className={`relative shrink-0 overflow-hidden bg-[var(--secondary-system-background)] shadow-sm border border-[var(--separator)] ${
                    (item.type === 'music' || item.type === 'song') ? 'w-[60px] h-[60px] rounded-full' : 'w-[60px] aspect-[2/3] rounded-lg'
                  }`}>
                    <img src={item.image || undefined} alt={item.title} className="w-full h-full object-cover" />
                    <div className={`absolute inset-0 shadow-[inset_0_0_0_1px_rgba(0,0,0,0.05)] dark:shadow-[inset_0_0_0_1px_rgba(255,255,255,0.05)] pointer-events-none ${
                      (item.type === 'music' || item.type === 'song') ? 'rounded-full' : 'rounded-lg'
                    }`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-sans font-semibold text-[var(--label)] truncate">{item.title}</h4>
                    <p className="font-sans text-sm text-[var(--secondary-label)] truncate">{item.subtitle}</p>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedItem(item);
                    }}
                    className="p-2.5 bg-transparent border border-[var(--separator)] shadow-sm rounded-full text-[var(--label)] hover:bg-[var(--secondary-system-background)] transition-colors shrink-0"
                  >
                    <Star className="w-4 h-4" />
                  </button>
                </div>
              ))}
              
              {isLoading && (
                <div className="flex justify-center py-4">
                  <div className="w-6 h-6 border-2 border-[var(--secondary-label)] border-t-transparent rounded-full animate-spin" />
                </div>
              )}
              
              {!isLoading && results.length === 0 && hasSearched && (
                <div className="flex flex-col items-center justify-center h-40 text-[var(--secondary-label)]">
                  <p className="text-sm font-medium">No results found</p>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <MediaDetailsModal
        item={detailItem}
        onClose={() => setDetailItem(null)}
        fullScreen={true}
        onRateClick={() => {
          if (detailItem) {
            setSelectedItem(detailItem);
          }
        }}
      />

      <LogMediaModal 
        isOpen={!!selectedItem}
        onClose={() => setSelectedItem(null)}
        item={selectedItem}
        onSave={(item, details) => {
          onAddItem(item, details);
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
