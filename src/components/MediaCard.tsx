import React, { useState, memo, useRef, useEffect } from 'react';
import { motion } from 'motion/react';
import { Play, Pause, ListPlus, Loader2, Star, Heart, Repeat, EyeOff, Trash2, Sparkles, Music, Headphones, Book, Film, Tv } from 'lucide-react';
import { fetchWithBackoff } from '../services/api';
import { UniversalMediaData } from '../types/universal';
import DOMPurify from 'dompurify';
import { marked } from 'marked';
import { haptics } from '../utils/haptics';

export type ViewMode = 'grid' | 'list' | 'carousel' | 'diary' | 'recommendation' | 'search-result';

export interface MediaCardProps {
  item: any;
  viewMode?: ViewMode;
  sectionType?: string;
  index?: number;
  playingId?: string | null;
  isPriority?: boolean;
  onItemClick?: (item: any) => void;
  onPlayToggle?: (url: string, id: string, title?: string, artist?: string, artworkUrl?: string) => void;
  onAddToAlbum?: (item: any) => void;
  onLogClick?: (item: any) => void;
  onAddToListClick?: (item: any) => void;
  
  // Specific handlers for recommendations
  onDelete?: (id: string) => void;
  isOwnProfile?: boolean;
}

// --- Shared Helpers ---

const getIconForType = (type: string) => {
  switch (type) {
    case 'music':
    case 'song': return <Music className="w-4 h-4" />;
    case 'podcast': return <Headphones className="w-4 h-4" />;
    case 'book':
    case 'manga':
    case 'webnovel': return <Book className="w-4 h-4" />;
    case 'movie': return <Film className="w-4 h-4" />;
    case 'tv':
    case 'anime': return <Tv className="w-4 h-4" />;
    default: return <Sparkles className="w-4 h-4" />;
  }
};

const getLabelForType = (type: string) => {
  switch (type) {
    case 'movie': return 'Films';
    case 'tv': return 'TV Shows';
    case 'music': return 'Music';
    case 'anime': return 'Anime';
    case 'manga': return 'Manga';
    case 'book': return 'Books';
    case 'podcast': return 'Podcasts';
    case 'webnovel': return 'Webnovels';
    default: return type ? type.charAt(0).toUpperCase() + type.slice(1) : 'Unknown';
  }
};

const ReviewContent = ({ text, hasSpoilers }: { text: string, hasSpoilers: boolean }) => {
  const [revealed, setRevealed] = useState(!hasSpoilers);

  if (!revealed) {
    return (
      <button 
        onClick={(e) => { e.stopPropagation(); haptics.light(); setRevealed(true); }}
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

const ExpandableMessage = ({ text }: { text: string }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isTruncatable, setIsTruncatable] = useState(false);
  const textRef = useRef<HTMLParagraphElement>(null);

  useEffect(() => {
    const checkTruncation = () => {
      if (textRef.current && !isExpanded) {
        setIsTruncatable(textRef.current.scrollHeight > textRef.current.clientHeight + 2);
      }
    };
    
    checkTruncation();
    const timeoutId = setTimeout(checkTruncation, 50);
    window.addEventListener('resize', checkTruncation);
    
    return () => {
      clearTimeout(timeoutId);
      window.removeEventListener('resize', checkTruncation);
    };
  }, [text, isExpanded]);

  return (
    <div className="flex flex-col items-start w-full">
      <p 
        ref={textRef}
        className={`text-label leading-relaxed ${!isExpanded ? 'line-clamp-3' : ''}`}
      >
        "{text}{!isExpanded && isTruncatable ? '' : '"'}
      </p>
      {isTruncatable && (
        <button 
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setIsExpanded(!isExpanded);
          }}
          className="text-label mt-0.5 hover:opacity-80 transition-opacity"
        >
          {isExpanded ? 'less' : 'more'}
        </button>
      )}
    </div>
  );
};

const MediaThumbnail = ({ 
  imageUrl, 
  sectionType, 
  isSquareFormat, 
  isPriority,
  className = "" 
}: { 
  imageUrl?: string; 
  sectionType: string; 
  isSquareFormat: boolean; 
  isPriority: boolean;
  className?: string; 
}) => (
  <div className={`overflow-hidden bg-tertiary-system-background ${className}`}>
    {imageUrl ? (
      <img src={imageUrl} className="w-full h-full object-cover" referrerPolicy="no-referrer" loading={isPriority ? "eager" : "lazy"} />
    ) : (
      <div className="w-full h-full flex items-center justify-center text-secondary-label">
        {getIconForType(sectionType)}
      </div>
    )}
  </div>
);

