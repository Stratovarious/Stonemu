document.addEventListener('DOMContentLoaded', function() {
    let slides = document.querySelectorAll('.slide');
    let currentSlide = 0;
    let progressBar = document.getElementById('progress');
    let progressWidth = 0;
    let progressInterval;
    let slideInterval;

    // Slayt Gösterisi
    function startSlideshow() {
        slides[currentSlide].classList.add('active');
        progressInterval = setInterval(updateProgressBar, 50);
        slideInterval = setInterval(nextSlide, 3000);
    }

    function updateProgressBar() {
        if (progressWidth >= 100) {
            clearInterval(progressInterval);
            clearInterval(slideInterval);
            checkExchangeSelection();
        } else {
            progressWidth += 0.5;
            progressBar.style.width = progressWidth + '%';
        }
    }

    function nextSlide() {
        slides[currentSlide].classList.remove('active');
        currentSlide = (currentSlide + 1) % slides.length;
        slides[currentSlide].classList.add('active');
    }

    function checkExchangeSelection() {
        // Sunucudan exchange seçimi kontrolü
        fetch('/api/check_exchange_selection', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ telegram_id: getTelegramID() })
        })
        .then(response => response.json())
        .then(data => {
            if (!data.exchange_selected) {
                document.getElementById('slideshow').style.display = 'none';
                document.getElementById('exchange-selection').style.display = 'block';
            } else {
                document.getElementById('slideshow').style.display = 'none';
                document.getElementById('homepage').style.display = 'block';
                initializeHomepage();
            }
        });
    }

    // Exchange Seçimi
    document.getElementById('exchange-ok-button').addEventListener('click', function() {
        let exchange = document.getElementById('exchange-dropdown').value;
        if (exchange) {
            // Sunucuya exchange seçimini kaydet
            fetch('/api/set_exchange_selection', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ telegram_id: getTelegramID(), exchange: exchange })
            })
            .then(response => response.json())
            .then(data => {
                if (data.status === 'success') {
                    document.getElementById('exchange-selection').style.display = 'none';
                    document.getElementById('homepage').style.display = 'block';
                    initializeHomepage();
                } else {
                    alert('Bir hata oluştu. Lütfen tekrar deneyin.');
                }
            });
        } else {
            alert('Lütfen bir exchange seçin.');
        }
    });

    // Anasayfa Başlatma
    function initializeHomepage() {
        // Kullanıcı verilerini sunucudan çek
        fetch('/api/get_user_data', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ telegram_id: getTelegramID() })
        })
        .then(response => response.json())
        .then(data => {
            if (data.status === 'success') {
                // Level ve Puan Bilgilerini Güncelle
                updateLevelAndPoints(data.level, data.points, data.total_points);
                // Diğer başlangıç işlemleri
                setupEventListeners();
            } else {
                alert('Kullanıcı verileri alınamadı.');
            }
        });
    }

    function updateLevelAndPoints(level, points, totalPoints) {
        document.getElementById('level-text').innerText = `Level ${level}`;
        document.getElementById('points-number').innerText = points;
        // Level çubuğunu güncelle
        updateLevelProgress(level, totalPoints);
    }

    function updateLevelProgress(level, totalPoints) {
        let levelThresholds = [50000, 150000, 500000];
        let currentLevelThreshold = levelThresholds[level - 2] || 0;
        let nextLevelThreshold = levelThresholds[level - 1];
        let progressPercentage = ((totalPoints - currentLevelThreshold) / (nextLevelThreshold - currentLevelThreshold)) * 100;
        document.getElementById('level-progress').style.width = progressPercentage + '%';
    }

    function setupEventListeners() {
        // Connect butonu tıklaması
        document.getElementById('connect-button').addEventListener('click', function() {
            // Wallet sayfasını aç
            alert('Wallet sayfası açılacak.');
        });

        // Settings
        document.getElementById('settings-icon').addEventListener('click', function() {
            document.getElementById('settings-window').style.display = 'block';
        });

        document.getElementById('close-settings').addEventListener('click', function() {
            document.getElementById('settings-window').style.display = 'none';
        });

        // Boost
        document.getElementById('boost').addEventListener('click', function() {
            document.getElementById('boost-window').style.display = 'block';
        });

        document.getElementById('close-boost').addEventListener('click', function() {
            document.getElementById('boost-window').style.display = 'none';
        });

        // Tıklama Oyunu ve Hile Kontrolü
        setupClickGame();
    }

    function setupClickGame() {
        let lastClickTime = 0;
        document.getElementById('click-circle').addEventListener('click', function() {
            let currentTime = Date.now();
            if (currentTime - lastClickTime < 100) {
                // Hile tespit edildi
                alert('Hile tespit edildi!');
                // Kullanıcı veritabanında işaretlenecek
                reportCheat();
            } else {
                // Normal tıklama işlemleri
                processClick();
            }
            lastClickTime = currentTime;
        });
    }

    function processClick() {
        // Sayaç ve puan güncelleme işlemleri
        fetch('/api/process_click', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ telegram_id: getTelegramID() })
        })
        .then(response => response.json())
        .then(data => {
            if (data.status === 'success') {
                updateLevelAndPoints(data.level, data.points, data.total_points);
                updateCounter(data.counter_a, data.counter_b);
            } else {
                alert(data.message);
            }
        });
    }

    function updateCounter(counterA, counterB) {
        document.getElementById('counter-a').innerText = counterA;
        document.getElementById('counter-b').innerText = counterB;
    }

    function reportCheat() {
        fetch('/api/report_cheat', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ telegram_id: getTelegramID() })
        })
        .then(response => response.json())
        .then(data => {
            if (data.status === 'success') {
                // Uygulamaya erişim engellenir
                alert('Hesabınız engellendi.');
                // Uygulamayı kapatabilir veya kullanıcıyı çıkışa yönlendirebilirsiniz
            } else {
                alert('Bir hata oluştu.');
            }
        });
    }

    // Diğer event listenerlar ve fonksiyonlar eklenecek

    function getTelegramID() {
        // Telegram WebApp içinde kullanıcının Telegram ID'sini almak için kullanılır
        // Örnek olarak sabit bir değer döndürüyoruz
        return '123456789';
    }

    startSlideshow();
});
