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
            // Seçimi sunucuya gönder
            fetch('/api/set_exchange_selection', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': 'Bearer ' + localStorage.getItem('token')
                },
                body: JSON.stringify({ exchange: exchange })
            })
                .then(response => response.json())
                .then(data => {
                    if (data.status === 'success') {
                        document.getElementById('exchange-selection').style.display = 'none';
                        document.getElementById('homepage').style.display = 'block';
                        initializeHomepage();
                    } else {
                        alert('Borsa seçimi kaydedilemedi.');
                    }
                })
                .catch(error => {
                    console.error('Hata:', error);
                });
        } else {
            alert('Lütfen bir borsa seçin.');
        }
    });

    // Anasayfayı başlat
    function initializeHomepage() {
        // Etkinlik dinleyicilerini ve başlangıç değerlerini ayarla
        document.getElementById('connect-button').addEventListener('click', showWalletPage);
        document.getElementById('settings-icon').addEventListener('click', showSettings);
        document.getElementById('close-settings').addEventListener('click', closeSettings);
        document.getElementById('boost').addEventListener('click', showBoost);
        document.getElementById('close-boost').addEventListener('click', closeBoost);

        // Click oyunu ayarları
        setupClickGame();

        // Seçilen exchange'i anasayfada göster
        let exchangeSelected = localStorage.getItem('exchangeSelected');
        if (exchangeSelected) {
            let exchangeFrame = document.getElementById('exchange-button');
            exchangeFrame.style.backgroundImage = `url('images/${exchangeSelected}_logo.png')`;
        }

        // Menü butonları
        document.getElementById('events-button').addEventListener('click', showEventsPage);
        document.getElementById('tournaments-button').addEventListener('click', showTournamentsPage);
        document.getElementById('leaderboard-button').addEventListener('click', showLeaderboardPage);
        document.getElementById('friends-button').addEventListener('click', showFriendsPage);
        document.getElementById('shop-button').addEventListener('click', showShopPage);
        document.getElementById('mine-button').addEventListener('click', showMinePage);
        document.getElementById('playground-button').addEventListener('click', showPlaygroundPage);

        // Diğer sayfalar
        document.getElementById('back-from-wallet').addEventListener('click', closePage);
        document.getElementById('back-from-events').addEventListener('click', closePage);
        document.getElementById('back-from-tournaments').addEventListener('click', closePage);
        document.getElementById('back-from-leaderboard').addEventListener('click', closePage);
        document.getElementById('back-from-friends').addEventListener('click', closePage);
        document.getElementById('back-from-shop').addEventListener('click', closePage);
        document.getElementById('back-from-mine').addEventListener('click', closePage);
        document.getElementById('back-from-playground').addEventListener('click', closePage);

        // Kullanıcı verilerini yükle
        loadUserData();
    }

    // Kullanıcı verilerini yükle
    function loadUserData() {
        fetch('/api/get_user_data', {
            method: 'GET',
            headers: {
                'Authorization': 'Bearer ' + localStorage.getItem('token')
            }
        })
            .then(response => response.json())
            .then(data => {
                if (data.status === 'success') {
                    document.getElementById('level-text').innerText = 'Seviye ' + data.level;
                    document.getElementById('points-number').innerText = data.points;
                    document.getElementById('counter-a').innerText = data.counter_a;
                    document.getElementById('counter-b').innerText = data.counter_b;
                    // Seviye ilerleme çubuğunu güncelle
                    updateLevelProgress(data.total_points);
                } else {
                    alert('Kullanıcı verileri yüklenemedi.');
                }
            })
            .catch(error => {
                console.error('Hata:', error);
            });
    }

    // Seviye ilerleme çubuğunu güncelle
    function updateLevelProgress(totalPoints) {
        let levelThresholds = [50000, 150000, 500000];
        let currentLevel = parseInt(document.getElementById('level-text').innerText.replace('Seviye ', ''));
        let progress = 0;
        if (currentLevel <= levelThresholds.length) {
            let levelStart = currentLevel === 1 ? 0 : levelThresholds[currentLevel - 2];
            let levelEnd = levelThresholds[currentLevel - 1];
            progress = ((totalPoints - levelStart) / (levelEnd - levelStart)) * 100;
        } else {
            progress = 100;
        }
        document.getElementById('level-progress').style.width = progress + '%';
    }

    // Click oyunu ayarları
    function setupClickGame() {
        document.getElementById('click-circle').addEventListener('click', function () {
            fetch('/api/process_click', {
                method: 'POST',
                headers: {
                    'Authorization': 'Bearer ' + localStorage.getItem('token')
                }
            })
                .then(response => response.json())
                .then(data => {
                    if (data.status === 'success') {
                        document.getElementById('points-number').innerText = data.points;
                        document.getElementById('counter-a').innerText = data.counter_a;
                        document.getElementById('level-text').innerText = 'Seviye ' + data.level;
                        updateLevelProgress(data.total_points);
                    } else if (data.status === 'error') {
                        alert(data.message);
                    }
                })
                .catch(error => {
                    console.error('Hata:', error);
                });
        });
    }

    // Diğer fonksiyonlar (showWalletPage, showSettings, closeSettings, showBoost, closeBoost, showEventsPage, closePage, vb.) burada tanımlanmalı

    startSlideshow();
});
