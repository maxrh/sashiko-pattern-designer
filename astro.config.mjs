// @ts-check
import { defineConfig } from 'astro/config';

import react from '@astrojs/react';

import tailwindcss from '@tailwindcss/vite';

import AstroPWA from '@vite-pwa/astro';

// https://astro.build/config
export default defineConfig({
  site: 'https://sashiko.design',
  integrations: [
    react(),
    AstroPWA({
      registerType: 'autoUpdate',
      workbox: {
        skipWaiting: true,
        clientsClaim: true,
        cleanupOutdatedCaches: true,
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff,woff2}'],
        runtimeCaching: [
          {
            // HTML pages - Serve from cache immediately, update in background
            urlPattern: ({ request }) => request.mode === 'navigate',
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'pages-cache',
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 // 1 hour
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          },
          {
            // JS and CSS - Serve from cache, update in background
            urlPattern: /\.(?:js|css)$/,
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'static-assets-cache',
              expiration: {
                maxEntries: 60,
                maxAgeSeconds: 60 * 60 // 1 hour
              }
            }
          },
          {
            // Images and fonts - Cache first (these don't change often)
            urlPattern: /\.(?:png|jpg|jpeg|svg|gif|webp|woff|woff2|ico)$/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'media-cache',
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 60 * 60 * 24 * 30 // 30 days
              }
            }
          }
        ]
      },
      manifest: {
        name: 'Sashiko Pattern Designer',
        short_name: 'Sashiko',
        description: 'Interactive tool for designing traditional Japanese Sashiko embroidery patterns',
        theme_color: '#fafafa',
        background_color: '#fafafa',
        display: 'standalone',
        start_url: '/',
        scope: '/',
        icons: [
          {
            src: '/android/android-launchericon-192-192.png',
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: '/android/android-launchericon-512-512.png',
            sizes: '512x512',
            type: 'image/png'
          }
        ]
      },
      devOptions: {
        enabled: false
      }
    })
  ],

  vite: {
    plugins: [tailwindcss()],
    server: {
      hmr: {
        overlay: false,
        port: 4321
      }
    },
    optimizeDeps: {
      include: ['react', 'react-dom']
    },
    build: {
      minify: 'esbuild'
    }
  }
});