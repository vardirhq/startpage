/* Service worker for the installable (PWA) version on GitHub Pages. Not used by the browser extension.
   App shell: stale-while-revalidate, so it opens instantly and offline, and picks up new versions on
   the next load. The file list comes from index.html itself, so it never goes stale.
   Google Fonts: cache-first. Everything else (weather, GitHub, news, Claude): straight to the network. */
const CACHE = 'startpage-v1';

self.addEventListener('install', (e) => {
  e.waitUntil((async () => {
    const c = await caches.open(CACHE);
    const html = await (await fetch('./index.html', { cache: 'no-cache' })).text();
    const files = new Set(['./', './index.html', './app.webmanifest']);
    for (const m of html.matchAll(/(?:src|href)="((?:js|css|icons)\/[^"]+|icon\.svg)"/g)) files.add('./' + m[1]);
    await c.addAll([...files]);
    self.skipWaiting();
  })());
});

self.addEventListener('activate', (e) => {
  e.waitUntil((async () => {
    for (const k of await caches.keys()) if (k !== CACHE) await caches.delete(k);
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', (e) => {
  const req = e.request, url = new URL(req.url);
  if (req.method !== 'GET') return;
  const fonts = url.host === 'fonts.googleapis.com' || url.host === 'fonts.gstatic.com';
  if (url.origin !== location.origin && !fonts) return; // APIs: always live

  e.respondWith((async () => {
    const c = await caches.open(CACHE);
    // Navigations (including ./#wrapped) are served from the cached index.
    const key = req.mode === 'navigate' ? './index.html' : req;
    const hit = await c.match(key, { ignoreSearch: req.mode === 'navigate' });
    if (fonts && hit) return hit;
    const net = fetch(req).then((r) => { if (r && (r.ok || r.type === 'opaque')) c.put(key, r.clone()); return r; }).catch(() => null);
    if (hit) { e.waitUntil(net); return hit; }
    return (await net) || new Response('Offline', { status: 503, statusText: 'Offline' });
  })());
});
