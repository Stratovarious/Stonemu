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

var isTouchDevice = ('ontouchstart' in document.documentElement);
var selectedSquare = null;

// Dragging for desktop
var draggedPieceEl = null;
var isDragging = false;
var draggable = true; // from config
// On touch devices, no actual drag, just tap-based selection.

// Telegram Web App API'sini başlat
if (window.Telegram && window.Telegram.WebApp) {
    window.Telegram.WebApp.ready();
} else {
    console.error("Telegram WebApp API yüklenemedi.");
}

// Güncellenmiş getTelegramUsername ve getTelegramUserId fonksiyonları
function getTelegramUsername() {
  if (window.Telegram && window.Telegram.WebApp && window.Telegram.WebApp.initDataUnsafe && window.Telegram.WebApp.initDataUnsafe.user) {
    return window.Telegram.WebApp.initDataUnsafe.user.username || "Anonymous";
  } else {
    console.error("Telegram WebApp API kullanılamıyor.");
    return "Anonymous";
  }
}

function getTelegramUserId() {
  if (window.Telegram && window.Telegram.WebApp && window.Telegram.WebApp.initDataUnsafe && window.Telegram.WebApp.initDataUnsafe.user) {
    return window.Telegram.WebApp.initDataUnsafe.user.id;
  } else {
    console.error("Telegram WebApp API kullanılamıyor.");
    return null;
  }
}

function addMessage(msg) {
  $("#chatMessages").css("display","block");
  $("#chatMessages").append($("<div>").text(msg));
}

function startCountdown() {
  addMessage("Eşleşme aranıyor, lütfen bekleyin...");
  addMessage("İşlem Devam Ediyor...");
  $("#chatMessages").append('<div id="countdownLine">Kalan süre: 30 sn</div>');

  countdownInterval = setInterval(() => {
    countdown--;
    if (countdown <= 0) {
      clearInterval(countdownInterval);
      if (!matchFound && !botRequested) {
        socket.emit('botRequest');
        botRequested = true;
      }
    } else {
      $("#countdownLine").text("Kalan süre: " + countdown + " sn");
    }
  }, 1000);
}

async function registerUser() {
  const username = getTelegramUsername(); // Telegram'dan alınan kullanıcı adı
  const user_id = getTelegramUserId(); // Telegram'dan alınan kullanıcı ID

  if (!user_id) {
    console.error("Kullanıcı ID alınamadı.");
    return;
  }

  try {
    const response = await fetch('/api/users', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ user_id, username }),
    });

    if (response.ok) {
        console.log('Kullanıcı kaydedildi veya güncellendi.');
        // Socket.io ile register event'ini gönder
        socket.emit('register', { user_id });
    } else {
        console.error('Kullanıcı kaydedilemedi.');
    }
  } catch (error) {
    console.error('Kullanıcı kaydetme hatası:', error);
  }
}

