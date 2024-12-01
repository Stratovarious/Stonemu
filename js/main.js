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
                if (page === 'home.html') {
                    attachHomeEventListeners();
                } else if (page === 'events.html') {
                    attachEventsEventListeners();
                } else if (page === 'friends.html') {
                    attachFriendsEventListeners();
                }
                // Diğer sayfalar için benzer kontroller ekleyin
            })
            .catch((error) => {
                console.error('Hata:', error);
            });
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

    // Sayfa yüklendiğinde ölçeklendirme yap
    adjustScale();

    // Home sayfası için eventleri bağlayan fonksiyon
    function attachHomeEventListeners() {
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

        preventImageDragging();

        // Sağ tık menüsünü engelle
        document.addEventListener('contextmenu', function (e) {
            e.preventDefault();
        });

        // Metin seçimini engelle
        document.addEventListener('selectstart', function (e) {
            e.preventDefault();
        });
    }

    // Events sayfası için eventleri bağlayan fonksiyon
    function attachEventsEventListeners() {
        const eventDetails = {
            "Stonemu Live": {
                shortDescription: "Stonemu App is live now. Play for our airdrop...",
                title: "Stonemu Live!",
                description: "Stonemu App is live now. Play for our airdrop... Contribute will be done and it will be fair",
            },
            "Play For Airdrop": {
                shortDescription: "Contribution is all, Followers will win!",
                title: "Play For Airdrop",
                description: "We care our users and we would like to see you to play our games.",
            },
            "Everything For Decentralization": {
                shortDescription: "Decentralization is our first goal!",
                title: "Everything For Decentralization",
                description: "We would like to reduce the costs for swap and others. Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry's standard dummy text ever since the 1500s, when an unknown printer took a galley of type and scrambled it to make a type specimen book. It has survived not only five centuries, but also the leap into electronic typesetting, remaining essentially unchanged. It was popularised in the 1960s with the release of Letraset sheets containing Lorem Ipsum passages, and more recently with desktop publishing software like Aldus PageMaker including versions of Lorem Ipsum.Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry's standard dummy text ever since the 1500s, when an unknown printer took a galley of type and scrambled it to make a type specimen book. It has survived not only five centuries, but also the leap into electronic typesetting, remaining essentially unchanged. It was popularised in the 1960s with the release of Letraset sheets containing Lorem Ipsum passages, and more recently with desktop publishing software like Aldus PageMaker including versions of Lorem Ipsum.Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry's standard dummy text ever since the 1500s, when an unknown printer took a galley of type and scrambled it to make a type specimen book. It has survived not only five centuries, but also the leap into electronic typesetting, remaining essentially unchanged. It was popularised in the 1960s with the release of Letraset sheets containing Lorem Ipsum passages, and more recently with desktop publishing software like Aldus PageMaker including versions of Lorem Ipsum.",
            }
        };

        const overlay = document.getElementById('overlay');
        const playButton = document.getElementById('play-btn');
        const backButton = document.getElementById('back-btn');
        const slides = document.querySelectorAll('.slide-events');
        const prevButton = document.getElementById('prev-btn');
        const nextButton = document.getElementById('next-btn');
        const dynamicText = document.getElementById('dynamic-text');
        const centerContent = document.getElementById('center-content');
        const events_scrollUp = document.getElementById('scroll-up');
        const events_scrollDown = document.getElementById('scroll-down');

        // Öğelerin varlığını kontrol edin
        if (!(overlay && playButton && backButton && slides.length > 0 && prevButton && nextButton && dynamicText && centerContent && events_scrollUp && events_scrollDown)) {
            return; // Öğeler bulunamazsa fonksiyondan çık
        }

        let currentSlide = 0;
        let slideInterval;
        let timeoutHandle;

        // Etkinlik slaytlarını göster ve açıklamayı güncelle
        function showSlide(index) {
            slides.forEach((slide, i) => {
                slide.style.display = i === index ? 'block' : 'none';
            });
            const currentEvent = slides[index].textContent.trim();
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
            const currentEvent = slides[currentSlide].textContent.trim();
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

        //Ok tuşlarının çalışması sırasında slaytın bekletilmesi.
        prevButton.addEventListener('click', () => {
            prevSlide();
            pauseSlideshowFor20Seconds();
        });

        // Scroll butonlarını yönet
        function handleScrollButtons() {
            if (centerContent.scrollTop > 0) {
                events_scrollUp.style.display = 'block';
            } else {
                events_scrollUp.style.display = 'none';
            }

            if (centerContent.scrollHeight - centerContent.scrollTop > centerContent.offsetHeight) {
                events_scrollDown.style.display = 'block';
            } else {
                events_scrollDown.style.display = 'none';
            }
        }

        events_scrollUp.addEventListener('click', () => {
            centerContent.scrollTop -= 50;
            handleScrollButtons();
        });

        events_scrollDown.addEventListener('click', () => {
            centerContent.scrollTop += 50;
            handleScrollButtons();
        });

        centerContent.addEventListener('scroll', handleScrollButtons);


        // İlk slaytı göster ve slayt gösterisini başlat
        showSlide(currentSlide);
        startSlideshow();
    }

    //Friends sayfası için js kodları
    function attachFriendsEventListeners() {
        // Davet linki dinamik olarak oluşturuluyor
        const inviteLink = "t.me/DSADJAFG";
        
        // Davet linkini uygun alana ekle
        document.getElementById("friends_invite_code").innerHTML = `
            <p>Invite Link:</p>
            <p>${inviteLink}</p>
        `;
        
        // Copy link button functionality
        document.getElementById("friends_copy_link_btn").addEventListener("click", function() {
            navigator.clipboard.writeText(inviteLink).then(() => {
                alert("Copied!");
            });
        });
        
        // Share link button functionality
        document.getElementById("friends_share_link_btn").addEventListener("click", function() {
            if (navigator.share) {
                navigator.share({
                    title: 'Invite Link',
                    text: 'Join me using this link:',
                    url: inviteLink
                }).then(() => {
                    alert("Shared!");
                }).catch(console.error);
            } else {
                alert("Sharing not supported on this device.");
            }
        });
        
        // Tablo verileri
        const friendsData = [
            { userName: "John", level: 5, point: 300, claimed: false },
            { userName: "Emma", level: 3, point: 150, claimed: false },
            { userName: "Noah", level: 8, point: 500, claimed: false },
            { userName: "Ava", level: 2, point: 100, claimed: false },
            { userName: "Liam", level: 6, point: 400, claimed: false }
        ];
        
        // Tabloyu render etme
        const tableBody = document.querySelector("#friends_table tbody");
        
        function renderTable(sortKey = "userName", sortAsc = true) {
            tableBody.innerHTML = "";
            const sortedData = [...friendsData].sort((a, b) => {
                if (typeof a[sortKey] === "string") {
                    return sortAsc
                        ? a[sortKey].localeCompare(b[sortKey])
                        : b[sortKey].localeCompare(a[sortKey]);
                }
                return sortAsc ? a[sortKey] - b[sortKey] : b[sortKey] - a[sortKey];
            });
        
            sortedData.forEach((friend, index) => {
                const row = document.createElement("tr");
        
                row.innerHTML = `
                    <td>${index + 1}</td>
                    <td>${friend.userName}</td>
                    <td>${friend.level}</td>
                    <td>${friend.point}</td>
                    <td>
                        <button class="friends-claim-btn ${
                            friend.claimed ? "claimed" : ""
                        }" ${friend.claimed ? "disabled" : ""}>
                            ${friend.claimed ? "Claimed" : "Claim"}
                        </button>
                    </td>
                `;
        
                const claimBtn = row.querySelector(".friends-claim-btn");
                claimBtn.addEventListener("click", () => {
                    friend.claimed = true;
                    renderTable(sortKey, sortAsc);
                });
        
                tableBody.appendChild(row);
            });
        }
        
        // Sıralama başlıklarına tıklama
        document.querySelectorAll(".sortable").forEach((header) => {
            let sortAsc = true;
            header.addEventListener("click", () => {
                const key = header.dataset.key;
                sortAsc = !sortAsc;
                renderTable(key, sortAsc);
                document
                    .querySelectorAll(".sortable")
                    .forEach((h) => (h.textContent = h.textContent.replace(" ▲", "").replace(" ▼", "")));
                header.textContent += sortAsc ? " ▲" : " ▼";
            });
        });
        
        renderTable();
    }
});
