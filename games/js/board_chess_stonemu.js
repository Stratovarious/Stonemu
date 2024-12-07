// board_chess_stonemu.js
// Tahtayı çizmek, taşları yerleştirmek, kareleri vurgulamak, dokunmatik/mouse eventleri ile drag-drop desteği.

(function (global) {
  "use strict";

  function ChessBoard(containerId, config) {
    var defaults = {
      draggable: true,
      orientation: "white",
      position: "start",
      showNotation: true,
      pieceTheme: "../img/chess_img/chips/{piece}.png",
      onDragStart: function () {},
      onDrop: function () {},
      onSnapEnd: function () {},
      onMouseoverSquare: function () {},
      onMouseoutSquare: function () {},
    };

    config = Object.assign({}, defaults, config);

    var boardEl = document.getElementById(containerId);
    var squares = {};
    var currentPosition = {};

    var draggedPiece = null;
    var draggedPieceSource = null;

    init();

    function init() {
      drawBoard();
      if (config.position === "start") {
        currentPosition = fenToPosition(
          "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR"
        );
      } else {
        currentPosition = fenToPosition(config.position);
      }
      setPosition(currentPosition);
      addEventListeners();
    }

    function drawBoard() {
      boardEl.innerHTML = "";
      boardEl.style.display = "grid";
      boardEl.style.gridTemplateColumns = "repeat(8, 1fr)";
      boardEl.style.gridTemplateRows = "repeat(8, 1fr)";

      var files = ["a", "b", "c", "d", "e", "f", "g", "h"];
      var ranks = ["1", "2", "3", "4", "5", "6", "7", "8"];

      if (config.orientation === "black") {
        files.reverse();
        ranks.reverse();
      }

      for (var i = 0; i < ranks.length; i++) {
        for (var j = 0; j < files.length; j++) {
          var squareColor = (i + j) % 2 === 0 ? "light" : "dark";
          var square = document.createElement("div");
          square.classList.add("square", squareColor);
          var squareId = files[j] + ranks[i];
          square.setAttribute("data-square", squareId);
          boardEl.appendChild(square);
          squares[squareId] = square;

          if (config.showNotation) {
            if (i === 7) {
              var fileNotation = document.createElement("div");
              fileNotation.classList.add("notation", "file");
              fileNotation.innerText = files[j];
              square.appendChild(fileNotation);
            }
            if (j === 0) {
              var rankNotation = document.createElement("div");
              rankNotation.classList.add("notation", "rank");
              rankNotation.innerText = ranks[i];
              square.appendChild(rankNotation);
            }
          }
        }
      }
    }

    function setPosition(position) {
      currentPosition = position;
      for (var square in squares) {
        if (squares.hasOwnProperty(square)) {
          var piece = position[square];
          var squareEl = squares[square];
          squareEl.innerHTML = "";
          if (piece) {
            var pieceEl = document.createElement("img");
            pieceEl.src = config.pieceTheme.replace("{piece}", piece);
            pieceEl.classList.add("piece");
            pieceEl.style.width = "100%";
            pieceEl.style.height = "100%";
            squareEl.appendChild(pieceEl);
          }
        }
      }
    }

    function fenToPosition(fen) {
      var position = {};
      var rows = fen.split(" ")[0].split("/");
      var ranks = ["8", "7", "6", "5", "4", "3", "2", "1"];
      var files = ["a", "b", "c", "d", "e", "f", "g", "h"];

      for (var i = 0; i < rows.length; i++) {
        var row = rows[i];
        var colIndex = 0;
        for (var j = 0; j < row.length; j++) {
          var char = row[j];
          if (isNaN(char)) {
            var color = char === char.toUpperCase() ? "w" : "b";
            var piece = color + char.toUpperCase();
            var square = files[colIndex] + ranks[i];
            position[square] = piece;
            colIndex++;
          } else {
            colIndex += parseInt(char, 10);
          }
        }
      }
      return position;
    }

    function addEventListeners() {
      // Dokunmatik için
      boardEl.addEventListener("touchstart", onTouchStart, { passive: false });
      boardEl.addEventListener("touchmove", onTouchMove, { passive: false });
      boardEl.addEventListener("touchend", onTouchEnd, { passive: false });

      // Mouse için
      boardEl.addEventListener("mousedown", onMouseDown);
      boardEl.addEventListener("mousemove", onMouseMove);
      boardEl.addEventListener("mouseup", onMouseUp);

      boardEl.addEventListener("mouseover", onMouseOver);
      boardEl.addEventListener("mouseout", onMouseOut);
    }

    function onMouseDown(e) {
      var square = e.target.closest(".square");
      if (!square) return;
      var squareId = square.getAttribute("data-square");
      if (!currentPosition[squareId]) return;
      var piece = currentPosition[squareId];
      if (config.onDragStart(squareId, piece) === false) return;
      draggedPiece = piece;
      draggedPieceSource = squareId;
      highlightValidMoves(squareId);
    }

    function onMouseMove(e) {
      // İsteğe bağlı: sürükleme efekti
    }

    function onMouseUp(e) {
      if (!draggedPiece) return;
      var targetSquare = e.target.closest(".square");
      var targetSquareId = targetSquare ? targetSquare.getAttribute("data-square") : null;
      var moveResult = config.onDrop(draggedPieceSource, targetSquareId, draggedPiece);
      if (moveResult !== "snapback" && targetSquareId) {
        currentPosition[targetSquareId] = draggedPiece;
        delete currentPosition[draggedPieceSource];
        setPosition(currentPosition);
        config.onSnapEnd();
      } else {
        setPosition(currentPosition);
      }
      draggedPiece = null;
      draggedPieceSource = null;
      clearHighlights();
    }

    function onTouchStart(e) {
      e.preventDefault();
      onMouseDown(e);
    }

    function onTouchMove(e) {
      e.preventDefault();
    }

    function onTouchEnd(e) {
      e.preventDefault();
      onMouseUp(e);
    }

    function onMouseOver(e) {
      var square = e.target.closest(".square");
      if (!square) return;
      var squareId = square.getAttribute("data-square");
      config.onMouseoverSquare(squareId, currentPosition[squareId]);
    }

    function onMouseOut(e) {
      var square = e.target.closest(".square");
      if (!square) return;
      var squareId = square.getAttribute("data-square");
      config.onMouseoutSquare(squareId, currentPosition[squareId]);
    }

    function highlightValidMoves(squareId) {
      clearHighlights();
      // Actual highlight done in chess_stonemu.js after getValidMoves()
    }

    function clearHighlights() {
      for (var s in squares) {
        squares[s].classList.remove("highlight");
      }
    }

    this.resize = function () {
      // CSS hallediyor
    };

    this.position = function (newPosition) {
      if (newPosition === undefined) return currentPosition;
      setPosition(newPosition);
    };

    this.orientation = function (newOrientation) {
      if (newOrientation === undefined) return config.orientation;
      config.orientation = newOrientation;
      drawBoard();
      setPosition(currentPosition);
    };

    this.clearHighlights = clearHighlights;
    this.highlightValidMoves = function(moves) {
      clearHighlights();
      moves.forEach(function(move) {
        if (squares[move.to]) squares[move.to].classList.add("highlight");
      });
    };
  }

  global.ChessBoard = ChessBoard;
})(window);
