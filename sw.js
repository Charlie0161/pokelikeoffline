// sw.js — Service Worker for offline Pokelike
// CACHE_NAME is injected by generate-sw.js at deploy time.
// Never edit this file directly — edit generate-sw.js instead.

const CACHE_NAME = 'pokelike-20260609-1517';

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
// Cache all static assets when the SW first installs.
// skipWaiting means the new SW activates immediately without waiting for
// existing tabs to close — so updates appear on next app open.
self.addEventListener('install', event => {
  console.log('[SW] Installing', CACHE_NAME);
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache =>
      Promise.allSettled(
        STATIC_ASSETS.map(url => cache.add(url).catch(e =>
          console.warn(`[SW] Failed to cache ${url}:`, e)
        ))
      )
    )
  );
  self.skipWaiting();
});

// ─── Activate ──────────────────────────────────────────────────────────────
// Delete ALL old caches so stale assets can never surface.
// clients.claim makes the new SW take over all open tabs immediately.
self.addEventListener('activate', event => {
  console.log('[SW] Activating', CACHE_NAME);
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys
          .filter(key => key !== CACHE_NAME)
          .map(key => {
            console.log('[SW] Purging old cache:', key);
            return caches.delete(key);
          })
      )
    ).then(() => self.clients.claim())
  );
});

// ─── Fetch ─────────────────────────────────────────────────────────────────
// Network-first for HTML and JS/CSS (so updates always come through).
// Cache-first for images/sprites (large, rarely change, need to work offline).
self.addEventListener('fetch', event => {
  const url = event.request.url;

  if (event.request.method !== 'GET') return;
  if (url.startsWith('chrome-extension://')) return;

  const isSprite =
    url.includes('/sprites/') ||
    url.includes('pokemonshowdown.com/sprites') ||
    url.includes('raw.githubusercontent.com/PokeAPI') ||
    url.includes('/ui/');

  const isGameFile =
    url.includes('/js/') ||
    url.includes('/css/') ||
    url.includes('index.html') ||
    url.endsWith('/');

  if (isSprite) {
    // Cache-first: sprites are large and don't change — serve from cache,
    // fall back to network and cache the result for next time.
    event.respondWith(
      caches.match(event.request).then(cached => {
        if (cached) return cached;
        return fetch(event.request).then(response => {
          if (response && response.status === 200) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then(c => c.put(event.request, clone));
          }
          return response;
        }).catch(() => {
          // Offline fallback: 1×1 transparent PNG so the game doesn't break
          return new Response(
            Uint8Array.from(atob(
              'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg=='
            ), c => c.charCodeAt(0)),
            { headers: { 'Content-Type': 'image/png' } }
          );
        });
      })
    );
  } else if (isGameFile) {
    // Network-first: always try to get the freshest JS/CSS/HTML.
    // Falls back to cache so the game still works offline.
    event.respondWith(
      fetch(event.request).then(response => {
        if (response && response.status === 200) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(c => c.put(event.request, clone));
        }
        return response;
      }).catch(() => caches.match(event.request))
    );
  }
  // All other requests (fonts, external APIs etc.) pass through unchanged.
});
