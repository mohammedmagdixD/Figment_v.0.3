export interface UniversalMediaData {
  id: string;
  mediaType: string;
  images: {
    backdropUrl: string | null;
    posterUrl: string;
    backdropFallback?: boolean;
  };
  header: {
    title: string;
    subtitle: string;
  };
  tagline?: string;
  stats: { label: string; value: string | number | null }[];
  metadata: { label: string; value: string | number | null }[];
  description: string;
  actionButton?: {
    type: 'trailer' | 'audio' | 'read' | 'link';
    payload: string;
    label?: string;
  };
  secondaryActionButton?: {
    type: 'audio';
    payload: string;
  };
  userStats?: {
    rating?: number;
    dateAdded?: string;
  };
  scrollableSections: {
    genres?: string[];
    cast?: { name: string; role: string; imageUrl: string | null }[];
    extras?: { type: string; title: string; data: any }[];
    watchProviders?: { provider_id: number; provider_name: string; logo_path: string }[];
  };
  relatedLists?: {
    listTitle: string;
    items: UniversalMediaData[];
  }[];
  streamingLinks?: any;
}
