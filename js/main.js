document.addEventListener('DOMContentLoaded', function () {
    let a = 5000; // Sayaç başlangıç değeri
    let b = 5000; // Sayaç maksimum değeri
    let points = 0; // Puan başlangıç değeri

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

    function preventImageDragging() {
        const images = document.querySelectorAll('img');
        images.forEach(function (img) {
            img.addEventListener('dragstart', function (e) {
                e.preventDefault();
            });
        });
    }

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
                        const dynamicContent = document.querySelector('.container');
                        if (dynamicContent) {
                            dynamicContent.innerHTML = html; // Dinamik içeriği değiştir
                        }
                        attachNavLinkEventListeners();
                        scalePage(); // Yüklenen içeriği yeniden ölçekle
                    })
                    .catch((error) => {
                        console.error('Hata:', error);
                    });
            });
        });
    }

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

    function scalePage() {
        const container = document.querySelector('.container');
        const footer = document.querySelector('footer');
    
        if (!container || !footer) return;
    
        // Ekran boyutlarını al
        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;
    
        // Sabit oranlarla çalış: %85 üst, %15 alt
        const containerRatio = 0.85; // Container ekranın %85'i
        const footerRatio = 0.15; // Footer ekranın %15'i
    
        // Container ve Footer için yükseklik hesaplamaları
        const containerHeight = viewportHeight * containerRatio; // Container yüksekliği
        const footerHeight = viewportHeight * footerRatio; // Footer yüksekliği
    
        // Container boyutlandırma ve konumlandırma
        container.style.position = 'relative';
        container.style.top = '0'; // Üst kenara yapışır
        container.style.left = '0';
        container.style.width = `${viewportWidth}px`;
        container.style.height = `${containerHeight}px`; // Ekranın %85'ini kaplar
    
        // Footer boyutlandırma ve konumlandırma
        footer.style.position = 'relative';
        footer.style.left = '0';
        footer.style.top = `${containerHeight}px`; // Container'ın hemen altına yerleşir
        footer.style.width = `${viewportWidth}px`;
        footer.style.height = `${footerHeight}px`; // Ekranın %15'ini kaplar
    
        // Ölçekleme faktörleri
        const scaleX = viewportWidth / viewportWidth; // Genişlik için ölçek (her zaman 1)
        const scaleY = viewportHeight / (containerHeight + footerHeight); // Yükseklik için ölçek
    
        const scale = Math.min(scaleX, scaleY); // Küçük olanı seçerek oranı koruyoruz
    
        // Container ve Footer'a ölçek uygula
        container.style.transform = `scale(${scale})`;
        container.style.transformOrigin = 'top left';
    
        footer.style.transform = `scale(${scale})`;
        footer.style.transformOrigin = 'top left';
    }




    window.addEventListener('resize', scalePage);
    window.addEventListener('load', scalePage);

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
