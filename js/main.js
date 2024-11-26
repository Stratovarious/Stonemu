document.addEventListener('DOMContentLoaded', function () {
    // Başlangıç değerleri
    let a = 5000; // Sayaç başlangıç değeri
    let b = 5000; // Sayaç maksimum değeri
    let points = 0; // Puan başlangıç değeri

    // Linklerin tıklanmasını ve sürüklenmesini tamamen engelle
    function preventLinkInteractions() {
        const links = document.querySelectorAll('a.nav-link');
        links.forEach(function (link) {
            link.addEventListener('click', function (e) {
                e.preventDefault();
            });
            link.addEventListener('dragstart', function (e) {
                e.preventDefault();
            });
        });
    }

    // Resimlerin sürüklenmesini engelle
    function preventImageDragging() {
        const images = document.querySelectorAll('img');
        images.forEach(function (img) {
            img.addEventListener('dragstart', function (e) {
                e.preventDefault();
            });
        });
    }

    // Dinamik sayfa yükleme
    function attachNavLinkEventListeners() {
        const navLinks = document.querySelectorAll('a.nav-link');

        navLinks.forEach(function (link) {
            link.addEventListener('click', function (e) {
                e.preventDefault();
                const page = this.getAttribute('href');

                fetch(page)
                    .then((response) => {
                        if (response.ok) {
                            return response.text();
                        } else {
                            throw new Error('Sayfa yüklenemedi.');
                        }
                    })
                    .then((html) => {
                        // Sadece container içeriğini güncelle
                        const dynamicContent = document.querySelector('.container');
                        if (dynamicContent) {
                            dynamicContent.innerHTML = html; // Dinamik içeriği değiştir
                        }

                        // Dinamik içerik yüklendikten sonra event listener'ları tekrar ata
                        attachNavLinkEventListeners();
                        attachFrameClickListener();
                        preventImageDragging();
                        preventLinkInteractions();
                        scalePage(); // Yüklenen içeriği yeniden ölçekle
                    })
                    .catch((error) => {
                        console.error('Hata:', error);
                    });
            });
        });
    }

    // Frame tıklama işlemi
    function attachFrameClickListener() {
        const frameImage = document.querySelector('.frame img');
        if (frameImage) {
            frameImage.addEventListener('click', function () {
                if (a > 0) {
                    a -= 1;
                    points += 1;
                    updateCounterDisplay();
                    updatePointsDisplay();
                    saveData();
                }
            });
        }
    }

    // Verileri yükle ve ekranı güncelle
    function loadData() {
        const storedData = JSON.parse(localStorage.getItem('gameData'));
        if (storedData) {
            a = storedData.a;
            points = storedData.points;
        }
        updateCounterDisplay();
        updatePointsDisplay();
    }

    function saveData() {
        const data = { a: a, points: points };
        localStorage.setItem('gameData', JSON.stringify(data));
    }

    function updateCounterDisplay() {
        const counterElement = document.querySelector('.counter');
        if (counterElement) {
            counterElement.textContent = `${formatNumber(a)}/${formatNumber(b)}`;
        }
    }

    function updatePointsDisplay() {
        const pointsValueElement = document.querySelector('.points-value');
        if (pointsValueElement) {
            pointsValueElement.textContent = formatNumber(points);
        }
    }

    function formatNumber(number) {
        return number.toLocaleString('tr-TR');
    }

    // Sayfa ölçekleme işlemi
    function scalePage() {
    const container = document.querySelector('.container');
    const footer = document.querySelector('footer');

    if (!container || !footer) return;

    // Ekran boyutlarını al
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    // Sabit oranlarla çalış
    const containerRatio = 0.85; // Container %85 oranında
    const footerRatio = 0.15; // Footer %15 oranında

    // Elemanların orijinal boyutlarını hesapla
    const containerHeight = viewportHeight * containerRatio;
    const footerHeight = viewportHeight * footerRatio;

    // Ölçekleme faktörlerini hesapla
    const containerWidth = container.offsetWidth;
    const scaleX = viewportWidth / containerWidth;
    const scaleY = viewportHeight / (containerHeight + footerHeight);

    // Küçük olan ölçeği seç
    const scale = Math.min(scaleX, scaleY);

    // Container için ölçek uygula
    container.style.transform = `scale(${scale})`;
    container.style.transformOrigin = 'top left';
    container.style.height = `${containerHeight}px`;
    container.style.width = `${viewportWidth}px`;

    // Footer için ölçek uygula
    footer.style.transform = `scale(${scale})`;
    footer.style.transformOrigin = 'top left';
    footer.style.height = `${footerHeight}px`;
    footer.style.width = `${viewportWidth}px`;

    // Konumlandırma
    container.style.position = 'absolute';
    container.style.left = '0';
    container.style.top = '0';

    footer.style.position = 'absolute';
    footer.style.left = '0';
    footer.style.top = `${containerHeight}px`; // Container'ın altına yerleştir
}

    // Sayfa yüklendiğinde ve pencere boyut değiştiğinde ölçekle
    window.addEventListener('resize', scalePage);
    window.addEventListener('load', scalePage);

    // Başlangıç ayarlarını yap
    function initializePage() {
        loadData();
        attachFrameClickListener();
        attachNavLinkEventListeners();
        preventImageDragging();
        preventLinkInteractions();
        scalePage(); // Sayfa yüklendiğinde ölçekle
    }

    initializePage();
});
