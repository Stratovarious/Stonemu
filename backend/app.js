require('dotenv').config();
const express = require('express');
const { Client } = require('pg');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

const app = express();
const server = http.createServer(app);
const port = process.env.PORT || 3000;

// GitHub Pages URL'inizi ayarlayın
const allowedOrigin = 'https://stratovarious.github.io';

app.use(cors({
  origin: allowedOrigin,
  methods: ['GET', 'POST'],
  credentials: true,
}));

// PostgreSQL Veritabanı Bağlantısı
const client = new Client({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});
client.connect();

// Basit Chess mantığı server tarafında da bot için gerekiyor
const { createServerChess } = require('./chess_server_logic'); // Aşağıda tanımlayacağız

app.get('/', (req, res) => {
  res.send('Stonemu Backend Çalışıyor!');
});

const io = new Server(server, {
  cors: {
    origin: allowedOrigin,
    methods: ['GET', 'POST'],
    credentials: true,
  },
});

let waitingPlayer = null;
let games = {}; // Oyun durumlarını tutacağız: { playerId: { boardState, turn, ... } }

io.on('connection', (socket) => {
  console.log('Bir kullanıcı bağlandı:', socket.id);

  socket.on('joinGame', (data) => {
    socket.playerUsername = "User_" + socket.id; // Telegram username'i almanız gerekirse entegre edin
    socket.randomNumber = data.randomNumber;
    socket.hasMatched = false;

    // 30 sn içinde eşleşme yoksa bot devreye girecek
    socket.matchTimeout = setTimeout(() => {
      if (!socket.hasMatched) {
        // Bot ile eşleştir
        assignBot(socket);
      }
    }, 30000);

    if (waitingPlayer) {
      // Gerçek oyuncu bulundu
      let player1 = waitingPlayer;
      let player2 = socket;

      clearTimeout(player1.matchTimeout);
      clearTimeout(player2.matchTimeout);

      matchPlayers(player1, player2);
    } else {
      waitingPlayer = socket;
    }
  });

  socket.on('move', (move) => {
    if (socket.gameId && games[socket.gameId]) {
      let g = games[socket.gameId];
      if (g.turn === socket.color) {
        let result = g.chess.move(move);
        if (result) {
          g.turn = g.chess.turn();
          if (socket.opponent === 'bot') {
            // Bot hamlesi yap
            setTimeout(() => botMove(socket.gameId), 2000);
          } else {
            // Karşı oyuncuya ilet
            if (socket.opponent && socket.opponent.id) {
              io.to(socket.opponent.id).emit('move', move);
            }
          }

          if (g.chess.game_over()) {
            // Oyun bitti
            if (g.chess.turn() === socket.color) {
              // Sırası onda ama hamle yok -> kaybetti
              if (socket.opponent !== 'bot') {
                io.to(socket.opponent.id).emit("gameOver", { winner: socket.opponent.color });
                socket.emit("gameOver", { winner: socket.opponent.color });
              } else {
                socket.emit("gameOver", { winner: socket.opponentColor });
              }
            } else {
              // Rakip hamle yapamadı, sen kazandın
              if (socket.opponent !== 'bot') {
                io.to(socket.opponent.id).emit("gameOver", { winner: socket.color });
                socket.emit("gameOver", { winner: socket.color });
              } else {
                socket.emit("gameOver", { winner: socket.color });
              }
            }
          }
        }
      }
    }
  });

  socket.on('claimVictory', (data) => {
    let query = "UPDATE users SET points = points + 100 WHERE user_id = $1";
    client.query(query, [socket.id], (err) => {
      if (err) {
        console.error(err);
      }
    });
    // Puan eklendiğine dair bir mesaj gönderebilirsiniz
  });

  socket.on('botRequest', () => {
    if (!socket.hasMatched) {
      assignBot(socket);
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
});

function matchPlayers(player1, player2) {
  player1.hasMatched = true;
  player2.hasMatched = true;

  let player1Number = player1.randomNumber;
  let player2Number = player2.randomNumber;

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
  games[gameId] = {
    chess: createServerChess(),
    turn: 'w'
  };

  player1.gameId = gameId;
  player2.gameId = gameId;
}

function assignBot(socket) {
  socket.hasMatched = true;
  let playerNumber = socket.randomNumber;
  let botNumber = Math.floor(Math.random() * 1000);
  while (botNumber === playerNumber) {
    botNumber = Math.floor(Math.random() * 1000);
  }

  let colorAssignment = playerNumber > botNumber ? ["white", "black"] : ["black", "white"];
  socket.color = colorAssignment[0];

  socket.emit("assignColor", { color: socket.color });
  socket.opponent = 'bot'; // Bot sembolü
  let gameId = "game_" + socket.id + "_bot";
  games[gameId] = {
    chess: createServerChess(),
    turn: 'w'
  };
  socket.gameId = gameId;

  if (games[gameId].turn !== socket.color) {
    setTimeout(() => botMove(gameId), 2000);
  }
}

function botMove(gameId) {
  let g = games[gameId];
  if (!g) return;

  if (g.chess.game_over()) return;

  if (g.turn === 'w' || g.turn === 'b') {
    // Bot rengi = g.turn'un tersi
    // Hangisi insanın rengi?
    // assignBot'ta insan color = colorAssignment[0], bot = colorAssignment[1].
    // Gerek yok, biz direk turn'a bakıp move yapalım.
    // Bot turn ise hamle yap.

    // Tüm geçerli hamleleri al
    let moves = g.chess.getAllValidMovesForTurn();
    if (moves.length === 0) return;
    // Rastgele hamle seç
    let move = moves[Math.floor(Math.random() * moves.length)];
    let result = g.chess.move(move);
    if (result) {
      g.turn = g.chess.turn();
      // Kullanıcıya ilet
      // Oyunun insan oyuncusu kim?
      // gameId = game_socketId_bot
      let socketId = gameId.split('_')[1]; // 0: game, 1:socketId
      let playerSocket = Array.from(io.sockets.sockets.values()).find(s => s.id === socketId);
      if (playerSocket) {
        playerSocket.emit('move', move);
      }

      if (g.chess.game_over() && playerSocket) {
        // Oyun bitti
        if (g.chess.turn() === playerSocket.color) {
          // Oyuncu kaybetti
          playerSocket.emit("gameOver", { winner: (playerSocket.color === 'w' ? 'b' : 'w') });
        } else {
          // Oyuncu kazandı
          playerSocket.emit("gameOver", { winner: playerSocket.color });
        }
      } else {
        if (g.turn !== playerSocket.color) {
          setTimeout(() => botMove(gameId), 2000);
        }
      }
    }
  }
}

// Basit sunucu tarafı chess logic (bot için) - minimal
function createServerChess() {
  return new ServerChessLogic();
}

class ServerChessLogic {
  constructor() {
    this.board = [
      ["r", "n", "b", "q", "k", "b", "n", "r"],
      ["p", "p", "p", "p", "p", "p", "p", "p"],
      ["", "", "", "", "", "", "", ""],
      ["", "", "", "", "", "", "", ""],
      ["", "", "", "", "", "", "", ""],
      ["", "", "", "", "", "", "", ""],
      ["P", "P", "P", "P", "P", "P", "P", "P"],
      ["R", "N", "B", "Q", "K", "B", "N", "R"],
    ];
    this.turnColor = 'w';
  }

  turn() {
    return this.turnColor;
  }

  game_over() {
    // Sadelik adına sadece hamle yoksa bitti varsay
    return this.getAllValidMovesForTurn().length === 0;
  }

  move(m) {
    let fromFile = m.from.charCodeAt(0) - "a".charCodeAt(0);
    let fromRank = 8 - parseInt(m.from.charAt(1));
    let toFile = m.to.charCodeAt(0) - "a".charCodeAt(0);
    let toRank = 8 - parseInt(m.to.charAt(1));
    let piece = this.board[fromRank][fromFile];
    if (!piece) return null;
    let moves = this.getValidMoves(m.from);
    if (!moves.some(x => x.to === m.to)) return null;
    this.board[toRank][toFile] = piece;
    this.board[fromRank][fromFile] = "";
    this.turnColor = this.turnColor === 'w' ? 'b' : 'w';
    return m;
  }

  getAllValidMovesForTurn() {
    let moves = [];
    for (let r = 0; r < 8; r++) {
      for (let f = 0; f < 8; f++) {
        let piece = this.board[r][f];
        if (piece !== "") {
          let color = (piece === piece.toUpperCase()) ? 'w' : 'b';
          if (color === this.turnColor) {
            let fromSq = String.fromCharCode("a".charCodeAt(0)+f)+(8-r);
            moves.push(...this.getValidMoves(fromSq));
          }
        }
      }
    }
    return moves;
  }

  getValidMoves(square) {
    // Basit aynı logic clientte olduğu gibi. Burada kısaltmamak için tekrar yazmak uzun olacak.
    // Zaman kısıtlı. Kolayca kopyalayabiliriz. Aynı mantığı serverda da uyguluyoruz.
    // Aynı fonksiyonları server'a uyarlıyoruz:

    let moves = [];
    let file = square.charCodeAt(0)-"a".charCodeAt(0);
    let rank = 8 - parseInt(square.charAt(1));
    let piece = this.board[rank][file];
    if (!piece) return moves;
    let color = piece === piece.toUpperCase() ? 'w':'b';
    if (color !== this.turnColor) return moves;
    let pieceType = piece.toLowerCase();

    const isOnBoard = (r,f) => (r>=0 && r<=7 && f>=0 && f<=7);
    const isOpponentPiece = (p,col) => {
      let pc = p === p.toUpperCase() ? 'w':'b';
      return pc!==col;
    };
    const addMove = (fr,ff,tr,tf,moves) => {
      let fsq = String.fromCharCode("a".charCodeAt(0)+ff)+(8-fr);
      let tsq = String.fromCharCode("a".charCodeAt(0)+tf)+(8-tr);
      moves.push({from:fsq,to:tsq});
    };
    const generateSlidingMoves = (fr,ff,color,moves,dirs) => {
      dirs.forEach(dir=>{
        let nr = fr; let nf = ff;
        while(true) {
          nr+=dir[0]; nf+=dir[1];
          if(!isOnBoard(nr,nf)) break;
          let tp = this.board[nr][nf];
          if(tp==="") {
            addMove(fr,ff,nr,nf,moves);
          } else {
            if(isOpponentPiece(tp,color)) {
              addMove(fr,ff,nr,nf,moves);
            }
            break;
          }
        }
      });
    };

    switch(pieceType){
      case 'p': {
        let direction = color==='w'?-1:1;
        let startRank = color==='w'?6:1;
        let fRank = rank+direction;
        if(isOnBoard(fRank,file)){
          if(this.board[fRank][file]===""){
            addMove(rank,file,fRank,file,moves);
            if(rank===startRank && this.board[fRank+direction] && this.board[fRank+direction][file]==="")
              addMove(rank,file,fRank+direction,file,moves);
          }
        }
        [file-1,file+1].forEach(nf=>{
          let nr = fRank;
          if(isOnBoard(nr,nf)){
            let tp = this.board[nr][nf];
            if(tp!=="" && isOpponentPiece(tp,color)){
              addMove(rank,file,nr,nf,moves);
            }
          }
        });
      } break;
      case 'n': {
        let offsets = [[-2,-1],[-2,1],[-1,-2],[-1,2],[1,-2],[1,2],[2,-1],[2,1]];
        offsets.forEach(off=>{
          let nr=rank+off[0]; let nf=file+off[1];
          if(isOnBoard(nr,nf)){
            let tp=this.board[nr][nf];
            if(tp===""||isOpponentPiece(tp,color)){
              addMove(rank,file,nr,nf,moves);
            }
          }
        });
      } break;
      case 'b':
        generateSlidingMoves(rank,file,color,moves,[[ -1,-1],[-1,1],[1,-1],[1,1]]);
        break;
      case 'r':
        generateSlidingMoves(rank,file,color,moves,[[-1,0],[1,0],[0,-1],[0,1]]);
        break;
      case 'q':
        generateSlidingMoves(rank,file,color,moves,[[ -1,-1],[-1,1],[1,-1],[1,1],[-1,0],[1,0],[0,-1],[0,1]]);
        break;
      case 'k': {
        let movesOffset = [[-1,-1],[-1,0],[-1,1],[0,-1],[0,1],[1,-1],[1,0],[1,1]];
        movesOffset.forEach(off=>{
          let nr=rank+off[0]; let nf=file+off[1];
          if(isOnBoard(nr,nf)){
            let tp=this.board[nr][nf];
            if(tp===""||isOpponentPiece(tp,color)){
              addMove(rank,file,nr,nf,moves);
            }
          }
        });
      } break;
    }

    return moves;
  }
}
