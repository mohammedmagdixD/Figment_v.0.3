import { 
  spotifySearchAdapter, 
  tmdbSearchAdapter, 
  googleBooksSearchAdapter, 
  openLibrarySearchAdapter, 
  malSearchAdapter, 
  itunesSearchAdapter,
  googleBooksAdapter,
  itunesAudioAdapter
} from '../utils/adapters';
import { UniversalMediaData } from '../types/universal';
import { GoogleBooksVolumeDetails, ITunesAudioAdapterInput, ITunesAudioDetails, OpenLibraryDoc } from '../types/api';

export type MediaType = 'movie' | 'music' | 'book' | 'anime' | 'manga' | 'webnovel' | 'podcast' | 'tv';

export interface Album {
  id: string;
  title: string;
  description?: string;
  coverImage?: string;
  tracks: UniversalMediaData[];
}

export interface SearchResult {
  id: string;
  title: string;
  subtitle: string;
  image: string;
  url?: string;
  previewUrl?: string; // For music previews
  description?: string; // For details modal
  type?: string;
}

export async function fetchWithBackoff(url: string, options?: RequestInit, maxRetries = 3, initialDelay = 1000): Promise<Response> {
  let retries = 0;
  let delay = initialDelay;

  while (true) {
    try {
      const response = await fetch(url, options);
      
      if (response.status === 429 || (response.status >= 500 && response.status < 600)) {
        if (retries >= maxRetries) {
          return response;
        }
        await new Promise(resolve => setTimeout(resolve, delay));
        delay *= 2;
        retries++;
        continue;
      }
      
      return response;
    } catch (error) {
      if (retries >= maxRetries) {
        throw error;
      }
      await new Promise(resolve => setTimeout(resolve, delay));
      delay *= 2;
      retries++;
    }
  }
}

export function getHighResBookCover(url?: string): string {
  if (!url) return 'https://placehold.co/300x400/1a1a1a/ffffff?text=No+Cover';
  
  let highResUrl = url.replace('http:', 'https:');
  highResUrl = highResUrl.replace(/&edge=curl/g, '');
  
  if (highResUrl.includes('&zoom=')) {
    highResUrl = highResUrl.replace(/&zoom=\d+/, '&zoom=3');
  } else if (highResUrl.includes('?id=')) {
    highResUrl += '&zoom=3';
  }
  
  return highResUrl;
}

export interface PodcastEpisode {
  id: string;
  title: string;
  description: string;
  date: string;
  duration?: number;
  previewUrl?: string;
}

export interface MovieDetails {
  id: string;
  title: string;
  tagline: string;
  overview: string;
  backdrop_path: string | null;
  poster_path: string | null;
  release_date: string;
  runtime: number;
  vote_average: number;
  genres: { id: number; name: string }[];
  director: string;
  contentRating: string;
  cast: { id: number; name: string; character: string; profile_path: string | null }[];
  trailerUrl: string | null;
  watchProviders: { provider_id: number; provider_name: string; logo_path: string }[];
  
  // TV Specific Fields
  last_air_date?: string;
  status?: string;
  number_of_seasons?: number;
  number_of_episodes?: number;
  networks?: { id: number; name: string; logo_path: string | null }[];
  next_episode_to_air?: { air_date: string; name: string; season_number: number; episode_number: number } | null;
  seasons?: { id: number; season_number: number; name: string; episode_count: number; air_date: string; poster_path: string | null }[];
}

