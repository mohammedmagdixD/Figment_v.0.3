/*
 * RLS Policies for `recommendations` table:
 * 
 * -- Enable RLS
 * ALTER TABLE recommendations ENABLE ROW LEVEL SECURITY;
 * 
 * -- Allow anyone (authenticated or anon) to insert a recommendation
 * CREATE POLICY "Anyone can insert recommendations" ON recommendations
 *   FOR INSERT WITH CHECK (true);
 * 
 * -- Allow users to view only their own received recommendations
 * CREATE POLICY "Users can view their own recommendations" ON recommendations
 *   FOR SELECT USING (auth.uid() = recipient_id);
 */
import { supabase } from './supabase';
import { UniversalMediaData } from '../types/universal';

export async function getUserByHandle(handle: string) {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('id')
      .eq('handle', handle)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // Not found
        return null;
      }
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Error fetching user by handle:', error);
    throw error;
  }
}

export async function upsertUserSocials(socials: any[]) {
  try {
    const { data, error } = await supabase
      .from('user_socials')
      .upsert(socials, { onConflict: 'id' })
      .select();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error upserting user socials:', error);
    throw error;
  }
}

export async function deleteUserSocial(id: string) {
  try {
    const { error } = await supabase
      .from('user_socials')
      .delete()
      .eq('id', id);

    if (error) throw error;
  } catch (error) {
    console.error('Error deleting user social:', error);
    throw error;
  }
}
export async function getUserProfile(userId: string) {
  try {
    const [userResponse, socialsResponse] = await Promise.all([
      supabase.from('users').select('*').eq('id', userId).single(),
      supabase.from('user_socials').select('*').eq('user_id', userId).order('position', { ascending: true })
    ]);

    if (userResponse.error) throw userResponse.error;
    if (socialsResponse.error) throw socialsResponse.error;

    return {
      ...userResponse.data,
      socials: socialsResponse.data || []
    };
  } catch (error) {
    console.error('Error fetching user profile:', error);
    throw error;
  }
}

export async function getUserShelves(userId: string) {
  try {
    const { data, error } = await supabase
      .from('profile_sections')
      .select(`
        *,
        section_items (
          *,
          media_items (
            *
          )
        )
      `)
      .eq('user_id', userId)
      .order('display_order', { ascending: true });

    if (error) throw error;

    return data.map((section: any) => {
      const items: UniversalMediaData[] = (section.section_items || [])
        .sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        .filter((si: any) => si.media_items)
        .map((si: any) => {
          const media = si.media_items;
          
          // Handle potential JSON fields if they are stored as strings or objects
          const header = media.header || { title: media.title || '', subtitle: media.subtitle || '' };
          const images = {
            backdropUrl: media.images?.backdropUrl || media.backdrop_url || media.backdropUrl || null,
            posterUrl: media.image_url || media.images?.posterUrl || media.poster_url || media.posterUrl || '',
            backdropFallback: media.images?.backdropFallback || media.backdrop_fallback || media.backdropFallback || false,
          };
          
          return {
            id: media.external_id || media.id || String(si.id),
            mediaType: media.media_type || media.mediaType || 'unknown',
            addedAt: si.created_at,
            images,
            header,
            tagline: media.tagline || undefined,
            stats: media.stats || [],
            metadata: media.metadata || [],
            description: media.description || '',
            userStats: {
              rating: si.rating || media.rating,
              dateAdded: si.created_at || si.createdAt || media.created_at || media.createdAt,
            },
            scrollableSections: media.scrollable_sections || media.scrollableSections || {},
            actionButton: media.action_button || media.actionButton || undefined,
            secondaryActionButton: media.secondary_action_button || media.secondaryActionButton || undefined,
            relatedLists: media.related_lists || media.relatedLists || undefined,
            streamingLinks: media.streaming_links || media.streamingLinks || undefined,
          } as UniversalMediaData;
        });

      return {
        ...section,
        type: section.media_type || section.type,
        items
      };
    });
  } catch (error) {
    console.error('Error fetching user shelves:', error);
    throw error;
  }
}

export async function updateShelfOrder(userId: string, shelfIds: string[]) {
  try {
    const updatePromises = shelfIds.map((id, index) => 
      supabase
        .from('profile_sections')
        .update({ display_order: index })
        .eq('id', id)
        .eq('user_id', userId)
    );

    const results = await Promise.all(updatePromises);
    
    // Check for any errors in the results
    for (const result of results) {
      if (result.error) throw result.error;
    }
  } catch (error) {
    console.error('Error updating shelf order:', error);
    throw error;
  }
}

export async function getUserMediaInteraction(userId: string, externalId: string, mediaType: string) {
  try {
    const { data, error } = await supabase
      .from('diary_entries')
      .select(`
        id,
        is_liked,
        is_rewatch,
        rating,
        logged_date,
        review_text,
        is_spoiler,
        media_items!inner (
          external_id,
          media_type
        )
      `)
      .eq('user_id', userId)
      .eq('media_items.external_id', externalId)
      .eq('media_items.media_type', mediaType)
      .order('logged_date', { ascending: false })
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error fetching user media interaction:', error);
    return null;
  }
}

