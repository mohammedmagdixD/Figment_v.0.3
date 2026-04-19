import useSWR, { mutate as globalMutate } from 'swr';
import { useMemo } from 'react';
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

  const diary = useMemo(() => {
    return data ? data.map((d: any) => ({
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
  }, [data]);

  const addDiaryEntryOptimistic = async (
    fakeBackendEntry: any,
    networkAction: () => Promise<void>
  ) => {
    if (!userId) return;

    await mutate(
      async (currentData: any) => {
        const optimisticData = currentData ? [fakeBackendEntry, ...currentData] : [fakeBackendEntry];
        try {
          await networkAction();
        } catch (e) {
          throw e; // throw to trigger rollback
        }
        return optimisticData;
      },
      {
        optimisticData: (currentData: any) => {
          return currentData ? [fakeBackendEntry, ...currentData] : [fakeBackendEntry];
        },
        rollbackOnError: true,
        populateCache: true,
        revalidate: false
      }
    );
    
    // As a safeguard, ensure shelves mutate eventually
    globalMutate(['shelves', userId]);
  };

  return { 
    diary, 
    isLoading, 
    error, 
    refetch: mutate,
    addDiaryEntryOptimistic
  };
}
