const CACHE = 'atmos-trener-v1';
const ASSETS = ['./', 'index.html', 'manifest.json', 'icon-192.png', 'icon-512.png', 'icon-maskable.png', 'apple-touch-icon.png', 'privatnost.html', 'uslovi.html'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

/* fajlovi aplikacije: prvo mreža (da nova verzija stigne odmah), keš kad nema interneta.
   Open Food Facts, Google i biblioteka za skeniranje idu direktno na mrežu. */
self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== location.origin) return;
  e.respondWith((async () => {
    const hit = await caches.match(req, { ignoreSearch: true });
    try {
      const ctl = new AbortController(), t = setTimeout(() => ctl.abort(), hit ? 4000 : 15000);
      const res = await fetch(req.url, { cache: 'no-cache', signal: ctl.signal, credentials: 'same-origin' });
      clearTimeout(t);
      if (res && res.ok && !new URL(req.url).search) { const copy = res.clone(); caches.open(CACHE).then(c => c.put(req, copy)); }
      return res;
    } catch (err) {
      return hit || (await caches.match('index.html')) || Response.error();
    }
  })());
});

self.addEventListener('message', e => { if (e.data === 'skip') self.skipWaiting(); });

self.addEventListener('notificationclick', e => {
  e.notification.close();
  e.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(cs => {
      if (cs.length) return cs[0].focus();
      return self.clients.openWindow('./index.html');
    })
  );
});
