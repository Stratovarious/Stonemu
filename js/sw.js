const CACHE_NAME = "stonemu-cache-v3";
const urlsToCache = [
    // Slideshow resimleri
    "../img/ploading_img/loading1a.webp",
    "../img/ploading_img/loading2a.webp",
    "../img/ploading_img/loading3a.webp",
    // Sayfa dosyaları
    "../mainpage.html",
    "../friends.html",
    "../events.html",
    "../playground.html",
    "../underconstruction.html",
    // CSS ve JavaScript dosyaları
    "../css/styles.css",
    "../js/main.js"
    // Diğer kaynaklarınızı buraya ekleyin
];

// Install event: Kaynakları önbelleğe al
self.addEventListener("install", (event) => {
    console.log("[Service Worker] Installing...");
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            console.log("[Service Worker] Caching all resources");
            return cache.addAll(urlsToCache);
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
                        console.log(`[Service Worker] Deleting old cache: ${cacheName}`);
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
                console.log(`[Service Worker] Serving from cache: ${event.request.url}`);
                return response;
            }
            console.log(`[Service Worker] Fetching from network: ${event.request.url}`);
            return fetch(event.request);
        })
    );
});
