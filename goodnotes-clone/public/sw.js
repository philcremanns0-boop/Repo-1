/* Offline support: app shell is cached on install; same-origin GETs use stale-while-revalidate.
   Bump VERSION to invalidate old caches (done automatically by the build via ?v= query on registration). */
const VERSION = new URL(self.location).searchParams.get('v') || 'dev'
const CACHE = `gn-${VERSION}`
self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(['/', '/index.html', '/manifest.webmanifest', '/favicon.svg', '/icon-192.png'])).then(() => self.skipWaiting()))
})
self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim()))
})
self.addEventListener('fetch', (e) => {
  const req = e.request
  if (req.method !== 'GET' || new URL(req.url).origin !== self.location.origin) return
  // SPA navigation → index.html
  if (req.mode === 'navigate') {
    e.respondWith(fetch(req).then((r) => { const c = r.clone(); caches.open(CACHE).then((x) => x.put('/index.html', c)); return r }).catch(() => caches.match('/index.html')))
    return
  }
  e.respondWith(caches.open(CACHE).then(async (c) => {
    const hit = await c.match(req)
    const net = fetch(req).then((r) => { if (r.ok) c.put(req, r.clone()); return r }).catch(() => hit)
    return hit || net
  }))
})