export async function getMovieDetails(id: string): Promise<MovieDetails | null> {
  try {
    const res = await fetchWithBackoff(`/api/tmdb/movie/${encodeURIComponent(id)}?append_to_response=credits,release_dates,watch%2Fproviders,videos`);
    if (!res.ok) throw new Error(`TMDB API error: ${res.status}`);
    const data = await res.json();

    // Find director
    const director = data.credits?.crew?.find((member: { job: string; name: string }) => member.job === 'Director')?.name || 'Unknown Director';

    // Find content rating (US certification)
    let contentRating = 'NR';
    const usRelease = data.release_dates?.results?.find((r: { iso_3166_1: string; release_dates: { certification: string }[] }) => r.iso_3166_1 === 'US');
    if (usRelease && usRelease.release_dates.length > 0) {
      const certification = usRelease.release_dates.find((d: { certification: string }) => d.certification !== '')?.certification;
      if (certification) contentRating = certification;
    }

    // Find trailer
    const trailer = data.videos?.results?.find((v: { type: string; site: string; key: string }) => v.type === 'Trailer' && v.site === 'YouTube');
    const trailerUrl = trailer ? `https://www.youtube.com/watch?v=${trailer.key}` : `https://www.youtube.com/results?search_query=${encodeURIComponent(data.title + ' movie trailer')}`;

    // Find watch providers (US)
    const usProviders = data['watch/providers']?.results?.US;
    let watchProviders: { provider_id: number; provider_name: string; logo_path: string }[] = [];
    if (usProviders) {
      // Combine flatrate, rent, and buy, then deduplicate
      const allProviders = [...(usProviders.flatrate || []), ...(usProviders.rent || []), ...(usProviders.buy || [])];
      const uniqueProviders = new Map();
      allProviders.forEach((p: { provider_id: number; provider_name: string; logo_path: string }) => {
        if (!uniqueProviders.has(p.provider_id)) {
          uniqueProviders.set(p.provider_id, p);
        }
      });
      watchProviders = Array.from(uniqueProviders.values()).slice(0, 5); // Limit to 5
    }

    return {
      id: data.id.toString(),
      title: data.title,
      tagline: data.tagline,
      overview: data.overview,
      backdrop_path: data.backdrop_path,
      poster_path: data.poster_path,
      release_date: data.release_date,
      runtime: data.runtime,
      vote_average: data.vote_average,
      genres: data.genres || [],
      director,
      contentRating,
      cast: (data.credits?.cast || []).slice(0, 10), // Top 10 cast members
      trailerUrl,
      watchProviders
    };
  } catch (e) {
    console.error('Failed to fetch movie details:', e);
    return null;
  }
}

export interface AnimeDetails {
  id: string;
  title: string;
  title_english: string | null;
  title_japanese: string | null;
  synopsis: string;
  image_url: string;
  large_image_url: string;
  backdrop_url: string | null;
  backdrop_fallback?: boolean;
  trailer_url: string | null;
  score: number | null;
  rank: number | null;
  popularity: number | null;
  season: string | null;
  year: number | null;
  type: string | null;
  episodes: number | null;
  status: string | null;
  studios: { mal_id: number; name: string }[];
  genres: { mal_id: number; name: string }[];
  themes: { mal_id: number; name: string }[];
  source: string | null;
  theme_openings: string[];
  theme_endings: string[];
  characters: {
    character: { mal_id: number; name: string; image_url: string };
    role: string;
    voice_actor: { mal_id: number; name: string; image_url: string } | null;
  }[];
  related_anime?: { node: { id: number; title: string; main_picture?: { large: string; medium: string } }; relation_type_formatted: string }[];
  recommendations?: { node: { id: number; title: string; main_picture?: { large: string; medium: string } } }[];
}

export interface MangaDetails {
  id: string;
  title: string;
  title_english: string | null;
  title_japanese: string | null;
  synopsis: string;
  image_url: string;
  large_image_url: string;
  backdrop_url: string | null;
  backdrop_fallback?: boolean;
  score: number | null;
  rank: number | null;
  popularity: number | null;
  type: string | null;
  chapters: number | null;
  volumes: number | null;
  status: string | null;
  authors: { mal_id: number; name: string }[];
  serializations: { mal_id: number; name: string }[];
  genres: { mal_id: number; name: string }[];
  themes: { mal_id: number; name: string }[];
  characters: {
    character: { mal_id: number; name: string; image_url: string };
    role: string;
  }[];
}

async function fetchMAL(url: string): Promise<Response> {
  const proxyUrl = url.replace('https://api.myanimelist.net/v2/', '/api/mal/');
  return fetchWithBackoff(proxyUrl);
}

async function getKitsuCoverImage(malId: string, type: 'anime' | 'manga'): Promise<string | null> {
  try {
    const res = await fetchWithBackoff(`https://kitsu.app/api/edge/mappings?filter[externalSite]=myanimelist/${type}&filter[externalId]=${malId}&include=item`);
    if (!res.ok) return null;
    const data = await res.json();
    if (data.included && data.included.length > 0) {
      const coverImage = data.included[0].attributes?.coverImage;
      return coverImage?.original || coverImage?.large || null;
    }
  } catch (e) {
    console.error('Kitsu API error:', e);
  }
  return null;
}

