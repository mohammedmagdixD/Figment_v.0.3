import React from 'react';
import { UniversalMediaData } from '../types/universal';
import { ThemeSongItem } from '../components/ThemeSongItem';
import { UniversalListItem } from '../components/UniversalListItem';
import { motion } from 'motion/react';
import { haptics } from '../utils/haptics';
import { Search } from 'lucide-react';
import { getHighResBookCover, SearchResult, AnimeDetails, MangaDetails } from '../services/api';
import {
  SpotifySearchResponse, SpotifyTrack, SpotifyShow,
  TMDBSearchResponse, TMDBMovie, TMDBTv,
  MALSearchResponse, MALAnime, MALManga,
  GoogleBooksResponse, GoogleBooksVolume,
  OpenLibrarySearchResponse, OpenLibraryDoc,
  ITunesSearchResponse, ITunesTrack, ITunesPodcast,
  TMDBMovieDetails, TMDBTvDetails, GoogleBooksVolumeDetails, ITunesAudioDetails, ITunesAudioAdapterInput
} from '../types/api';

export function spotifySearchAdapter(data: SpotifySearchResponse, type: 'track' | 'show'): SearchResult[] {
  if (type === 'show' && data.shows) {
    return data.shows.items.map((item: SpotifyShow) => ({
      id: item.id,
      title: item.name,
      subtitle: item.publisher,
      image: item.images[0]?.url || 'https://via.placeholder.com/600',
      url: item.external_urls.spotify,
      description: undefined // SpotifyShow doesn't have description in our type, or we can add it
    }));
  } else if (type === 'track' && data.tracks) {
    return data.tracks.items.map((item: SpotifyTrack) => ({
      id: item.id,
      title: item.name,
      subtitle: item.artists.map((a) => a.name).join(', '),
      image: item.album.images[0]?.url || 'https://via.placeholder.com/600',
      url: item.external_urls.spotify,
      previewUrl: undefined // SpotifyTrack doesn't have preview_url in our type, let's add it
    }));
  }
  return [];
}

export function tmdbSearchAdapter(data: TMDBSearchResponse, type: 'movie' | 'tv'): SearchResult[] {
  return (data.results || []).map((item: TMDBMovie | TMDBTv) => {
    const isMovie = type === 'movie' || item.media_type === 'movie';
    const title = 'title' in item ? item.title : item.name;
    const releaseDate = 'release_date' in item ? item.release_date : item.first_air_date;
    return {
      id: item.id?.toString() || '',
      title: title || 'Unknown',
      subtitle: releaseDate ? releaseDate.split('-')[0] : (isMovie ? 'Movie' : 'TV Show'),
      image: item.poster_path ? `https://image.tmdb.org/t/p/w500${item.poster_path}` : 'https://placehold.co/600x600/1a1a1a/ffffff?text=No+Cover',
      url: `https://www.themoviedb.org/${type}/${item.id || ''}`,
      description: item.overview
    };
  });
}

export function googleBooksSearchAdapter(data: GoogleBooksResponse, query: string, type: 'book' | 'webnovel'): SearchResult[] {
  let items = data.items || [];
  
  if (type === 'book') {
    const badKeywords = ['summary of', 'study guide', 'analysis of', 'review of', 'notes on', 'workbook for', 'instaread', 'chapter by chapter', 'summary & analysis'];
    const queryLower = query.toLowerCase();
    const queryHasBadWord = badKeywords.some(kw => queryLower.includes(kw));
    
    if (!queryHasBadWord) {
      items = items.filter((item: GoogleBooksVolume) => {
        const title = (item.volumeInfo.title || '').toLowerCase();
        const subtitle = ((item.volumeInfo as any).subtitle || '').toLowerCase();
        return !badKeywords.some(kw => title.includes(kw) || subtitle.includes(kw));
      });
    }
  }

  items.sort((a: GoogleBooksVolume, b: GoogleBooksVolume) => {
    const aHasCover = !!a.volumeInfo.imageLinks?.thumbnail;
    const bHasCover = !!b.volumeInfo.imageLinks?.thumbnail;
    if (aHasCover && !bHasCover) return -1;
    if (!aHasCover && bHasCover) return 1;
    
    const aHasAuthor = !!(a.volumeInfo.authors && a.volumeInfo.authors.length > 0);
    const bHasAuthor = !!(b.volumeInfo.authors && b.volumeInfo.authors.length > 0);
    if (aHasAuthor && !bHasAuthor) return -1;
    if (!aHasAuthor && bHasAuthor) return 1;
    
    const aHasDesc = !!a.volumeInfo.description;
    const bHasDesc = !!b.volumeInfo.description;
    if (aHasDesc && !bHasDesc) return -1;
    if (!aHasDesc && bHasDesc) return 1;

    return 0;
  });

  items = items.slice(0, 15);

  return items.map((item: GoogleBooksVolume) => {
    const info = item.volumeInfo;
    return {
      id: item.id || '',
      title: info.title || 'Unknown',
      subtitle: info.authors ? info.authors.join(', ') : 'Unknown Author',
      image: getHighResBookCover(info.imageLinks?.thumbnail),
      url: (info as any).infoLink,
      description: typeof info.description === 'string' ? info.description : info.description?.value
    };
  });
}

