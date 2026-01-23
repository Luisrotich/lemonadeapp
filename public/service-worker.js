// service-worker.js - Auto-update service worker
const CACHE_NAME = 'lemonade-app-v2.0'; // Update version for new releases
const APP_CACHE_NAME = 'lemonade-app-bundle';
const API_CACHE_NAME = 'lemonade-api-cache';

// Files to cache on install
const CORE_ASSETS = [
    '/',
    '/index.html',
    '/resources.html',
    '/manifest.json',
    '/css/styles.css',
    '/css/resources.css',
    '/js/app.js',
    '/js/app-updater.js',
    '/img/logo.png',
    '/img/icon-192.png',
    '/img/icon-512.png'
];

// Install event - Cache core assets
self.addEventListener('install', (event) => {
    console.log('[Service Worker] Installing...');
    
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                console.log('[Service Worker] Caching core assets');
                return cache.addAll(CORE_ASSETS);
            })
            .then(() => self.skipWaiting())
    );
});

// Activate event - Clean up old caches
self.addEventListener('activate', (event) => {
    console.log('[Service Worker] Activating...');
    
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.map(cacheName => {
                    if (cacheName !== CACHE_NAME && cacheName !== APP_CACHE_NAME && cacheName !== API_CACHE_NAME) {
                        console.log('[Service Worker] Deleting old cache:', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        })
        .then(() => self.clients.claim())
    );
});

// Fetch event - Network first, then cache
self.addEventListener('fetch', (event) => {
    // Skip non-GET requests
    if (event.request.method !== 'GET') return;
    
    // Skip chrome-extension requests
    if (event.request.url.startsWith('chrome-extension://')) return;
    
    event.respondWith(
        fetch(event.request)
            .then(response => {
                // Cache successful responses
                if (response.status === 200) {
                    const responseClone = response.clone();
                    
                    // Determine which cache to use
                    let cacheToUse = CACHE_NAME;
                    if (event.request.url.includes('/api/')) {
                        cacheToUse = API_CACHE_NAME;
                    } else if (event.request.url.includes('/app/')) {
                        cacheToUse = APP_CACHE_NAME;
                    }
                    
                    caches.open(cacheToUse).then(cache => {
                        cache.put(event.request, responseClone);
                    });
                }
                return response;
            })
            .catch(() => {
                // Network failed, try cache
                return caches.match(event.request)
                    .then(cachedResponse => {
                        if (cachedResponse) {
                            return cachedResponse;
                        }
                        
                        // Return offline page for HTML requests
                        if (event.request.headers.get('accept').includes('text/html')) {
                            return caches.match('/offline.html');
                        }
                        
                        // Return placeholder for images
                        if (event.request.headers.get('accept').includes('image')) {
                            return caches.match('/img/placeholder.png');
                        }
                    });
            })
    );
});

// Listen for messages from the page
self.addEventListener('message', (event) => {
    if (event.data === 'SKIP_WAITING') {
        self.skipWaiting();
    }
    
    if (event.data === 'CHECK_FOR_UPDATES') {
        checkForUpdates();
    }
});

// Check for updates function
async function checkForUpdates() {
    try {
        const response = await fetch('/version.json', {
            headers: {
                'Cache-Control': 'no-cache'
            }
        });
        
        const data = await response.json();
        
        // Compare versions
        const currentCache = await caches.open(CACHE_NAME);
        const cachedVersion = await currentCache.match('/version.json');
        
        if (cachedVersion) {
            const cachedData = await cachedVersion.json();
            
            if (data.version !== cachedData.version) {
                // New version available - notify all clients
                const clients = await self.clients.matchAll();
                clients.forEach(client => {
                    client.postMessage({
                        type: 'UPDATE_AVAILABLE',
                        version: data.version,
                        releaseNotes: data.releaseNotes
                    });
                });
                
                // Pre-cache new version
                await updateCache(data.version);
            }
        }
    } catch (error) {
        console.error('[Service Worker] Update check failed:', error);
    }
}

async function updateCache(newVersion) {
    console.log('[Service Worker] Updating to version:', newVersion);
    
    // Fetch and cache new assets
    const newCache = await caches.open(`lemonade-app-v${newVersion}`);
    
    // Fetch updated assets list
    const response = await fetch('/asset-manifest.json');
    const assets = await response.json();
    
    await newCache.addAll(assets.files);
    
    // Update CACHE_NAME for next activation
    CACHE_NAME = `lemonade-app-v${newVersion}`;
}