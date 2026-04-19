import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig, loadEnv} from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig(({mode}) => {
  const env = loadEnv(mode, '.', '');
  return {
    plugins: [
      react(), 
      tailwindcss(),
      VitePWA({
        registerType: 'autoUpdate',
        injectRegister: 'auto',
        workbox: {
          globPatterns: ['**/*.{js,css,html,png,jpg,jpeg,svg,webp,ico,woff,woff2}'],
          navigateFallback: '/index.html',
          runtimeCaching: [
            {
              // UI Assets (Stale-While-Revalidate)
              urlPattern: /\.(?:js|css|woff2?|eot|ttf|otf)$/i,
              handler: 'StaleWhileRevalidate',
              options: {
                cacheName: 'ui-assets-cache',
                expiration: {
                  maxEntries: 200,
                  maxAgeSeconds: 60 * 60 * 24 * 7, // 7 Days
                },
                cacheableResponse: {
                  statuses: [0, 200]
                }
              }
            },
            {
              // Static Media (Cache-First)
              urlPattern: /\.(?:png|jpg|jpeg|svg|webp|ico|gif|webm|mp4)$/i,
              handler: 'CacheFirst',
              options: {
                cacheName: 'static-media-cache',
                expiration: {
                  maxEntries: 1000,
                  maxAgeSeconds: 60 * 60 * 24 * 30, // 30 Days
                },
                cacheableResponse: {
                  statuses: [0, 200]
                }
              }
            },
            {
              // Supabase REST API (Stale-While-Revalidate)
              urlPattern: /^https:\/\/.*\.supabase\.co\/rest\/v1\/.*/i,
              handler: 'StaleWhileRevalidate',
              options: {
                cacheName: 'supabase-api-cache',
                expiration: {
                  maxEntries: 500,
                  maxAgeSeconds: 60 * 60 * 24 * 7, // 7 Days
                },
                cacheableResponse: {
                  statuses: [0, 200]
                }
              }
            },
            {
              // Images (TMDB, Supabase Storage, General) (Cache-First)
              urlPattern: /^https:\/\/(?:image\.tmdb\.org|.*\.supabase\.co\/storage\/v1\/object\/public|picsum\.photos)\/.*/i,
              handler: 'CacheFirst',
              options: {
                cacheName: 'media-image-cache',
                expiration: {
                  maxEntries: 1000,
                  maxAgeSeconds: 60 * 60 * 24 * 30, // 30 Days
                },
                cacheableResponse: {
                  statuses: [0, 200]
                }
              }
            }
          ]
        },
        manifest: {
          name: 'Figment',
          short_name: 'Figment',
          description: 'Your personal media catalog',
          theme_color: '#ffffff',
          background_color: '#ffffff',
          display: 'standalone',
          scope: '/',
          start_url: '/',
          icons: [
            {
              src: '/icon-192x192.png',
              sizes: '192x192',
              type: 'image/png'
            },
            {
              src: '/icon-512x512.png',
              sizes: '512x512',
              type: 'image/png'
            }
          ]
        }
      })
    ],
    define: {
      'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY),
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    build: {
      rollupOptions: {
        output: {
          manualChunks: {
            'react-vendor': ['react', 'react-dom'],
            'motion-vendor': ['motion'],
            'lucide-vendor': ['lucide-react'],
            'supabase-vendor': ['@supabase/supabase-js'],
            'swr-vendor': ['swr']
          }
        }
      }
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modifyâfile watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
    },
  };
});
