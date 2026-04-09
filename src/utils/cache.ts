const MAX_CACHE_SIZE = 500;

export const serverCache = new Map<string, { data: any; timestamp: number; ttlSeconds: number }>();

function evictIfNecessary() {
  if (serverCache.size >= MAX_CACHE_SIZE) {
    const now = Date.now();
    
    // 1. Try to free up space by removing expired items
    for (const [key, value] of serverCache.entries()) {
      if (now - value.timestamp >= value.ttlSeconds * 1000) {
        serverCache.delete(key);
      }
    }
    
    // 2. If still at capacity, delete the oldest item (FIFO)
    if (serverCache.size >= MAX_CACHE_SIZE) {
      const oldestKey = serverCache.keys().next().value;
      if (oldestKey) {
        serverCache.delete(oldestKey);
      }
    }
  }
}

export async function fetchWithCache<T>(
  cacheKey: string,
  ttlSeconds: number,
  fetcher: () => Promise<T>
): Promise<T> {
  const cached = serverCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < cached.ttlSeconds * 1000) {
    return cached.data as T;
  }

  const data = await fetcher();
  
  // Enforce memory bounds before inserting new data
  evictIfNecessary();
  serverCache.set(cacheKey, { data, timestamp: Date.now(), ttlSeconds });
  
  return data;
}
