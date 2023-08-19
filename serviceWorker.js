const cacheName = 'sordle^0.5.8.1692480083866';
const assets = ['/', '/index.html', '/main.css', '/main.js'];

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
