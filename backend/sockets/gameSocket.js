// sockets/gameSocket.js

const db = require('../models');
const userService = require('../services/userService');
const gameService = require('../services/gameService');
const cheatService = require('../services/cheatService');

// Sunucu Tarafı Satranç Mantığı Sınıfı
const ServerChessLogic = require('../services/serverChessLogic'); // Ayrı bir servis olarak taşınabilir

let waitingPlayer = null;
let games = {};

module.exports = (io, socket) => {
  // Kullanıcıyı kaydet
  socket.on('register', async (data) => {
    const { user_id } = data;
    socket.user_id = String(user_id); // user_id'yi string'e dönüştür
    console.log(`Socket ${socket.id} için user_id: ${socket.user_id}`);
  });

  socket.hasMatched = false;
  socket.isBotGame = false;

  // Oyun bekleyen var mı kontrol et
  if (waitingPlayer && waitingPlayer !== socket) {
    matchPlayers(waitingPlayer, socket, io, games);
    waitingPlayer = null;
  } else {
    waitingPlayer = socket;
    socket.matchTimeout = setTimeout(() => {
      if (!socket.hasMatched && !socket.isBotGame) {
        assignBot(socket, io, games);
      }
    }, 30000);
  }

  socket.on('move', async (move) => {
    if (socket.gameId && games[socket.gameId]) {
      let g = games[socket.gameId];
      if (g.chess.turn() === (socket.color === 'white' ? 'w' : 'b')) {
        let result = g.chess.move(move);
        if (result) {
          // Puan hesaplama
          if (g.chess.game_over()) {
            // Oyuncu kazandı
            if ((result.color === 'w' && socket.color === 'white') ||
                (result.color === 'b' && socket.color === 'black')) {
              const pointsEarned = 100; // Örnek puan
              await db.Game.create({
                user_id: socket.user_id,
                game_type: 'chess',
                points_earned: pointsEarned,
                claimed: false,
              });
              socket.emit("gameOver", { winner: socket.color });
              // Güncellenmiş puanları gönder
              socket.emit('updatePoints', { points: socket.points + pointsEarned });
            }
          }

          if (socket.opponent === 'bot') {
            setTimeout(() => botMove(socket.gameId, io, games), 2000);
          } else {
            if (socket.opponent && socket.opponent.id) {
              io.to(socket.opponent.id).emit('move', move);
            }
          }
          if (g.chess.game_over()) {
            endGame(socket, g, io, games);
          }
        }
      }
    }
  });

  socket.on('claimVictory', async (data) => {
    try {
      const user = await db.User.findByPk(String(socket.user_id));
      if (!user) {
        return;
      }

      user.points += 100; // Örnek puan
      await user.save();

      // Oyun kaydını güncelle
      const game = await db.Game.findOne({
        where: {
          user_id: String(socket.user_id),
          game_type: 'chess',
          claimed: false,
        },
      });

      if (game) {
        game.claimed = true;
        await game.save();
      }

      socket.emit('pointsUpdated', { points: user.points });
    } catch (error) {
      console.error(error);
    }
  });

  socket.on('botRequest', () => {
    if (!socket.hasMatched && !socket.isBotGame) {
      assignBot(socket, io, games);
    }
  });

  socket.on('disconnect', () => {
    console.log('Bir kullanıcı ayrıldı:', socket.id);
    if (waitingPlayer === socket) {
      waitingPlayer = null;
    }

    if (socket.opponent && socket.opponent !== 'bot') {
      io.to(socket.opponent.id).emit("opponentLeft");
      socket.opponent.opponent = null;
    }
  });
};

