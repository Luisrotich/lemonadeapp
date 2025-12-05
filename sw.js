// Service Worker for Lemonade PWA
const CACHE_NAME = 'lemonade-v2';
const urlsToCache = [
  '/',
  '/index.html',
  '/style.css',
  '/script.js',
  '/manifest.json',
  '/uploads/appicon.jpg'
];

// Install event - cache resources
self.addEventListener('install', event => {
  console.log('Service Worker: Installing...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Service Worker: Caching app shell');
        return cache.addAll(urlsToCache);
      })
      .catch(error => {
        console.error('Service Worker: Cache failed:', error);
      })
  );
  self.skipWaiting();
});

// Activate event - clean old caches
self.addEventListener('activate', event => {
  console.log('Service Worker: Activating...');
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            console.log('Service Worker: Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// ✅ Fetch event - DO NOT intercept API calls
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);

  // ✅ Skip all backend API calls
  if (url.pathname.startsWith('/api/')) {
    return; // Let the network handle it normally
  }

  // ✅ Normal caching for static files
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        return response || fetch(event.request);
      })
      .catch(() => {
        // Offline fallback for pages
        if (event.request.destination === 'document') {
          return caches.match('/index.html');
        }
      })
  );
});

// Background sync for offline orders (optional)
self.addEventListener('sync', event => {
  if (event.tag === 'background-sync-orders') {
    event.waitUntil(syncOrders());
  }
});

async function syncOrders() {
  console.log('Service Worker: Syncing orders in background');
}