import useSWR from 'swr';
import { getUserDiary } from '../services/supabaseData';
import { DiaryEntry } from '../components/DiaryView';

export function useDiary(userId: string | undefined) {
  const { data, error, mutate, isLoading } = useSWR(
    userId ? ['diary', userId] : null,
    ([_, id]) => getUserDiary(id),
    {
      revalidateOnFocus: false,
      dedupingInterval: 30000,
    }
  );

  const diary = data ? data.map((d: any) => ({
    id: d.id,
    date: d.logged_date,
    rating: d.rating,
    liked: d.is_liked,
    rewatched: d.is_rewatch,
    reviewText: d.review_text,
    hasSpoilers: d.is_spoiler,
    media: {
      id: d.media_items?.external_id,
      title: d.media_items?.title,
      subtitle: d.media_items?.subtitle,
      image: d.media_items?.image_url,
      type: d.media_items?.media_type
    }
  } as DiaryEntry)) : [];

  return { diary, isLoading, error, refetch: mutate };
}