export async function getAnimeDetails(id: string): Promise<AnimeDetails | null> {
  try {
    const url = `https://api.myanimelist.net/v2/anime/${id}?fields=id,title,main_picture,synopsis,genres,mean,rank,popularity,num_episodes,start_season,studios,alternative_titles,media_type,status,opening_themes,ending_themes,trailer,related_anime,recommendations`;
    
    const [res, kitsuCover] = await Promise.all([
      fetchMAL(url),
      getKitsuCoverImage(id, 'anime')
    ]);
    
    if (res.status === 404) return null;
    if (!res.ok) throw new Error(`MAL API error: ${res.status}`);
    
    const data = await res.json();
    
    let backdrop_url = kitsuCover;
    let backdrop_fallback = false;

    // Fallback 1: YouTube Thumbnail from MAL
    if (!backdrop_url && data.trailer?.images) {
      backdrop_url = data.trailer.images.maximum_image_url || data.trailer.images.large_image_url || null;
    }

    // Fallback 2: Heavy Blur
    if (!backdrop_url) {
      backdrop_url = data.main_picture?.large || data.main_picture?.medium || null;
      backdrop_fallback = true;
    }

    return {
      id: data.id.toString(),
      title: data.title,
      title_english: data.alternative_titles?.en || '',
      title_japanese: data.alternative_titles?.ja || '',
      synopsis: data.synopsis || '',
      image_url: data.main_picture?.medium || '',
      large_image_url: data.main_picture?.large || '',
      backdrop_url,
      backdrop_fallback,
      trailer_url: data.trailer?.youtube_id 
        ? `https://www.youtube.com/watch?v=${data.trailer.youtube_id}` 
        : (data.trailer?.url || `https://www.youtube.com/results?search_query=${encodeURIComponent(data.title + ' anime trailer')}`),
      score: data.mean,
      rank: data.rank,
      popularity: data.popularity,
      season: data.start_season?.season,
      year: data.start_season?.year,
      type: data.media_type,
      episodes: data.num_episodes,
      status: data.status,
      studios: data.studios || [],
      genres: data.genres || [],
      themes: [],
      source: '',
      theme_openings: data.opening_themes?.map((t: { text: string }) => t.text) || [],
      theme_endings: data.ending_themes?.map((t: { text: string }) => t.text) || [],
      characters: [],
      related_anime: data.related_anime || [],
      recommendations: data.recommendations || []
    };
  } catch (e) {
    console.error('Failed to fetch anime details:', e);
    return null;
  }
}

export async function getMangaDetails(id: string): Promise<MangaDetails | null> {
  try {
    const url = `https://api.myanimelist.net/v2/manga/${id}?fields=id,title,main_picture,synopsis,genres,mean,rank,popularity,num_chapters,num_volumes,authors,alternative_titles,media_type,status`;
    
    const [res, kitsuCover] = await Promise.all([
      fetchMAL(url),
      getKitsuCoverImage(id, 'manga')
    ]);
    
    if (res.status === 404) return null;
    if (!res.ok) throw new Error(`MAL API error: ${res.status}`);
    
    const data = await res.json();
    
    let backdrop_url = kitsuCover;
    let backdrop_fallback = false;

    // Fallback 1: Heavy Blur
    if (!backdrop_url) {
      backdrop_url = data.main_picture?.large || data.main_picture?.medium || null;
      backdrop_fallback = true;
    }

    return {
      id: data.id.toString(),
      title: data.title,
      title_english: data.alternative_titles?.en || '',
      title_japanese: data.alternative_titles?.ja || '',
      synopsis: data.synopsis || '',
      image_url: data.main_picture?.medium || '',
      large_image_url: data.main_picture?.large || '',
      backdrop_url,
      backdrop_fallback,
      score: data.mean,
      rank: data.rank,
      popularity: data.popularity,
      type: data.media_type,
      chapters: data.num_chapters,
      volumes: data.num_volumes,
      status: data.status,
      authors: data.authors?.map((a: { node: { first_name: string; last_name: string }; role: string }) => ({
        name: `${a.node.first_name} ${a.node.last_name}`.trim(),
        role: a.role
      })) || [],
      serializations: [],
      genres: data.genres || [],
      themes: [],
      characters: []
    };
  } catch (e) {
    console.error('Failed to fetch manga details:', e);
    return null;
  }
}

