/* Rede primeiro para tudo do próprio site, cache como reserva para abrir sem internet.
   Mudou app.js, style.css ou ref.js? Suba V aqui e o ?v= no index.html. */
const V = 2;
const CACHE = 'litoteca-v' + V;
const SHELL = ['./', 'index.html', `style.css?v=${V}`, `app.js?v=${V}`, `ref.js?v=${V}`, 'manifest.webmanifest',
  'icons/apple-touch-icon.png', 'icons/icon-192.png', 'icons/icon-512.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL.map(u => new Request(u, { cache: 'reload' })))).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});

self.addEventListener('fetch', e => {
  const req = e.request;
  const url = new URL(req.url);
  if (req.method !== 'GET' || url.origin !== location.origin) return;
  const navegacao = req.mode === 'navigate';
  e.respondWith((async () => {
    try {
      const resp = await fetch(url.href, { cache: 'no-cache' });
      if (resp.ok) {
        const c = await caches.open(CACHE);
        c.put(navegacao ? './' : req, resp.clone());
      }
      return resp;
    } catch {
      const c = await caches.open(CACHE);
      return (await c.match(navegacao ? './' : req, navegacao ? { ignoreSearch: true } : undefined))
        || (await c.match(req, { ignoreSearch: true }))
        || Response.error();
    }
  })());
});
