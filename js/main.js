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
        const containerRatio = 0.85; // Container oranı
        const footerRatio = 0.15; // Footer oranı
    
        // Yükseklik hesaplamaları
        const containerHeight = viewportHeight * containerRatio;
        const footerHeight = viewportHeight * footerRatio;
    
        // Container boyutlandırma
        container.style.position = 'absolute';
        container.style.top = '0';
        container.style.left = '0';
        container.style.width = `${viewportWidth}px`;
        container.style.height = `${containerHeight}px`;
    
        // Footer boyutlandırma
        footer.style.position = 'absolute';
        footer.style.left = '0';
        footer.style.bottom = '0'; // Her zaman alt kenarda
        footer.style.width = `${viewportWidth}px`;
        footer.style.height = `${footerHeight}px`;
    
        // Ölçekleme faktörleri
        const pageWidth = viewportWidth;
        const pageHeight = containerHeight + footerHeight;
    
        const scaleX = viewportWidth / pageWidth;
        const scaleY = viewportHeight / pageHeight;
    
        const scale = Math.min(scaleX, scaleY);
    
        // Ölçek uygula
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