export async function getTvDetails(id: string): Promise<MovieDetails | null> {
  try {
    const res = await fetchWithBackoff(`/api/tmdb/tv/${id}?append_to_response=credits,content_ratings,watch/providers,videos`);
    if (!res.ok) throw new Error(`TMDB API error: ${res.status}`);
    const data = await res.json();

    // Find creator/director
    const director = data.created_by && data.created_by.length > 0 
      ? data.created_by.map((c: { name: string }) => c.name).join(', ') 
      : (data.credits?.crew?.find((member: { job: string; name: string }) => member.job === 'Director' || member.job === 'Executive Producer')?.name || 'Unknown Creator');

    // Find content rating (US certification)
    let contentRating = 'NR';
    const usRating = data.content_ratings?.results?.find((r: { iso_3166_1: string; rating: string }) => r.iso_3166_1 === 'US');
    if (usRating) {
      contentRating = usRating.rating;
    }

    // Find trailer
    const trailer = data.videos?.results?.find((v: { type: string; site: string; key: string }) => v.type === 'Trailer' && v.site === 'YouTube');
    const trailerUrl = trailer ? `https://www.youtube.com/watch?v=${trailer.key}` : `https://www.youtube.com/results?search_query=${encodeURIComponent(data.name + ' tv show trailer')}`;

    // Find watch providers (US)
    const usProviders = data['watch/providers']?.results?.US;
    let watchProviders: { provider_id: number; provider_name: string; logo_path: string }[] = [];
    if (usProviders) {
      const allProviders = [...(usProviders.flatrate || []), ...(usProviders.rent || []), ...(usProviders.buy || [])];
      const uniqueProviders = new Map();
      allProviders.forEach((p: { provider_id: number; provider_name: string; logo_path: string }) => {
        if (!uniqueProviders.has(p.provider_id)) {
          uniqueProviders.set(p.provider_id, p);
        }
      });
      watchProviders = Array.from(uniqueProviders.values()).slice(0, 5);
    }

    return {
      id: data.id.toString(),
      title: data.name,
      tagline: data.tagline,
      overview: data.overview,
      backdrop_path: data.backdrop_path,
      poster_path: data.poster_path,
      release_date: data.first_air_date,
      runtime: data.episode_run_time?.[0] || 0,
      vote_average: data.vote_average,
      genres: data.genres || [],
      director,
      contentRating,
      cast: (data.credits?.cast || []).slice(0, 10),
      trailerUrl,
      watchProviders,
      
      // TV Specific
      last_air_date: data.last_air_date,
      status: data.status,
      number_of_seasons: data.number_of_seasons,
      number_of_episodes: data.number_of_episodes,
      networks: data.networks || [],
      next_episode_to_air: data.next_episode_to_air,
      seasons: data.seasons || []
    };
  } catch (e) {
    console.error('Failed to fetch TV details:', e);
    return null;
  }
}

export async function getPodcastEpisodes(podcastId: string): Promise<PodcastEpisode[]> {
  try {
    const res = await fetchWithBackoff(`https://itunes.apple.com/lookup?id=${podcastId}&media=podcast&entity=podcastEpisode&limit=50`);
    if (!res.ok) throw new Error(`iTunes API error: ${res.status}`);
    const data = await res.json();
    // The first result is the podcast itself, the rest are episodes
    return (data.results || []).slice(1).map((item: { trackId?: number; trackName: string; description?: string; shortDescription?: string; releaseDate?: string; trackTimeMillis?: number; episodeUrl?: string }) => ({
      id: item.trackId?.toString(),
      title: item.trackName,
      description: item.description || item.shortDescription || '',
      date: item.releaseDate,
      duration: item.trackTimeMillis,
      previewUrl: item.episodeUrl
    }));
  } catch (e) {
    console.error('Failed to fetch podcast episodes:', e);
    return [];
  }
}

