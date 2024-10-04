// static/js/script.js

document.addEventListener('DOMContentLoaded', function () {
    let slides = document.querySelectorAll('.slide');
    let currentSlide = 0;
    let progressBar = document.getElementById('progress');
    let progressWidth = 0;
    let progressInterval;
    let slideInterval;

    // Slideshow'u başlat
    function startSlideshow() {
        slides[currentSlide].classList.add('active');
        progressInterval = setInterval(updateProgressBar, 50);
        slideInterval = setInterval(nextSlide, 3000);
    }

    // Yükleme çubuğunu güncelle
    function updateProgressBar() {
        if (progressWidth >= 100) {
            clearInterval(progressInterval);
            clearInterval(slideInterval);
            checkBanStatus();
        } else {
            progressWidth += 0.5;
            progressBar.style.width = progressWidth + '%';
        }
    }

    // Sonraki slide'ı göster
    function nextSlide() {
        slides[currentSlide].classList.remove('active');
        currentSlide = (currentSlide + 1) % slides.length;
        slides[currentSlide].classList.add('active');
    }

    // Kullanıcının yasaklı olup olmadığını kontrol et
    function checkBanStatus() {
        // telegram_id'yi kullanıcının oturumundan veya girdisinden almalısınız
        let telegramId = localStorage.getItem('telegram_id') || 'user_telegram_id';
        fetch('/check_ban_status', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ telegram_id: telegramId })
        })
            .then(response => response.json())
            .then(data => {
                if (data.banned) {
                    document.getElementById('slideshow').style.display = 'none';
                    document.getElementById('ban-page').style.display = 'block';
                } else {
                    checkExchangeSelection();
                }
            })
            .catch(error => {
                console.error('Hata:', error);
            });
    }

    // Borsa seçiminin gerekip gerekmediğini kontrol et
    function checkExchangeSelection() {
        let exchangeSelected = localStorage.getItem('exchangeSelected');
        if (!exchangeSelected) {
            document.getElementById('slideshow').style.display = 'none';
            document.getElementById('exchange-selection').style.display = 'block';
        } else {
            document.getElementById('slideshow').style.display = 'none';
            document.getElementById('homepage').style.display = 'block';
            initializeHomepage();
        }
    }

    // Borsa seçimi işle
    document.getElementById('exchange-ok-button').addEventListener('click', function () {
        let exchange = document.getElementById('exchange-dropdown').value;
        if (exchange) {
            localStorage.setItem('exchangeSelected', exchange);
            document.getElementById('exchange-selection').style.display = 'none';
            document.getElementById('homepage').style.display = 'block';
            initializeHomepage();
            // İsterseniz seçimi sunucuya bir API çağrısı ile gönderebilirsiniz
        } else {
            alert('Lütfen bir borsa seçin.');
        }
    });

    // Anasayfayı başlat
    function initializeHomepage() {
        // Etkinlik dinleyicilerini ve başlangıç değerlerini ayarla
        // [Önceki kodlarda yaptığınız gibi devam edin]
    }

    startSlideshow();
});
