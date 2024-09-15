// Telegram WebApp API'sini başlat
const tele = window.Telegram.WebApp;

// WebApp hazır olduğunda ekranı genişlet
tele.expand(); 

function setFullHeight() {
    // Dinamik olarak yükseklik ayarlamak
    document.getElementById("loadingContainer").style.height = window.innerHeight + "px";
}

document.addEventListener("DOMContentLoaded", function() {
    // Sayfa yüklendiğinde tam ekranı zorla
    setFullHeight();
    window.addEventListener("resize", function() {
        setFullHeight();
    });

    // Tam ekran zorlamasını sürekli tekrar et (500ms, 1sn ve 2sn sonra)
    let forceFullScreenInterval = setInterval(function() {
        tele.requestViewMode('full');
    }, 1000);  // Her saniyede bir tam ekran modunu zorla

    // Belirli bir süre sonra tam ekran zorlamasını durdur (örneğin, 10 saniye sonra)
    setTimeout(function() {
        clearInterval(forceFullScreenInterval);
    }, 10000); // 10 saniye boyunca zorlamaya devam et
});

// Telegram WebApp görünüm modu değişikliklerinde tam ekranı zorla
tele.onEvent('viewportChanged', function() {
    tele.requestViewMode('full');  // Tam ekranı her viewport değişiminde zorla
});
