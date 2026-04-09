import { useState, useEffect } from 'react';
import { getUserShelves, updateShelfOrder } from '../services/supabaseData';

export function useShelves(userId: string | undefined) {
  const [shelves, setShelves] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchShelves = async () => {
    if (!userId) return;
    try {
      setIsLoading(true);
      setError(null);
      const data = await getUserShelves(userId);
      
      const getStandardShelfTitle = (type: string, originalTitle: string) => {
        switch(type?.toLowerCase()) {
          case 'movie': return 'Films';
          case 'tv': return 'TV Shows';
          case 'music': return 'Music';
          case 'anime': return 'Anime';
          case 'manga': return 'Manga';
          case 'book': return 'Books';
          case 'podcast': return 'Podcasts';
          case 'webnovel': return 'Webnovels';
          default: return originalTitle;
        }
      };

      const standardizedShelves = data.map((s: any) => ({
        ...s,
        title: getStandardShelfTitle(s.media_type || s.type, s.title)
      }));
      
      setShelves(standardizedShelves);
    } catch (err) {
      console.error('Failed to fetch shelves:', err);
      setError(err instanceof Error ? err : new Error('Unknown error'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleReorder = async (newShelves: any[]) => {
    setShelves(newShelves);
    if (!userId) return;
    try {
      const shelfIds = newShelves.map(s => s.id);
      await updateShelfOrder(userId, shelfIds);
    } catch (err) {
      console.error('Failed to update shelf order:', err);
      // Optionally revert state here if needed
    }
  };

  useEffect(() => {
    fetchShelves();
  }, [userId]);

  return { shelves, setShelves: handleReorder, isLoading, error, refetch: fetchShelves };
}
