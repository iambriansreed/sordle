const cacheName = 'sordle^0.6.0';

const cacheFirst = async (request) => {
    const responseFromCache = await caches.match(request);
    return responseFromCache || fetch(request);
};

const addResourcesToCache = async (resources) => {
    const cache = await caches.open(cacheName);
    await cache.addAll(resources);
};

self.addEventListener('fetch', (event) => {
    event.respondWith(cacheFirst(event.request));
});

self.addEventListener('install', (event) => {
    event.waitUntil(addResourcesToCache(['/', '/index.html', '/main.css', '/main.js']));
});