export function openLibrarySearchAdapter(data: OpenLibrarySearchResponse): SearchResult[] {
  return (data.docs || []).map((item: OpenLibraryDoc) => ({
    id: item.key?.replace('/works/', '') || '',
    title: item.title || 'Unknown',
    subtitle: item.author_name ? item.author_name.join(', ') : 'Unknown Author',
    image: item.cover_i ? `https://covers.openlibrary.org/b/id/${item.cover_i}-M.jpg` : 'https://placehold.co/300x400/1a1a1a/ffffff?text=No+Cover',
    url: item.key ? `https://openlibrary.org${item.key}` : undefined,
    description: (item as any).first_sentence ? (typeof (item as any).first_sentence === 'string' ? (item as any).first_sentence : (item as any).first_sentence[0]) : ''
  }));
}

export function malSearchAdapter(data: MALSearchResponse, type: 'anime' | 'manga'): SearchResult[] {
  return (data.data || []).map((item: MALAnime | MALManga) => ({
    id: item.node?.id?.toString() || '',
    title: item.node?.title || 'Unknown',
    subtitle: (item.node as any)?.start_season ? (item.node as any).start_season.year.toString() : item.node?.media_type || '',
    image: item.node?.main_picture?.large || item.node?.main_picture?.medium || 'https://placehold.co/300x400/1a1a1a/ffffff?text=No+Cover',
    url: `https://myanimelist.net/${type}/${item.node?.id || ''}`,
    description: (item.node as any)?.synopsis || ''
  }));
}

export function itunesSearchAdapter(data: ITunesSearchResponse, type: 'podcast' | 'music'): SearchResult[] {
  if (type === 'podcast') {
    return (data.results || []).map((item: ITunesTrack | ITunesPodcast) => ({
      id: item.collectionId?.toString() || '',
      title: item.collectionName || '',
      subtitle: item.artistName || '',
      image: item.artworkUrl600 || item.artworkUrl100?.replace('100x100bb', '600x600bb') || 'https://placehold.co/600x600/1a1a1a/ffffff?text=No+Cover',
      url: (item as any).collectionViewUrl,
      description: item.collectionName
    }));
  } else {
    return (data.results || []).map((item: ITunesTrack | ITunesPodcast) => ({
      id: ('trackId' in item ? item.trackId : item.collectionId)?.toString() || '',
      title: 'trackName' in item ? item.trackName : item.collectionName || '',
      subtitle: item.artistName || '',
      image: item.artworkUrl100?.replace('100x100bb', '600x600bb') || 'https://placehold.co/600x600/1a1a1a/ffffff?text=No+Cover',
      url: (item as any).trackViewUrl,
      previewUrl: 'previewUrl' in item ? item.previewUrl : undefined,
      description: item.collectionName
    }));
  }
}