export async function getBookDetails(id: string): Promise<GoogleBooksVolumeDetails | null> {
  if (!id.startsWith('OL')) {
    try {
      const res = await fetchWithBackoff(`/api/books/volumes/${id}`, undefined, 0);
      if (!res.ok) throw new Error(`Google Books API error: ${res.status}`);
      return await res.json();
    } catch (e) {
      console.warn('Google Books API failed, trying OpenLibrary fallback', e);
    }
  }

  try {
    const res = await fetchWithBackoff(`https://openlibrary.org/works/${id}.json`);
      if (!res.ok) throw new Error(`OpenLibrary API error: ${res.status}`);
      const data = await res.json();
      
      let authorNames = ['Unknown Author'];
      if (data.authors && data.authors.length > 0) {
        try {
          const authorRes = await fetchWithBackoff(`https://openlibrary.org${data.authors[0].author.key}.json`);
          if (authorRes.ok) {
            const authorData = await authorRes.json();
            authorNames = [authorData.name];
          }
        } catch (authorErr) {
          console.warn('Failed to fetch author details from OpenLibrary', authorErr);
        }
      }

      return {
        id: id,
        volumeInfo: {
          title: data.title,
          authors: authorNames,
          description: typeof data.description === 'string' ? data.description : (data.description?.value || ''),
          imageLinks: {
            thumbnail: data.covers && data.covers.length > 0 ? `https://covers.openlibrary.org/b/id/${data.covers[0]}-L.jpg` : null
          },
          publishedDate: data.first_publish_date,
          categories: data.subjects,
          previewLink: `https://openlibrary.org/works/${id}`
        }
      };
    } catch (olErr) {
      console.error('Failed to fetch book details from OpenLibrary:', olErr);
      return null;
    }
}

export async function getAudioDetails(item: SearchResult & { header?: { subtitle?: string }, type?: string }): Promise<ITunesAudioAdapterInput> {
  let backdropUrl: string | null = null;
  let backdropFallback = false;
  let actionButton: ITunesAudioAdapterInput['actionButton'] = undefined;
  let streamingLinks: ITunesAudioAdapterInput['streamingLinks'] = null;

  const artistName = item.subtitle || item.header?.subtitle || '';

  const isSpotify = item.url?.includes('spotify.com');
  const platform = isSpotify ? 'spotify' : 'itunes';

  // Step 1: Fetch Odesli Links
  let videoId: string | null = null;
  try {
    const odesliType = item.type === 'album' ? 'album' : 'song';
    const odesliUrl = isSpotify && item.url
      ? `/api/odesli?url=${encodeURIComponent(item.url)}`
      : `/api/odesli?platform=${platform}&type=${odesliType}&id=${item.id}`;
    console.log('Fetching Odesli:', odesliUrl);
    const res = await fetchWithBackoff(odesliUrl);
    if (res.ok) {
      const data = await res.json();
      console.log('Odesli data:', data);
      if (data && data.linksByPlatform) {
        streamingLinks = data.linksByPlatform;
        console.log('Streaming links set:', streamingLinks);
        
        // Extract YouTube video ID from Odesli links
        const ytEntity = streamingLinks.youtube || streamingLinks.youtubeMusic;
        if (ytEntity && ytEntity.entityUniqueId) {
          const entityData = data.entitiesByUniqueId?.[ytEntity.entityUniqueId];
          if (entityData && entityData.thumbnailUrl) {
            backdropUrl = entityData.thumbnailUrl;
          }
          
          const parts = ytEntity.entityUniqueId.split('::');
          if (parts.length > 1 && parts[1].length === 11) {
            videoId = parts[1];
          }
        }
        
        // Fallback to URL regex if entityUniqueId is missing or didn't work
        if (!videoId) {
          const ytLink = streamingLinks.youtube?.url || streamingLinks.youtubeMusic?.url;
          if (ytLink) {
            const match = ytLink.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([a-zA-Z0-9_-]{11})/i);
            if (match && match[1]) {
              videoId = match[1];
            }
          }
        }
      }
    } else {
      console.error('Odesli fetch failed with status:', res.status);
    }
  } catch (e) {
    console.debug('Odesli API failed in adapter', e);
  }

  if (videoId) {
    if (!backdropUrl) {
      backdropUrl = `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;
    }
    actionButton = {
      type: 'trailer',
      payload: `https://www.youtube.com/watch?v=${videoId}`
    };
  }

  // Step 2: TheAudioDB (Fallback 1)
  if (!backdropUrl) {
    try {
      const adbRes = await fetchWithBackoff(`https://www.theaudiodb.com/api/v1/json/2/search.php?s=${encodeURIComponent(artistName)}`);
      if (adbRes.ok) {
        const adbData = await adbRes.json();
        if (adbData.artists && adbData.artists.length > 0 && adbData.artists[0].strArtistFanart) {
          backdropUrl = adbData.artists[0].strArtistFanart;
        }
      }
    } catch (e) {
      console.warn('TheAudioDB API failed', e);
    }
  }

  // Step 3: iTunes square album art (Fallback 2)
  if (!backdropUrl) {
    const imageUrl = item.image || (item as any).images?.posterUrl;
    backdropUrl = imageUrl?.replace('100x100bb', '600x600bb') || imageUrl;
    backdropFallback = true;
  }

  let trackDetails: ITunesAudioDetails | null = null;
  try {
    const itunesRes = await fetchWithBackoff(`https://itunes.apple.com/lookup?id=${item.id}`);
    if (itunesRes.ok) {
      const itunesData = await itunesRes.json();
      if (itunesData.results && itunesData.results.length > 0) {
        trackDetails = itunesData.results[0];
      }
    }
  } catch (e) {
    console.error('iTunes lookup failed', e);
  }

  return { trackDetails, item, backdropUrl, backdropFallback, actionButton, streamingLinks };
}

