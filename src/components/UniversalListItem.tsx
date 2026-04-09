import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Play, Pause, Music, Film, Tv, BookOpen } from 'lucide-react';

interface UniversalListItemProps {
  title: string;
  subtitle?: string;
  imageUrl?: string | null;
  icon?: 'music' | 'film' | 'tv' | 'book';
  imageStyle?: 'circle' | 'square' | 'vertical';
  onClick?: () => void;
  actionButton?: React.ReactNode;
  rightContent?: React.ReactNode;
}

export function UniversalListItem({ 
  title, 
  subtitle, 
  imageUrl, 
  icon = 'music', 
  imageStyle = 'circle',
  onClick,
  actionButton,
  rightContent
}: UniversalListItemProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  
  const renderIcon = () => {
    switch (icon) {
      case 'film': return <Film className="w-5 h-5 text-[var(--secondary-label)]" />;
      case 'tv': return <Tv className="w-5 h-5 text-[var(--secondary-label)]" />;
      case 'book': return <BookOpen className="w-5 h-5 text-[var(--secondary-label)]" />;
      case 'music':
      default: return <Music className="w-5 h-5 text-[var(--secondary-label)]" />;
    }
  };

  const getImageContainerClasses = () => {
    switch (imageStyle) {
      case 'square': return 'w-12 h-12 rounded-md';
      case 'vertical': return 'w-10 h-14 rounded-md';
      case 'circle':
      default: return 'w-12 h-12 rounded-full';
    }
  };

  return (
    <div 
      className={`flex items-center gap-4 py-3 border-b border-[var(--separator)] last:border-0 ${onClick ? 'cursor-pointer hover:opacity-80 transition-opacity' : ''}`}
      onClick={onClick}
    >
      <div className={`${getImageContainerClasses()} overflow-hidden bg-[var(--tertiary-system-background)] shrink-0 relative flex items-center justify-center border border-[var(--separator)]`}>
        {imageStyle === 'circle' && (
          <div className="absolute inset-0 rounded-full border-[3px] border-ink-black/90 dark:border-white/10 pointer-events-none z-10 shadow-inner" />
        )}
        {imageUrl ? (
          <>
            {/* Skeleton Placeholder */}
            {!isLoaded && (
              <div className="absolute inset-0 bg-[var(--secondary-system-background)] animate-pulse" />
            )}
            
            <motion.img 
              initial={{ opacity: 0 }}
              animate={{ opacity: isLoaded ? 1 : 0 }}
              src={imageUrl || undefined} 
              alt={title} 
              loading="lazy"
              onLoad={() => setIsLoaded(true)}
              onError={() => setIsLoaded(true)}
              className="absolute inset-0 w-full h-full object-cover" 
              referrerPolicy="no-referrer" 
            />
            {actionButton && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/30 hover:bg-black/50 transition-colors z-20">
                {actionButton}
              </div>
            )}
          </>
        ) : (
          renderIcon()
        )}
      </div>
      <div className="flex-1 min-w-0">
        <h4 className="font-sans text-base font-semibold text-[var(--label)] truncate">
          {title}
        </h4>
        {subtitle && (
          <p className="font-sans text-sm text-[var(--secondary-label)] truncate mt-0.5">
            {subtitle}
          </p>
        )}
      </div>
      {rightContent && (
        <div className="shrink-0">
          {rightContent}
        </div>
      )}
    </div>
  );
}
