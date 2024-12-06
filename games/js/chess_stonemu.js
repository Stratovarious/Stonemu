// chess_stonemu.js

"use strict";

var board;
var game = new Chess();
var socket = io('https://stonemu-8bdeedab7930.herokuapp.com'); // Heroku URL
var playerColor;
var gameStarted = false;

// Telegram kullanıcı adını alma (placeholder)
function getTelegramUsername() {
  // Telegram WebApp üzerinden bilgi alınacak, burada varsayımsal
  return "Player" + Math.floor(Math.random() * 1000);
}

function initGame() {
  var cfg = {
    draggable: true,
    position: "start",
    pieceTheme: "../img/chess_img/chips/{piece}.png", // chess_stonemu.html games/ dizininde, ../ ile Stonemu_/ dizinine, sonra img/
    onDragStart: onDragStart,
    onDrop: onDrop,
    onSnapEnd: onSnapEnd,
    onMouseoverSquare: onMouseoverSquare,
    onMouseoutSquare: onMouseoutSquare,
  };

  board = new ChessBoard("gameBoard", cfg);

  var randomNumber = Math.floor(Math.random() * 1000);
  socket.emit("joinGame", { randomNumber: randomNumber });

  socket.on("assignColor", function (data) {
    playerColor = data.color;
    board.orientation(playerColor);
    if (playerColor === "white") {
      alert("Your number has been randomly generated, your color is White, you start the game first.\nDokunarak taşınızı seçin ve hamlenizi yapın.");
    } else {
      alert("Your number has been randomly generated, unfortunately your color is Black, please wait for the other player's move.\nDokunarak taş hamlelerini inceleyebilirsiniz ama hamleyi beyaz yapacak.");
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
    alert("Karşı oyuncu oyundan ayrıldı. Yeni oyun için sayfayı yenileyin.");
  });

  // Kullanıcıya başlangıçta bilgi ver
  alert("Bu oyun Telegram üzerinde sadece telefondan oynanacak şekilde tasarlanmıştır.\nLütfen dokunmatik hamleleri kullanın.\n'Bol şanslar', 'İyi oyunlar', 'İyi oyundu' gibi mesajları alttaki panelden gönderebilirsiniz.");
}

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
  // Basit bir kontrol: eğer sırası gelen oyuncu hamle yapamıyorsa kaybetti varsayıyoruz
  // Geliştirilebilir.
  if (game.turn() === playerColor) {
    // Sırası sizde ama hamle yoksa kaybettiniz
    message = "Maalesef oyunu kaybettiniz, şansınızı tekrar deneyiniz";
    showGameOverScreen(message, false);
  } else {
    // Rakip hamle yapamadı siz kazandınız
    message = "Oyunu kazandınız, lütfen puanınızı alınız";
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
      alert("Puanınız hesabınıza eklendi.");
    });
  }

  document.getElementById("newGameButton").addEventListener("click", function () {
    location.reload();
  });

  document.getElementById("closeButton").addEventListener("click", function () {
    window.history.back();
  });
}

$(document).ready(function () {
  initGame();
  $(window).resize(board.resize);

  // Basit mesaj gönderme özelliği (opsiyonel)
  $("#sendButton").click(function () {
    var msg = $("#chatInput").val();
    if (msg.trim() !== "") {
      alert("Mesajınız: " + msg); // Gerçekte Telegram arayüzüne veya rakibe gönderilebilir.
      $("#chatInput").val("");
    }
  });
});
