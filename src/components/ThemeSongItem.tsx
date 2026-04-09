import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, Music } from 'lucide-react';
import { fetchWithBackoff } from '../services/api';
import { UniversalListItem } from './UniversalListItem';

interface ThemeSongItemProps {
  themeString: string;
}

export function ThemeSongItem({ themeString }: ThemeSongItemProps) {
  const [songData, setSongData] = useState<any>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    let isMounted = true;
    const fetchSong = async () => {
      try {
        // Parse "1: \"Song Name\" by Artist (eps 1-12)"
        const match = themeString.match(/"([^"]+)"\s+by\s+([^()]+)/);
        let query = themeString;
        if (match) {
          query = `${match[1]} ${match[2]}`.trim();
        } else {
          // Fallback parsing if quotes aren't used
          const bySplit = themeString.split(' by ');
          if (bySplit.length > 1) {
            const songName = bySplit[0].replace(/^\d+:\s*/, '').trim();
            const artist = bySplit[1].split('(')[0].trim();
            query = `${songName} ${artist}`;
          }
        }

        const res = await fetchWithBackoff(`https://itunes.apple.com/search?term=${encodeURIComponent(query)}&entity=song&limit=1`);
        const data = await res.json();
        
        if (isMounted && data.results && data.results.length > 0) {
          setSongData(data.results[0]);
        }
      } catch (e) {
        console.error('Failed to fetch song:', e);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    fetchSong();
    return () => { isMounted = false; };
  }, [themeString]);

  useEffect(() => {
    if (songData?.previewUrl) {
      audioRef.current = new Audio(songData.previewUrl);
      audioRef.current.addEventListener('ended', () => setIsPlaying(false));
    }
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, [songData]);

  const togglePlay = () => {
    if (!audioRef.current) return;
    
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      // Pause all other audio elements on the page
      document.querySelectorAll('audio').forEach(audio => {
        if (audio !== audioRef.current) {
          audio.pause();
        }
      });
      // Also dispatch a custom event to tell other components to pause
      window.dispatchEvent(new CustomEvent('pause-all-audio'));
      
      audioRef.current.play();
      setIsPlaying(true);
    }
  };

  useEffect(() => {
    const handlePauseAll = () => {
      if (isPlaying && audioRef.current) {
        audioRef.current.pause();
        setIsPlaying(false);
      }
    };
    window.addEventListener('pause-all-audio', handlePauseAll);
    return () => window.removeEventListener('pause-all-audio', handlePauseAll);
  }, [isPlaying]);

  const title = songData?.trackName || themeString.replace(/^\d+:\s*/, '').split(' by ')[0].replace(/"/g, '');
  const subtitle = songData?.artistName || themeString.split(' by ')[1]?.split('(')[0]?.trim() || 'Unknown Artist';

  return (
    <UniversalListItem
      title={title}
      subtitle={subtitle}
      imageUrl={songData?.artworkUrl100}
      icon="music"
      imageStyle="circle"
      actionButton={
        songData?.previewUrl ? (
          <button 
            onClick={(e) => {
              e.stopPropagation();
              togglePlay();
            }}
            className="w-full h-full flex items-center justify-center"
          >
            {isPlaying ? (
              <Pause className="w-4 h-4 text-white fill-white" />
            ) : (
              <Play className="w-4 h-4 text-white fill-white ml-0.5" />
            )}
          </button>
        ) : undefined
      }
      rightContent={
        !songData?.previewUrl && !isLoading ? (
          <div className="text-xs font-medium text-[var(--tertiary-label)] uppercase tracking-wider px-2 py-1 bg-[var(--tertiary-system-background)] rounded-sm">
            No Preview
          </div>
        ) : undefined
      }
    />
  );
}
