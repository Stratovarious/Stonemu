const CACHE_NAME = "stonemu-cache-v1";
const urlsToCache = [
    // Slideshow resimleri
    "img/ploading_img/loading1a.webp",
    "img/ploading_img/loading2a.webp",
    "img/ploading_img/loading3a.webp",
    // Sayfa dosyaları
    "mainpage.html",
    "friends.html",
    "events.html",
    "playground.html",
    "underconstruction.html",
    // CSS ve JavaScript dosyaları
    "css/styles.css",
    "js/main.js",
    // Ekstra görseller
    "img/friends_icon.webp",
    "img/events_icon.webp",
    "img/playground_icon.webp",
    "img/underconstruction_icon.webp"
];

// Install event: Önbelleği oluştur ve kaynakları ekle
self.addEventListener("install", (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            console.log("Cache opened");
            return cache.addAll(urlsToCache);
        })
    );
});

// Fetch event: Talepleri önbellekten karşıla veya ağdan indir
self.addEventListener("fetch", (event) => {
    event.respondWith(
        caches.match(event.request).then((response) => {
            return response || fetch(event.request);
        })
    );
});

// Activate event: Eski önbellekleri temizle
self.addEventListener("activate", (event) => {
    const cacheWhitelist = [CACHE_NAME];
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    if (!cacheWhitelist.includes(cacheName)) {
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
});
