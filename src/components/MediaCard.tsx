import React, { useState, memo } from 'react';
import { motion } from 'motion/react';
import { Play, Pause, ListPlus, Loader2 } from 'lucide-react';
import { fetchWithBackoff } from '../services/api';
import { UniversalMediaData } from '../types/universal';

interface MediaCardProps {
  item: UniversalMediaData;
  sectionType: string;
  index: number;
  playingId: string | null;
  isPriority?: boolean;
  onItemClick: (item: UniversalMediaData) => void;
  onPlayToggle: (url: string, id: string) => void;
  onAddToAlbum?: (item: UniversalMediaData) => void;
}

const MediaCardComponent = ({
  item,
  sectionType,
  index,
  playingId,
  isPriority = false,
  onItemClick,
  onPlayToggle,
  onAddToAlbum
}: MediaCardProps) => {
  const [isFetchingAudio, setIsFetchingAudio] = useState(false);

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

  // Safely grab the image whether it's wrapped in the normalized 'images' object 
  // OR if it's arriving as a raw database row.
  const mediaItem = (item as any).media_items || item;
  const imageUrl = item.images?.posterUrl || mediaItem.image_url || mediaItem.image;
  const playUrl = item.actionButton?.payload || item.secondaryActionButton?.payload || mediaItem.previewUrl || mediaItem.preview_url;
  const title = item.header?.title || mediaItem.title;
  const subtitle = item.header?.subtitle || mediaItem.subtitle;

  const isMusic = sectionType === 'music' || sectionType === 'song' || mediaItem.media_type === 'music' || mediaItem.media_type === 'song';
  const showPlayButton = playUrl || isMusic;

  const handlePlayClick = async (e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (playingId === item.id) {
      onPlayToggle('', item.id); // This will pause it in MediaScroller
      return;
    }

    if (playUrl) {
      onPlayToggle(playUrl, item.id);
    } else if (isMusic) {
      setIsFetchingAudio(true);
      try {
        const query = `${title} ${subtitle || ''}`.trim();
        const res = await fetchWithBackoff(`https://itunes.apple.com/search?term=${encodeURIComponent(query)}&entity=song&limit=1`);
        const data = await res.json();
        if (data.results && data.results.length > 0 && data.results[0].previewUrl) {
          onPlayToggle(data.results[0].previewUrl, item.id);
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

  return (
    <motion.div 
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.1 }}
      className={`snap-start card-container flex flex-col gap-2 group cursor-pointer ${getAspectRatioClass(sectionType)}`}
      onClick={() => onItemClick(item)}
    >
      <div className="relative overflow-hidden rounded-xl bg-[var(--secondary-system-background)] shadow-sm border border-[var(--separator)] card-image">
        
        {/* Skeleton Placeholder */}
        {!imageUrl && (
          <div className="absolute inset-0 bg-[var(--secondary-system-background)] animate-pulse" />
        )}

        {/* Image */}
        {imageUrl ? (
          <motion.img 
            src={imageUrl} 
            alt={title}
            loading={isPriority ? "eager" : "lazy"}
            className="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 ease-out"
            referrerPolicy="no-referrer"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center bg-[var(--secondary-system-background)] p-4 text-center overflow-auto">
            <span className="text-[8px] font-mono text-[var(--secondary-label)] break-all">
              {JSON.stringify(item).substring(0, 200)}
            </span>
          </div>
        )}
        
        {/* Subtle inner shadow for depth */}
        <div className="absolute inset-0 shadow-[inset_0_0_0_1px_rgba(0,0,0,0.05)] dark:shadow-[inset_0_0_0_1px_rgba(255,255,255,0.05)] pointer-events-none rounded-xl" />
        {/* Hover overlay */}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 dark:group-hover:bg-white/10 transition-colors duration-300" />
        
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
        {(sectionType === 'music' || sectionType === 'song') && onAddToAlbum && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onAddToAlbum(item);
            }}
            className="absolute top-2 right-2 w-8 h-8 rounded-full bg-black/50 backdrop-blur-md flex items-center justify-center text-white hover:bg-black/70 transition-colors z-20 opacity-0 group-hover:opacity-100"
          >
            <ListPlus className="w-4 h-4" />
          </button>
        )}
      </div>
      <div className="w-full">
        <h3 className="font-sans text-base font-semibold leading-tight text-[var(--label)] card-text-truncate">
          {title}
        </h3>
        {subtitle && (
          <p className="font-sans text-sm font-medium leading-relaxed text-[var(--secondary-label)] card-text-truncate mt-0.5">
            {subtitle}
          </p>
        )}
      </div>
    </motion.div>
  );
};

export const MediaCard = memo(MediaCardComponent, (prevProps, nextProps) => 
  prevProps.item.id === nextProps.item.id && prevProps.playingId === nextProps.playingId
);
