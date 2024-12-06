// chess_stonemu.js

"use strict";

var board;
var game = new Chess();
// Backend URL (Heroku)
var socket = io('https://stonemu-8bdeedab7930.herokuapp.com');
var playerColor;
var gameStarted = false;
var matchFound = false;
var countdown = 30;
var countdownInterval;
var botRequested = false;

function getTelegramUsername() {
  // Telegram WebApp API ile entegre etmelisiniz.
  // Şimdilik placeholder
  return "TGUser_" + Math.floor(Math.random()*1000);
}

function addMessage(msg) {
  // Mesajları #chatMessages içinde gösterelim
  // #chatMessages gizli, görünür yapalım
  $("#chatMessages").css("display","block");
  $("#chatMessages").append($("<div>").text(msg));
}

function startCountdown() {
  addMessage("Eşleşme aranıyor, lütfen bekleyin...");
  addMessage("Kalan süre: " + countdown + " sn");
  // Spinner ekleyelim
  addMessage("(Burada bir spinner animasyonu olduğunu varsayın)");

  countdownInterval = setInterval(() => {
    countdown--;
    if (countdown <= 0) {
      clearInterval(countdownInterval);
      if (!matchFound && !botRequested) {
        // Bot iste
        socket.emit('botRequest');
        botRequested = true;
      }
    } else {
      // Süre güncelle
      $("#chatMessages div:last-child").text("Kalan süre: " + countdown + " sn");
    }
  }, 1000);
}

function initGame() {
  var cfg = {
    draggable: true,
    position: "start",
    pieceTheme: "../img/chess_img/chips/{piece}.png",
    onDragStart: onDragStart,
    onDrop: onDrop,
    onSnapEnd: onSnapEnd,
    onMouseoverSquare: onMouseoverSquare,
    onMouseoutSquare: onMouseoutSquare,
  };

  board = new ChessBoard("gameBoard", cfg);

  var randomNumber = Math.floor(Math.random() * 1000);
  socket.emit("joinGame", { randomNumber: randomNumber });

  startCountdown();

  socket.on("assignColor", function (data) {
    clearInterval(countdownInterval);
    matchFound = true;
    $("#chatMessages").append($("<div>").text("Eşleşme bulundu!"));
    playerColor = data.color;
    board.orientation(playerColor);
    if (playerColor === "white") {
      addMessage("Sayınız rastgele üretildi, renginiz: Beyaz, ilk hamleyi siz yapıyorsunuz.");
      addMessage("Dokunarak taşınızı seçin ve hamlenizi yapın.");
    } else {
      addMessage("Sayınız rastgele üretildi, renginiz: Siyah, lütfen rakibinizin hamlesini bekleyiniz.");
    }
    gameStarted = true;
  });

  socket.on("move", function (move) {
    game.move(move);
    board.position(game.fen());
    if (game.game_over()) {
      handleGameOver();
    }
  });

  socket.on("opponentLeft", function () {
    addMessage("Karşı oyuncu oyundan ayrıldı. Yeni oyun için sayfayı yenileyin.");
  });

  socket.on("gameOver", function(data) {
    // data.winner var
    if (data.winner === playerColor) {
      addMessage("Oyunu kazandınız, lütfen puanınızı claim butonu ile alın.");
      showGameOverScreen("Oyunu kazandınız, lütfen puanınızı alınız", true);
    } else {
      addMessage("Maalesef oyunu kaybettiniz, tekrar deneyiniz.");
      showGameOverScreen("Maalesef oyunu kaybettiniz, şansınızı tekrar deneyiniz", false);
    }
}

$(document).ready(function () {
  initGame();
  $(window).resize(board.resize);

  $("#sendButton").click(function () {
    var msg = $("#chatInput").val().trim();
    if (msg !== "") {
      addMessage(getTelegramUsername() + ": " + msg);
      $("#chatInput").val("");
    }
  });
});

function onDragStart(source, piece) {
  if (!gameStarted) return false;
  if (
    (game.turn() === "w" && playerColor !== "white") ||
    (game.turn() === "b" && playerColor !== "black") ||
    game.game_over()
  ) {
    return false;
  }
  if (
    (playerColor === "white" && piece.search(/^b/) !== -1) ||
    (playerColor === "black" && piece.search(/^w/) !== -1)
  ) {
    return false;
  }
}

function onDrop(source, target) {
  var move = {
    from: source,
    to: target,
    promotion: "q",
  };

  if (!game.validate_move(move)) return "snapback";

  game.move(move);
  board.position(game.fen());
  socket.emit("move", move);

  if (game.game_over()) {
    handleGameOver();
  }
}

function onSnapEnd() {
  board.position(game.fen());
}

function onMouseoverSquare(square, piece) {
  if (!gameStarted) return;
  if (piece && piece.charAt(0) === playerColor.charAt(0)) {
    var moves = game.getValidMoves(square);
    board.highlightValidMoves(moves);
  }
}

function onMouseoutSquare(square, piece) {
  board.clearHighlights();
}

function handleGameOver() {
  var message;
  if (game.turn() === playerColor) {
    // Sıra bizde ama hamle yok -> kaybettik varsayımı
    message = "Maalesef oyunu kaybettiniz, şansınızı tekrar deneyiniz";
    addMessage(message);
    showGameOverScreen(message, false);
  } else {
    message = "Oyunu kazandınız, lütfen puanınızı alınız";
    addMessage(message);
    showGameOverScreen(message, true);
  }
}

function showGameOverScreen(message, won) {
  var overlay = document.createElement("div");
  overlay.id = "gameOverOverlay";
  overlay.innerHTML = `
    <div id="gameOverMessage">${message}</div>
    ${won ? '<button id="claimButton">Claim</button>' : ''}
    <button id="newGameButton">New Game</button>
    <button id="closeButton">Close</button>
  `;
  document.body.appendChild(overlay);

  if (won) {
    document.getElementById("claimButton").addEventListener("click", function () {
      socket.emit("claimVictory", { playerColor: playerColor });
      addMessage("Puanınız hesabınıza eklendi.");
    });
  }

  document.getElementById("newGameButton").addEventListener("click", function () {
    location.reload();
  });

  document.getElementById("closeButton").addEventListener("click", function () {
    window.history.back();
  });
}
