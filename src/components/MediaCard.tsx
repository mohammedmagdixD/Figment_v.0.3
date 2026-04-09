import React, { useState, memo } from 'react';
import { motion } from 'motion/react';
import { Play, Pause, ListPlus } from 'lucide-react';
import { UniversalMediaData } from '../types/universal';

interface MediaCardProps {
  item: any;
  sectionType: string;
  index: number;
  playingId: string | null;
  isPriority?: boolean;
  onItemClick: (item: any) => void;
  onPlayToggle: (url: string, id: string) => void;
  onAddToAlbum?: (item: any) => void;
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
  const [isLoaded, setIsLoaded] = useState(false);

  const getAspectRatioClass = (type: string) => {
    switch (type) {
      case 'movies':
      case 'tv':
        return 'aspect-[2/3] w-[140px]';
      case 'books':
        return 'aspect-[2/3] w-[140px]';
      case 'music':
      case 'song':
        return 'aspect-square w-[140px]';
      case 'podcasts':
        return 'aspect-square w-[140px]';
      case 'games':
        return 'aspect-[3/4] w-[140px]';
      default:
        return 'aspect-[2/3] w-[140px]';
    }
  };

  const getImageUrl = (item: any) => {
    if (!item) return undefined;
    if (item.image) return item.image;
    if (item.images?.posterUrl) return item.images.posterUrl;
    if (item.images?.[0]?.url) return item.images[0].url;
    if (item.poster_url) return item.poster_url;
    if (item.poster_path) return `https://image.tmdb.org/t/p/w500${item.poster_path}`;
    if (item.main_picture?.large) return item.main_picture.large;
    if (item.main_picture?.medium) return item.main_picture.medium;
    if (item.volumeInfo?.imageLinks?.thumbnail) return item.volumeInfo.imageLinks.thumbnail;
    return undefined;
  };

  const imageUrl = getImageUrl(item);

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
        {(!isLoaded && imageUrl) && (
          <div className="absolute inset-0 bg-[var(--secondary-system-background)] animate-pulse" />
        )}

        {/* Image */}
        {imageUrl ? (
          <motion.img 
            initial={{ opacity: 0 }}
            animate={{ opacity: isLoaded ? 1 : 0 }}
            src={imageUrl} 
            alt={item.title || item.header?.title}
            loading={isPriority ? "eager" : "lazy"}
            onLoad={() => setIsLoaded(true)}
            onError={() => setIsLoaded(true)}
            className="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 ease-out"
            referrerPolicy="no-referrer"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center bg-[var(--secondary-system-background)] p-4 text-center">
            <span className="text-xs font-medium text-[var(--secondary-label)] line-clamp-3">
              {item.title || item.header?.title || 'No Image'}
            </span>
          </div>
        )}
        
        {/* Subtle inner shadow for depth */}
        <div className="absolute inset-0 shadow-[inset_0_0_0_1px_rgba(0,0,0,0.05)] dark:shadow-[inset_0_0_0_1px_rgba(255,255,255,0.05)] pointer-events-none rounded-xl" />
        {/* Hover overlay */}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 dark:group-hover:bg-white/10 transition-colors duration-300" />
        {(item.previewUrl || (item.secondaryActionButton?.type === 'audio' && item.secondaryActionButton?.payload)) && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              const url = item.previewUrl || item.secondaryActionButton?.payload;
              if (url) onPlayToggle(url, item.id?.toString());
            }}
            className="absolute bottom-2 right-2 w-8 h-8 rounded-full bg-black/50 backdrop-blur-md flex items-center justify-center text-white hover:bg-black/70 transition-colors z-20"
          >
            {playingId === item.id?.toString() ? (
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
          {item.title || item.header?.title}
        </h3>
        <p className="font-sans text-sm font-medium leading-relaxed text-[var(--secondary-label)] card-text-truncate mt-0.5">
          {item.subtitle || item.header?.subtitle}
        </p>
      </div>
    </motion.div>
  );
};

export const MediaCard = memo(MediaCardComponent, (prevProps, nextProps) => prevProps.item.id === nextProps.item.id && prevProps.playingId === nextProps.playingId);
