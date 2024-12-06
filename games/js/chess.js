// chess.js

(function (global) {
  "use strict";

  function Chess() {
    var board = [
      ["r", "n", "b", "q", "k", "b", "n", "r"],
      ["p", "p", "p", "p", "p", "p", "p", "p"],
      ["", "", "", "", "", "", "", ""],
      ["", "", "", "", "", "", "", ""],
      ["", "", "", "", "", "", "", ""],
      ["", "", "", "", "", "", "", ""],
      ["P", "P", "P", "P", "P", "P", "P", "P"],
      ["R", "N", "B", "Q", "K", "B", "N", "R"],
    ];

    var turn = "w";
    var moveHistory = [];

    this.fen = function () {
      var fen = "";
      for (var i = 0; i < 8; i++) {
        var empty = 0;
        for (var j = 0; j < 8; j++) {
          var piece = board[i][j];
          if (piece === "") {
            empty++;
          } else {
            if (empty > 0) {
              fen += empty;
              empty = 0;
            }
            fen += piece;
          }
        }
        if (empty > 0) {
          fen += empty;
        }
        if (i !== 7) {
          fen += "/";
        }
      }
      fen += " " + turn + " KQkq - 0 1";
      return fen;
    };

    this.turn = function () {
      return turn;
    };

    this.game_over = function () {
      // Basit bir kontrol, geliştirilebilir.
      return false;
    };

    this.move = function (move) {
      var from = move.from;
      var to = move.to;
      var promotion = move.promotion;

      var fromFile = from.charCodeAt(0) - "a".charCodeAt(0);
      var fromRank = 8 - parseInt(from.charAt(1));
      var toFile = to.charCodeAt(0) - "a".charCodeAt(0);
      var toRank = 8 - parseInt(to.charAt(1));

      var piece = board[fromRank][fromFile];
      if (!piece) return null;

      var validMoves = this.getValidMoves(from);
      var isValidMove = validMoves.some(function (m) {
        return m.to === to;
      });

      if (!isValidMove) return null;

      board[toRank][toFile] = promotion || piece;
      board[fromRank][fromFile] = "";
      moveHistory.push(move);

      turn = turn === "w" ? "b" : "w";
      return move;
    };

    this.getValidMoves = function (square) {
      var moves = [];
      var file = square.charCodeAt(0) - "a".charCodeAt(0);
      var rank = 8 - parseInt(square.charAt(1));
      var piece = board[rank][file];
      if (!piece) return moves;
      var color = piece === piece.toUpperCase() ? "w" : "b";
      if (color !== turn) return moves;
      var pieceType = piece.toLowerCase();

      switch (pieceType) {
        case "p":
          generatePawnMoves(rank, file, color, moves);
          break;
        case "n":
          generateKnightMoves(rank, file, color, moves);
          break;
        case "b":
          generateBishopMoves(rank, file, color, moves);
          break;
        case "r":
          generateRookMoves(rank, file, color, moves);
          break;
        case "q":
          generateQueenMoves(rank, file, color, moves);
          break;
        case "k":
          generateKingMoves(rank, file, color, moves);
          break;
      }

      return moves;
    };

    function generatePawnMoves(rank, file, color, moves) {
      var direction = color === "w" ? -1 : 1;
      var startRank = color === "w" ? 6 : 1;

      var forwardRank = rank + direction;
      if (forwardRank >= 0 && forwardRank <= 7) {
        if (board[forwardRank][file] === "") {
          addMove(rank, file, forwardRank, file, moves);
          if (rank === startRank && board[forwardRank + direction] && board[forwardRank + direction][file] === "") {
            addMove(rank, file, forwardRank + direction, file, moves);
          }
        }
      }

      var captures = [file - 1, file + 1];
      captures.forEach(function (newFile) {
        var newRank = forwardRank;
        if (newFile >= 0 && newFile <= 7 && newRank >= 0 && newRank <= 7) {
          var targetPiece = board[newRank][newFile];
          if (targetPiece !== "" && isOpponentPiece(targetPiece, color)) {
            addMove(rank, file, newRank, newFile, moves);
          }
        }
      });
    }

    function generateKnightMoves(rank, file, color, moves) {
      var movesOffset = [
        [-2, -1],
        [-2, 1],
        [-1, -2],
        [-1, 2],
        [1, -2],
        [1, 2],
        [2, -1],
        [2, 1],
      ];

      movesOffset.forEach(function (offset) {
        var newRank = rank + offset[0];
        var newFile = file + offset[1];
        if (isOnBoard(newRank, newFile)) {
          var targetPiece = board[newRank][newFile];
          if (targetPiece === "" || isOpponentPiece(targetPiece, color)) {
            addMove(rank, file, newRank, newFile, moves);
          }
        }
      });
    }

    function generateBishopMoves(rank, file, color, moves) {
      generateSlidingMoves(rank, file, color, moves, [
        [-1, -1],
        [-1, 1],
        [1, -1],
        [1, 1],
      ]);
    }

    function generateRookMoves(rank, file, color, moves) {
      generateSlidingMoves(rank, file, color, moves, [
        [-1, 0],
        [1, 0],
        [0, -1],
        [0, 1],
      ]);
    }

    function generateQueenMoves(rank, file, color, moves) {
      generateSlidingMoves(rank, file, color, moves, [
        [-1, -1],
        [-1, 1],
        [1, -1],
        [1, 1],
        [-1, 0],
        [1, 0],
        [0, -1],
        [0, 1],
      ]);
    }

    function generateKingMoves(rank, file, color, moves) {
      var movesOffset = [
        [-1, -1],
        [-1, 0],
        [-1, 1],
        [0, -1],
        [0, 1],
        [1, -1],
        [1, 0],
        [1, 1],
      ];

      movesOffset.forEach(function (offset) {
        var newRank = rank + offset[0];
        var newFile = file + offset[1];
        if (isOnBoard(newRank, newFile)) {
          var targetPiece = board[newRank][newFile];
          if (targetPiece === "" || isOpponentPiece(targetPiece, color)) {
            addMove(rank, file, newRank, newFile, moves);
          }
        }
      });
    }

    function generateSlidingMoves(rank, file, color, moves, directions) {
      directions.forEach(function (direction) {
        var newRank = rank;
        var newFile = file;

        while (true) {
          newRank += direction[0];
          newFile += direction[1];
          if (!isOnBoard(newRank, newFile)) break;
          var targetPiece = board[newRank][newFile];
          if (targetPiece === "") {
            addMove(rank, file, newRank, newFile, moves);
          } else {
            if (isOpponentPiece(targetPiece, color)) {
              addMove(rank, file, newRank, newFile, moves);
            }
            break;
          }
        }
      });
    }

    function addMove(fromRank, fromFile, toRank, toFile, moves) {
      var fromSquare = String.fromCharCode("a".charCodeAt(0) + fromFile) + (8 - fromRank);
      var toSquare = String.fromCharCode("a".charCodeAt(0) + toFile) + (8 - toRank);
      moves.push({ from: fromSquare, to: toSquare });
    }

    function isOnBoard(rank, file) {
      return rank >= 0 && rank <= 7 && file >= 0 && file <= 7;
    }

    function isOpponentPiece(piece, color) {
      var pieceColor = piece === piece.toUpperCase() ? "w" : "b";
      return pieceColor !== color;
    }

    this.validate_move = function (move) {
      var validMoves = this.getValidMoves(move.from);
      return validMoves.some(function (m) {
        return m.to === move.to;
      });
    };

    this.reset = function () {
      board = [
        ["r", "n", "b", "q", "k", "b", "n", "r"],
        ["p", "p", "p", "p", "p", "p", "p", "p"],
        ["", "", "", "", "", "", "", ""],
        ["", "", "", "", "", "", "", ""],
        ["", "", "", "", "", "", "", ""],
        ["", "", "", "", "", "", "", ""],
        ["P", "P", "P", "P", "P", "P", "P", "P"],
        ["R", "N", "B", "Q", "K", "B", "N", "R"],
      ];
      turn = "w";
      moveHistory = [];
    };
  }

  global.Chess = Chess;
})(window);