function baseMalAdapter(data: any, type: 'anime' | 'manga'): UniversalMediaData {
  const isAnime = type === 'anime';
  return {
    id: data.id.toString(),
    mediaType: type,
    images: {
      backdropUrl: data.backdrop_url || data.large_image_url || data.image_url,
      posterUrl: data.image_url,
      backdropFallback: data.backdrop_fallback
    },
    header: {
      title: data.title_english || data.title,
      subtitle: isAnime 
        ? (data.studios?.map((s: any) => s.name).join(', ') || 'Unknown Studio')
        : (data.authors?.map((a: any) => a.name).join(', ') || 'Unknown Author')
    },
    stats: [
      { label: 'MAL Score', value: data.score },
      { label: 'Rank', value: data.rank ? `#${data.rank}` : null },
      { label: 'Popularity', value: data.popularity ? `#${data.popularity}` : null }
    ].filter(s => s.value !== null),
    metadata: [
      isAnime ? { label: 'Year', value: data.season ? `${data.season.charAt(0).toUpperCase() + data.season.slice(1)} ${data.year || ''}` : data.year } : { label: 'Published', value: data.published?.string },
      isAnime ? { label: 'Episodes', value: data.episodes ? `${data.episodes} Episodes` : 'Ongoing' } : { label: 'Chapters', value: data.chapters ? `${data.chapters} Chapters` : (data.volumes ? `${data.volumes} Volumes` : 'Ongoing') },
      { label: 'Status', value: data.status }
    ].filter(m => m.value != null),
    description: data.synopsis,
    actionButton: isAnime && data.trailer_url ? {
      type: 'trailer',
      payload: data.trailer_url
    } : undefined,
    scrollableSections: {
      genres: [...(data.genres || []), ...(data.themes || [])].map((g: any) => g.name || g),
      cast: data.characters?.map((c: any) => ({
        name: c.name,
        role: c.role,
        imageUrl: c.image_url
      })) || [],
      extras: isAnime ? [
        ...(data.theme_openings && data.theme_openings.length > 0 ? [{
          type: 'theme_songs',
          title: 'Openings',
          data: data.theme_openings.map((op: string, i: number) => <ThemeSongItem key={`op-${i}`} themeString={op} />)
        }] : []),
        ...(data.theme_endings && data.theme_endings.length > 0 ? [{
          type: 'theme_songs',
          title: 'Endings',
          data: data.theme_endings.map((ed: string, i: number) => <ThemeSongItem key={`ed-${i}`} themeString={ed} />)
        }] : []),
        ...(data.source ? [{
          type: 'source',
          title: 'Source Material',
          data: <p className="font-sans text-sm text-[var(--secondary-label)]">Adapted from {data.source}</p>
        }] : [])
      ] : []
    }
  };
}

export function malAnimeAdapter(data: AnimeDetails): UniversalMediaData {
  const baseData = baseMalAdapter(data, 'anime');
  
  const relatedLists: Array<{ listTitle: string; items: UniversalMediaData[] }> = [];

  if (data.related_anime && data.related_anime.length > 0) {
    relatedLists.push({
      listTitle: 'Related Anime',
      items: data.related_anime.map((item: any) => ({
        id: item.node?.id?.toString() || '',
        mediaType: 'anime',
        images: {
          backdropUrl: item.node?.main_picture?.large || item.node?.main_picture?.medium || null,
          posterUrl: item.node?.main_picture?.large || item.node?.main_picture?.medium || '',
          backdropFallback: true
        },
        header: {
          title: item.node?.title || 'Unknown',
          subtitle: item.relation_type_formatted || 'Related'
        },
        stats: [],
        metadata: [],
        description: '',
        scrollableSections: { genres: [], cast: [], extras: [] }
      }))
    });
  }

  if (data.recommendations && data.recommendations.length > 0) {
    relatedLists.push({
      listTitle: 'Recommendations',
      items: data.recommendations.map((item: any) => ({
        id: item.node?.id?.toString() || '',
        mediaType: 'anime',
        images: {
          backdropUrl: item.node?.main_picture?.large || item.node?.main_picture?.medium || null,
          posterUrl: item.node?.main_picture?.large || item.node?.main_picture?.medium || '',
          backdropFallback: true
        },
        header: {
          title: item.node?.title || 'Unknown',
          subtitle: item.num_recommendations ? `${item.num_recommendations} Recommendations` : 'Recommended'
        },
        stats: [],
        metadata: [],
        description: '',
        scrollableSections: { genres: [], cast: [], extras: [] }
      }))
    });
  }

  if (relatedLists.length > 0) {
    baseData.relatedLists = relatedLists;
  }

  return baseData;
}

export function malMangaAdapter(data: MangaDetails): UniversalMediaData {
  return baseMalAdapter(data, 'manga');
}

