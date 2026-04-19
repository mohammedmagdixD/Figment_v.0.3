import useSWR from 'swr';
import { useMemo } from 'react';
import { getUserShelves, updateShelfOrder } from '../services/supabaseData';

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

export function useShelves(userId: string | undefined) {
  const { data, error, mutate, isLoading } = useSWR(
    userId ? ['shelves', userId] : null,
    ([_, id]) => getUserShelves(id),
    {
      revalidateOnFocus: false,
      dedupingInterval: 30000,
    }
  );

  const shelves = useMemo(() => {
    return data ? data.map((s: any) => ({
      ...s,
      title: getStandardShelfTitle(s.media_type || s.type, s.title)
    })) : [];
  }, [data]);

  const handleReorder = async (newShelves: any[]) => {
    if (!userId) return;
    
    // Map the internal shelves back to the expected DB response format if needed
    // or just directly use newShelves since our cache holds the mapped/unmapped structure
    try {
      const shelfIds = newShelves.map(s => s.id);
      
      await mutate(
        async () => {
          await updateShelfOrder(userId, shelfIds);
          // Return the updated array to populate SWR cache (if you had a fetcher, you'd fetch here)
          return newShelves; 
        },
        { 
          // Optimistic UI state
          optimisticData: newShelves, 
          // Roll back to the original SWR cache if the async throws
          rollbackOnError: true,
          populateCache: true,
          revalidate: false, // Wait until next interval or forced fetch
        }
      );
    } catch (err) {
      console.error('Failed to update shelf order:', err);
    }
  };

  return { 
    shelves, 
    setShelves: handleReorder, 
    isLoading, 
    error, 
    refetch: mutate 
  };
}
