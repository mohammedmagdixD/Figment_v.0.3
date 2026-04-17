import useSWR from 'swr';
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

  const shelves = data ? data.map((s: any) => ({
    ...s,
    title: getStandardShelfTitle(s.media_type || s.type, s.title)
  })) : [];

  const handleReorder = async (newShelves: any[]) => {
    // 1. Optimistic UI Mutator - Instant screen update without waiting for DB response.
    mutate(newShelves, false); 
    
    if (!userId) return;
    try {
      const shelfIds = newShelves.map(s => s.id);
      await updateShelfOrder(userId, shelfIds);
      // Validated in background; mutate again to ensure sync if needed
      mutate();
    } catch (err) {
      console.error('Failed to update shelf order:', err);
      // Automatic silent rollback if database operation fails
      mutate(); 
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
