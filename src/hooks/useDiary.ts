import { useState, useEffect } from 'react';
import { getUserDiary } from '../services/supabaseData';
import { DiaryEntry } from '../components/DiaryView';

export function useDiary(userId: string | undefined) {
  const [diary, setDiary] = useState<DiaryEntry[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchDiary = async () => {
    if (!userId) return;
    try {
      setIsLoading(true);
      setError(null);
      const data = await getUserDiary(userId);
      
      const formattedDiary = data.map((d: any) => ({
        id: d.id,
        date: d.logged_date,
        rating: d.rating,
        liked: d.is_liked,
        rewatched: d.is_rewatch,
        media: {
          id: d.media_items.external_id,
          title: d.media_items.title,
          subtitle: d.media_items.subtitle,
          image: d.media_items.image_url,
          type: d.media_items.media_type
        }
      }));
      
      setDiary(formattedDiary);
    } catch (err) {
      console.error('Failed to fetch diary:', err);
      setError(err instanceof Error ? err : new Error('Unknown error'));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDiary();
  }, [userId]);

  return { diary, isLoading, error, refetch: fetchDiary };
}
