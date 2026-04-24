import React, { useState, useEffect, useRef, Suspense, lazy } from 'react';
import { Loader2, Sparkles } from 'lucide-react';
import { getRecommendations, deleteRecommendation } from '../services/supabaseData';
import { useAuth } from '../contexts/AuthContext';
import { motion, AnimatePresence } from 'motion/react';
import { haptics } from '../utils/haptics';
import { ConfirmDeleteModal } from '../components/ConfirmDeleteModal';
import { SearchResult } from '../services/api';
import { MediaCard } from '../components/MediaCard';
import { handleAddToList } from '../utils/listManager';

const MediaDetailsModal = lazy(() => import('../components/MediaDetailsModal').then(module => ({ default: module.MediaDetailsModal })));

export const RecommendationsView = React.memo(function RecommendationsView({ viewingUserId }: { viewingUserId?: string }) {
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
        <Loader2 className="w-8 h-8 text-secondary-label animate-spin" />
      </div>
    );
  }

  if (recommendations.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full flex-1 px-4 text-center">
        <div className="w-16 h-16 mb-4 rounded-full bg-secondary-system-background flex items-center justify-center">
          <Sparkles className="w-8 h-8 text-secondary-label" />
        </div>
        <h2 className="font-serif text-xl font-semibold text-label mb-2">
          No Recommendations Yet :/
        </h2>
        <p className="font-sans text-sm text-secondary-label max-w-[250px]">
          Share your profile to get personalized recommendations from your friends.
        </p>
      </div>
    );
  }

  return (
    <div className="pb-28 px-4 pt-4">
      <h2 className="font-serif text-2xl font-semibold text-label mb-4">
        For You
      </h2>
      <div className="space-y-4">
        <AnimatePresence mode="popLayout">
          {recommendations.map((rec, index) => (
            <MediaCard
              key={rec.id}
              item={rec}
              viewMode="recommendation"
              index={index}
              isOwnProfile={isOwnProfile}
              onDelete={setDeleteConfirmId}
              onItemClick={setSelectedMedia}
              onAddToListClick={(rec.sender_id === user?.id || rec.sender?.id === user?.id) ? undefined : () => handleAddToList(user?.id, rec.media_items || rec)}
            />
          ))}
        </AnimatePresence>
      </div>

      <AnimatePresence>
        {selectedMedia && (
          <Suspense fallback={<div />}>
            <MediaDetailsModal
              item={selectedMedia}
              onClose={() => setSelectedMedia(null)}
              onAddToListClick={() => {
                // Determine if the original recommendation was sent by current user
                const rec = recommendations.find(r => r.media_item_id === selectedMedia.id || (r.media_items && r.media_items.external_id === selectedMedia.id));
                if (rec && (rec.sender_id === user?.id || rec.sender?.id === user?.id)) {
                  // Do nothing, it was sent by user
                } else {
                  handleAddToList(user?.id, selectedMedia);
                }
              }}
            />
          </Suspense>
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
});
