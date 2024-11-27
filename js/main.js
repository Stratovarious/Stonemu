document.addEventListener('DOMContentLoaded', function () {
    // Başlangıç değerleri
    let a = 5000; // Sayaç başlangıç değeri
    const b = 5000; // Sayaç maksimum değeri
    let points = 0; // Puan başlangıç değeri

    // Wrapper'ın ölçeğini ayarlayan fonksiyon
    function adjustScale() {
        const wrapper = document.getElementById('wrapper');
        const body = document.body;

        // Pencere boyutlarını al
        const windowWidth = window.innerWidth;
        const windowHeight = window.innerHeight;

        // İçerik boyutlarını al
        const contentWidth = wrapper.offsetWidth;
        const contentHeight = wrapper.offsetHeight;

        // Ölçek faktörlerini hesapla
        const scaleX = windowWidth / contentWidth;
        const scaleY = windowHeight / contentHeight;

        // Oranı korumak için en küçük ölçeği kullan
        const scale = Math.min(scaleX, scaleY);

        // Transform ölçeğini uygula
        wrapper.style.transformOrigin = '0 0'; // Köşeden ölçeklendir
        wrapper.style.transform = `scale(${scale})`;

        // Taşmaları gizlemek için body'ye overflow ayarı
        body.style.overflow = 'hidden';

        // Scrollbar oluşumunu engellemek için body boyutunu ayarla
        body.style.width = contentWidth * scale + 'px';
        body.style.height = contentHeight * scale + 'px';
    }

    // Pencere yeniden boyutlandığında ölçeği ayarla
    window.addEventListener('resize', adjustScale);

    // Sayfa yüklendiğinde ölçeği ayarla
    adjustScale();

    // Linklerin sürüklenmesini ve tıklanmasını tamamen engelle
    function preventLinkInteractions() {
        const links = document.querySelectorAll('a.nav-link');
        links.forEach(function (link) {
            // Link tıklamasını engelle
            link.addEventListener('click', function (e) {
                e.preventDefault();
            });

            // Linkin sürüklenmesini engelle
            link.addEventListener('dragstart', function (e) {
                e.preventDefault();
            });

            // Linki sürükleme girişimini engelle
            link.addEventListener('mousedown', function (e) {
                e.preventDefault();
            });
        });
    }

    // Resimlerin sürüklenmesini ve seçilmesini engelle
    function preventImageDragging() {
        const images = document.querySelectorAll('img');
        images.forEach(function (img) {
            img.addEventListener('dragstart', function (e) {
                e.preventDefault();
            });
        });
    }

    // Sağ tık menüsünü engelle
    document.addEventListener('contextmenu', function (e) {
        e.preventDefault();
    });

    // Metin seçimini engelle
    document.addEventListener('selectstart', function (e) {
        e.preventDefault();
    });

    // Verileri localStorage'dan yükle
    function loadData() {
        const storedData = JSON.parse(localStorage.getItem('gameData'));
        if (storedData) {
            a = storedData.a;
            points = storedData.points;
        }
        updateCounterDisplay();
        updatePointsDisplay();
    }

    // Verileri localStorage'a kaydet
    function saveData() {
        const data = { a: a, points: points };
        localStorage.setItem('gameData', JSON.stringify(data));
    }

    // Sayıları binlik ayırıcı ile formatla
    function formatNumber(number) {
        return number.toLocaleString('tr-TR');
    }

    // Sayaç ekranını güncelle
    function updateCounterDisplay() {
        const counterElement = document.querySelector('.counter');
        if (counterElement) {
            counterElement.textContent = `${formatNumber(a)}/${formatNumber(b)}`;
        }
    }

    // Puan ekranını güncelle
    function updatePointsDisplay() {
        const pointsValueElement = document.querySelector('.points-value');
        if (pointsValueElement) {
            pointsValueElement.textContent = formatNumber(points);
        }
    }

    // Frame tıklama işlemi sadece çerçeve resmine sınırlı
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

    // Sayaç her 10 saniyede 1 artar
    setInterval(function () {
        if (a < b) {
            a += 1;
            updateCounterDisplay();
            saveData();
        }
    }, 10000);

    // Dinamik sayfa yükleme (Güvenlik açısından yorum satırına alındı)
    
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
                        document.querySelector('.container').innerHTML = html;
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
    

    // Sayfa yüklendiğinde başlangıç ayarları
    loadData();
    attachFrameClickListener();
    attachNavLinkEventListeners(); // Güvenlik açısından devre dışı bırakıldı
    preventImageDragging();
    preventLinkInteractions();
});
