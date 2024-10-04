document.addEventListener('DOMContentLoaded', function() {
    let slides = document.querySelectorAll('.slide');
    let currentSlide = 0;
    let progressBar = document.getElementById('progress');
    let progressWidth = 0;
    let progressInterval;
    let slideInterval;

    // Start the slideshow
    function startSlideshow() {
        slides[currentSlide].classList.add('active');
        progressInterval = setInterval(updateProgressBar, 50);
        slideInterval = setInterval(nextSlide, 3000);
    }

    // Update the loading bar
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

    // Show the next slide
    function nextSlide() {
        slides[currentSlide].classList.remove('active');
        currentSlide = (currentSlide + 1) % slides.length;
        slides[currentSlide].classList.add('active');
    }

    // Check if exchange selection is required
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

    // Handle exchange selection
    document.getElementById('exchange-ok-button').addEventListener('click', function() {
        let exchange = document.getElementById('exchange-dropdown').value;
        if (exchange) {
            localStorage.setItem('exchangeSelected', exchange);
            document.getElementById('exchange-selection').style.display = 'none';
            document.getElementById('homepage').style.display = 'block';
            initializeHomepage();
        } else {
            alert('Please select an exchange.');
        }
    });

    // Initialize the homepage
    function initializeHomepage() {
        // Set up event listeners and initial values
        document.getElementById('connect-button').addEventListener('click', showWalletPage);
        document.getElementById('settings-icon').addEventListener('click', showSettings);
        document.getElementById('close-settings').addEventListener('click', closeSettings);
        document.getElementById('boost').addEventListener('click', showBoost);
        document.getElementById('close-boost').addEventListener('click', closeBoost);

        // Initialize click game
        setupClickGame();

        // Initialize menu buttons
        document.getElementById('events-button').addEventListener('click', showEventsPage);
        document.getElementById('tournaments-button').addEventListener('click', showTournamentsPage);
        document.getElementById('leaderboard-button').addEventListener('click', showLeaderboardPage);
        document.getElementById('friends-button').addEventListener('click', showFriendsPage);
        document.getElementById('shop-button').addEventListener('click', showShopPage);
        document.getElementById('mine-button').addEventListener('click', showMinePage);
        document.getElementById('playground-button').addEventListener('click', showPlaygroundPage);

        // Initialize wallet page
        document.getElementById('back-from-wallet').addEventListener('click', closePage);
        document.getElementById('connect-ton-wallet').addEventListener('click', connectTonWallet);
        document.getElementById('connect-okx-wallet').addEventListener('click', connectOkxWallet);

        // Initialize other pages
        document.getElementById('back-from-events').addEventListener('click', closePage);
        document.getElementById('back-from-tournaments').addEventListener('click', closePage);
        document.getElementById('back-from-leaderboard').addEventListener('click', closePage);
        document.getElementById('back-from-friends').addEventListener('click', closePage);
        document.getElementById('back-from-shop').addEventListener('click', closePage);
        document.getElementById('back-from-mine').addEventListener('click', closePage);
        document.getElementById('back-from-playground').addEventListener('click', closePage);

        // Update level and points display
        document.getElementById('level-text').innerText = 'Level 1';
        document.getElementById('points-number').innerText = '0';
    }

    // Show wallet page
    function showWalletPage() {
        document.getElementById('homepage').style.display = 'none';
        document.getElementById('wallet-page').style.display = 'block';
    }

    // Show settings
    function showSettings() {
        document.getElementById('settings-window').style.display = 'block';
    }

    // Close settings
    function closeSettings() {
        document.getElementById('settings-window').style.display = 'none';
    }

    // Show boost
    function showBoost() {
        document.getElementById('boost-window').style.display = 'block';
    }

    // Close boost
    function closeBoost() {
        document.getElementById('boost-window').style.display = 'none';
    }

    // Setup click game
    function setupClickGame() {
        let counterA = 5000;
        let counterB = 5000;
        let clickValue = 1;
        let points = 0;
        let totalPoints = 0;
        let level = 1;
        let levelThresholds = [50000, 150000, 500000];
        let clickInterval = 20000; // 20 seconds

        document.getElementById('click-circle').addEventListener('click', function() {
            // Cheat detection
            let now = Date.now();
            let lastClickTime = parseInt(localStorage.getItem('lastClickTime')) || 0;
            if (now - lastClickTime < 100) {
                // Cheating detected
                alert('Cheating detected!');
                // Report to server
                reportCheating();
                return;
            }
            localStorage.setItem('lastClickTime', now);

            // Process click
            if (counterA >= clickValue) {
                counterA -= clickValue;
                points += clickValue;
                totalPoints += clickValue;
                updatePointsDisplay();
                updateCounterDisplay();
                checkLevelUp();
            } else {
                alert('Not enough counter!');
            }
        });

        function updatePointsDisplay() {
            document.getElementById('points-number').innerText = points;
        }

        function updateCounterDisplay() {
            document.getElementById('counter-a').innerText = counterA;
            document.getElementById('counter-b').innerText = counterB;
        }

        function checkLevelUp() {
            if (level <= levelThresholds.length && totalPoints >= levelThresholds[level - 1]) {
                level += 1;
                document.getElementById('level-text').innerText = 'Level ' + level;
            }
        }

        // Automatic counter refill
        setInterval(function() {
            if (counterA < counterB) {
                counterA += 1;
                updateCounterDisplay();
            }
        }, clickInterval);
    }

    // Report cheating to server
    function reportCheating() {
        // Implement API call to report cheating
        alert('You have been banned for cheating.');
        // Redirect or disable app
    }

    // Show events page
    function showEventsPage() {
        document.getElementById('homepage').style.display = 'none';
        document.getElementById('events-page').style.display = 'block';
        // Load tasks
        loadTasks();
    }

    function loadTasks() {
        let tasksList = document.getElementById('tasks-list');
        tasksList.innerHTML = '';
        // Example tasks
        let tasks = [
            { name: 'Like Twitter Page', points: 500 },
            { name: 'Retweet Post', points: 600 },
            // ... other tasks
        ];
        tasks.forEach(task => {
            let taskItem = document.createElement('div');
            taskItem.className = 'task-item';
            taskItem.innerHTML = `
                <p>${task.name} - ${task.points} Points</p>
                <button class="task-button">Do Task</button>
            `;
            tasksList.appendChild(taskItem);
        });
    }

    // Show tournaments page
    function showTournamentsPage() {
        document.getElementById('homepage').style.display = 'none';
        document.getElementById('tournaments-page').style.display = 'block';
    }

    // Show leaderboard page
    function showLeaderboardPage() {
        document.getElementById('homepage').style.display = 'none';
        document.getElementById('leaderboard-page').style.display = 'block';
        // Load leaderboard data
        loadLeaderboard();
    }

    function loadLeaderboard() {
        let leaderboardList = document.getElementById('leaderboard-list');
        leaderboardList.innerHTML = '';
        // Example data
        let leaderboard = [
            { username: 'User1', level: 5, points: 100000 },
            // ... other users
        ];
        leaderboard.forEach(user => {
            let entry = document.createElement('div');
            entry.className = 'leaderboard-entry';
            entry.innerHTML = `<p>${user.username} - Level ${user.level} - ${user.points} Points</p>`;
            leaderboardList.appendChild(entry);
        });
    }

    // Show friends page
    function showFriendsPage() {
        document.getElementById('homepage').style.display = 'none';
        document.getElementById('friends-page').style.display = 'block';
        // Display invite code
        let inviteCode = localStorage.getItem('inviteCode');
        if (!inviteCode) {
            inviteCode = generateInviteCode();
            localStorage.setItem('inviteCode', inviteCode);
        }
        document.getElementById('invite-code').innerText = inviteCode;
        // Load invitees
        loadInvitees();
    }

    function generateInviteCode() {
        let characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        let code = '';
        for (let i = 0; i < 12; i++) {
            code += characters.charAt(Math.floor(Math.random() * characters.length));
        }
        return code;
    }

    function loadInvitees() {
        let inviteesList = document.getElementById('invitees-list');
        inviteesList.innerHTML = '';
        // Example invitees
        let invitees = [
            { username: 'Friend1' },
            // ... other invitees
        ];
        invitees.forEach(invitee => {
            let item = document.createElement('div');
            item.className = 'invitee-item';
            item.innerText = invitee.username;
            inviteesList.appendChild(item);
        });
    }

    // Show shop page
    function showShopPage() {
        document.getElementById('homepage').style.display = 'none';
        document.getElementById('shop-page').style.display = 'block';
    }

    // Show mine page
    function showMinePage() {
        document.getElementById('homepage').style.display = 'none';
        document.getElementById('mine-page').style.display = 'block';
    }

    // Show playground page
    function showPlaygroundPage() {
        document.getElementById('homepage').style.display = 'none';
        document.getElementById('playground-page').style.display = 'block';
    }

    // Close the current page and go back to homepage
    function closePage() {
        document.querySelectorAll('.page').forEach(page => page.style.display = 'none');
        document.getElementById('homepage').style.display = 'block';
    }

    // Connect TON wallet
    function connectTonWallet() {
        // Implement wallet connection logic
        document.getElementById('wallet-status').innerText = 'TON Wallet connected.';
    }

    // Connect OKX wallet
    function connectOkxWallet() {
        // Implement wallet connection logic
        document.getElementById('wallet-status').innerText = 'OKX Web3 Wallet connected.';
    }

    startSlideshow();
});
