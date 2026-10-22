/* Service Worker: macht die Seite installierbar und lädt bei Wiederbesuchen Code, Schriften und Bilder aus dem Cache.
   Bewusst NICHT gecacht: Audio/Video (Safari braucht dort Range-Antworten – der Browser-Cache übernimmt das),
   API-Aufrufe und fremde Hosts (Multiplayer-Verbindung). */
const CACHE = 'museum-v1';
const MEDIA = /\.(mp3|m4a|ogg|wav|mp4|webm)(\?|$)/i;

self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (e) => {
  e.waitUntil((async () => {
    for (const k of await caches.keys()) if (k !== CACHE) await caches.delete(k);
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET' || req.headers.has('range')) return;
  const url = new URL(req.url);
  if (url.origin !== location.origin || url.pathname.startsWith('/api/') || MEDIA.test(url.pathname)) return;

  // Gehashte Build-Dateien ändern sich nie → Cache zuerst
  if (url.pathname.startsWith('/assets/')) {
    e.respondWith((async () => {
      const cache = await caches.open(CACHE);
      const hit = await cache.match(req);
      if (hit) return hit;
      const res = await fetch(req);
      if (res.ok) cache.put(req, res.clone());
      return res;
    })());
    return;
  }

  // Seite & Manifest: Netz zuerst (immer aktuell), Cache als Rückfall
  e.respondWith((async () => {
    const cache = await caches.open(CACHE);
    try {
      const res = await fetch(req);
      if (res.ok) cache.put(req, res.clone());
      return res;
    } catch {
      return (await cache.match(req)) || (await cache.match('/')) || Response.error();
    }
  })());
});

// Die Seite meldet nach dem Laden, welche Dateien sie schon geholt hat → schon beim ersten Besuch in den Cache legen,
// damit der zweite Besuch sofort startet (kommt aus dem HTTP-Cache, kein erneuter Download).
self.addEventListener('message', (e) => {
  if (!e.data || e.data.type !== 'cache' || !Array.isArray(e.data.urls)) return;
  e.waitUntil((async () => {
    const cache = await caches.open(CACHE);
    for (const u of e.data.urls) {
      try {
        const url = new URL(u, location.origin);
        if (url.origin !== location.origin || !url.pathname.startsWith('/assets/') || MEDIA.test(url.pathname)) continue;
        if (await cache.match(url.href)) continue;
        const res = await fetch(url.href);
        if (res.ok) await cache.put(url.href, res);
      } catch { /* einzelne Datei egal */ }
    }
  })());
});
