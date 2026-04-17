import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Search, Loader2, Music, Book, Film, Tv, Headphones, Check } from 'lucide-react';
import { searchMedia, SearchResult, MediaType } from '../services/api';
import { haptics } from '../utils/haptics';
import { useScrollLock } from '../hooks/useScrollLock';
import { useAuth } from '../contexts/AuthContext';

interface RecommendationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (recommendation: any) => void;
}

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

export function RecommendationModal({ isOpen, onClose, onSubmit }: RecommendationModalProps) {
  const { user } = useAuth();
  useScrollLock(isOpen);

  const [activeType, setActiveType] = useState<MediaType>('movie');
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedItem, setSelectedItem] = useState<SearchResult | null>(null);
  const [message, setMessage] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(!user);
  const [error, setError] = useState<string | null>(null);

  const searchTimeoutRef = useRef<number | undefined>(undefined);

  useEffect(() => {
    setIsAnonymous(!user);
  }, [user]);

  useEffect(() => {
    if (!isOpen) {
      setQuery('');
      setResults([]);
      setSelectedItem(null);
      setMessage('');
      setIsAnonymous(!user);
      setError(null);
    }
  }, [isOpen, user]);

  useEffect(() => {
    if (query.length < 2) {
      setResults([]);
      setError(null);
      return;
    }

    if (searchTimeoutRef.current) {
      window.clearTimeout(searchTimeoutRef.current);
    }

    searchTimeoutRef.current = window.setTimeout(async () => {
      setIsSearching(true);
      setError(null);
      try {
        const data = await searchMedia(query, activeType);
        setResults(data);
      } catch (err) {
        console.error('Search error:', err);
        setError('Failed to search. Please try again.');
        setResults([]);
      } finally {
        setIsSearching(false);
      }
    }, 500);

    return () => {
      if (searchTimeoutRef.current) {
        window.clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [query, activeType]);

  if (!isOpen) return null;

  const handleClose = () => {
    haptics.light();
    onClose();
  };

  const handleSubmit = () => {
    if (!selectedItem) return;
    haptics.success();
    onSubmit({
      item: selectedItem,
      message,
      isAnonymous,
      type: activeType,
      date: new Date().toISOString()
    });
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex sm:items-center justify-center">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ type: "spring", stiffness: 400, damping: 30 }}
            className="absolute inset-0 bg-overlay backdrop-blur-sm"
            onClick={handleClose}
            onTouchMove={(e) => e.preventDefault()}
            onWheel={(e) => e.preventDefault()}
          />
          
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', stiffness: 400, damping: 40 }}
            drag="y"
            dragConstraints={{ top: 0 }}
            onDragEnd={(e, { offset, velocity }) => {
              if (offset.y > 120 || velocity.y > 500) {
                handleClose();
              }
            }}
            onClick={(e) => e.stopPropagation()}
            onTouchMove={(e) => e.stopPropagation()}
            onWheel={(e) => e.stopPropagation()}
            className="absolute bottom-0 sm:relative w-full max-w-2xl bg-system-background rounded-t-3xl sm:rounded-3xl shadow-xl overflow-hidden flex flex-col h-[85vh] sm:h-auto sm:max-h-[85vh] pb-[env(safe-area-inset-bottom)]"
          >
            <div className="w-full flex justify-center pt-3 pb-1 shrink-0 sm:hidden">
              <div className="w-10 h-1 bg-separator rounded-full" />
            </div>
            <div className="flex items-center justify-between p-6 border-b border-separator">
              <div>
                <h2 className="text-2xl font-serif font-semibold text-label">Leave a Recommendation</h2>
                <p className="text-secondary-label text-sm mt-1">Suggest something for the profile owner</p>
              </div>
              <motion.button
                whileTap={{ scale: 0.95 }}
                transition={{ type: "spring", stiffness: 600, damping: 35 }}
                onClick={handleClose}
                className="w-11 h-11 flex items-center justify-center hover:bg-secondary-system-background rounded-full transition-colors"
              >
                <X className="w-5 h-5 text-secondary-label" />
              </motion.button>
            </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6 overlay-content">
          {!selectedItem ? (
            <>
              {/* Media Type Selection */}
              <div className="flex gap-2 overflow-x-auto pb-4 pt-2 px-2 -mx-2 scrollbar-hide">
                {MEDIA_TYPES.map((type) => (
                  <motion.button
                    key={type.id}
                    whileTap={{ scale: 0.95 }}
                    transition={{ type: "spring", stiffness: 600, damping: 35 }}
                    onClick={() => {
                      haptics.light();
                      setActiveType(type.id);
                      setQuery('');
                    }}
                    className={`flex items-center gap-2 px-4 py-2.5 rounded-full whitespace-nowrap transition-all duration-300 ${
                      activeType === type.id
                        ? 'bg-label text-system-background shadow-lg scale-105 ring-2 ring-label ring-offset-2 ring-offset-system-background'
                        : 'bg-secondary-system-background text-secondary-label hover:opacity-80 hover:scale-105'
                    }`}
                  >
                    {type.icon}
                    <span className="text-sm font-medium">{type.label}</span>
                  </motion.button>
                ))}
              </div>

              {/* Search Input */}
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-secondary-label" />
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder={`Search for ${MEDIA_TYPES.find(t => t.id === activeType)?.label.toLowerCase()}...`}
                  className="w-full pl-12 pr-4 py-4 bg-secondary-system-background text-label rounded-2xl outline-none focus:ring-2 focus:ring-label/20 transition-all font-medium placeholder:text-secondary-label/50"
                />
                {isSearching && (
                  <Loader2 className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-secondary-label animate-spin" />
                )}
              </div>

              {/* Search Results */}
              <div className="space-y-2">
                {error && (
                  <div className="text-center py-8 text-red-500 text-sm">
                    {error}
                  </div>
                )}
                {!isSearching && query.length >= 2 && results.length === 0 && !error && (
                  <div className="text-center py-8 text-secondary-label text-sm">
                    No results found
                  </div>
                )}
                {results.map((result) => (
                  <motion.button
                    key={result.id}
                    whileTap={{ scale: 0.98 }}
                    transition={{ type: "spring", stiffness: 600, damping: 35 }}
                    onClick={() => {
                      haptics.light();
                      setSelectedItem(result);
                    }}
                    className="w-full flex items-center gap-4 p-3 hover:bg-secondary-system-background rounded-2xl transition-all duration-200 text-left group hover:scale-[1.02] active:scale-[0.98]"
                  >
                    <img
                      src={result.image || undefined}
                      alt={result.title}
                      className="w-14 h-14 rounded-xl object-cover bg-secondary-system-background shadow-sm"
                    />
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-label truncate transition-colors">{result.title}</h4>
                      <p className="text-sm text-secondary-label truncate">{result.subtitle}</p>
                    </div>
                  </motion.button>
                ))}
              </div>
            </>
          ) : (
            <div className="space-y-6">
              {/* Selected Item Preview */}
              <div className="relative overflow-hidden rounded-3xl bg-secondary-system-background border border-separator group">
                <div className="absolute inset-0 opacity-20 blur-2xl transition-opacity group-hover:opacity-30">
                  <img src={selectedItem.image || undefined} alt="" className="w-full h-full object-cover" />
                </div>
                <div className="relative p-6 flex sm:flex-row flex-col items-center sm:items-start gap-6 text-center sm:text-left">
                  <img
                    src={selectedItem.image || undefined}
                    alt={selectedItem.title}
                    className="w-28 h-28 rounded-2xl object-cover shadow-xl ring-1 ring-label/10"
                  />
                  <div className="flex-1 min-w-0 flex flex-col justify-center h-full pt-2">
                    <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-system-background/60 backdrop-blur-md text-xs font-semibold text-label mb-3 shadow-sm border border-separator mx-auto sm:mx-0 w-fit">
                       {MEDIA_TYPES.find(t => t.id === activeType)?.icon}
                       {MEDIA_TYPES.find(t => t.id === activeType)?.label}
                    </div>
                    <h4 className="font-serif text-2xl font-semibold text-label line-clamp-2">{selectedItem.title}</h4>
                    <p className="text-secondary-label mt-1.5 line-clamp-1">{selectedItem.subtitle}</p>
                  </div>
                  <motion.button
                    whileTap={{ scale: 0.9 }}
                    transition={{ type: "spring", stiffness: 600, damping: 35 }}
                    onClick={() => {
                      haptics.light();
                      setSelectedItem(null);
                    }}
                    className="absolute top-4 right-4 p-2 bg-system-background/80 backdrop-blur-md rounded-full text-secondary-label hover:text-label shadow-sm transition-all hover:scale-110 active:scale-90"
                  >
                    <X className="w-5 h-5" />
                  </motion.button>
                </div>
              </div>

              {/* Message Input */}
              <div>
                <label className="block text-sm font-medium text-label mb-2">
                  Why are you recommending this? (Optional)
                </label>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="It's a masterpiece because..."
                  className="w-full p-4 bg-secondary-system-background text-label rounded-2xl outline-none focus:ring-2 focus:ring-label/20 transition-all resize-none h-32 placeholder:text-secondary-label/50"
                />
              </div>

              {/* Anonymize Toggle */}
              <label 
                className={`flex items-center gap-3 p-4 border border-separator rounded-2xl transition-colors ${!user ? 'opacity-60 cursor-not-allowed bg-secondary-system-background' : 'cursor-pointer hover:opacity-80'}`}
                onClick={(e) => {
                  if (!user) {
                    e.preventDefault();
                  }
                }}
              >
                <input 
                  type="checkbox" 
                  className="hidden" 
                  checked={isAnonymous} 
                  onChange={(e) => { if (user) setIsAnonymous(e.target.checked); }} 
                  disabled={!user} 
                />
                <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${isAnonymous ? 'bg-label border-label' : 'border-secondary-label'}`}>
                  {isAnonymous && <Check className="w-3.5 h-3.5 text-system-background" />}
                </div>
                <div className="flex-1">
                  <div className="font-medium text-label flex items-center gap-2">
                    Anonymize Response
                  </div>
                  <p className="text-sm text-secondary-label">
                    {!user ? 'Guests always recommend anonymously' : 'Your recommendation will be sent anonymously'}
                  </p>
                </div>
              </label>
            </div>
          )}
        </div>

        {/* Footer */}
        {selectedItem && (
          <div className="p-6 border-t border-separator bg-system-background">
            <motion.button
              whileHover={{ scale: window.matchMedia('(hover: hover)').matches ? 1.02 : 1 }}
              whileTap={{ scale: 0.95 }}
              transition={{ type: "spring", stiffness: 600, damping: 35 }}
              onClick={handleSubmit}
              className="w-full bg-label text-system-background rounded-xl py-3.5 font-medium hover:opacity-90 transition-colors"
            >
              Send Recommendation
            </motion.button>
          </div>
        )}
      </motion.div>
      </div>
      )}
    </AnimatePresence>
  );
}