export async function fetchRelatedMedia(item: UniversalMediaData): Promise<{ listTitle: string; items: UniversalMediaData[] }[]> {
  const relatedLists: { listTitle: string; items: UniversalMediaData[] }[] = [];

  switch (item.mediaType) {
    case 'book':
    case 'webnovel': {
      const author = item.header.subtitle;
      const categories = item.scrollableSections.genres || [];

      try {
        if (author && author !== 'Unknown Author') {
          let items: UniversalMediaData[] = [];
          try {
            const authorRes = await fetchWithBackoff(`/api/books/volumes?q=inauthor:"${encodeURIComponent(author)}"&printType=books&maxResults=30`, undefined, 0);
            if (!authorRes.ok) throw new Error('Google Books API failed');
            const authorData = await authorRes.json();
            if (authorData.items) {
              let authorItems = authorData.items.filter((i: GoogleBooksVolumeDetails) => i.id !== item.id);
              
              authorItems.sort((a: GoogleBooksVolumeDetails, b: GoogleBooksVolumeDetails) => {
                const aHasCover = !!a.volumeInfo.imageLinks?.thumbnail;
                const bHasCover = !!b.volumeInfo.imageLinks?.thumbnail;
                if (aHasCover && !bHasCover) return -1;
                if (!aHasCover && bHasCover) return 1;
                
                const aHasDesc = !!a.volumeInfo.description;
                const bHasDesc = !!b.volumeInfo.description;
                if (aHasDesc && !bHasDesc) return -1;
                if (!aHasDesc && bHasDesc) return 1;
                return 0;
              });

              items = authorItems.slice(0, 10).map((i: GoogleBooksVolumeDetails) => googleBooksAdapter(i, item.mediaType));
            }
          } catch (e) {
            console.warn('Falling back to OpenLibrary for related author books');
            const olRes = await fetchWithBackoff(`https://openlibrary.org/search.json?author=${encodeURIComponent(author)}&limit=10`);
            if (olRes.ok) {
              const olData = await olRes.json();
              items = (olData.docs || [])
                .filter((i: OpenLibraryDoc) => i.key.replace('/works/', '') !== item.id)
                .map((i: OpenLibraryDoc) => googleBooksAdapter({
                  id: i.key.replace('/works/', ''),
                  volumeInfo: {
                    title: i.title,
                    authors: i.author_name,
                    imageLinks: {
                      thumbnail: i.cover_i ? `https://covers.openlibrary.org/b/id/${i.cover_i}-M.jpg` : undefined
                    }
                  }
                } as GoogleBooksVolumeDetails, item.mediaType));
            }
          }
          if (items.length > 0) {
            relatedLists.push({ listTitle: `More by ${author}`, items });
          }
        }
      } catch (e) {
        console.error('Failed to fetch related author books', e);
      }

      try {
        if (categories.length > 0) {
          const category = categories[0];
          let items: UniversalMediaData[] = [];
          try {
            const categoryRes = await fetchWithBackoff(`/api/books/volumes?q=subject:"${encodeURIComponent(category)}"&printType=books&maxResults=30`, undefined, 0);
            if (!categoryRes.ok) throw new Error('Google Books API failed');
            const categoryData = await categoryRes.json();
            if (categoryData.items) {
              let categoryItems = categoryData.items.filter((i: GoogleBooksVolumeDetails) => i.id !== item.id);
              
              categoryItems.sort((a: GoogleBooksVolumeDetails, b: GoogleBooksVolumeDetails) => {
                const aHasCover = !!a.volumeInfo.imageLinks?.thumbnail;
                const bHasCover = !!b.volumeInfo.imageLinks?.thumbnail;
                if (aHasCover && !bHasCover) return -1;
                if (!aHasCover && bHasCover) return 1;
                
                const aHasDesc = !!a.volumeInfo.description;
                const bHasDesc = !!b.volumeInfo.description;
                if (aHasDesc && !bHasDesc) return -1;
                if (!aHasDesc && bHasDesc) return 1;
                return 0;
              });

              items = categoryItems.slice(0, 10).map((i: GoogleBooksVolumeDetails) => googleBooksAdapter(i, item.mediaType));
            }
          } catch (e) {
            console.warn('Falling back to OpenLibrary for similar books');
            const olRes = await fetchWithBackoff(`https://openlibrary.org/search.json?subject=${encodeURIComponent(category)}&limit=10`);
            if (olRes.ok) {
              const olData = await olRes.json();
              items = (olData.docs || [])
                .filter((i: OpenLibraryDoc) => i.key.replace('/works/', '') !== item.id)
                .map((i: OpenLibraryDoc) => googleBooksAdapter({
                  id: i.key.replace('/works/', ''),
                  volumeInfo: {
                    title: i.title,
                    authors: i.author_name,
                    imageLinks: {
                      thumbnail: i.cover_i ? `https://covers.openlibrary.org/b/id/${i.cover_i}-M.jpg` : undefined
                    }
                  }
                } as GoogleBooksVolumeDetails, item.mediaType));
            }
          }
          if (items.length > 0) {
            relatedLists.push({ listTitle: 'Similar Books', items });
          }
        }
      } catch (e) {
        console.error('Failed to fetch similar books', e);
      }
      break;
    }
    case 'music':
    case 'song':
    case 'album':
    case 'podcast': {
      try {
        const itunesRes = await fetchWithBackoff(`https://itunes.apple.com/lookup?id=${item.id}`);
        if (itunesRes.ok) {
          const itunesData = await itunesRes.json();
          if (itunesData.results && itunesData.results.length > 0) {
            const trackDetails = itunesData.results[0];

            if (trackDetails.collectionId) {
              try {
                const albumRes = await fetchWithBackoff(`https://itunes.apple.com/lookup?id=${trackDetails.collectionId}&entity=song`);
                if (albumRes.ok) {
                  const albumData = await albumRes.json();
                  const albumTracks = albumData.results.filter((res: ITunesAudioDetails) => res.wrapperType === 'track' && res.trackId !== trackDetails?.trackId);
                  
                  if (albumTracks.length > 0) {
                    relatedLists.push({
                      listTitle: "More from this Album",
                      items: albumTracks.map((track: ITunesAudioDetails) => itunesAudioAdapter({
                        trackDetails: track,
                        item: { type: 'song' },
                        backdropUrl: null,
                        backdropFallback: true,
                        actionButton: undefined,
                        streamingLinks: null
                      }))
                    });
                  }
                }
              } catch (e) {
                console.error('iTunes album lookup failed', e);
              }
            }

            if (trackDetails.artistId) {
              try {
                const artistRes = await fetchWithBackoff(`https://itunes.apple.com/lookup?id=${trackDetails.artistId}&entity=song&limit=11`);
                if (artistRes.ok) {
                  const artistData = await artistRes.json();
                  const artistTracks = artistData.results.filter((res: ITunesAudioDetails) => res.wrapperType === 'track' && res.trackId !== trackDetails?.trackId).slice(0, 10);
                  
                  if (artistTracks.length > 0) {
                    relatedLists.push({
                      listTitle: "More from this Artist",
                      items: artistTracks.map((track: ITunesAudioDetails) => itunesAudioAdapter({
                        trackDetails: track,
                        item: { type: 'song' },
                        backdropUrl: null,
                        backdropFallback: true,
                        actionButton: undefined,
                        streamingLinks: null
                      }))
                    });
                  }
                }
              } catch (e) {
                console.error('iTunes artist lookup failed', e);
              }
            }
          }
        }
      } catch (e) {
        console.error('iTunes lookup failed', e);
      }
      break;
    }
  }

  return relatedLists;
}

