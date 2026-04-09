export interface FetchError extends Error {
  status?: number;
}

export function isFetchError(error: unknown): error is FetchError {
  return error instanceof Error && 'status' in error;
}

// Spotify
export interface SpotifyTrack {
  id: string;
  name: string;
  artists: { name: string }[];
  album: {
    images: { url: string }[];
  };
  external_urls: { spotify: string };
  type: string;
}

export interface SpotifyShow {
  id: string;
  name: string;
  publisher: string;
  images: { url: string }[];
  external_urls: { spotify: string };
  type: string;
}

export interface SpotifySearchResponse {
  tracks?: { items: SpotifyTrack[] };
  shows?: { items: SpotifyShow[] };
}

// TMDB
export interface TMDBMovie {
  id: number;
  title: string;
  release_date: string;
  poster_path: string | null;
  backdrop_path: string | null;
  overview: string;
  media_type?: string;
  director?: string;
  vote_average?: number;
  runtime?: number;
  genres?: { name: string }[];
  contentRating?: string;
  cast?: { name: string; character: string; profile_path: string | null }[];
  trailerUrl?: string;
  watchProviders?: unknown[];
  tagline?: string;
}

export interface TMDBTv {
  id: number;
  name: string;
  first_air_date: string;
  last_air_date?: string;
  poster_path: string | null;
  backdrop_path: string | null;
  overview: string;
  media_type?: string;
  director?: string;
  vote_average?: number;
  number_of_seasons?: number;
  status?: string;
  genres?: { name: string }[];
  contentRating?: string;
  cast?: { name: string; character: string; profile_path: string | null }[];
  trailerUrl?: string;
  watchProviders?: unknown[];
  seasons?: {
    id: number;
    name: string;
    air_date: string;
    episode_count: number;
    poster_path: string | null;
    season_number: number;
  }[];
  tagline?: string;
}

export interface TMDBSearchResponse {
  results: (TMDBMovie | TMDBTv)[];
}

// MAL
export interface MALAnime {
  node: {
    id: number;
    title: string;
    main_picture?: { medium: string; large: string };
    start_date?: string;
    media_type?: string;
  };
}

export interface MALManga {
  node: {
    id: number;
    title: string;
    main_picture?: { medium: string; large: string };
    start_date?: string;
    media_type?: string;
  };
}

export interface MALSearchResponse {
  data: (MALAnime | MALManga)[];
}

// Detailed MAL
export interface MALAnimeDetails extends MALAnime {
  node: MALAnime['node'] & {
    synopsis?: string;
    mean?: number;
    genres?: { name: string }[];
    num_episodes?: number;
    studios?: { name: string }[];
    alternative_titles?: { en?: string; ja?: string };
    status?: string;
    opening_themes?: { text: string }[];
    ending_themes?: { text: string }[];
    trailer?: { url: string };
    related_anime?: { node: { id: number; title: string; main_picture?: { large: string; medium: string } }; relation_type_formatted: string }[];
    recommendations?: { node: { id: number; title: string; main_picture?: { large: string; medium: string } } }[];
  };
}

export interface MALMangaDetails extends MALManga {
  node: MALManga['node'] & {
    synopsis?: string;
    mean?: number;
    genres?: { name: string }[];
    num_chapters?: number;
    num_volumes?: number;
    authors?: { node: { first_name: string; last_name: string } }[];
    alternative_titles?: { en?: string; ja?: string };
    status?: string;
  };
}

// Detailed TMDB
export interface TMDBMovieDetails extends TMDBMovie {
  credits?: {
    cast?: { name: string; character: string; profile_path: string | null }[];
  };
  videos?: {
    results?: { type: string; site: string; key: string }[];
  };
  'watch/providers'?: {
    results?: Record<string, { flatrate?: { provider_name: string }[]; rent?: { provider_name: string }[]; buy?: { provider_name: string }[] }>;
  };
  recommendations?: {
    results?: TMDBMovie[];
  };
  similar?: {
    results?: TMDBMovie[];
  };
}

export interface TMDBTvDetails extends TMDBTv {
  credits?: {
    cast?: { name: string; character: string; profile_path: string | null }[];
  };
  videos?: {
    results?: { type: string; site: string; key: string }[];
  };
  'watch/providers'?: {
    results?: Record<string, { flatrate?: { provider_name: string }[]; rent?: { provider_name: string }[]; buy?: { provider_name: string }[] }>;
  };
  recommendations?: {
    results?: TMDBTv[];
  };
  similar?: {
    results?: TMDBTv[];
  };
}

// Detailed Google Books
export interface GoogleBooksVolumeDetails extends GoogleBooksVolume {
  // Same as GoogleBooksVolume but we use it directly
}

// Detailed iTunes
export interface ITunesAudioDetails extends ITunesTrack {
  // Same as ITunesTrack but we use it directly
}

export interface ITunesAudioAdapterInput {
  trackDetails: ITunesAudioDetails;
  item: any;
  backdropUrl?: string;
  backdropFallback?: boolean;
  actionButton?: {
    type: 'trailer' | 'link' | 'read';
    payload: string;
    label?: string;
  };
  streamingLinks?: any;
}

export interface GoogleBooksVolume {
  id: string;
  volumeInfo: {
    title: string;
    authors?: string[];
    publishedDate?: string;
    imageLinks?: { thumbnail?: string; smallThumbnail?: string };
    description?: string | { value: string };
    averageRating?: number;
    pageCount?: number;
    categories?: string[];
    publisher?: string;
    industryIdentifiers?: { type: string; identifier: string }[];
    language?: string;
    previewLink?: string;
  };
  accessInfo?: {
    webReaderLink?: string;
  };
}

export interface GoogleBooksResponse {
  items?: GoogleBooksVolume[];
}

export interface OpenLibraryDoc {
  key: string;
  title: string;
  author_name?: string[];
  cover_i?: number;
}

export interface OpenLibrarySearchResponse {
  docs?: OpenLibraryDoc[];
}

// iTunes
export interface ITunesTrack {
  trackId: number;
  trackName: string;
  artistName: string;
  collectionName?: string;
  artworkUrl100?: string;
  artworkUrl600?: string;
  trackTimeMillis?: number;
  releaseDate?: string;
  trackPrice?: number;
  currency?: string;
  trackNumber?: number;
  trackCount?: number;
  trackExplicitness?: string;
  primaryGenreName?: string;
  previewUrl?: string;
  country?: string;
  copyright?: string;
  collectionId?: number;
  artistId?: number;
  wrapperType?: string;
}

export interface ITunesPodcast {
  collectionId: number;
  collectionName: string;
  artistName: string;
  artworkUrl100?: string;
  artworkUrl600?: string;
  releaseDate?: string;
  trackCount?: number;
  primaryGenreName?: string;
  feedUrl?: string;
}

export interface ITunesSearchResponse {
  results: (ITunesTrack | ITunesPodcast)[];
}
