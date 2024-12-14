// sw.js

const CACHE_VERSION = 'v1';
const CACHE_NAME = `stonemu-cache-${CACHE_VERSION}`;

// Sadece frontend kaynaklarını önbelleğe al
const urlsToCache = [
    "/mainpage.html",
    "/friends.html",
    "/events.html",
    "/playground.html",
    "/underconstruction.html",
    "/css/styles.css",
 
    // Diğer frontend kaynaklarınızı ekleyin
];

// Install event: Kaynakları önbelleğe al
self.addEventListener("install", (event) => {
    console.log("[Service Worker] Installing...");
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            console.log("[Service Worker] Caching resources");
            return Promise.all(urlsToCache.map(url => {
                return cache.add(url).then(() => {
                    console.log(`[Service Worker] Cached ${url}`);
                }).catch(err => {
                    console.error(`[Service Worker] Failed to cache ${url}:`, err);
                });
            })).then(() => {
                console.log("[Service Worker] All resources attempted to cache");
                self.skipWaiting(); // Yeni Service Worker hemen aktif olsun
            });
        }).catch(err => {
            console.error("[Service Worker] Caching failed:", err);
        })
    );
});

// Activate event: Eski önbellekleri temizle
self.addEventListener("activate", (event) => {
    console.log("[Service Worker] Activating...");
    const cacheWhitelist = [CACHE_NAME];
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    if (!cacheWhitelist.includes(cacheName)) {
                        console.log("[Service Worker] Deleting old cache:", cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        }).then(() => {
            self.clients.claim(); // Yeni Service Worker tüm istemcileri kontrol etsin
        })
    );
});

// Fetch event: Önbellekten veya ağdan yanıt ver
self.addEventListener("fetch", (event) => {
    event.respondWith(
        caches.match(event.request).then((response) => {
            if (response) {
                console.log("[Service Worker] Serving from cache:", event.request.url);
                return response;
            }
            console.log("[Service Worker] Fetching from network:", event.request.url);
            return fetch(event.request).then((networkResponse) => {
                if (networkResponse.status === 200 && networkResponse.type === 'basic') {
                    // Response klonlama işlemi
                    const responseClone = networkResponse.clone();
                    caches.open(CACHE_NAME).then((cache) => {
                        cache.put(event.request, responseClone).then(() => {
                            console.log(`[Service Worker] Cached ${event.request.url}`);
                        });
                    });
                }
                return networkResponse;
            }).catch(err => {
                console.error("[Service Worker] Fetch failed:", err);
                // İsteğe bağlı olarak, fetch başarısız olursa gösterilecek bir fallback sayfası ekleyebilirsiniz
            });
        })
    );
});