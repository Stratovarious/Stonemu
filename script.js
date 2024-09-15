// Telegram WebApp tam ekran moduna geçiş
Telegram.WebApp.ready();

function setFullHeight() {
    document.getElementById("loadingContainer").style.height = window.innerHeight + "px";
}

document.addEventListener("DOMContentLoaded", function() {
    setFullHeight();
    Telegram.WebApp.expand(); // WebApp tam ekran moduna geçiş

    window.addEventListener("resize", function() {
        setFullHeight();
    });
});

// Tam ekran zorlaması
function forceFullScreen() {
    Telegram.WebApp.requestViewMode('full');  // Tam ekran zorlaması
}

Telegram.WebApp.onEvent('viewportChanged', function() {
    forceFullScreen();
});

// Service Worker kaydı
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/service-worker.js')
    .then(function() { console.log('Service Worker Registered'); });
}