export async function searchMedia(query: string, type: MediaType): Promise<SearchResult[]> {
  if (!query) return [];
  
  const fetchResults = async (): Promise<SearchResult[]> => {
    try {
      if (type === 'podcast') {
        let results: SearchResult[] = [];
        // Try iTunes first
        try {
          const res = await fetchWithBackoff(`https://itunes.apple.com/search?term=${encodeURIComponent(query)}&media=podcast&entity=podcast&limit=15`);
          if (!res.ok) throw new Error(`iTunes API error: ${res.status}`);
          const data = await res.json();
          results = itunesSearchAdapter(data, 'podcast');
        } catch (e) {
          console.warn('iTunes search failed, falling back to Spotify', e);
        }

        // Fallback to Spotify if no results
        if (results.length === 0) {
          try {
            const res = await fetchWithBackoff(`/api/search/spotify?q=${encodeURIComponent(query)}&type=show`);
            if (!res.ok) throw new Error(`Spotify API error: ${res.status}`);
            const data = await res.json();
            results = spotifySearchAdapter(data, 'show');
          } catch (e) {
            console.error('Spotify search failed:', e);
          }
        }

        // Deduplicate podcasts by title and subtitle
        const seen = new Set();
        return results.filter(item => {
          const key = `${item.title}-${item.subtitle}`.toLowerCase();
          if (seen.has(key)) return false;
          seen.add(key);
          return true;
        });
      }

      if (type === 'music') {
        // Try Spotify first
        try {
          const res = await fetchWithBackoff(`/api/search/spotify?q=${encodeURIComponent(query)}`);
          if (!res.ok) throw new Error(`Spotify API error: ${res.status}`);
          const data = await res.json();
          const adaptedResults = spotifySearchAdapter(data, 'track');
          if (adaptedResults && adaptedResults.length > 0) {
            return adaptedResults;
          }
        } catch (e) {
          console.warn('Spotify search failed or yielded no results, falling back to iTunes', e);
        }

        // Fallback to iTunes
        try {
          const res = await fetchWithBackoff(`https://itunes.apple.com/search?term=${encodeURIComponent(query)}&entity=song&limit=15`);
          if (!res.ok) throw new Error(`iTunes API error: ${res.status}`);
          const data = await res.json();
          return itunesSearchAdapter(data, 'music');
        } catch (e) {
          console.error('iTunes search failed:', e);
          return [];
        }
      }
      
      if (type === 'movie' || type === 'tv') {
        // Using TMDB API for reliable movie/tv search
        const endpoint = type === 'movie' ? 'search/movie' : 'search/tv';
        const res = await fetchWithBackoff(`/api/tmdb/${endpoint}?query=${encodeURIComponent(query)}`);
        if (!res.ok) throw new Error(`TMDB API error: ${res.status}`);
        const data = await res.json();
        return tmdbSearchAdapter(data, type);
      }

      if (type === 'book' || type === 'webnovel') {
        try {
          const excludeTerms = '-summary -study -analysis -review -notes -guide';
          let finalQuery = query;
          if (type === 'webnovel') {
            finalQuery += ' webnovel';
          } else if (type === 'book') {
            finalQuery += ` ${excludeTerms}`;
          }
          const res = await fetchWithBackoff(`/api/books/volumes?q=${encodeURIComponent(finalQuery)}&printType=books&orderBy=relevance&maxResults=40`, undefined, 0);
          if (!res.ok) throw new Error(`Google Books API error: ${res.status}`);
          const data = await res.json();
          
          return googleBooksSearchAdapter(data, query, type);
        } catch (e) {
          console.warn('Google Books API failed, falling back to OpenLibrary', e);
          try {
            const res = await fetchWithBackoff(`https://openlibrary.org/search.json?q=${encodeURIComponent(query + (type === 'webnovel' ? ' webnovel' : ''))}&limit=15`);
            if (!res.ok) throw new Error(`OpenLibrary API error: ${res.status}`);
            const data = await res.json();
            return openLibrarySearchAdapter(data);
          } catch (olErr) {
            console.error(`Error searching ${type} on OpenLibrary:`, olErr);
            return [];
          }
        }
      }

      if (type === 'anime' || type === 'manga') {
        const url = `https://api.myanimelist.net/v2/${type}?q=${encodeURIComponent(query)}&limit=15&fields=id,title,main_picture,synopsis,mean,start_season,media_type`;
        const res = await fetchMAL(url);
        if (res.status === 404) return [];
        if (!res.ok) throw new Error(`MAL API error: ${res.status}`);
        const data = await res.json();
        return malSearchAdapter(data, type);
      }
    } catch (error) {
      console.error(`Error searching ${type}:`, error);
      return [];
    }
    return [];
  };

  const results = await fetchResults();
  return results.map(r => ({ ...r, type }));
}
