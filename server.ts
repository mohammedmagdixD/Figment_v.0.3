import express from 'express';
import cors from 'cors';
import { isFetchError } from './src/types/api.ts';
import type { FetchError } from './src/types/api.ts';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import fs from 'fs';
import { fetchWithCache } from './src/utils/cache.ts';
import { createClient } from '@supabase/supabase-js';
import satori from 'satori';
import { html } from 'satori-html';
import { Resvg } from '@resvg/resvg-js';

let interRegular: ArrayBuffer | null = null;
let interBold: ArrayBuffer | null = null;

async function loadFonts() {
  if (!interRegular) {
    const res = await fetch('https://raw.githubusercontent.com/rsms/inter/master/docs/font-files/Inter-Regular.ttf');
    interRegular = await res.arrayBuffer();
  }
  if (!interBold) {
    const res = await fetch('https://raw.githubusercontent.com/rsms/inter/master/docs/font-files/Inter-Bold.ttf');
    interBold = await res.arrayBuffer();
  }
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(cors());

  // Initialize Supabase client for OG tag injection
  const supabaseUrl = process.env.VITE_SUPABASE_URL;
  const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;
  const supabase = createClient(supabaseUrl || '', supabaseAnonKey || '');

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
  let vite: any;
  if (process.env.NODE_ENV !== 'production') {
    vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
  }

  // OG Image Route
  app.get('/api/og/@:handle', async (req, res) => {
    let handle = req.params.handle;
    handle = handle.replace(/[:/]+$/, '');

    try {
      const { data: userProfile, error } = await supabase
        .from('users')
        .select('name, bio, avatar_url')
        .or(`handle.eq.${handle},username.eq.${handle}`)
        .single();

      if (error || !userProfile) {
        return res.status(404).send('Not found');
      }

      const name = userProfile.name || 'Anonymous';
      const bio = (userProfile.bio || '').substring(0, 100) + (userProfile.bio?.length > 100 ? '...' : '');
      const avatarUrl = userProfile.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${handle}`;

      let avatarBase64 = '';
      try {
        const avatarRes = await fetch(avatarUrl);
        const buffer = await avatarRes.arrayBuffer();
        const contentType = avatarRes.headers.get('content-type') || 'image/png';
        avatarBase64 = `data:${contentType};base64,${Buffer.from(buffer).toString('base64')}`;
      } catch (e) {
        console.error('Error fetching avatar for OG:', e);
      }

      await loadFonts();

      const markup = html`
        <div style="display: flex; flex-direction: column; width: 1200px; height: 630px; background-color: #050505; background-image: linear-gradient(135deg, #0f172a 0%, #000000 100%); position: relative; overflow: hidden; align-items: center; justify-content: center; font-family: 'Inter', sans-serif;">
          
          <!-- Decorative elements -->
          <div style="position: absolute; top: -200px; right: -100px; width: 800px; height: 800px; background-image: radial-gradient(circle, rgba(196, 227, 243, 0.15) 0%, rgba(0,0,0,0) 70%); border-radius: 50%;"></div>
          <div style="position: absolute; bottom: -200px; left: -100px; width: 800px; height: 800px; background-image: radial-gradient(circle, rgba(244, 200, 221, 0.1) 0%, rgba(0,0,0,0) 70%); border-radius: 50%;"></div>
          
          <!-- Glass Card -->
          <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; width: 1080px; height: 510px; background-color: rgba(255, 255, 255, 0.03); border: 1px solid rgba(255, 255, 255, 0.08); border-radius: 48px; box-shadow: 0 30px 60px rgba(0,0,0,0.5);">
            
            <!-- Avatar -->
            <div style="display: flex; width: 220px; height: 220px; border-radius: 110px; overflow: hidden; border: 2px solid rgba(255,255,255,0.15); margin-bottom: 30px; box-shadow: 0 10px 30px rgba(0,0,0,0.5);">
              ${avatarBase64 ? `<img src="${avatarBase64}" width="220" height="220" style="object-fit: cover;" />` : `<div style="width: 220px; height: 220px; background-color: rgba(255,255,255,0.05);"></div>`}
            </div>

            <!-- Text Content -->
            <div style="display: flex; flex-direction: column; align-items: center;">
              <div style="font-size: 84px; font-weight: 700; color: #ffffff; letter-spacing: -0.02em; margin-bottom: 10px; text-align: center;">${name}</div>
              <div style="font-size: 36px; font-weight: 400; color: rgba(255,255,255,0.5); margin-bottom: 30px;">@${handle}</div>
              <div style="font-size: 28px; font-weight: 400; color: rgba(255,255,255,0.6); text-align: center; max-width: 800px; line-height: 1.5;">${bio}</div>
            </div>
            
            <!-- Bottom Branding -->
            <div style="position: absolute; bottom: 80px; display: flex; width: 960px; justify-content: space-between; align-items: center; border-top: 1px solid rgba(255,255,255,0.1); padding-top: 30px;">
              <div style="font-size: 16px; color: rgba(255,255,255,0.4); letter-spacing: 2px;">DIGITAL IDENTITY PWA</div>
              <div style="font-size: 24px; font-weight: 700; color: #ffffff; letter-spacing: 6px; opacity: 0.8;">FIGMENT</div>
            </div>
          </div>
        </div>
      `;

      const svg = await satori(markup as any, {
        width: 1200,
        height: 630,
        fonts: [
          {
            name: 'Inter',
            data: interRegular!,
            weight: 400,
            style: 'normal',
          },
          {
            name: 'Inter',
            data: interBold!,
            weight: 700,
            style: 'normal',
          },
        ],
      });

      const resvg = new Resvg(svg, {
        fitTo: {
          mode: 'width',
          value: 1200,
        },
      });
      const pngData = resvg.render();
      const pngBuffer = pngData.asPng();

      res.setHeader('Content-Type', 'image/png');
      res.setHeader('Cache-Control', 'public, max-age=3600');
      res.send(pngBuffer);
    } catch (e) {
      console.error('Error generating OG image:', e);
      res.status(500).send('Error');
    }
  });

  // Handle dynamic OG tags for profile routes
  app.get('/@:handle', async (req, res, next) => {
    let handle = req.params.handle;
    handle = handle.replace(/[:/]+$/, '');
    
    try {
      // Fetch user profile from Supabase
      const { data: userProfile, error } = await supabase
        .from('users')
        .select('name, bio, avatar_url')
        .or(`handle.eq.${handle},username.eq.${handle}`)
        .single();

      if (error || !userProfile) {
        return next(); // Fallback to default index.html
      }

      let template: string;
      if (process.env.NODE_ENV !== 'production') {
        template = fs.readFileSync(path.resolve(process.cwd(), 'index.html'), 'utf-8');
        template = await vite.transformIndexHtml(req.originalUrl, template);
      } else {
        template = fs.readFileSync(path.resolve(process.cwd(), 'dist/index.html'), 'utf-8');
      }

      const name = userProfile.name || 'Anonymous';
      const bio = userProfile.bio || `Check out ${name}'s profile on Figment.`;
      const ogImageUrl = `https://${req.get('host')}/api/og/@${handle}`;

      const ogTags = `
        <title>${name} (@${handle}) | Figment</title>
        <meta name="description" content="${bio}" />
        <meta property="og:title" content="${name} (@${handle}) | Figment" />
        <meta property="og:description" content="${bio}" />
        <meta property="og:image" content="${ogImageUrl}" />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />
        <meta property="og:image:type" content="image/png" />
        <meta property="og:url" content="https://${req.get('host')}/@${handle}" />
        <meta property="og:type" content="profile" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="${name} (@${handle}) | Figment" />
        <meta name="twitter:description" content="${bio}" />
        <meta name="twitter:image" content="${ogImageUrl}" />
      `;

      const html = template.replace(
        '</head>',
        `${ogTags}</head>`
      );

      res.status(200).set({ 'Content-Type': 'text/html' }).end(html);
    } catch (e) {
      console.error('Error injecting OG tags:', e);
      next();
    }
  });

  // Image proxy for CORS-restricted images (e.g., MAL, Google Books) to allow canvas export
  app.get('/api/image-proxy', async (req, res) => {
    try {
      const url = req.query.url as string;
      if (!url) return res.status(400).json({ error: 'No URL provided' });

      if (!url.startsWith('http://') && !url.startsWith('https://')) {
        return res.status(400).json({ error: 'Invalid URL' });
      }

      const response = await fetch(url, {
        headers: {
          'User-Agent': 'ShelveApp/1.0 (ImageProxy)',
          'Accept': 'image/webp,image/png,image/jpeg,image/*;q=0.8',
        }
      });
      
      if (!response.ok) {
        throw new Error(`Fetch failed: ${response.status} ${response.statusText}`);
      }

      const contentType = response.headers.get('content-type');
      if (contentType) res.setHeader('Content-Type', contentType);
      
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Cache-Control', 'public, max-age=86400');
      
      const arrayBuffer = await response.arrayBuffer();
      res.send(Buffer.from(arrayBuffer));
    } catch (e: any) {
      console.error('Image proxy error:', e.message);
      res.status(500).json({ error: 'Failed to proxy image' });
    }
  });

  // Handle dynamic OG tags for media items and redirect
  app.get('/m/:type/:id', async (req, res, next) => {
    const { type, id } = req.params;
    
    try {
      // Basic bot user-agent detection
      const userAgent = req.headers['user-agent'] || '';
      const isBot = /bot|chatgpt|facebookexternalhit|whatsapp|twitterbot|discordbot|slackbot/i.test(userAgent);

      let imgUrl = `https://${req.get('host')}/apple-touch-icon.png`; // Fallback image

      if (isBot) {
        return res.send(`
          <!DOCTYPE html>
          <html>
            <head>
              <meta property="og:title" content="View on Figment" />
              <meta property="og:description" content="Click to view full details." />
              <meta property="og:image" content="${imgUrl}" />
              <meta property="og:url" content="https://${req.get('host')}/m/${type}/${id}" />
              <meta name="twitter:card" content="summary_large_image" />
            </head>
            <body></body>
          </html>
        `);
      }

      let template: string;
      if (process.env.NODE_ENV !== 'production') {
        template = fs.readFileSync(path.resolve(process.cwd(), 'index.html'), 'utf-8');
        template = await vite.transformIndexHtml(req.originalUrl, template);
      } else {
        template = fs.readFileSync(path.resolve(process.cwd(), 'dist/index.html'), 'utf-8');
      }
      
      const ogTags = `
        <title>Shared Media | Figment</title>
        <meta property="og:title" content="View on Figment" />
        <meta property="og:description" content="View this media on Figment" />
        <meta property="og:image" content="${imgUrl}" />
      `;

      const html = template.replace('</head>', `${ogTags}</head>`);
      res.status(200).set({ 'Content-Type': 'text/html' }).end(html);

    } catch (e) {
      console.error('Error handling /m/ route:', e);
      next();
    }
  });

  if (process.env.NODE_ENV !== 'production') {
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
  }

  // SPA fallback
  app.get('*', (req, res) => {
    if (process.env.NODE_ENV !== 'production') {
      // Vite handles this in dev mode via middleware
    } else {
      res.sendFile(path.join(process.cwd(), 'dist/index.html'));
    }
  });

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
