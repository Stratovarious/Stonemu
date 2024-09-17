let score = 149559687;

function incrementScore() {
    score += 1;
    document.querySelector('.score-section').innerText = score.toLocaleString();
}

function changePage(page) {
    alert("Navigating to " + page + " page.");
}
