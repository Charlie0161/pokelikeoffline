// sw.js — Service Worker for offline Pokelike
// Place this file in the ROOT of the project (same folder as index.html)

const CACHE_NAME = 'pokelike-v1';

// Core game files to cache immediately on first load
const STATIC_ASSETS = [
  './',
  './index.html',
  './css/style.css',
  './js/data.js',
  './js/map.js',
  './js/battle.js',
  './js/endless.js',
  './js/ui.js',
  './js/game.js',
  './js/rules.js',
  './js/cloud-save.js',
  './manifest.json',
];

// ─── Install ───────────────────────────────────────────────────────────────
// Cache all static assets when the SW first installs
self.addEventListener('install', event => {
  console.log('[SW] Installing...');
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      console.log('[SW] Caching static assets');
      // addAll fails if any single asset 404s — use individual adds so one
      // missing file doesn't break everything
      return Promise.allSettled(
        STATIC_ASSETS.map(url => cache.add(url).catch(e =>
          console.warn(`[SW] Failed to cache ${url}:`, e)
        ))
      );
    })
  );
  self.skipWaiting(); // activate immediately
});

// ─── Activate ──────────────────────────────────────────────────────────────
// Remove old caches when a new SW version activates
self.addEventListener('activate', event => {
  console.log('[SW] Activating...');
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys
          .filter(key => key !== CACHE_NAME)
          .map(key => {
            console.log('[SW] Deleting old cache:', key);
            return caches.delete(key);
          })
      )
    )
  );
  self.clients.claim(); // take control of all open tabs immediately
});

// ─── Fetch ─────────────────────────────────────────────────────────────────
// Serve from cache first; fall back to network and cache the response
self.addEventListener('fetch', event => {
  const url = event.request.url;

  // Skip non-GET requests and chrome-extension requests
  if (event.request.method !== 'GET') return;
  if (url.startsWith('chrome-extension://')) return;

  event.respondWith(
    caches.match(event.request).then(cached => {
      if (cached) {
        return cached; // Serve from cache (works offline)
      }

      // Not in cache — try the network
      return fetch(event.request).then(response => {
        // Don't cache bad responses
        if (!response || response.status !== 200 || response.type === 'opaque') {
          return response;
        }

        // Cache sprites, UI images, and JS/CSS files as they load
        const shouldCache =
          url.includes('/sprites/') ||
          url.includes('/ui/') ||
          url.includes('/css/') ||
          url.includes('/js/') ||
          url.includes('pokemonshowdown.com/sprites') ||
          url.includes('raw.githubusercontent.com/PokeAPI');

        if (shouldCache) {
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then(cache => {
            cache.put(event.request, responseClone);
          });
        }

        return response;
      }).catch(() => {
        // Completely offline and not cached
        // Return a transparent 1x1 PNG for missing images so the game
        // doesn't break with broken image icons
        if (
          event.request.destination === 'image' ||
          url.endsWith('.png') ||
          url.endsWith('.jpg')
        ) {
          return new Response(
            // Minimal valid 1x1 transparent PNG
            Uint8Array.from(atob(
              'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg=='
            ), c => c.charCodeAt(0)),
            { headers: { 'Content-Type': 'image/png' } }
          );
        }
      });
    })
  );
});