// Oyuncuları Eşleştirme Fonksiyonu
function matchPlayers(player1, player2, io, games) {
  player1.hasMatched = true;
  player2.hasMatched = true;

  // Rastgele sayılar üret
  let player1Number = Math.floor(Math.random() * 1000);
  let player2Number = Math.floor(Math.random() * 1000);
  while (player1Number === player2Number) {
    player1Number = Math.floor(Math.random() * 1000);
    player2Number = Math.floor(Math.random() * 1000);
  }

  let colorAssignment = player1Number > player2Number ? ["white", "black"] : ["black", "white"];

  player1.color = colorAssignment[0];
  player2.color = colorAssignment[1];

  player1.emit("assignColor", { color: player1.color });
  player2.emit("assignColor", { color: player2.color });

  player1.opponent = player2;
  player2.opponent = player1;

  let gameId = "game_" + player1.id + "_" + player2.id;
  games[gameId] = { chess: new ServerChessLogic() };

  player1.gameId = gameId;
  player2.gameId = gameId;
}

// Bot Atama Fonksiyonu
function assignBot(socket, io, games) {
  socket.hasMatched = true;
  socket.isBotGame = true;

  let playerNumber = Math.floor(Math.random() * 1000);
  let botNumber = Math.floor(Math.random() * 1000);
  while (botNumber === playerNumber) {
    botNumber = Math.floor(Math.random() * 1000);
  }

  let colorAssignment = playerNumber > botNumber ? ["white", "black"] : ["black", "white"];
  socket.color = colorAssignment[0];
  socket.emit("assignColor", { color: socket.color });
  socket.opponent = 'bot';

  let gameId = "game_" + socket.id + "_bot";
  games[gameId] = { chess: new ServerChessLogic() };
  socket.gameId = gameId;

  if (games[gameId].chess.turn() !== socket.color[0].toLowerCase()) {
    setTimeout(() => botMove(gameId, io, games), 2000);
  }
}

// Bot Hamle Fonksiyonu
function botMove(gameId, io, games) {
  let g = games[gameId];
  if (!g) return;
  if (g.chess.game_over()) return;
  let moves = g.chess.getAllValidMovesForTurn();
  if (moves.length === 0) return;

  // Basit bir değerlendirme fonksiyonu: En fazla taş yakalama
  let bestMove = null;
  let maxCaptures = -1;

  for (let move of moves) {
    let tempChess = new ServerChessLogic();
    tempChess.loadFen(g.chess.fen());
    let result = tempChess.move(move);
    if (result && result.captured) {
      if (maxCaptures < 1) {
        maxCaptures = 1;
        bestMove = move;
      }
    }
  }

  // Eğer herhangi bir taş yakalama hamlesi yoksa rastgele hamle seç
  if (!bestMove) {
    bestMove = moves[Math.floor(Math.random() * moves.length)];
  }

  let result = g.chess.move(bestMove);
  if (result) {
    let playerSocketId = gameId.split('_')[1];
    let playerSocket = io.sockets.sockets.get(playerSocketId);
    if (playerSocket) {
      playerSocket.emit('move', bestMove);
    }
    if (g.chess.game_over()) {
      endGame(playerSocket, g, io, games);
    } else {
      if (playerSocket && g.chess.turn() !== playerSocket.color[0].toLowerCase()) {
        setTimeout(() => botMove(gameId, io, games), 2000);
      }
    }
  }
}

// Oyun Sonlandırma Fonksiyonu
function endGame(socket, g, io, games) {
  let moves = g.chess.getAllValidMovesForTurn();
  if (moves.length > 0) return; // Oyun bitmedi
  let color = g.chess.turn();
  let inCheck = g.chess.inCheck(color);
  let loserColor = inCheck ? color : null;
  let winnerColor = loserColor ? (loserColor === 'w' ? 'b' : 'w') : null;

  if (inCheck) {
    // Checkmate
    if (socket.color === (winnerColor === 'w' ? 'white' : 'black')) {
      socket.emit("gameOver", { winner: socket.color });
      if (socket.opponent !== 'bot' && socket.opponent) {
        socket.opponent.emit("gameOver", { winner: socket.color });
      }
    }
  } else {
    // Stalemate
    socket.emit("gameOver", { winner: null });
    if (socket.opponent !== 'bot' && socket.opponent) {
      socket.opponent.emit("gameOver", { winner: null });
    }
  }
}