function baseTmdbAdapter(data: any, item: any, type: 'movie' | 'tv'): UniversalMediaData {
  const isMovie = type === 'movie';
  const startYear = isMovie ? data.release_date?.split('-')[0] : data.first_air_date?.split('-')[0];
  
  let yearDisplay = startYear;
  if (!isMovie && startYear) {
    const endYear = data.last_air_date?.split('-')[0];
    const isEnded = data.status === 'Ended' || data.status === 'Canceled';
    if (isEnded) {
      if (endYear && startYear !== endYear) {
        yearDisplay = `${startYear}–${endYear}`;
      } else {
        yearDisplay = startYear;
      }
    } else {
      yearDisplay = `${startYear}–Present`;
    }
  }

  return {
    id: data.id.toString(),
    mediaType: type,
    images: {
      backdropUrl: data.backdrop_path ? `https://image.tmdb.org/t/p/w1280${data.backdrop_path}` : item.image,
      posterUrl: data.poster_path ? `https://image.tmdb.org/t/p/w500${data.poster_path}` : item.image,
      backdropFallback: !data.backdrop_path
    },
    header: {
      title: data.title || data.name,
      subtitle: isMovie ? (data.director || 'Unknown Director') : (data.director || 'Unknown Creator')
    },
    tagline: data.tagline,
    stats: [
      { label: 'TMDB', value: data.vote_average ? data.vote_average.toFixed(1) : null },
    ].filter(s => s.value !== null),
    metadata: [
      { label: 'Year', value: yearDisplay },
      isMovie 
        ? { label: 'Runtime', value: data.runtime ? `${Math.floor(data.runtime / 60)}h ${data.runtime % 60}m` : null }
        : { label: 'Seasons', value: data.number_of_seasons ? `${data.number_of_seasons} Season${data.number_of_seasons > 1 ? 's' : ''}` : null },
      { label: 'MPA', value: data.contentRating !== 'NR' ? data.contentRating : null },
      !isMovie ? { label: 'Status', value: (data.status === 'Ended' || data.status === 'Canceled') ? 'Finished' : 'Ongoing' } : null
    ].filter(m => m != null && m.value != null),
    description: data.overview,
    actionButton: data.trailerUrl ? {
      type: 'trailer',
      payload: data.trailerUrl
    } : undefined,
    scrollableSections: {
      genres: data.genres?.map((g: any) => g.name) || [],
      cast: data.cast?.map((c: any) => ({
        name: c.name,
        role: c.character,
        imageUrl: c.profile_path ? `https://image.tmdb.org/t/p/w185${c.profile_path}` : null
      })) || [],
      watchProviders: data.watchProviders || [],
      extras: !isMovie && data.seasons && data.seasons.length > 0 ? [{
        type: 'seasons',
        title: 'Seasons',
        data: data.seasons.filter((s: any) => s.season_number > 0).map((season: any) => (
          <UniversalListItem 
            key={season.id}
            title={season.name}
            subtitle={`${season.air_date?.split('-')[0]} • ${season.episode_count} Episodes`}
            imageUrl={season.poster_path ? `https://image.tmdb.org/t/p/w185${season.poster_path}` : null}
            icon="tv"
            imageStyle="vertical"
            rightContent={
              <motion.button 
                whileTap={{ scale: 0.95 }}
                transition={{ type: "spring", stiffness: 600, damping: 35 }}
                onClick={(e) => {
                  e.stopPropagation();
                  haptics.light();
                }}
                className="shrink-0 text-xs font-medium bg-[var(--system-background)] border border-[var(--separator)] px-3 py-1.5 rounded-full hover:bg-[var(--tertiary-system-background)] text-[var(--label)] transition-colors"
              >
                Rate
              </motion.button>
            }
          />
        ))
      }] : []
    }
  };
}

export function tmdbMovieAdapter(data: TMDBMovieDetails, item: SearchResult): UniversalMediaData {
  return baseTmdbAdapter(data, item, 'movie');
}

export function tmdbTvAdapter(data: TMDBTvDetails, item: SearchResult): UniversalMediaData {
  return baseTmdbAdapter(data, item, 'tv');
}

