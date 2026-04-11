const CACHE_NAME = 'homework-v1';
const URLS_TO_CACHE = [
    '/',
    '/index.html',
    '/style.css',
    '/grade-3.html',
    '/grade-5.html',
    '/kindergarten.html',
    '/homework_data.js',
    '/homework_manual.js',
    '/firebase-homework.js'
];

// התקנה — שומרים את הקבצים הבסיסיים בקאש
self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => cache.addAll(URLS_TO_CACHE))
            .then(() => self.skipWaiting())
    );
});

// הפעלה — מנקים קאש ישן
self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys().then(keys =>
            Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
        ).then(() => self.clients.claim())
    );
});

// בקשות — קודם מהרשת, אם נכשל אז מהקאש
self.addEventListener('fetch', event => {
    event.respondWith(
        fetch(event.request)
            .then(response => {
                // שומרים עותק בקאש
                const clone = response.clone();
                caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
                return response;
            })
            .catch(() => caches.match(event.request))
    );
});
