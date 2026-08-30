// ==============================================
// sw.js — Service Worker
// קאש + קבלת הודעות ברקע (FCM)
// ==============================================

// --- Firebase SDK for background messages ---
importScripts('https://www.gstatic.com/firebasejs/9.23.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.23.0/firebase-messaging-compat.js');

firebase.initializeApp({
    apiKey: "AIzaSyAi0YrEfLEr7GK2VRjJ9FOuhz4066_7T5M",
    authDomain: "homework-barad.firebaseapp.com",
    projectId: "homework-barad",
    messagingSenderId: "324035760311",
    appId: "1:324035760311:web:2b9793e3924cc2840a3d32"
});

const messaging = firebase.messaging();

// --- הודעה שמגיעה כשהדף סגור/ברקע ---
messaging.onBackgroundMessage((payload) => {
    console.log('📨 Background message:', payload);

    const title = payload.notification?.title || '📝 שיעורי בית';
    const body = payload.notification?.body || 'יש משימות שמחכות לך!';

    self.registration.showNotification(title, {
        body: body,
        icon: 'https://inbaltsa.github.io/My-school-apps/icon-192.png',
        badge: 'https://inbaltsa.github.io/My-school-apps/icon-192.png',
        tag: 'homework-reminder',
        renotify: true,
        vibrate: [200, 100, 200],
        data: { url: '/My-school-apps/index.html' }
    });
});

// --- לחיצה על הודעה — פתיחת האפליקציה ---
self.addEventListener('notificationclick', event => {
    event.notification.close();

    const urlToOpen = event.notification.data?.url || '/My-school-apps/index.html';

    event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true }).then(windowClients => {
            for (const client of windowClients) {
                if (client.url.includes('My-school-apps') && 'focus' in client) {
                    return client.focus();
                }
            }
            return clients.openWindow(urlToOpen);
        })
    );
});

// --- קאש ---
const CACHE_NAME = 'homework-v2';
const URLS_TO_CACHE = [
    '/My-school-apps/',
    '/My-school-apps/index.html',
    '/My-school-apps/style.css',
    '/My-school-apps/grade-3.html',
    '/My-school-apps/grade-5.html',
    '/My-school-apps/kindergarten.html',
    '/My-school-apps/homework_data.js',
    '/My-school-apps/homework_manual.js',
    '/My-school-apps/firebase-homework.js',
    '/My-school-apps/notification-manager.js'
];

self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => cache.addAll(URLS_TO_CACHE))
            .then(() => self.skipWaiting())
    );
});

self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys().then(keys =>
            Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
        ).then(() => self.clients.claim())
    );
});

self.addEventListener('fetch', event => {
    const req = event.request;

    // רק בקשות GET נשמרות ב-cache. POST וכו' (Firebase/Analytics) עוברות כרגיל
    // לרשת — ניסיון cache.put על POST זורק שגיאה ומלכלך את ה-Console.
    if (req.method !== 'GET') return;

    event.respondWith(
        fetch(req)
            .then(response => {
                // שומרים ב-cache רק תגובות תקינות מאותו origin (לא cross-origin/שגיאות)
                if (response && response.ok &&
                    new URL(req.url).origin === self.location.origin) {
                    const clone = response.clone();
                    caches.open(CACHE_NAME).then(cache => cache.put(req, clone));
                }
                return response;
            })
            .catch(() => caches.match(req))
    );
});
