import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence, useAnimation, PanInfo, useDragControls } from 'motion/react';
import { Loader2, ArrowLeft, Star, Download } from 'lucide-react';
import { SearchResult, getPodcastEpisodes, PodcastEpisode, getMovieDetails, getTvDetails, MovieDetails, getAnimeDetails, getMangaDetails, AnimeDetails, MangaDetails, getBookDetails, getAudioDetails } from '../services/api';
import { LogMediaModal } from './LogMediaModal';
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
import { useAuth } from '../contexts/AuthContext';
import { getUserMediaInteraction } from '../services/supabaseData';
import { showToast } from './Toast';
import { toPng } from 'html-to-image';

interface MediaDetailsModalProps {
  item: SearchResult & { rating?: number; dateAdded?: string; type?: string } | null;
  onClose: () => void;
  onLogEpisode?: (episode: PodcastEpisode, rating: number, date: string, liked: boolean, rewatched: boolean, podcast: any, reviewText?: string, hasSpoilers?: boolean) => void;
  fullScreen?: boolean;
  onRateClick?: () => void;
  viewingUserId?: string;
  onAddToListClick?: () => void;
}

export const MediaDetailsModal = React.memo(function MediaDetailsModal({ item, onClose, onLogEpisode, fullScreen, onRateClick, viewingUserId, onAddToListClick }: MediaDetailsModalProps) {
  useScrollLock(!!item);

  const [mediaDetails, setMediaDetails] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  
  const [loggingEpisode, setLoggingEpisode] = useState<PodcastEpisode | null>(null);
  const [rating, setRating] = useState(0);
  const [liked, setLiked] = useState(false);
  const [rewatched, setRewatched] = useState(false);
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);

  const [sheetState, setSheetState] = useState<'half' | 'full'>('half');
  const controls = useAnimation();
  const dragControls = useDragControls();

  const { user } = useAuth();
  const [userStats, setUserStats] = useState<{ rating?: number; dateAdded?: string } | null>(null);

  const [currentItemId, setCurrentItemId] = useState(item?.id);
  if (item?.id !== currentItemId) {
    setCurrentItemId(item?.id);
    setMediaDetails(null);
    setIsLoading(!!item);
  }

  useEffect(() => {
    if (item?.rating !== undefined || item?.dateAdded) {
      setUserStats({ rating: item.rating, dateAdded: item.dateAdded });
    } else {
      setUserStats(null);
    }
  }, [item]);

  useEffect(() => {
    async function fetchUserStats() {
      const targetUserId = viewingUserId || user?.id;
      if (!targetUserId || !item) return;
      const stats = await getUserMediaInteraction(targetUserId, item.id, item.type || 'unknown');
      if (stats) {
        setUserStats({
          rating: stats.rating,
          dateAdded: stats.logged_date
        });
      }
    }
    fetchUserStats();
  }, [user, item, viewingUserId]);

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
    onLogEpisode?.(loggingEpisode!, rating, date, liked, rewatched, item);
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
      const episodeItem: SearchResult = {
        id: loggingEpisode.id,
        title: loggingEpisode.title,
        subtitle: item.title,
        image: loggingEpisode.image || item.image,
        type: 'podcast-episode',
        description: loggingEpisode.description
      };

      return (
        <LogMediaModal
          isOpen={!!loggingEpisode}
          onClose={() => setLoggingEpisode(null)}
          item={episodeItem}
          onSave={async (savedItem, details) => {
            if (onLogEpisode) {
              await onLogEpisode(loggingEpisode, details.rating, details.date, details.liked, details.rewatched, item, details.reviewText, details.hasSpoilers);
            }
            setLoggingEpisode(null);
          }}
        />
      );
    }

    if (isLoading) {
      return (
        <div className="flex justify-center items-center h-64">
          <Loader2 className="w-8 h-8 text-secondary-label animate-spin" />
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
      normalizedData = itunesPodcastAdapter(mediaDetails, item, setLoggingEpisode);
    } else if ((item.type === 'book' || item.type === 'webnovel') && mediaDetails) {
      normalizedData = googleBooksAdapter(mediaDetails, item.type);
    } else if ((item.type === 'music' || item.type === 'song' || item.type === 'album') && mediaDetails) {
      normalizedData = itunesAudioAdapter(mediaDetails);
    } else {
      normalizedData = genericAdapter(item);
    }

    if (!normalizedData) {
      return <div className="p-6 text-center text-secondary-label">Failed to load details.</div>;
    }

    // Add user stats if available
    if (userStats) {
      normalizedData.userStats = {
        rating: userStats.rating,
        dateAdded: userStats.dateAdded
      };
    }

    const handleDownload = async () => {
      const cardContainer = document.getElementById(`universal-detail-export-container-${item?.id}`);
      if (!cardContainer) return;

      try {
        haptics.light();
        showToast('Generating image...', false);

        const dataUrl = await toPng(cardContainer, {
          cacheBust: false,
          quality: 0.95,
          pixelRatio: window.devicePixelRatio || 2,
          filter: (node: HTMLElement | Node) => {
            if ('classList' in node && typeof (node as HTMLElement).classList.contains === 'function') {
              return !(node as HTMLElement).classList.contains('hide-on-export');
            }
            return true;
          },
          style: {
            transform: 'none',
            margin: '0',
          }
        });

        const arr = dataUrl.split(',');
        const mimeMatch = arr[0].match(/:(.*?);/);
        const mime = mimeMatch ? mimeMatch[1] : 'image/png';
        const bstr = atob(arr[1]);
        let n = bstr.length;
        const u8arr = new Uint8Array(n);
        while(n--){
            u8arr[n] = bstr.charCodeAt(n);
        }
        const blob = new Blob([u8arr], {type:mime});
        const blobUrl = URL.createObjectURL(blob);

        const link = document.createElement('a');
        link.download = `${(normalizedData?.header.title || 'media').replace(/\s+/g, '_').toLowerCase()}_image.png`;
        link.href = blobUrl;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        setTimeout(() => URL.revokeObjectURL(blobUrl), 10000);
        
        haptics.success();
      } catch (err) {
        console.error('Failed to download image:', err);
        haptics.error();
        showToast('Failed to download image', true);
      }
    };

    return (
      <div className="relative h-full">
        {fullScreen && (
          <div className="absolute top-4 left-4 right-4 flex justify-between z-50 pt-safe-top">
            <button 
              onClick={handleClose}
              className="p-2.5 bg-system-background/70 backdrop-blur-md rounded-full text-label hover:bg-secondary-system-background/80 transition-colors hide-on-export"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div className="flex gap-2">
              <button 
                onClick={async () => {
                  try {
                    haptics.light();
                    const shareUrl = `${window.location.origin}/m/${item.type || 'generic'}/${item.id}`;
                    if (navigator.share) {
                      await navigator.share({
                        title: normalizedData?.header.title || 'Check this out',
                        url: shareUrl
                      });
                    } else {
                      await navigator.clipboard.writeText(shareUrl);
                      showToast('Link copied to clipboard!');
                    }
                  } catch (e) {
                    console.error('Failed to share', e);
                  }
                }}
                className="p-2.5 bg-system-background/70 backdrop-blur-md rounded-full text-label hover:bg-secondary-system-background/80 transition-colors hide-on-export"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/><polyline points="16 6 12 2 8 6"/><line x1="12" x2="12" y1="2" y2="15"/></svg>
              </button>
              <button 
                onClick={handleDownload}
                className="p-2.5 bg-system-background/70 backdrop-blur-md rounded-full text-label hover:bg-secondary-system-background/80 transition-colors hide-on-export"
              >
                <Download className="w-4 h-4" />
              </button>
              {onRateClick && (
                <button 
                  onClick={onRateClick}
                  className="p-2.5 bg-system-background/70 backdrop-blur-md rounded-full text-label hover:bg-secondary-system-background/80 transition-colors hide-on-export"
                >
                  <Star className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        )}
        <div id={`universal-detail-export-container-${item?.id}`} className="h-full bg-system-background">
          <UniversalDetailCard data={normalizedData} viewingUserId={viewingUserId} onAddToListClick={onAddToListClick} />
        </div>
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
              className="absolute inset-0 bg-overlay backdrop-blur-sm"
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
            className={`relative w-full bg-system-background shadow-2xl overflow-hidden flex flex-col ${
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
                <div className="w-12 h-1.5 bg-tertiary-label rounded-full" />
              </div>
            )}

            <div 
              className={`flex-1 hide-scrollbar overlay-content ${sheetState === 'full' || fullScreen ? 'overflow-y-auto' : 'overflow-hidden touch-none'}`}
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
});