export async function getUserDiary(userId: string) {
  try {
    const { data, error } = await supabase
      .from('diary_entries')
      .select(`
        *,
        media_items (
          *
        )
      `)
      .eq('user_id', userId)
      .order('logged_date', { ascending: false })
      .order('created_at', { ascending: false });

    if (error) throw error;

    return data;
  } catch (error) {
    console.error('Error fetching user diary:', error);
    throw error;
  }
}

export async function logMediaItem(
  userId: string,
  mediaItem: any,
  logDetails: { rating: number; date: string; liked: boolean; rewatched: boolean; reviewText?: string; hasSpoilers?: boolean }
) {
  try {
    // 1. Upsert into media_items
    const { data: mediaData, error: mediaError } = await supabase
      .from('media_items')
      .upsert({
        external_id: String(mediaItem.external_id || mediaItem.id),
        media_type: mediaItem.type || mediaItem.mediaType || mediaItem.media_type || 'unknown',
        provider: mediaItem.provider || 'unknown',
        title: mediaItem.title || mediaItem.header?.title || '',
        subtitle: mediaItem.subtitle || mediaItem.header?.subtitle || '',
        image_url: mediaItem.image || mediaItem.images?.posterUrl || mediaItem.images?.backdropUrl || mediaItem.image_url || '',
      }, { onConflict: 'external_id,media_type' })
      .select('id')
      .single();

    if (mediaError) throw mediaError;

    // 2. Insert into diary_entries
    const { data: diaryData, error: diaryError } = await supabase
      .from('diary_entries')
      .insert({
        user_id: userId,
        media_item_id: mediaData.id,
        rating: logDetails.rating,
        is_liked: logDetails.liked,
        is_rewatch: logDetails.rewatched,
        logged_date: logDetails.date,
        review_text: logDetails.reviewText ? logDetails.reviewText.trim() || null : null,
        is_spoiler: logDetails.hasSpoilers || false,
      })
      .select()
      .single();

    if (diaryError) throw diaryError;

    // 3. Auto-remove from Watchlist / Reading List
    const { data: intentSections } = await supabase
      .from('profile_sections')
      .select('id')
      .eq('user_id', userId)
      .in('title', ['Watchlist', 'Reading List']);
      
    if (intentSections && intentSections.length > 0) {
      await supabase
        .from('section_items')
        .delete()
        .in('section_id', intentSections.map(s => s.id))
        .eq('media_item_id', mediaData.id);
    }

    return diaryData;
  } catch (error) {
    console.error('Error logging media item:', error);
    throw error;
  }
}

export async function addToIntentList(userId: string, mediaItem: any) {
  try {
    const mediaType = mediaItem.type || mediaItem.mediaType || mediaItem.media_type || 'unknown';
    
    // 1. Check if already logged
    const interaction = await getUserMediaInteraction(userId, String(mediaItem.external_id || mediaItem.id), mediaType);
    if (interaction) {
      return { status: 'ALREADY_LOGGED', message: `You already ${['movie', 'tv', 'anime'].includes(mediaType) ? 'watched' : 'read'} this.` };
    }

    // 2. Determine List Type
    const isWatchable = ['movie', 'tv', 'anime'].includes(mediaType);
    const targetListName = isWatchable ? 'Watchlist' : 'Reading List';

    // 3. Find or Create the List JIT
    const { data: existingSections, error: fetchError } = await supabase
      .from('profile_sections')
      .select('id')
      .eq('user_id', userId)
      .eq('title', targetListName)
      .limit(1);

    if (fetchError) throw fetchError;

    let sectionId;
    if (existingSections && existingSections.length > 0) {
      sectionId = existingSections[0].id;
    } else {
      const { data: newSection, error: createError } = await supabase
        .from('profile_sections')
        .insert({
          user_id: userId,
          title: targetListName,
          media_type: isWatchable ? 'movie' : 'book',
          display_order: 0
        })
        .select('id')
        .single();
      
      if (createError) throw createError;
      sectionId = newSection.id;
    }

    // 4. Add Item to Shelf
    await addSectionItem(sectionId, mediaItem, userId);
    return { status: 'SUCCESS' };
  } catch (error) {
    console.error('Error adding to intent list:', error);
    throw error;
  }
}
export async function addSectionItem(
  sectionId: string,
  mediaItem: any,
  userId?: string
) {
  try {
    // 1. Upsert into media_items
    const { data: mediaData, error: mediaError } = await supabase
      .from('media_items')
      .upsert({
        external_id: String(mediaItem.external_id || mediaItem.id),
        media_type: mediaItem.type || mediaItem.mediaType || mediaItem.media_type || 'unknown',
        provider: mediaItem.provider || 'unknown',
        title: mediaItem.title || mediaItem.header?.title || '',
        subtitle: mediaItem.subtitle || mediaItem.header?.subtitle || '',
        image_url: mediaItem.image || mediaItem.images?.posterUrl || mediaItem.images?.backdropUrl || mediaItem.image_url || '',
      }, { onConflict: 'external_id,media_type' })
      .select('id')
      .single();

    if (mediaError) throw mediaError;

    // 2. Check if it already exists in section_items
    const { data: existingItem, error: checkError } = await supabase
      .from('section_items')
      .select('id')
      .eq('section_id', sectionId)
      .eq('media_item_id', mediaData.id)
      .maybeSingle();
      
    if (checkError) throw checkError;
    
    if (existingItem) {
      return existingItem; // Already in the shelf
    }

    // 3. Insert into section_items
    const { data: sectionData, error: sectionError } = await supabase
      .from('section_items')
      .insert({
        section_id: sectionId,
        media_item_id: mediaData.id,
        display_order: 0
      })
      .select()
      .single();

    if (sectionError) throw sectionError;

    return sectionData;
  } catch (error) {
    console.error('Error adding section item:', error);
    throw error;
  }
}

