import { useState, useEffect } from 'react';
import { MediaType } from '../services/api';

export interface SearchHistoryItem {
  id: string;
  query: string;
  mediaType: MediaType;
  timestamp: number;
}

const STORAGE_KEY = 'ais_search_history';

export function useSearchHistory() {
  const [history, setHistory] = useState<SearchHistoryItem[]>([]);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        setHistory(JSON.parse(stored));
      }
    } catch (e) {
      console.error('Failed to load search history', e);
    }
  }, []);

  const addToHistory = (query: string, mediaType: MediaType) => {
    if (!query.trim()) return;
    
    setHistory(prev => {
      // Remove duplicate if exists
      const filtered = prev.filter(item => !(item.query === query && item.mediaType === mediaType));
      
      const newItem: SearchHistoryItem = {
        id: `sh_${Date.now()}`,
        query: query.trim(),
        mediaType,
        timestamp: Date.now()
      };
      
      const updated = [newItem, ...filtered].slice(0, 20); // Keep last 20
      
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      } catch (e) {
        console.error('Failed to save search history', e);
      }
      
      return updated;
    });
  };

  const clearHistory = () => {
    setHistory([]);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (e) {
      console.error('Failed to clear search history', e);
    }
  };

  const removeFromHistory = (id: string) => {
    setHistory(prev => {
      const updated = prev.filter(item => item.id !== id);
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      } catch (e) {
        console.error('Failed to save search history', e);
      }
      return updated;
    });
  };

  return { history, addToHistory, clearHistory, removeFromHistory };
}
