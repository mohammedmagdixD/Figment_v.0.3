import React, { useState, useEffect, useRef } from 'react';
import { Loader2, Sparkles, Music, Headphones, Book, Film, Tv, Trash2 } from 'lucide-react';
import { getRecommendations, deleteRecommendation } from '../services/supabaseData';
import { useAuth } from '../contexts/AuthContext';
import { motion, AnimatePresence } from 'motion/react';
import { haptics } from '../utils/haptics';
import { MediaDetailsModal } from '../components/MediaDetailsModal';
import { ConfirmDeleteModal } from '../components/ConfirmDeleteModal';
import { SearchResult } from '../services/api';

const getIconForType = (type: string) => {
  switch (type) {
    case 'music': return <Music className="w-4 h-4" />;
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
    default: return type.charAt(0).toUpperCase() + type.slice(1);
  }
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
        className={`text-[var(--label)] leading-relaxed ${!isExpanded ? 'line-clamp-3' : ''}`}
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
          className="text-[var(--label)] mt-0.5 hover:opacity-80 transition-opacity"
        >
          {isExpanded ? 'less' : 'more'}
        </button>
      )}
    </div>
  );
};

export function RecommendationsView({ viewingUserId }: { viewingUserId?: string }) {
  const { user } = useAuth();
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedMedia, setSelectedMedia] = useState<SearchResult | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // Use viewingUserId if provided, otherwise fallback to the logged-in user
  const targetUserId = viewingUserId || user?.id;
  const isOwnProfile = user?.id === targetUserId;

  useEffect(() => {
    async function fetchRecommendations() {
      if (!targetUserId) return;
      try {
        setIsLoading(true);
        const data = await getRecommendations(targetUserId);
        setRecommendations(data);
      } catch (error) {
        console.error('Failed to fetch recommendations:', error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchRecommendations();
  }, [targetUserId]);

  const handleDelete = async (id: string) => {
    try {
      haptics.medium();
      await deleteRecommendation(id);
      setRecommendations(prev => prev.filter(rec => rec.id !== id));
    } catch (error) {
      console.error('Failed to delete recommendation:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full flex-1">
        <Loader2 className="w-8 h-8 text-[var(--secondary-label)] animate-spin" />
      </div>
    );
  }

  if (recommendations.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full flex-1 px-4 text-center">
        <div className="w-16 h-16 mb-4 rounded-full bg-[var(--secondary-system-background)] flex items-center justify-center">
          <Sparkles className="w-8 h-8 text-[var(--secondary-label)]" />
        </div>
        <h2 className="font-serif text-xl font-semibold text-[var(--label)] mb-2">
          No Recommendations Yet :/
        </h2>
        <p className="font-sans text-sm text-[var(--secondary-label)] max-w-[250px]">
          Share your profile to get personalized recommendations from your friends.
        </p>
      </div>
    );
  }

  return (
    <div className="pb-4 px-4 pt-4">
      <h2 className="font-serif text-2xl font-semibold text-[var(--label)] mb-4">
        For You
      </h2>
      <div className="space-y-4">
        <AnimatePresence mode="popLayout">
          {recommendations.map((rec, index) => {
            const media = rec.media_items;
            const senderName = rec.is_anonymous || !rec.sender ? 'Anonymous' : (rec.sender.name || rec.sender.handle || 'Someone');
            
            return (
              <motion.div 
                key={rec.id} 
                layout
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ type: "spring", stiffness: 400, damping: 30, delay: index * 0.1 }}
                className="p-4 rounded-2xl bg-[var(--secondary-system-background)] border border-[var(--separator)] shadow-sm flex flex-col gap-3 relative group"
              >
              <div className="flex items-center justify-between gap-4">
                <button 
                  onClick={() => {
                    if (!rec.is_anonymous && rec.sender?.handle) {
                      window.history.pushState({}, '', `/@${rec.sender.handle}`);
                      window.dispatchEvent(new PopStateEvent('popstate'));
                    }
                  }}
                  className={`flex items-center gap-2 text-left ${!rec.is_anonymous && rec.sender?.handle ? 'cursor-pointer hover:opacity-80 transition-opacity' : 'cursor-default'}`}
                >
                  <div className="w-10 h-10 rounded-full bg-[var(--system-background)] flex items-center justify-center shrink-0 overflow-hidden border border-[var(--separator)]">
                    {!rec.is_anonymous && rec.sender?.avatar_url ? (
                      <img src={rec.sender.avatar_url} alt={senderName} className="w-full h-full object-cover" />
                    ) : (
                      <Sparkles className="w-5 h-5 text-[var(--secondary-label)]" />
                    )}
                  </div>
                  <div>
                    <p className="font-sans text-sm font-medium text-[var(--label)]">
                      {senderName}
                    </p>
                    <p className="font-sans text-xs text-[var(--secondary-label)]">
                      {new Date(rec.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </p>
                  </div>
                </button>

                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-[var(--separator)] !bg-transparent text-[var(--secondary-label)]">
                    {getIconForType(media?.media_type)}
                    <span className="text-xs font-medium">{getLabelForType(media?.media_type)}</span>
                  </div>
                  {isOwnProfile && (
                    <button
                      onClick={() => setDeleteConfirmId(rec.id)}
                      className="p-1.5 rounded-full border border-[var(--separator)] !bg-transparent text-[var(--secondary-label)] hover:text-red-500 hover:border-red-500/30 hover:!bg-red-500/10 transition-colors"
                      aria-label="Delete recommendation"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>

              <button 
                onClick={() => {
                  if (media) {
                    setSelectedMedia({
                      id: media.external_id,
                      title: media.title,
                      subtitle: media.subtitle,
                      image: media.image_url,
                      type: media.media_type
                    });
                  }
                }}
                className="flex gap-4 mt-2 text-left hover:opacity-80 transition-opacity group/media"
              >
                <div className="w-16 h-24 shrink-0 rounded-lg overflow-hidden bg-[var(--system-background)] border border-[var(--separator)] shadow-sm">
                  {media?.image_url ? (
                    <img src={media.image_url} alt={media.title} className="w-full h-full object-cover transition-transform duration-300 group-hover/media:scale-105" referrerPolicy="no-referrer" loading="lazy" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      {getIconForType(media?.media_type)}
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0 flex flex-col justify-center">
                  <h3 className="font-sans font-semibold text-base text-[var(--label)] line-clamp-2">
                    {media?.title || 'Unknown Title'}
                  </h3>
                  <p className="font-sans text-sm text-[var(--secondary-label)] line-clamp-1 mt-0.5">
                    {media?.subtitle}
                  </p>
                </div>
              </button>

              {rec.message && (
                <div className="mt-2">
                  <ExpandableMessage text={rec.message} />
                </div>
              )}
            </motion.div>
          );
        })}
        </AnimatePresence>
      </div>

      <AnimatePresence>
        {selectedMedia && (
          <MediaDetailsModal
            item={selectedMedia}
            onClose={() => setSelectedMedia(null)}
          />
        )}
      </AnimatePresence>

      <ConfirmDeleteModal
        isOpen={!!deleteConfirmId}
        onClose={() => setDeleteConfirmId(null)}
        onConfirm={() => {
          if (deleteConfirmId) {
            handleDelete(deleteConfirmId);
            setDeleteConfirmId(null);
          }
        }}
        title="Delete Item"
        message="Are you sure you want to delete this item from your recommendation?"
      />
    </div>
  );
}