export async function syncMediaToShelf(userId: string, mediaItem: any) {
  try {
    const mediaType = mediaItem.type || mediaItem.mediaType || 'unknown';
    
    // 1. Find an existing shelf for this media type
    const { data: existingSections, error: fetchError } = await supabase
      .from('profile_sections')
      .select('id')
      .eq('user_id', userId)
      .eq('media_type', mediaType)
      .limit(1);
      
    if (fetchError) throw fetchError;
    
    let sectionId;
    
    if (existingSections && existingSections.length > 0) {
      sectionId = existingSections[0].id;
    } else {
      // 2. Create a new shelf if it doesn't exist
      const titleMap: Record<string, string> = {
        'movie': 'Films',
        'tv': 'TV Shows',
        'book': 'Books',
        'anime': 'Anime',
        'manga': 'Manga',
        'music': 'Music',
        'podcast': 'Podcasts',
        'webnovel': 'Webnovels'
      };
      
      const title = titleMap[mediaType] || `${mediaType.charAt(0).toUpperCase() + mediaType.slice(1)}s`;
      
      const { data: newSection, error: createError } = await supabase
        .from('profile_sections')
        .insert({
          user_id: userId,
          title: title,
          media_type: mediaType,
          display_order: 0
        })
        .select('id')
        .single();
        
      if (createError) throw createError;
      sectionId = newSection.id;
    }
    
    // 3. Add item to this shelf
    await addSectionItem(sectionId, mediaItem, userId);
    
  } catch (error) {
    console.error('Error syncing media to shelf:', error);
    throw error;
  }
}

export async function sendRecommendation(
  receiverId: string,
  mediaItem: any,
  message: string,
  isAnonymous: boolean,
  senderId?: string
) {
  try {
    // 1. Upsert into media_items
    const { data: mediaData, error: mediaError } = await supabase
      .from('media_items')
      .upsert({
        external_id: String(mediaItem.external_id || mediaItem.id),
        media_type: mediaItem.type || mediaItem.mediaType || mediaItem.media_type || 'unknown',
        provider: mediaItem.provider || 'unknown',
        title: mediaItem.title || mediaItem.header?.title || '',
        subtitle: mediaItem.subtitle || mediaItem.header?.subtitle || '',
        image_url: mediaItem.image || mediaItem.images?.posterUrl || mediaItem.images?.backdropUrl || mediaItem.image_url || '',
      }, { onConflict: 'external_id,media_type' })
      .select('id')
      .single();

    if (mediaError) throw mediaError;

    // 2. Insert into recommendations
    const { error: recError } = await supabase
      .from('recommendations')
      .insert({
        recipient_id: receiverId,
        media_item_id: mediaData.id,
        message: message,
        is_anonymous: isAnonymous,
        sender_id: isAnonymous ? null : (senderId || null),
      });

    if (recError) throw recError;

    return { success: true };
  } catch (error) {
    console.error('Error sending recommendation:', error);
    throw error;
  }
}

export async function getRecommendations(userId: string) {
  try {
    const { data, error } = await supabase
      .from('recommendations')
      .select(`
        *,
        media_items (*),
        sender:users!sender_id (
          id,
          name,
          handle,
          avatar_url
        )
      `)
      .eq('recipient_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      // If table doesn't exist yet, just return empty array
      if (error.code === '42P01') return [];
      throw error;
    }

    return data || [];
  } catch (error) {
    console.error('Error fetching recommendations:', error);
    return []; // Return empty array as fallback for now
  }
}

export async function deleteRecommendation(recommendationId: string) {
  try {
    const { error } = await supabase
      .from('recommendations')
      .delete()
      .eq('id', recommendationId);

    if (error) throw error;
    return { success: true };
  } catch (error) {
    console.error('Error deleting recommendation:', error);
    throw error;
  }
}
