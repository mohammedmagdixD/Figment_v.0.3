import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence, useAnimation, PanInfo, useDragControls } from 'motion/react';
import { Loader2, ArrowLeft, Star } from 'lucide-react';
import { SearchResult, getPodcastEpisodes, PodcastEpisode, getMovieDetails, getTvDetails, MovieDetails, getAnimeDetails, getMangaDetails, AnimeDetails, MangaDetails, getBookDetails, getAudioDetails } from '../services/api';
import { RatingModule } from './RatingModule';
import { haptics } from '../utils/haptics';
import { useScrollLock } from '../hooks/useScrollLock';
import { UniversalDetailCard } from './UniversalDetailCard';
import { 
  malAnimeAdapter, 
  malMangaAdapter, 
  tmdbMovieAdapter, 
  tmdbTvAdapter, 
  itunesPodcastAdapter, 
  googleBooksAdapter,
  itunesAudioAdapter,
  genericAdapter 
} from '../utils/adapters';
import { UniversalMediaData } from '../types/universal';

interface MediaDetailsModalProps {
  item: SearchResult & { rating?: number; dateAdded?: string; type?: string } | null;
  onClose: () => void;
  onLogEpisode?: (episode: PodcastEpisode, rating: number, date: string, liked: boolean, rewatched: boolean) => void;
  fullScreen?: boolean;
  onRateClick?: () => void;
}

