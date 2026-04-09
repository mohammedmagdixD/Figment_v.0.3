import express from 'express';
import cors from 'cors';
import { FetchError, isFetchError } from './src/types/api';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fetchWithCache } from './src/utils/cache';

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(cors());

  // Spotify Auth Token Cache
  let spotifyToken: string | null = null;
  let spotifyTokenExpiresAt = 0;
  let spotifyTokenPromise: Promise<string> | null = null;

  async function getSpotifyToken(forceRefresh = false) {
    const clientId = process.env.SPOTIFY_CLIENT_ID;
    const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;

    if (!clientId || !clientSecret) {
      throw new Error('Spotify credentials not configured');
    }

    if (spotifyTokenPromise) {
      return spotifyTokenPromise;
    }

    if (!forceRefresh && spotifyToken && Date.now() < spotifyTokenExpiresAt) {
      return spotifyToken;
    }

    spotifyTokenPromise = (async () => {
      try {
        const response = await fetch('https://accounts.spotify.com/api/token', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Authorization': 'Basic ' + Buffer.from(clientId + ':' + clientSecret).toString('base64'),
            'User-Agent': 'ShelveApp/1.0'
          },
          body: 'grant_type=client_credentials'
        });

        if (!response.ok) {
          const errText = await response.text();
          console.error('Failed to get Spotify token:', errText);
          throw new Error(`Failed to get Spotify token: ${response.status} ${errText}`);
        }

        const data = await response.json();
        if (!data.access_token) {
          console.error('Spotify token response missing access_token:', data);
          throw new Error('Spotify token response missing access_token');
        }
        spotifyToken = data.access_token;
        spotifyTokenExpiresAt = Date.now() + (data.expires_in - 60) * 1000; // Expire 1 min early
        return spotifyToken;
      } catch (error) {
        console.error('Error during Spotify token handshake:', error);
        throw error;
      } finally {
        spotifyTokenPromise = null;
      }
    })();

    return spotifyTokenPromise;
  }

  // API Routes
  app.get('/api/search/spotify', async (req, res) => {
    try {
      const query = (req.query.q as string || '').trim();
      const type = (req.query.type as string || 'track').trim(); // Support 'track' or 'show'
      if (!query) return res.json({ results: [] });

      const cacheKey = `spotify:search:${type}:${query}`;
      const TTL = 60 * 60; // 1 hour

      const data = await fetchWithCache(cacheKey, TTL, async () => {
        const fetchSpotifySearch = async (token: string) => {
          const params = new URLSearchParams({
            q: query,
            type: type,
            limit: '15'
          });
          return fetch(`https://api.spotify.com/v1/search?${params.toString()}`, {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Accept': 'application/json',
              'User-Agent': 'ShelveApp/1.0'
            }
          });
        };

        let token = await getSpotifyToken();
        let response = await fetchSpotifySearch(token);

        if (response.status === 401) {
          // Token might be expired or invalid, clear it and retry once
          token = await getSpotifyToken(true);
          response = await fetchSpotifySearch(token);
        }

        if (!response.ok) {
          const errText = await response.text();
          if (response.status === 403) {
            // Gracefully handle 403 Forbidden
            return { results: [] };
          }
          const err = new Error(`Spotify API error: ${response.status} ${errText}`) as FetchError;
          err.status = response.status;
          throw err;
        }

        const data = await response.json();
        return data;
      });

      res.setHeader('Cache-Control', `public, max-age=${TTL}`);
      res.json(data);
    } catch (error: unknown) {
      if (isFetchError(error) && error.status !== 429) {
        console.error('Spotify search error:', error.message || error);
      } else if (!isFetchError(error)) {
        console.error('Spotify search error:', error);
      }
      res.status(isFetchError(error) && error.status ? error.status : 500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
    }
  });

  // MAL API Proxy
  app.get('/api/mal/*', async (req, res) => {
    try {
      const endpoint = req.params[0];
      const queryParams = new URLSearchParams(req.query as Record<string, string>).toString();
      const url = `https://api.myanimelist.net/v2/${endpoint}${queryParams ? `?${queryParams}` : ''}`;
      
      const cacheKey = `mal:${endpoint}:${queryParams}`;
      const TTL = 24 * 60 * 60; // 24 hours

      const data = await fetchWithCache(cacheKey, TTL, async () => {
        const clientId = process.env.MAL_CLIENT_ID;
        if (!clientId) {
          throw new Error('MAL_CLIENT_ID not configured');
        }
        
        const response = await fetch(url, {
          headers: {
            'X-MAL-CLIENT-ID': clientId
          }
        });

        if (!response.ok) {
          const errText = await response.text();
          const err = new Error(`MAL API error: ${response.status} ${errText}`) as FetchError;
          err.status = response.status;
          throw err;
        }

        return await response.json();
      });

      res.setHeader('Cache-Control', `public, max-age=${TTL}`);
      res.json(data);
    } catch (error: unknown) {
      if (isFetchError(error) && error.status !== 429) {
        console.error('MAL API error:', error.message || error);
      } else if (!isFetchError(error)) {
        console.error('MAL API error:', error);
      }
      res.status(isFetchError(error) && error.status ? error.status : 500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
    }
  });

  // Odesli API Proxy with Caching
  app.get('/api/odesli', async (req, res) => {
    try {
      const { url, platform, type, id } = req.query;
      
      let odesliUrl = 'https://api.song.link/v1-alpha.1/links?songIfSingle=true';
      let cacheKey = '';

      if (url) {
        odesliUrl += `&url=${encodeURIComponent(url as string)}`;
        cacheKey = `odesli:url:${url}`;
      } else if (platform && type && id) {
        odesliUrl += `&platform=${platform}&type=${type}&id=${id}`;
        cacheKey = `odesli:id:${platform}:${type}:${id}`;
      } else {
        return res.status(400).json({ error: 'Missing required parameters: url OR platform, type, and id' });
      }

      const TTL = 24 * 60 * 60; // 24 hours

      const data = await fetchWithCache(cacheKey, TTL, async () => {
        const response = await fetch(odesliUrl);
        
        if (!response.ok) {
          const errText = await response.text();
          const err = new Error(`Odesli API error: ${response.status} ${errText}`) as FetchError;
          err.status = response.status;
          throw err;
        }

        return await response.json();
      });
      
      res.setHeader('Cache-Control', `public, max-age=${TTL}`);
      res.json(data);
    } catch (error: unknown) {
      if (isFetchError(error) && error.status !== 429) {
        console.error('Odesli proxy error:', error.message || error);
      } else if (!isFetchError(error)) {
        console.error('Odesli proxy error:', error);
      }
      res.status(isFetchError(error) && error.status ? error.status : 500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
    }
  });

  // TMDB API Proxy
  app.get('/api/tmdb/*', async (req, res) => {
    try {
      const endpoint = req.params[0];
      const queryParams = new URLSearchParams(req.query as Record<string, string>);
      
      // Remove any client-provided api_key to ensure we use the server's key
      queryParams.delete('api_key');
      
      const tmdbApiKey = process.env.TMDB_API_KEY;
      if (!tmdbApiKey) {
        throw new Error('TMDB API key not configured');
      }
      
      queryParams.append('api_key', tmdbApiKey);
      const queryString = queryParams.toString();
      const url = `https://api.themoviedb.org/3/${endpoint}?${queryString}`;
      
      const cacheKey = `tmdb:${endpoint}:${queryString}`;
      const TTL = endpoint.startsWith('search/') ? 60 * 60 : 24 * 60 * 60; // 1 hour for search, 24 hours for details

      const data = await fetchWithCache(cacheKey, TTL, async () => {
        const headers: Record<string, string> = {};
        headers.referer = req.headers.referer || req.headers.origin || `https://${req.get('host')}/`;

        const response = await fetch(url, { headers });

        if (!response.ok) {
          const errText = await response.text();
          const err = new Error(`TMDB API error: ${response.status} ${errText}`) as FetchError;
          err.status = response.status;
          throw err;
        }

        return await response.json();
      });

      res.setHeader('Cache-Control', `public, max-age=${TTL}`);
      res.json(data);
    } catch (error: unknown) {
      if (isFetchError(error) && error.status !== 429) {
        console.error('TMDB API error:', error.message || error);
      } else if (!isFetchError(error)) {
        console.error('TMDB API error:', error);
      }
      res.status(isFetchError(error) && error.status ? error.status : 500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
    }
  });

  // Google Books API Proxy
  app.get('/api/books/*', async (req, res) => {
    try {
      const endpoint = req.params[0];
      const queryParams = new URLSearchParams(req.query as Record<string, string>);
      
      // Remove any client-provided key to ensure we use the server's key
      queryParams.delete('key');
      
      const googleBooksApiKey = process.env.GOOGLE_BOOKS_API_KEY;
      if (googleBooksApiKey) {
        queryParams.append('key', googleBooksApiKey);
      }
      
      const queryString = queryParams.toString();
      const url = `https://www.googleapis.com/books/v1/${endpoint}${queryString ? `?${queryString}` : ''}`;
      
      const cacheKey = `books:${endpoint}:${queryString}`;
      const TTL = (endpoint === 'volumes' && queryString.includes('q=')) ? 60 * 60 : 24 * 60 * 60; // 1 hour for search, 24 hours for details

      const data = await fetchWithCache(cacheKey, TTL, async () => {
        const headers: Record<string, string> = {};
        headers.referer = req.headers.referer || req.headers.origin || `https://${req.get('host')}/`;

        const response = await fetch(url, { headers });

        if (!response.ok) {
          const errText = await response.text();
          const err = new Error(`Google Books API error: ${response.status} ${errText}`) as FetchError;
          err.status = response.status;
          throw err;
        }

        return await response.json();
      });

      res.setHeader('Cache-Control', `public, max-age=${TTL}`);
      res.json(data);
    } catch (error: unknown) {
      if (isFetchError(error) && error.status !== 429) {
        console.error('Google Books API error:', error.message || error);
      } else if (!isFetchError(error)) {
        console.error('Google Books API error:', error);
      }
      res.status(isFetchError(error) && error.status ? error.status : 500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
