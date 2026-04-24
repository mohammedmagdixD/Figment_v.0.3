import { addToIntentList } from '../services/supabaseData';
import { showToast } from '../components/Toast';
import { mutate } from 'swr';
import { haptics } from './haptics';

export async function handleAddToList(userId: string | undefined, item: any) {
  if (!userId) {
    showToast("Please sign in to add to your list.", true);
    return;
  }

  try {
    haptics.light();
    const res = await addToIntentList(userId, item);
    if (res.status === 'ALREADY_LOGGED') {
      haptics.error();
      showToast(res.message, true); // Pop-up notification for already rated
    } else {
      haptics.success();
      showToast(`Added to ${['movie', 'tv', 'anime'].includes(item.type || item.mediaType) ? 'Watchlist' : 'Reading List'}!`);
      // Update cache
      await mutate(['shelves', userId]);
    }
  } catch (err: any) {
    console.error(err);
    haptics.error();
    showToast(`Failed: ${err.message || 'Unknown error code'}`, true);
  }
}
