// Enhanced service worker for offline support
const CACHE_NAME = 'pascals-shoplist-v3';
const urlsToCache = [
    '/',
    '/manifest.json',
    '/icons/icon-64.png',
    '/icons/icon-192.png',
    '/icons/icon-512.png',
    'https://unpkg.com/htmx.org@1.9.10'
];

// Install event - cache essential resources
self.addEventListener('install', event => {
    console.log('[ServiceWorker] Installing...');
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                console.log('[ServiceWorker] Caching app shell');
                return cache.addAll(urlsToCache);
            })
            .then(() => self.skipWaiting())
    );
});

// Activate event - clean up old caches
self.addEventListener('activate', event => {
    console.log('[ServiceWorker] Activating...');
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.map(cacheName => {
                    if (cacheName !== CACHE_NAME) {
                        console.log('[ServiceWorker] Removing old cache:', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        }).then(() => self.clients.claim())
    );
});

// Fetch event - network first, then cache fallback
self.addEventListener('fetch', event => {
    const { request } = event;
    const url = new URL(request.url);

    // Skip cross-origin requests
    if (url.origin !== location.origin) {
        // But still cache HTMX if available
        if (url.href.includes('unpkg.com/htmx')) {
            event.respondWith(
                caches.match(request).then(response => {
                    return response || fetch(request).then(fetchResponse => {
                        return caches.open(CACHE_NAME).then(cache => {
                            cache.put(request, fetchResponse.clone());
                            return fetchResponse;
                        });
                    });
                })
            );
        }
        return;
    }

    // API requests - network only (with error handling)
    if (url.pathname.startsWith('/api/')) {
        event.respondWith(
            fetch(request).catch(error => {
                console.error('[ServiceWorker] API request failed:', error);
                return new Response(
                    JSON.stringify({ error: 'Offline - request will be queued' }),
                    {
                        status: 503,
                        headers: { 'Content-Type': 'application/json' }
                    }
                );
            })
        );
        return;
    }

    // Always prefer a fresh manifest so home-screen name updates are picked up.
    if (url.pathname === '/manifest.json') {
        event.respondWith(
            fetch(request)
                .then(response => {
                    if (response.status === 200) {
                        const responseToCache = response.clone();
                        caches.open(CACHE_NAME).then(cache => {
                            cache.put(request, responseToCache);
                        });
                    }
                    return response;
                })
                .catch(() => caches.match(request))
        );
        return;
    }

    // For page navigation - network first, fallback to cache, then offline page
    if (request.mode === 'navigate') {
        event.respondWith(
            fetch(request)
                .then(response => {
                    // Cache successful responses
                    if (response.status === 200) {
                        const responseToCache = response.clone();
                        caches.open(CACHE_NAME).then(cache => {
                            cache.put(request, responseToCache);
                        });
                    }
                    return response;
                })
                .catch(() => {
                    // Try cache first
                    return caches.match(request).then(cachedResponse => {
                        if (cachedResponse) {
                            return cachedResponse;
                        }
                        // Fallback to homepage
                        return caches.match('/');
                    });
                })
        );
        return;
    }

    // For other resources - cache first, then network
    event.respondWith(
        caches.match(request).then(cachedResponse => {
            if (cachedResponse) {
                // Update cache in background
                fetch(request).then(fetchResponse => {
                    if (fetchResponse.status === 200) {
                        caches.open(CACHE_NAME).then(cache => {
                            cache.put(request, fetchResponse);
                        });
                    }
                }).catch(() => { });
                return cachedResponse;
            }

            return fetch(request).then(fetchResponse => {
                // Cache successful responses
                if (fetchResponse.status === 200) {
                    const responseToCache = fetchResponse.clone();
                    caches.open(CACHE_NAME).then(cache => {
                        cache.put(request, responseToCache);
                    });
                }
                return fetchResponse;
            }).catch(error => {
                console.error('[ServiceWorker] Fetch failed:', error);
                throw error;
            });
        })
    );
});

// Listen for messages from the app
self.addEventListener('message', event => {
    if (event.data && event.data.type === 'SKIP_WAITING') {
        self.skipWaiting();
    }
});
