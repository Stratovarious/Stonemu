// sw.js

const CACHE_VERSION = 'v1';
const CACHE_NAME = `stonemu-cache-${CACHE_VERSION}`;

// Sadece frontend kaynaklarını önbelleğe al
const urlsToCache = [
    "https://stonemu-8bdeedab7930.herokuapp.com//img/ploading_img/loading1a.webp",
    "https://stonemu-8bdeedab7930.herokuapp.com//img/ploading_img/loading2a.webp",
    "https://stonemu-8bdeedab7930.herokuapp.com//img/ploading_img/loading3a.webp",
    "./mainpage.html",
    "./friends.html",
    "./events.html",
    "./playground.html",
    "./underconstruction.html",
    "./css/styles.css",
    "https://stonemu-8bdeedab7930.herokuapp.com//js/main.min.js",
    // Diğer frontend kaynaklarınızı ekleyin
];

// Install event: Kaynakları önbelleğe al
self.addEventListener("install", (event) => {
    console.log("[Service Worker] Installing...");
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            console.log("[Service Worker] Caching resources");
            return cache.addAll(urlsToCache);
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
                // Ağdan gelen isteği önbelleğe ekle
                if (networkResponse.status === 200 && networkResponse.type === 'basic') {
                    caches.open(CACHE_NAME).then((cache) => {
                        cache.put(event.request, networkResponse.clone());
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