export function itunesPodcastAdapter(
  episodes: any[], 
  item: any, 
  onLogEpisode: (ep: any) => void,
  searchQuery: string,
  setSearchQuery: (query: string) => void
): UniversalMediaData {
  const filteredEpisodes = episodes.filter(ep => 
    ep.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
    ep.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return {
    id: item.id.toString(),
    mediaType: 'podcast',
    images: {
      backdropUrl: item.image,
      posterUrl: item.image,
      backdropFallback: true
    },
    header: {
      title: item.title,
      subtitle: item.subtitle
    },
    stats: [],
    metadata: [
      { label: 'Format', value: 'Podcast' }
    ],
    description: item.description,
    scrollableSections: {
      extras: [
        ...(episodes && episodes.length > 0 ? [{
          type: 'episodes',
          title: 'Episodes',
          data: [
            <div key="search-bar" className="relative mb-4">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--secondary-label)]" />
              <input
                type="text"
                placeholder="Search episodes..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-[var(--secondary-system-background)] border border-[var(--separator)] rounded-xl py-2 pl-9 pr-3 text-sm font-sans text-[var(--label)] placeholder:text-[var(--secondary-label)] focus:outline-none focus:ring-2 focus:ring-[var(--label)]/10 transition-all"
              />
            </div>,
            ...filteredEpisodes.map((ep: any) => (
              <UniversalListItem 
                key={ep.id}
                title={ep.title}
                subtitle={new Date(ep.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                imageUrl={item.image}
                icon="music"
                imageStyle="square"
                onClick={() => onLogEpisode(ep)}
                rightContent={
                  <motion.button 
                    whileTap={{ scale: 0.95 }}
                    transition={{ type: "spring", stiffness: 600, damping: 35 }}
                    onClick={(e) => {
                      e.stopPropagation();
                      haptics.light();
                      onLogEpisode(ep);
                    }}
                    className="shrink-0 text-xs font-medium bg-[var(--system-background)] border border-[var(--separator)] px-3 py-1.5 rounded-full hover:bg-[var(--tertiary-system-background)] text-[var(--label)] transition-colors"
                  >
                    Rate
                  </motion.button>
                }
              />
            ))
          ]
        }] : [])
      ]
    }
  };
}

export function googleBooksAdapter(data: GoogleBooksVolumeDetails, type: string = 'book'): UniversalMediaData {
  const info = data.volumeInfo;
  const access = data.accessInfo;
  
  // Image handling
  const imageUrl = getHighResBookCover(info?.imageLinks?.thumbnail || info?.imageLinks?.smallThumbnail);

  // Description handling: strip HTML tags
  const rawDescription = info?.description || '';
  const cleanDescription = typeof rawDescription === 'string' ? rawDescription.replace(/<[^>]*>?/gm, '') : (rawDescription.value || '').replace(/<[^>]*>?/gm, '');

  const stats = [];
  if (info?.averageRating) {
    stats.push({ label: 'Rating', value: info.averageRating.toString() });
  }
  if (info?.pageCount) {
    stats.push({ label: 'Pages', value: `${info.pageCount} Pages` });
  }
  if (info?.publishedDate) {
    stats.push({ label: 'Published', value: info.publishedDate.substring(0, 4) });
  }

  const limitedCategories = info?.categories ? info.categories.slice(0, 3) : [];
  const limitedAuthors = info?.authors ? info.authors.slice(0, 2) : [];

  const metadata = [];
  if (info?.publisher) {
    metadata.push({ label: 'Publisher', value: info.publisher });
  }
  if (limitedCategories.length > 0) {
    metadata.push({ label: 'Categories', value: limitedCategories.join(', ') });
  }
  metadata.push({ label: 'Format', value: type === 'webnovel' ? 'Webnovel' : 'Book' });

  const extras = [];
  if (info?.industryIdentifiers) {
    info.industryIdentifiers.forEach((id: any) => {
      extras.push({ label: id.type.replace('_', ' '), value: id.identifier });
    });
  }
  if (info?.language) {
    extras.push({ label: 'Language', value: info.language.toUpperCase() });
  }

  let actionButton;
  if (info?.previewLink || access?.webReaderLink) {
    actionButton = {
      type: 'read' as const,
      payload: info?.previewLink || access?.webReaderLink,
      label: 'Read Sample'
    };
  }

  return {
    id: data.id.toString(),
    mediaType: type as any,
    images: {
      backdropUrl: imageUrl,
      posterUrl: imageUrl,
      backdropFallback: true
    },
    header: {
      title: info.title || 'Unknown Title',
      subtitle: limitedAuthors.length > 0 ? limitedAuthors.join(', ') : 'Unknown Author'
    },
    stats,
    metadata,
    description: cleanDescription,
    actionButton,
    scrollableSections: {
      genres: limitedCategories,
      extras
    }
  };
}

export function mapItunesTrack(trackDetails: ITunesAudioDetails | null | undefined, item: any, backdropUrl: string | null | undefined, backdropFallback: boolean, actionButton: any): UniversalMediaData {
  const duration = trackDetails?.trackTimeMillis 
    ? `${Math.floor(trackDetails.trackTimeMillis / 60000)}:${Math.floor((trackDetails.trackTimeMillis % 60000) / 1000).toString().padStart(2, '0')}` 
    : null;

  const releaseDate = trackDetails?.releaseDate 
    ? new Date(trackDetails.releaseDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
    : null;

  const price = trackDetails?.trackPrice && trackDetails.trackPrice > 0
    ? `${trackDetails.currency === 'USD' ? '$' : trackDetails.currency + ' '}${trackDetails.trackPrice}`
    : null;

  return {
    id: trackDetails?.trackId?.toString() || item.id?.toString() || '',
    mediaType: item.type || 'song',
    images: {
      backdropUrl,
      posterUrl: trackDetails?.artworkUrl100?.replace('100x100bb', '600x600bb') || item.image || '',
      backdropFallback
    },
    header: {
      title: trackDetails?.trackName || item.title || '',
      subtitle: [trackDetails?.artistName || item.subtitle, trackDetails?.collectionName].filter(Boolean).join(' • ') || ''
    },
    stats: [
      trackDetails?.trackNumber && trackDetails?.trackCount ? { label: 'Track Placement', value: `Track ${trackDetails.trackNumber} of ${trackDetails.trackCount}` } : null,
      trackDetails?.trackExplicitness === 'explicit' ? { label: 'Explicitness', value: 'Explicit' } : null,
      price ? { label: 'Price', value: price } : null
    ].filter((s): s is {label: string; value: string} => s !== null),
    metadata: [
      releaseDate ? { label: 'Released', value: releaseDate } : (trackDetails?.releaseDate ? { label: 'Release Year', value: new Date(trackDetails.releaseDate).getFullYear().toString() } : null),
      trackDetails?.primaryGenreName ? { label: 'Genre', value: trackDetails.primaryGenreName } : null,
      duration ? { label: 'Duration', value: duration } : null
    ].filter((m): m is {label: string; value: string} => m != null),
    description: '',
    actionButton: actionButton,
    secondaryActionButton: (trackDetails?.previewUrl || item.previewUrl) ? {
      type: 'audio',
      payload: trackDetails?.previewUrl || item.previewUrl
    } : undefined,
    scrollableSections: {
      extras: [
        ...(trackDetails?.country || trackDetails?.copyright ? [{
          type: 'copyright',
          title: '',
          data: (
            <div className="text-xs text-[var(--tertiary-label)] text-center mt-4 space-y-1">
              {trackDetails?.country && <p>Country of Origin: {trackDetails.country}</p>}
              {trackDetails?.copyright && <p>{trackDetails.copyright}</p>}
            </div>
          )
        }] : [])
      ]
    }
  };
}

export function itunesAudioAdapter(data: ITunesAudioAdapterInput): UniversalMediaData {
  const { trackDetails, item, backdropUrl, backdropFallback, actionButton, streamingLinks } = data;
  const mappedData = mapItunesTrack(trackDetails, item, backdropUrl, backdropFallback, actionButton);
  mappedData.streamingLinks = streamingLinks;

  return mappedData;
}

export function genericAdapter(item: any): UniversalMediaData {
  return {
    id: item.id.toString(),
    mediaType: item.type,
    images: {
      backdropUrl: item.image,
      posterUrl: item.image,
      backdropFallback: true
    },
    header: {
      title: item.title,
      subtitle: item.subtitle
    },
    stats: [],
    metadata: [
      { label: 'Format', value: item.type.charAt(0).toUpperCase() + item.type.slice(1) }
    ],
    description: item.description,
    actionButton: item.url ? {
      type: 'link',
      payload: item.url
    } : undefined,
    scrollableSections: {
      extras: []
    }
  };
}
