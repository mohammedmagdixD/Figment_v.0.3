import { UniversalMediaData } from '../types/universal';

export function getCopyTextForMedia(data: UniversalMediaData): string {
  const { mediaType, header, metadata } = data;
  const title = header.title;
  const subtitle = header.subtitle;

  const extractYear = () => {
    const yearMeta = metadata.find(m => m.label.toLowerCase() === 'year' || m.label.toLowerCase() === 'release year');
    if (yearMeta && yearMeta.value) {
      // If the value is like "Spring 2023" or "2023-05", extract the 4 digits
      const match = String(yearMeta.value).match(/\b(19|20)\d{2}\b/);
      if (match) return match[0];
      return String(yearMeta.value);
    }
    return null;
  };

  switch (mediaType) {
    case 'movie':
    case 'tv': {
      const year = extractYear();
      return year ? `${title} (${year})` : title;
    }
    case 'season':
    case 'anime': {
      return title;
    }
    case 'song':
    case 'music':
    case 'album':
    case 'manga':
    case 'book':
    case 'podcast': {
      return subtitle ? `${title} by ${subtitle}` : title;
    }
    case 'podcast-episode': {
      return subtitle ? `${title} - ${subtitle}` : title;
    }
    default:
      return title;
  }
}
