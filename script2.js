let clickCount = 10000;

function handleClick() {
    if (clickCount > 0) {
        clickCount--;
        document.getElementById('click-counter').innerText = clickCount;
    }
}

// Tıklama butonuna gölge efekti eklemek için
const navItems = document.querySelectorAll('.nav-item');

navItems.forEach(item => {
    item.addEventListener('click', () => {
        // Seçilen menüye tıklandığını belirtmek için sınıf ekleme
        navItems.forEach(nav => nav.classList.remove('active'));
        item.classList.add('active');
    });
});

