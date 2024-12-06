require('dotenv').config();
const express = require('express');
const { Client } = require('pg');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

const app = express();
const server = http.createServer(app);
const port = process.env.PORT || 3000;

// GitHub Pages URL'iniz
const allowedOrigin = 'https://stratovarious.github.io/'; // Örnek

app.use(cors({
  origin: allowedOrigin,
  methods: ['GET', 'POST'],
  credentials: true,
}));

const client = new Client({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});
client.connect();

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

io.on('connection', (socket) => {
  console.log('Bir kullanıcı bağlandı:', socket.id);

  socket.on('joinGame', (data) => {
    if (waitingPlayer) {
      let player1 = waitingPlayer;
      let player2 = socket;

      let player1Number = player1.randomNumber;
      let player2Number = data.randomNumber;

      while (player1Number === player2Number) {
        player1Number = Math.floor(Math.random() * 1000);
        player2Number = Math.floor(Math.random() * 1000);
      }

      let colorAssignment = player1Number > player2Number ? ["white", "black"] : ["black", "white"];
      player1.emit("assignColor", { color: colorAssignment[0] });
      player2.emit("assignColor", { color: colorAssignment[1] });

      player1.opponent = player2;
      player2.opponent = player1;

      waitingPlayer = null;
    } else {
      waitingPlayer = socket;
      socket.randomNumber = data.randomNumber;
    }
  });

  socket.on('move', (move) => {
    if (socket.opponent) {
      socket.opponent.emit('move', move);
    }
  });

  socket.on('claimVictory', (data) => {
    let query = "UPDATE users SET points = points + 100 WHERE user_id = $1";
    client.query(query, [socket.id], (err) => {
      if (err) {
        console.error(err);
      }
    });
  });

  socket.on('disconnect', () => {
    console.log('Bir kullanıcı ayrıldı:', socket.id);
    if (waitingPlayer === socket) {
      waitingPlayer = null;
    }
    if (socket.opponent) {
      socket.opponent.emit("opponentLeft");
      socket.opponent.opponent = null;
    }
  });
});

server.listen(port, () => {
  console.log('Sunucu çalışıyor: ' + port);
});
