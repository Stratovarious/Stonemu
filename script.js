// Telegram WebApp tam ekran moduna geçiş
Telegram.WebApp.ready();

function setFullHeight() {
    // Dinamik olarak yükseklik ayarlamak
    document.getElementById("loadingContainer").style.height = window.innerHeight + "px";
}

document.addEventListener("DOMContentLoaded", function() {
    // Sayfa yüklendiğinde tam ekranı zorla
    setFullHeight();
    Telegram.WebApp.expand(); // WebApp tam ekran moduna geçiş

    window.addEventListener("resize", function() {
        setFullHeight();
    });

    // Tam ekran zorlamasını tekrar et (500ms, 1sn ve 2sn sonra)
    setTimeout(function() {
        Telegram.WebApp.requestViewMode('full'); // İlk zorlamayı 500ms sonra yap
    }, 500);

    setTimeout(function() {
        Telegram.WebApp.requestViewMode('full'); // 1 saniye sonra tekrar zorla
    }, 1000);

    setTimeout(function() {
        Telegram.WebApp.requestViewMode('full'); // 2 saniye sonra tekrar zorla
    }, 2000);
});

// Telegram WebApp görünüm modu değişikliklerinde tam ekranı zorla
Telegram.WebApp.onEvent('viewportChanged', function() {
    Telegram.WebApp.requestViewMode('full');  // Tam ekranı her viewport değişiminde zorla
});
