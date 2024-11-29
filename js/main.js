document.addEventListener('DOMContentLoaded', function () {
    // Dinamik içerik yüklenecek container
    const container = document.getElementById('container');

    // Sayfa yüklendiğinde home.html'i yükle
    loadPage('home.html');

    // Linklerin tıklanmasını yönet
    function attachNavLinkEventListeners() {
        const navLinks = document.querySelectorAll('a.nav-link');

        navLinks.forEach(function (link) {
            link.addEventListener('click', function (e) {
                e.preventDefault();
                const page = this.getAttribute('href');

                // Sayfayı container içine yükle
                loadPage(page);
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
                attachNavLinkEventListeners();
                attachDynamicEventListeners();
            })
            .catch((error) => {
                console.error('Hata:', error);
            });
    }

    // Dinamik olarak yüklenen içerikteki eventleri bağla
    function attachDynamicEventListeners() {
        //home.html içerik script
        //home.html içerik script
        //home.html içerik script
        // Tıklama oyunu kodları
        // Başlangıç değerleri
        let a = 5000; // Sayaç başlangıç değeri
        const b = 5000; // Sayaç maksimum değeri
        let points = 0; // Puan başlangıç değeri

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
        function startCounterInterval() {
            setInterval(function () {
                if (a < b) {
                    a += 1;
                    updateCounterDisplay();
                    saveData();
                }
            }, 10000);
        }

        // Başlangıç ayarları
        loadData();
        attachFrameClickListener();
        startCounterInterval();

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

        preventImageDragging();

        //Events sayfası için script
        //Events sayfası için script
        //Events sayfası için script
        const eventDetails = {
            "Event 1": {
                shortDescription: "Event 1 is the first event with exciting details.",
                title: "Event 1 Title",
                description: "Detailed information about Event 1. It includes various subtopics and insights.",
            },
            "Event 2": {
                shortDescription: "Event 2 brings more engaging topics.",
                title: "Event 2 Title",
                description: "Detailed information about Event 2. Explore deeper insights and data here.",
            },
            "Event 3": {
                shortDescription: "Event 3 is the final event of the series.",
                title: "Event 3 Title",
                description: "Detailed information about Event 3. A summary of key discussions and topics.",
            }
        };

        const overlay = document.getElementById('overlay');
        const playButton = document.getElementById('play-btn');
        const backButton = document.getElementById('back-btn');
        const slides = document.querySelectorAll('.slide');
        const prevButton = document.getElementById('prev-btn');
        const nextButton = document.getElementById('next-btn');
        const dynamicText = document.getElementById('dynamic-text');
        const centerContent = document.getElementById('center-content');
        const scrollUp = document.getElementById('scroll-up');
        const scrollDown = document.getElementById('scroll-down');

        let currentSlide = 0;
        let slideInterval;
        let timeoutHandle;

        // Etkinlik slaytlarını göster ve açıklamayı güncelle
        function showSlide(index) {
            slides.forEach((slide, i) => {
                slide.style.display = i === index ? 'block' : 'none';
            });
            const currentEvent = slides[index].textContent;
            dynamicText.textContent = eventDetails[currentEvent].shortDescription;
        }

        // Bir sonraki slayta geçiş
        function nextSlide() {
            currentSlide = (currentSlide + 1) % slides.length;
            showSlide(currentSlide);
        }

        // Bir önceki slayta geçiş
        function prevSlide() {
            currentSlide = (currentSlide - 1 + slides.length) % slides.length;
            showSlide(currentSlide);
        }

        // Slayt gösterisini başlat
        function startSlideshow() {
            slideInterval = setInterval(nextSlide, 5000);
        }

        // Slayt gösterisini durdur
        function stopSlideshow() {
            clearInterval(slideInterval);
        }

        // Sağa veya sola ok tuşlarına basıldığında geçici olarak slayt gösterisini durdur
        function pauseSlideshowFor20Seconds() {
            stopSlideshow(); // Slayt geçişini durdur
            clearTimeout(timeoutHandle); // Önceki zamanlayıcıyı temizle
            timeoutHandle = setTimeout(startSlideshow, 20000); // 20 saniye sonra yeniden başlat
        }

        // Play düğmesine tıklandığında ikinci sayfayı dinamik olarak güncelle
        playButton.addEventListener('click', () => {
            const currentEvent = slides[currentSlide].textContent;
            const eventInfo = eventDetails[currentEvent];

            centerContent.innerHTML = `
                <h2>${eventInfo.title}</h2>
                <p>${eventInfo.description}</p>
            `;

            overlay.classList.add('open'); // İkinci sayfayı aç
        });

        // Geri düğmesine tıklandığında ikinci sayfayı kapat
        backButton.addEventListener('click', () => {
            overlay.classList.remove('open');
        });

        // Sağ ve sol ok tuşlarına işlev ekle
        nextButton.addEventListener('click', () => {
            nextSlide();
            pauseSlideshowFor20Seconds();
        });

        prevButton.addEventListener('click', () => {
            prevSlide();
            pauseSlideshowFor20Seconds();
        });

        // İlk slaytı göster ve slayt gösterisini başlat
        showSlide(currentSlide);
        startSlideshow();
    }

    // İlk başta link eventlerini bağla
    attachNavLinkEventListeners();

    // Sayfanın ölçeklenmesini sağlayan fonksiyon
    function adjustScale() {
    const wrapper = document.getElementById('wrapper');

    // Pencere boyutlarını al
    const windowWidth = window.innerWidth;
    const windowHeight = window.innerHeight;

    // Wrapper boyutlarını al
    const wrapperWidth = wrapper.offsetWidth;
    const wrapperHeight = wrapper.offsetHeight;

    // Ölçek faktörlerini hesapla
    const scaleX = windowWidth / wrapperWidth;
    const scaleY = windowHeight / wrapperHeight;

    // Oranı korumak için en küçük ölçeği kullan
    const scale = Math.min(scaleX, scaleY);

    // Ölçeklendirme uygula
    wrapper.style.transformOrigin = '0 0'; // Üst sol köşeden ölçeklendir
    wrapper.style.transform = `scale(${scale})`;

    // Wrapper'ı ortalamak için (her boyutta çalışacak şekilde)
    const scaledWidth = wrapperWidth * scale;
    const scaledHeight = wrapperHeight * scale;

    wrapper.style.position = 'absolute';
    wrapper.style.left = `${(windowWidth - scaledWidth) / 2}px`;
    wrapper.style.top = `${(windowHeight - scaledHeight) / 2}px`;
}


    // Pencere boyutlandığında ve sayfa yüklendiğinde ölçeklendirme yap
    window.addEventListener('resize', adjustScale);
    document.addEventListener('DOMContentLoaded', adjustScale);

    // Sayfa yüklendiğinde ölçeklendirme yap
    adjustScale();
});
