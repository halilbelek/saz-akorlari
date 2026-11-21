// Çevrimdışı çalışma için önbellek
const SURUM = 'saz-akorlari-v4';
const DOSYALAR = ['./', 'index.html', 'style.css', 'theory.js', 'turkuler.js', 'sap.js', 'ses.js', 'app.js', 'manifest.webmanifest',
  'icons/icon-180.png', 'icons/icon-192.png', 'icons/icon-512.png'];
self.addEventListener('install', e => { e.waitUntil(caches.open(SURUM).then(c => c.addAll(DOSYALAR))); self.skipWaiting(); });
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(k => Promise.all(k.filter(x => x !== SURUM).map(x => caches.delete(x)))));
  self.clients.claim();
});
// Önce ağ, olmazsa önbellek (güncellemeler hemen gelsin)
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  e.respondWith(fetch(e.request).then(r => {
    const kopya = r.clone(); caches.open(SURUM).then(c => c.put(e.request, kopya)); return r;
  }).catch(() => caches.match(e.request)));
});