export function MediaDetailsModal({ item, onClose, onLogEpisode, fullScreen, onRateClick }: MediaDetailsModalProps) {
  useScrollLock(!!item);

  const [mediaDetails, setMediaDetails] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  const [loggingEpisode, setLoggingEpisode] = useState<PodcastEpisode | null>(null);
  const [rating, setRating] = useState(0);
  const [liked, setLiked] = useState(false);
  const [rewatched, setRewatched] = useState(false);
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);

  const [sheetState, setSheetState] = useState<'half' | 'full'>('half');
  const controls = useAnimation();
  const dragControls = useDragControls();

  useEffect(() => {
    if (item) {
      setSheetState(fullScreen ? 'full' : 'half');
      controls.start(fullScreen ? 'full' : 'half');
      setIsLoading(true);
      
      const fetchDetails = async () => {
        try {
          let data;
          switch (item.type) {
            case 'podcast':
              data = await getPodcastEpisodes(item.id);
              break;
            case 'movie':
              data = await getMovieDetails(item.id);
              break;
            case 'tv':
              data = await getTvDetails(item.id);
              break;
            case 'anime':
              data = await getAnimeDetails(item.id);
              break;
            case 'manga':
              data = await getMangaDetails(item.id);
              break;
            case 'book':
            case 'webnovel':
              data = await getBookDetails(item.id);
              break;
            case 'song':
            case 'music':
            case 'album':
              data = await getAudioDetails(item);
              break;
            default:
              data = item;
          }
          setMediaDetails(data);
        } catch (error) {
          console.error("Failed to fetch details", error);
        } finally {
          setIsLoading(false);
        }
      };

      fetchDetails();
    }
  }, [item, controls]);

  if (!item) return null;

  const handleClose = () => {
    haptics.light();
    onClose();
  };

  const handleLogEpisode = () => {
    haptics.success();
    onLogEpisode?.(loggingEpisode!, rating, date, liked, rewatched);
    setLoggingEpisode(null);
    onClose();
  };

  const handleDragEnd = (event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    const velocityY = info.velocity.y;
    const offsetY = info.offset.y;

    if (sheetState === 'half') {
      if (velocityY < -500 || offsetY < -50) {
        setSheetState('full');
        controls.start('full');
        haptics.light();
      } else if (velocityY > 500 || offsetY > 50) {
        handleClose();
      } else {
        controls.start('half');
      }
    } else if (sheetState === 'full') {
      if (velocityY > 500 || offsetY > 50) {
        handleClose();
      } else {
        controls.start('full');
      }
    }
  };

  const renderMediaContent = () => {
    if (loggingEpisode) {
      return (
        <div className="p-6 overflow-y-auto hide-scrollbar bg-[var(--system-background)] overlay-content flex flex-col h-full">
          <div className="flex items-center gap-4 mb-6">
            <motion.button 
              whileTap={{ scale: 0.95 }}
              transition={{ type: "spring", stiffness: 600, damping: 35 }}
              onClick={() => {
                haptics.light();
                setLoggingEpisode(null);
              }} 
              className="w-11 h-11 flex items-center justify-center bg-[var(--secondary-system-background)] rounded-full text-[var(--secondary-label)] hover:text-[var(--label)] transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </motion.button>
            <h2 className="font-sans text-xl font-semibold text-[var(--label)]">Log Episode</h2>
          </div>
          
          <div className="mb-6">
            <h3 className="font-sans font-semibold text-base text-[var(--label)] line-clamp-2 mb-1">{loggingEpisode.title}</h3>
            <p className="font-sans text-sm text-[var(--secondary-label)] line-clamp-2">{item.title}</p>
          </div>

          <div className="mb-auto px-1">
            <RatingModule
              rating={rating}
              onRatingChange={setRating}
              liked={liked}
              onLikedChange={setLiked}
              date={date}
              onDateChange={setDate}
              showRewatch={item.type === 'movie' || item.type === 'tv' || item.type === 'anime'}
              rewatched={rewatched}
              onRewatchedChange={setRewatched}
            />
          </div>

          <motion.button 
            whileHover={{ scale: window.matchMedia('(hover: hover)').matches ? 1.02 : 1 }}
            whileTap={{ scale: 0.95 }}
            transition={{ type: "spring", stiffness: 600, damping: 35 }}
            onClick={handleLogEpisode}
            className="w-full bg-[var(--label)] text-[var(--system-background)] rounded-xl py-4 font-medium text-base hover:opacity-90 transition-colors mt-8"
          >
            Save to Diary
          </motion.button>
        </div>
      );
    }

    if (isLoading) {
      return (
        <div className="flex justify-center items-center h-64">
          <Loader2 className="w-8 h-8 text-gray dark:text-ios-gray-1 animate-spin" />
        </div>
      );
    }

    let normalizedData: UniversalMediaData | null = null;

    if (item.type === 'movie' && mediaDetails) {
      normalizedData = tmdbMovieAdapter(mediaDetails, item);
    } else if (item.type === 'tv' && mediaDetails) {
      normalizedData = tmdbTvAdapter(mediaDetails, item);
    } else if (item.type === 'anime' && mediaDetails) {
      normalizedData = malAnimeAdapter(mediaDetails);
    } else if (item.type === 'manga' && mediaDetails) {
      normalizedData = malMangaAdapter(mediaDetails);
    } else if (item.type === 'podcast' && mediaDetails) {
      normalizedData = itunesPodcastAdapter(mediaDetails, item, setLoggingEpisode, searchQuery, setSearchQuery);
    } else if ((item.type === 'book' || item.type === 'webnovel') && mediaDetails) {
      normalizedData = googleBooksAdapter(mediaDetails, item.type);
    } else if ((item.type === 'music' || item.type === 'song' || item.type === 'album') && mediaDetails) {
      normalizedData = itunesAudioAdapter(mediaDetails);
    } else {
      normalizedData = genericAdapter(item);
    }

    if (!normalizedData) {
      return <div className="p-6 text-center text-gray dark:text-ios-gray-1">Failed to load details.</div>;
    }

    // Add user stats if available
    if (item.rating !== undefined || item.dateAdded) {
      normalizedData.userStats = {
        rating: item.rating,
        dateAdded: item.dateAdded
      };
    }

    return (
      <div className="relative h-full">
        {fullScreen && (
          <div className="absolute top-4 left-4 right-4 flex justify-between z-50 pt-safe-top">
            <button 
              onClick={handleClose}
              className="p-2.5 bg-[var(--system-background)]/70 backdrop-blur-md rounded-full text-[var(--label)] hover:bg-[var(--secondary-system-background)]/80 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            {onRateClick && (
              <button 
                onClick={onRateClick}
                className="p-2.5 bg-[var(--system-background)]/70 backdrop-blur-md rounded-full text-[var(--label)] hover:bg-[var(--secondary-system-background)]/80 transition-colors"
              >
                <Star className="w-4 h-4" />
              </button>
            )}
          </div>
        )}
        <UniversalDetailCard data={normalizedData} />
      </div>
    );
  };

  return (
    <AnimatePresence>
      {item && (
        <div className={`fixed inset-0 z-50 flex items-end justify-center ${fullScreen ? '' : 'sm:items-center sm:p-4'}`}>
          {!fullScreen && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              onClick={() => {
                if (sheetState === 'half') handleClose();
              }}
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            />
          )}
          
          <motion.div 
            initial={fullScreen ? { opacity: 0, y: 20 } : "closed"}
            animate={fullScreen ? { opacity: 1, y: 0 } : controls}
            exit={fullScreen ? { opacity: 0, y: 20 } : "closed"}
            variants={fullScreen ? undefined : {
              closed: { y: '100%' },
              half: { y: '50%' },
              full: { y: '5%' }
            }}
            transition={fullScreen ? { duration: 0.3 } : { type: 'spring', stiffness: 400, damping: 40 }}
            drag={fullScreen ? false : "y"}
            dragControls={dragControls}
            dragListener={false}
            dragConstraints={{ top: 0 }}
            dragElastic={0.2}
            onDragEnd={fullScreen ? undefined : handleDragEnd}
            onClick={(e) => e.stopPropagation()}
            className={`relative w-full bg-[var(--system-background)] shadow-2xl overflow-hidden flex flex-col ${
              fullScreen 
                ? 'h-full max-w-full rounded-none' 
                : 'max-w-md rounded-t-[32px] sm:rounded-3xl h-[95vh] sm:h-[85vh] sm:max-h-[850px]'
            }`}
          >
            {/* Dash Icon for dragging */}
            {!fullScreen && (
              <div 
                className="absolute top-0 left-0 right-0 z-50 flex justify-center pt-3 pb-3 cursor-grab active:cursor-grabbing touch-none"
                onPointerDown={(e) => dragControls.start(e)}
              >
                <div className="w-12 h-1.5 bg-[var(--tertiary-label)] rounded-full" />
              </div>
            )}

            <div 
              className={`flex-1 hide-scrollbar overlay-content ${sheetState === 'full' || fullScreen ? 'overflow-y-auto' : 'overflow-hidden'}`}
              onPointerDown={(e) => {
                if (!fullScreen && sheetState === 'half') {
                  dragControls.start(e);
                }
              }}
              onWheel={(e) => {
                if (!fullScreen && sheetState === 'half' && e.deltaY > 0) {
                  setSheetState('full');
                  controls.start('full');
                  haptics.light();
                }
              }}
            >
              {renderMediaContent()}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