function initGame() {
  var cfg = {
    draggable: !isTouchDevice, 
    position: "start",
    pieceTheme: "../img/chess_img/chips/{piece}.png",
    onDragStart: onDragStart,
    onDrop: onDrop,
    onSnapEnd: onSnapEnd,
    onMouseoverSquare: onMouseoverSquare,
    onMouseoutSquare: onMouseoutSquare,
    showNotation:true
  };

  board = new ChessBoard("gameBoard", cfg);

  // For dragging piece img
  $("body").append('<img id="draggedPiece" class="piece" />');
  draggedPieceEl = $("#draggedPiece");

 // Kullanıcıyı backend'e kaydet ve register event'ini tetikle
 registerUser();

  startCountdown();

  socket.on("assignColor", function (data) {
    clearInterval(countdownInterval);
    matchFound = true;
    addMessage("Eşleşme bulundu!");
    playerColor = data.color;
    board.orientation(playerColor);
    if (playerColor === "white") {
      addMessage("Renginiz: Beyaz, ilk hamleyi siz yapıyorsunuz.");
      addMessage("Dokunarak (veya mouse ile) taşınızı seçin ve hamlenizi yapın.");
    } else {
      addMessage("Renginiz: Siyah, lütfen rakibinizin hamlesini bekleyiniz.");
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
    if (data.winner === null) {
      addMessage("Oyun berabere bitti.");
      showGameOverScreen("Oyun berabere bitti.", false);
    } else if (data.winner === playerColor) {
      addMessage("Oyunu kazandınız, lütfen puanınızı claim butonu ile alın.");
      showGameOverScreen("Oyunu kazandınız, lütfen puanınızı alınız", true);
    } else {
      addMessage("Maalesef oyunu kaybettiniz, tekrar deneyiniz.");
      showGameOverScreen("Maalesef oyunu kaybettiniz, şansınızı tekrar deneyiniz", false);
    }
  });

  $(document).ready(function () {
    $(window).resize(board.resize);

    $("#sendButton").click(function () {
      var msg = $("#chatInput").val().trim();
      if (msg !== "") {
        addMessage(getTelegramUsername() + ": " + msg);
        $("#chatInput").val("");
      }
    });
  });

  // Touch-based selection logic
  if(isTouchDevice) {
    $("#gameBoard").on("touchstart", ".square", function(e) {
      e.preventDefault();
      var square = $(this).attr("data-square");
      var piece = game.fen().split(' ')[0]; // just to ensure fen loaded
      // actually piece from board position:
      var pos=board.position();
      var pieceAt=pos[square];

      if(!gameStarted) return;
      if(!selectedSquare) {
        // no selection
        if(pieceAt && pieceAt.charAt(0)===playerColor.charAt(0)) {
          // select this piece
          selectedSquare=square;
          highlightSelectionAndMoves(square);
        } else {
          // tap on empty or opponent piece does nothing
        }
      } else {
        // piece selected previously
        if(selectedSquare===square) {
          // same square tapped again => deselect
          clearSelection();
        } else {
          // try move
          var moves=game.getValidMoves(selectedSquare);
          var valid = moves.find(m=>m.to===square);
          if(valid) {
            // make move
            var move = {from:selectedSquare,to:square,promotion:'q'};
            if(game.validate_move(move)) {
              game.move(move);
              board.position(game.fen());
              socket.emit("move", move);
              if(game.game_over()) handleGameOver();
            }
          }
          clearSelection();
        }
      }
    });
  } else {
    // Mouse-based dragging logic already implemented via onDragStart, onMouseMove, onMouseUp
    // Additional: If user just click without dragging: select piece logic?
    // We'll just rely on dragging for desktop. If user just clicks piece and releases, no move performed => no harm.
    // If we want click-to-select also on desktop, we can implement similarly:
    $("#gameBoard").on("click",".square",function(e){
      if(!gameStarted||isDragging)return;
      var square=$(this).attr("data-square");
      var pos=board.position();
      var pieceAt=pos[square];

      if(!selectedSquare) {
        if(pieceAt && pieceAt.charAt(0)===playerColor.charAt(0)) {
          selectedSquare=square;
          highlightSelectionAndMoves(square);
        }
      } else {
        if(selectedSquare===square) {
          clearSelection();
        } else {
          var moves=game.getValidMoves(selectedSquare);
          var valid=moves.find(m=>m.to===square);
          if(valid) {
            var move={from:selectedSquare,to:square,promotion:'q'};
            if(game.validate_move(move)) {
              game.move(move);
              board.position(game.fen());
              socket.emit("move",move);
              if(game.game_over()) handleGameOver();
            }
          }
          clearSelection();
        }
      }
    });
  }
}

function highlightSelectionAndMoves(square) {
  board.clearHighlights();
  // highlight selected piece square with gray
  $("[data-square='"+square+"']").addClass("selected-square");
  var moves=game.getValidMoves(square);
  board.highlightValidMoves(moves);
}

function clearSelection() {
  selectedSquare=null;
  $("[data-square]").removeClass("selected-square");
  board.clearHighlights();
}

function onDragStart(source, piece) {
  if(isTouchDevice) return false; // no drag on touch
  if (!gameStarted) return false;
  if (
    (game.turn() === "w" && playerColor !== "white") ||
    (game.turn() === "b" && playerColor !== "black") ||
    game.game_over()
  ) {
    return false;
  }
  if (
    (playerColor === "white" && piece.search(/^w/) !== -1) ||
    (playerColor === "black" && piece.search(/^b/) !== -1)
  ) {
    return false;
  }
  isDragging=true;
  // Show dragged piece
  var pos=board.position();
  var sqEl = $("[data-square='"+source+"']");
  var pieceEl=sqEl.find(".piece");
  if(pieceEl.length>0) {
    draggedPieceEl.attr("src",pieceEl.attr("src"));
    draggedPieceEl.show();
  }
}

function onDrop(source, target, piece) {
  if(isTouchDevice) return;
  isDragging=false;
  draggedPieceEl.hide();

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
  if(isTouchDevice) return;
  if (!gameStarted) return;
  if (selectedSquare) return; // if already selected by click
  // If just hover: highlight moves if piece belongs to player
  var pos=board.position();
  var pieceAt=pos[square];
  if(pieceAt && pieceAt.charAt(0)===playerColor.charAt(0)) {
    var moves=game.getValidMoves(square);
    board.highlightValidMoves(moves);
  }
}

function onMouseoutSquare(square, piece) {
  if(isTouchDevice)return;
  if(!selectedSquare) board.clearHighlights();
}

function onMouseMove(e) {
  if(isTouchDevice) return;
  if(isDragging && draggedPieceEl.is(":visible")) {
    draggedPieceEl.css({
      left:e.pageX-25+"px",
      top:e.pageY-25+"px"
    });
  }
}

function handleGameOver() {
  var moves = game.getAllValidMovesForTurn();
  if(moves.length===0){
    // check or stalemate
    var inCheck=game.inCheck(game.turn());
    var message;
    if(inCheck) {
      // mat
      if(game.turn()!==playerColor) {
        message="Oyunu kazandınız, lütfen puanınızı alınız";
        addMessage(message);
        showGameOverScreen(message,true);
      } else {
        message="Maalesef oyunu kaybettiniz, şansınızı tekrar deneyiniz";
        addMessage(message);
        showGameOverScreen(message,false);
      }
    } else {
      // pat
      message="Oyun berabere bitti.";
      addMessage(message);
      showGameOverScreen(message,false);
    }
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

document.addEventListener('DOMContentLoaded', ()=>{
  initGame();
  $(window).on("mousemove",onMouseMove);
});
