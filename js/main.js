document.addEventListener('DOMContentLoaded', function () {
    // Dinamik içerik yüklenecek container
    const container = document.getElementById('.container');

    // Sayfa yüklendiğinde home.html'i yükle
    loadPage('home.html');

    // Linklerin tıklanmasını yönet
    function attachNavLinkEventListeners() {
        const navLinks = document.querySelectorAll('a.nav-link');

        navLinks.forEach(function (link) {
            link.addEventListener('click', function (e) {
                e.preventDefault();
                const page = this.getAttribute('href');

                if (page === 'home.html') {
                    // Eğer exchange tuşuna tıklandıysa, sayfayı yenile
                    window.location.href = 'index.html';
                } else {
                    // Diğer sayfaları container içine yükle
                    loadPage(page);
                }
            });
        });
    }

    // Sayfayı yükle ve container içine yerleştir
    function loadPage(page) {
        fetch(page)
            .then((response) => {
                if (response.ok) {
                    return response.text();
                } else {
                    throw new Error('Sayfa yüklenemedi.');
                }
            })
            .then((html) => {
                container.innerHTML = html;
                // Dinamik olarak yüklenen sayfadaki eventleri yeniden bağla
                attachDynamicEventListeners();
            })
            .catch((error) => {
                console.error('Hata:', error);
            });
    }

    // Dinamik olarak yüklenen içerikteki eventleri bağla
    function attachDynamicEventListeners() {
        // Örneğin, home.html içinde yer alan tıklama eventleri
        // Buraya gerekli kodları ekleyebilirsiniz
    }

    // İlk başta link eventlerini bağla
    attachNavLinkEventListeners();

    // Sayfanın ölçeklenmesini sağlayan fonksiyon
    function adjustScale() {
        const wrapper = document.getElementById('wrapper');

        // Pencere boyutlarını al
        const windowWidth = window.innerWidth;
        const windowHeight = window.innerHeight;

        // Ölçek faktörlerini hesapla
        const scaleX = windowWidth / wrapper.offsetWidth;
        const scaleY = windowHeight / wrapper.offsetHeight;

        // Oranı korumak için en küçük ölçeği kullan
        const scale = Math.min(scaleX, scaleY);

        // Ölçeklendirme uygula
        wrapper.style.transformOrigin = '0 0';
        wrapper.style.transform = `scale(${scale})`;
    }

    // Pencere boyutlandığında ölçeklendirme yap
    window.addEventListener('resize', adjustScale);

    // Sayfa yüklendiğinde ölçeklendirme yap
    adjustScale();
});