// --- Main Component ---

const MediaCardComponent = ({
  item,
  viewMode = 'grid',
  sectionType: passedSectionType,
  index = 0,
  playingId,
  isPriority = false,
  onItemClick,
  onPlayToggle,
  onAddToAlbum,
  onLogClick,
  onAddToListClick,
  onDelete,
  isOwnProfile
}: MediaCardProps) => {
  const [isFetchingAudio, setIsFetchingAudio] = useState(false);

  // Normalize data across different item shapes
  const mediaItem = item.media || item.media_items || item;
  
  const getImageUrl = (preferBackdrop = false) => {
    if (preferBackdrop) {
      return item.images?.backdropUrl || mediaItem.backdrop_url || item.images?.posterUrl || mediaItem.image_url || mediaItem.image;
    }
    return item.images?.posterUrl || mediaItem.image_url || mediaItem.image;
  };
  
  const imageUrl = getImageUrl(viewMode === 'carousel');
  const playUrl = item.actionButton?.payload || item.secondaryActionButton?.payload || mediaItem.previewUrl || mediaItem.preview_url;
  const title = item.title || item.header?.title || mediaItem.title;
  const subtitle = item.subtitle || item.header?.subtitle || mediaItem.subtitle;
  const sectionType = passedSectionType || mediaItem.media_type || mediaItem.type || item.type;

  const isMusic = sectionType === 'music' || sectionType === 'song';
  const isSquareFormat = isMusic || sectionType === 'podcast' || sectionType === 'podcasts' || sectionType === 'album';
  const showPlayButton = (playUrl || isMusic) && (viewMode === 'grid');

  const handlePlayClick = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!onPlayToggle) return;
    
    if (playingId === item.id) {
      onPlayToggle('', item.id);
      return;
    }

    if (playUrl) {
      onPlayToggle(playUrl, item.id, title, subtitle, imageUrl);
    } else if (isMusic) {
      setIsFetchingAudio(true);
      try {
        const query = `${title} ${subtitle || ''}`.trim();
        const res = await fetchWithBackoff(`https://itunes.apple.com/search?term=${encodeURIComponent(query)}&entity=song&limit=1`);
        const data = await res.json();
        if (data.results && data.results.length > 0 && data.results[0].previewUrl) {
          onPlayToggle(data.results[0].previewUrl, item.id, title, subtitle, imageUrl);
        } else {
          console.warn('No preview URL found on iTunes');
        }
      } catch (error) {
        console.error('Error fetching from iTunes:', error);
      } finally {
        setIsFetchingAudio(false);
      }
    }
  };

  const getAspectRatioClass = (type: string) => {
    switch (type) {
      case 'music':
      case 'song':
      case 'podcasts':
      case 'podcast':
        return 'card-square';
      default:
        return 'card-vertical';
    }
  };

  const fireClick = () => {
    if (onItemClick) {
      if (viewMode === 'recommendation' && item.media_items) {
        // Special case for recommendation passing just the media portion conceptually, 
        // but let's pass the whole media item mimicking the search result shape since that's what onItemClick likely expects.
        onItemClick({
          id: item.media_items.external_id,
          title: item.media_items.title,
          subtitle: item.media_items.subtitle,
          image: item.media_items.image_url,
          type: item.media_items.media_type
        });
      } else {
        onItemClick(item);
      }
    }
  };

  if (viewMode === 'list' || viewMode === 'search-result') {
    return (
      <motion.div 
        key={item.id}
        initial={viewMode === 'search-result' ? { opacity: 0, y: 10 } : {}}
        animate={viewMode === 'search-result' ? { opacity: 1, y: 0 } : {}}
        exit={viewMode === 'search-result' ? { opacity: 0, y: -10 } : {}}
        whileTap={{ scale: 0.98 }}
        onClick={fireClick}
        className="flex items-center gap-4 py-3 border-b border-separator/50 last:border-0 active:opacity-70 transition-all cursor-pointer w-full group"
      >
        <MediaThumbnail
          imageUrl={imageUrl}
          sectionType={sectionType}
          isSquareFormat={isSquareFormat}
          isPriority={isPriority}
          className={`shrink-0 shadow-sm border border-separator/30 ${isSquareFormat ? 'w-14 h-14 rounded-md' : 'w-12 h-16 sm:w-14 sm:h-20 rounded-md'}`}
        />
        <div className="flex-1 min-w-0 pr-2">
          <h3 className="font-sans font-semibold text-base text-label truncate">{title}</h3>
          {subtitle && <p className="font-sans text-sm text-secondary-label truncate">{subtitle}</p>}
          <div className="flex items-center gap-1.5 mt-1 opacity-80">
            <span className="text-[10px] font-medium px-2 py-0.5 rounded text-secondary-label bg-secondary-system-background border border-separator/30 uppercase tracking-widest leading-none">
              {getLabelForType(sectionType)}
            </span>
          </div>
        </div>
        <div className="flex items-center shrink-0">
          {onAddToListClick && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onAddToListClick(item);
              }}
              className="p-2 sm:p-2.5 bg-transparent border border-separator shadow-sm rounded-full text-secondary-label hover:text-label hover:bg-secondary-system-background transition-colors mx-1 group-hover:border-separator/80"
              aria-label="Add to List"
            >
              <ListPlus className="w-5 h-5" />
            </button>
          )}
          {viewMode === 'search-result' && onLogClick && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onLogClick(item);
              }}
              className="p-2 sm:p-2.5 bg-transparent border border-separator shadow-sm rounded-full text-secondary-label hover:text-label hover:bg-secondary-system-background transition-colors mx-1 group-hover:border-separator/80"
            >
              <Star className="w-5 h-5" />
            </button>
          )}
        </div>
      </motion.div>
    );
  }

  if (viewMode === 'carousel') {
    return (
      <motion.div 
        whileTap={{ scale: 0.98 }}
        onClick={fireClick}
        className="w-full relative aspect-video rounded-2xl overflow-hidden bg-secondary-system-background shadow-sm cursor-pointer group shrink-0"
      >
        {imageUrl && (
          <img src={imageUrl} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" referrerPolicy="no-referrer" loading={isPriority ? "eager" : "lazy"} />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent flex flex-col justify-end p-4">
          <h3 className="text-white font-bold text-xl drop-shadow-md truncate">{title}</h3>
          {subtitle && <p className="text-white/80 text-sm font-medium drop-shadow-md truncate">{subtitle}</p>}
        </div>
      </motion.div>
    );
  }

  if (viewMode === 'diary') {
    const dateString = item.date || item.addedAt || item.created_at;
    const date = dateString ? new Date(dateString) : new Date();
    
    return (
      <motion.div 
        onClick={fireClick}
        className="flex gap-4 items-start pb-4 mb-4 border-b border-separator/50 last:border-0 group cursor-pointer active:opacity-60 transition-opacity w-full"
      >
        <div className="w-10 sm:w-12 shrink-0 pt-1 text-center">
          <div className="text-[10px] sm:text-xs uppercase tracking-wider text-secondary-label font-semibold">
            {date.toLocaleDateString('en-US', { month: 'short', timeZone: 'UTC' })}
          </div>
          <div className="text-lg sm:text-xl font-serif font-semibold text-label leading-none my-0.5">
            {date.getUTCDate()}
          </div>
          <div className="text-[10px] sm:text-xs text-secondary-label opacity-70">
            {date.getUTCFullYear()}
          </div>
        </div>
        
        <MediaThumbnail
          imageUrl={imageUrl}
          sectionType={sectionType}
          isSquareFormat={isSquareFormat}
          isPriority={isPriority}
          className={`shrink-0 rounded-md border border-separator/50 shadow-sm ${isSquareFormat ? 'w-14 h-14' : 'w-12 h-16 sm:w-14 sm:h-20'}`}
        />
        
        <div className="flex-1 min-w-0 pt-1">
          <h3 className="font-sans font-semibold text-base sm:text-lg text-label truncate">{title}</h3>
          {subtitle && <p className="font-sans text-sm text-secondary-label truncate mb-1">{subtitle}</p>}
          
          {item.rating > 0 && (
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-0.5 text-label">
                {[1, 2, 3, 4, 5].map((star) => (
                  <div key={star} className="relative w-3.5 h-3.5">
                    <Star className="absolute inset-0 w-3.5 h-3.5 text-separator fill-transparent" />
                    <div 
                      className="absolute inset-0 overflow-hidden" 
                      style={{ width: item.rating >= star ? '100%' : item.rating >= star - 0.5 ? '50%' : '0%' }}
                    >
                      <Star className="w-3.5 h-3.5 text-label fill-label max-w-none" />
                    </div>
                  </div>
                ))}
              </div>
              {item.liked && <Heart className="w-3.5 h-3.5 text-red-500 fill-red-500" />}
              {item.rewatched && <Repeat className="w-3.5 h-3.5 text-ios-blue" />}
            </div>
          )}
          {item.rating === 0 && (item.liked || item.rewatched) && (
            <div className="flex items-center gap-2 mt-1">
              {item.liked && <Heart className="w-3.5 h-3.5 text-red-500 fill-red-500" />}
              {item.rewatched && <Repeat className="w-3.5 h-3.5 text-ios-blue" />}
            </div>
          )}
          {item.reviewText && (
            <ReviewContent text={item.reviewText} hasSpoilers={item.hasSpoilers} />
          )}
        </div>
        {onAddToListClick && (
          <div className="shrink-0 flex items-center pt-2 px-1">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onAddToListClick(item);
              }}
              className="p-2 sm:p-2.5 bg-transparent border border-separator shadow-sm rounded-full text-secondary-label hover:text-label hover:bg-secondary-system-background transition-colors group-hover:border-separator/80"
              aria-label="Add to List"
            >
              <ListPlus className="w-5 h-5" />
            </button>
          </div>
        )}
      </motion.div>
    );
  }

  if (viewMode === 'recommendation') {
    const senderName = item.is_anonymous || !item.sender ? 'Anonymous' : (item.sender.name || item.sender.handle || 'Someone');
    
    return (
      <motion.div 
        layout
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ type: "spring", stiffness: 400, damping: 30, delay: index * 0.1 }}
        className="p-4 rounded-2xl bg-secondary-system-background border border-separator shadow-sm flex flex-col gap-3 relative group w-full"
      >
        <div className="flex items-center justify-between gap-4">
          <button 
            onClick={() => {
              if (!item.is_anonymous && item.sender?.handle) {
                window.history.pushState({}, '', `/@${item.sender.handle}`);
                window.dispatchEvent(new PopStateEvent('popstate'));
              }
            }}
            className={`flex items-center gap-2 text-left ${!item.is_anonymous && item.sender?.handle ? 'cursor-pointer hover:opacity-80 transition-opacity' : 'cursor-default'}`}
          >
            <div className="w-10 h-10 rounded-full bg-system-background flex items-center justify-center shrink-0 overflow-hidden border border-separator">
              {!item.is_anonymous && item.sender?.avatar_url ? (
                <img src={item.sender.avatar_url} alt={senderName} className="w-full h-full object-cover" />
              ) : (
                <Sparkles className="w-5 h-5 text-secondary-label" />
              )}
            </div>
            <div>
              <p className="font-sans text-sm font-medium text-label">
                {senderName}
              </p>
              <p className="font-sans text-xs text-secondary-label">
                {new Date(item.created_at || Date.now()).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
              </p>
            </div>
          </button>

          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-separator !bg-transparent text-secondary-label">
              {getIconForType(sectionType)}
              <span className="text-xs font-medium">{getLabelForType(sectionType)}</span>
            </div>
            {onAddToListClick && (
              <button
                onClick={(e) => { e.stopPropagation(); onAddToListClick(item); }}
                className="p-1.5 rounded-full border border-separator !bg-transparent text-secondary-label hover:text-label hover:border-separator/80 hover:!bg-secondary-system-background transition-colors"
                aria-label="Add to List"
              >
                <ListPlus className="w-4 h-4" />
              </button>
            )}
            {isOwnProfile && onDelete && (
              <button
                onClick={(e) => { e.stopPropagation(); onDelete(item.id); }}
                className="p-1.5 rounded-full border border-separator !bg-transparent text-secondary-label hover:text-red-500 hover:border-red-500/30 hover:!bg-red-500/10 transition-colors"
                aria-label="Delete recommendation"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        <button 
          onClick={fireClick}
          className="flex gap-4 mt-2 text-left hover:opacity-80 transition-opacity group/media"
        >
          <MediaThumbnail
            imageUrl={imageUrl}
            sectionType={sectionType}
            isSquareFormat={isSquareFormat}
            isPriority={isPriority}
            className={`rounded-lg border border-separator shadow-sm ${isSquareFormat ? 'w-16 h-16' : 'w-16 h-24'}`}
          />
          <div className="flex-1 min-w-0 flex flex-col justify-center">
            <h3 className="font-sans font-semibold text-base text-label line-clamp-2">
              {title || 'Unknown Title'}
            </h3>
            {subtitle && (
              <p className="font-sans text-sm text-secondary-label line-clamp-1 mt-0.5">
                {subtitle}
              </p>
            )}
          </div>
        </button>

        {item.message && (
          <div className="mt-2">
            <ExpandableMessage text={item.message} />
          </div>
        )}
      </motion.div>
    );
  }

  // Default Grid View
  return (
    <motion.div 
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.1 }}
      className={`snap-start card-container flex flex-col gap-2 group cursor-pointer ${getAspectRatioClass(sectionType)}`}
      onClick={fireClick}
    >
      <div className="relative overflow-hidden rounded-xl bg-secondary-system-background shadow-sm border border-separator card-image group/thumbnail">
        <MediaThumbnail
          imageUrl={imageUrl}
          sectionType={sectionType}
          isSquareFormat={isSquareFormat}
          isPriority={isPriority}
          className="absolute inset-0 w-full h-full transition-transform duration-700 ease-out group-hover/thumbnail:scale-105"
        />
        
        {/* Subtle inner shadow for depth */}
        <div className="absolute inset-0 shadow-[inset_0_0_0_1px_rgba(0,0,0,0.05)] pointer-events-none rounded-xl" />
        {/* Hover overlay */}
        <div className="absolute inset-0 bg-transparent group-hover/thumbnail:bg-black/20 transition-colors duration-300 pointer-events-none z-10" />
        
        {showPlayButton && (
          <button
            onClick={handlePlayClick}
            disabled={isFetchingAudio}
            className="absolute bottom-2 right-2 w-8 h-8 rounded-full bg-black/50 backdrop-blur-md flex items-center justify-center text-white hover:bg-black/70 transition-colors z-20 disabled:opacity-50"
          >
            {isFetchingAudio ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : playingId === item.id ? (
              <Pause className="w-4 h-4" />
            ) : (
              <Play className="w-4 h-4 ml-0.5" />
            )}
          </button>
        )}
        {(sectionType === 'music' || sectionType === 'song') && onAddToAlbum ? (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onAddToAlbum(item);
            }}
            className="absolute top-2 right-2 w-8 h-8 rounded-full bg-black/50 backdrop-blur-md flex items-center justify-center text-white hover:bg-black/70 transition-colors z-20 opacity-0 group-hover:opacity-100"
          >
            <ListPlus className="w-4 h-4" />
          </button>
        ) : onAddToListClick ? (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onAddToListClick(item);
            }}
            className="absolute top-2 right-2 w-8 h-8 rounded-full bg-black/50 backdrop-blur-md flex items-center justify-center text-white hover:bg-black/70 transition-colors z-20 opacity-0 group-hover:opacity-100"
          >
            <ListPlus className="w-4 h-4" />
          </button>
        ) : null}
      </div>
      <div className="w-full mt-1">
        <h3 className="font-sans text-base font-semibold leading-tight text-label card-text-truncate">
          {title}
        </h3>
        {subtitle && (
          <p className="font-sans text-sm font-medium leading-relaxed text-secondary-label card-text-truncate mt-0.5">
            {subtitle}
          </p>
        )}
      </div>
    </motion.div>
  );
};

export const MediaCard = memo(MediaCardComponent, (prevProps, nextProps) => 
  prevProps.item.id === nextProps.item.id && 
  prevProps.playingId === nextProps.playingId &&
  prevProps.viewMode === nextProps.viewMode
);
