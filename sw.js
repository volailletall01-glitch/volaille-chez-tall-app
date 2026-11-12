const CACHE_NAME = 'poulet-pro-shell-v56';
const APP_SHELL = [
  './',
  './index.html',
  './commander.html',
  './styles.css',
  './app.js',
  './commander.js',
  './supabase-config.js',
  './manifest.webmanifest',
  './icons/volaille-chez-tall-logo.png',
  './icons/volaille-chez-tall-180.png',
  './icons/volaille-chez-tall-192.png',
  './icons/volaille-chez-tall-512.png',
];

async function matchCache(request) {
  try {
    return await caches.match(request);
  } catch {
    return undefined;
  }
}

async function cacheResponse(request, response) {
  try {
    const cache = await caches.open(CACHE_NAME);
    await cache.put(request, response);
  } catch {
    return;
  }
}

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => Promise.allSettled(APP_SHELL.map((url) => cache.add(url))))
      .catch(() => undefined)
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', (event) => {
  const request = event.request;
  if (request.method !== 'GET' || new URL(request.url).origin !== self.location.origin) return;
  event.respondWith(
    fetch(request).then((response) => {
      if (response.ok) {
        const copy = response.clone();
        event.waitUntil(cacheResponse(request, copy));
      }
      return response;
    }).catch(async () => {
      const cached = await matchCache(request);
      if (cached) return cached;
      if (request.mode === 'navigate') {
        const fallback = await matchCache(request.url.includes('commander') ? './commander.html' : './index.html');
        if (fallback) return fallback;
      }
      throw new Error('Ressource indisponible hors ligne.');
    }),
  );
});
