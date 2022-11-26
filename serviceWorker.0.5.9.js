const cacheName = 'sordle';
const assets = ['/', '/index.html?v=0.5.9', '/main.css?v=0.5.9', '/main.js?v=0.5.9'];

self.addEventListener('install', (installEvent) => {
    installEvent.waitUntil(
        caches.open(cacheName).then((cache) => {
            cache.addAll(assets);
        })
    );
});

self.addEventListener('fetch', (fetchEvent) => {
    fetchEvent.respondWith(
        caches.match(fetchEvent.request).then((res) => {
            return res || fetch(fetchEvent.request);
        })
    );
});
