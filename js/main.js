document.addEventListener('DOMContentLoaded', function () {
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
                        // Yalnızca .container içeriğini güncelle
                        const container = document.querySelector('.container');
                        if (container) {
                            container.innerHTML = html;
                        }

                        // Dinamik içerik yüklendikten sonra event listener'ları tekrar ata
                        attachNavLinkEventListeners();
                        attachFrameClickListener();
                        preventImageDragging();
                        preventLinkInteractions();
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

    // Başlangıç ayarlarını yap
    function initializePage() {
        loadData();
        attachFrameClickListener();
        attachNavLinkEventListeners();
        preventImageDragging();
        preventLinkInteractions();
    }

    initializePage();
});
