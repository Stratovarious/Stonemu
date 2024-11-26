document.addEventListener('DOMContentLoaded', function () {
    let a = 5000; // Sayaç başlangıç değeri
    let b = 5000; // Sayaç maksimum değeri
    let points = 0; // Puan başlangıç değeri

    function scalePage() {
        const wrapper = document.getElementById('wrapper');
        if (!wrapper) return;

        // Wrapper'ın doğal boyutlarını al
        const wrapperWidth = wrapper.offsetWidth;
        const wrapperHeight = wrapper.offsetHeight;

        // Pencere boyutlarını al
        const windowWidth = window.innerWidth;
        const windowHeight = window.innerHeight;

        // Ölçek faktörlerini hesapla
        const scaleX = windowWidth / wrapperWidth;
        const scaleY = windowHeight / wrapperHeight;

        // Oranı korumak için minimum ölçeği kullan
        const scale = Math.min(scaleX, scaleY);

        // Ölçeği uygula
        wrapper.style.transform = `scale(${scale})`;

        // İçeriği merkezle
        wrapper.style.position = 'absolute';
        wrapper.style.left = '50%';
        wrapper.style.top = '50%';
        wrapper.style.transformOrigin = 'top left';
        wrapper.style.transform = `translate(-50%, -50%) scale(${scale})`;
    }

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
                        scalePage(); // İçerik değiştikten sonra yeniden ölçekle
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
