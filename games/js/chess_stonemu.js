// chess_stonemu.js

"use strict";

var board;
var game = new Chess();
// Heroku'da barındırdığınız backend URL'sini girin
var socket = io('https://stonemu-8bdeedab7930.herokuapp.com');
var playerColor;
var gameStarted = false;

function initGame() {
  var cfg = {
    draggable: true,
    position: "start",
    pieceTheme: "../../img/chess_img/chips/{piece}.png",
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
      alert("Your number has been randomly generated, your color is White, you start the game first");
    } else {
      alert("Your number has been randomly generated, unfortunately your color is Black, please wait for the other player's move");
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
    alert("Karşı oyuncu oyundan ayrıldı.");
  });
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
  var message = game.game_over()
    ? "You won the game, please claim your points"
    : "Draw!";
  showGameOverScreen(message);
}

function showGameOverScreen(message) {
  var overlay = document.createElement("div");
  overlay.id = "gameOverOverlay";
  overlay.innerHTML = `
    <div id="gameOverMessage">${message}</div>
    <button id="claimButton">Claim</button>
    <button id="newGameButton">New Game</button>
    <button id="closeButton">Close</button>
  `;
  document.body.appendChild(overlay);

  document.getElementById("claimButton").addEventListener("click", function () {
    socket.emit("claimVictory", { playerColor: playerColor });
    alert("Your points have been added to your account.");
  });

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
});
