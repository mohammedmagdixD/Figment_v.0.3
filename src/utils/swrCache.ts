/**
 * @license
 * SWR LocalStorage Cache Provider
 * 
 * Provides synchronous hydration of the SWR cache on cold boot.
 * - Reads from localStorage synchronously to ensure instant 0ms paints.
 * - Debounces writes to localStorage to prevent blocking the main thread during high-frequency optimistic UI updates (e.g., rapid liking).
 * - Synchronizes state across multiple browser tabs natively.
 */

export function swrLocalStorageProvider() {
  const map = new Map<string, any>();
  const CACHE_KEY = 'figment-swr-cache';

  // Defensive check for edge/SSR environments
  if (typeof window !== 'undefined') {
    
    // 1. Synchronous Cache Hydration on Cold Boot
    try {
      const cacheData = localStorage.getItem(CACHE_KEY);
      if (cacheData) {
        const parsed = JSON.parse(cacheData);
        // Safely rehydrate the Map graph
        if (Array.isArray(parsed)) {
          parsed.forEach(([key, value]: [string, any]) => {
            map.set(key, value);
          });
        }
      }
    } catch (err) {
      console.warn('Failed to parse SWR cache from localStorage', err);
    }

    // 2. Debounced Cache Persistence (Main Thread Liberation)
    let saveTimeout: ReturnType<typeof setTimeout> | null = null;
    const saveCache = () => {
      if (saveTimeout) clearTimeout(saveTimeout);
      // Wait 1.5 seconds after mutations stop to commit the data out of the critical rendering path
      saveTimeout = setTimeout(() => {
        try {
          const appCache = JSON.stringify(Array.from(map.entries()));
          localStorage.setItem(CACHE_KEY, appCache);
        } catch (err) {
          if ((err as any).name === 'QuotaExceededError') {
            console.warn('SWR Cache quota exceeded - clearing cache manually');
            localStorage.removeItem(CACHE_KEY);
            map.clear();
          } else {
            console.warn('Failed to persist SWR cache to localStorage', err);
          }
        }
      }, 1500); 
    };

    // 3. Map Operations Hooking to trigger background saves
    const setOp = map.set.bind(map);
    map.set = (key: string, value: any) => {
      setOp(key, value);
      saveCache();
      return map;
    };

    const deleteOp = map.delete.bind(map);
    map.delete = (key: string) => {
      const result = deleteOp(key);
      saveCache();
      return result;
    };

    const clearOp = map.clear.bind(map);
    map.clear = () => {
      clearOp();
      saveCache();
    };

    // 4. Cross-tab Multitasking Synchronization
    window.addEventListener('storage', (e) => {
      if (e.key === CACHE_KEY && e.newValue) {
        try {
          const parsed = JSON.parse(e.newValue);
          // Purge underlying native Map to bypass the set() interceptor and prevent an infinite loop
          clearOp(); 
          if (Array.isArray(parsed)) {
            parsed.forEach(([key, value]: [string, any]) => {
              setOp(key, value);
            });
          }
        } catch (err) {
          console.warn('Cross-tab sync failed', err);
        }
      }
    });

    // 5. Hard flush when window unloads to avoid race condition misses
    window.addEventListener('beforeunload', () => {
      if (saveTimeout) clearTimeout(saveTimeout);
      try {
        const appCache = JSON.stringify(Array.from(map.entries()));
        localStorage.setItem(CACHE_KEY, appCache);
      } catch (err) {
        // Silent catch for unloaded scopes
      }
    });
  }

  return map;
}
