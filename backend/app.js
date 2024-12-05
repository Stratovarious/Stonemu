"use strict";

const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const { Client } = require("pg");
require("dotenv").config();

const app = express();
const server = http.createServer(app);
const io = new Server(server);
const port = process.env.PORT || 3000;

// PostgreSQL veritabanı bağlantısı
const client = new Client({
  connectionString: process.env.DATABASE_URL, // Heroku Config Vars'dan alır
  ssl: {
    rejectUnauthorized: false,
  },
});

client.connect();

// Statik dosyaları sunmayacağız çünkü sadece API ve Socket.IO kullanılıyor

// Socket.IO bağlantı mantığı
let waitingPlayer = null;

io.on("connection", (socket) => {
  console.log("Yeni bir kullanıcı bağlandı");

  socket.on("joinGame", (data) => {
    if (waitingPlayer) {
      const player1 = waitingPlayer;
      const player2 = socket;

      let colorAssignment = ["white", "black"];
      player1.emit("assignColor", { color: colorAssignment[0] });
      player2.emit("assignColor", { color: colorAssignment[1] });

      player1.opponent = player2;
      player2.opponent = player1;

      waitingPlayer = null;
    } else {
      waitingPlayer = socket;
    }
  });

  socket.on("move", (move) => {
    if (socket.opponent) {
      socket.opponent.emit("move", move);
    }
  });

  socket.on("disconnect", () => {
    console.log("Bir kullanıcı ayrıldı");
    if (waitingPlayer === socket) {
      waitingPlayer = null;
    }
    if (socket.opponent) {
      socket.opponent.emit("opponentLeft");
      socket.opponent.opponent = null;
    }
  });
});

// Sunucuyu başlat
server.listen(port, () => {
  console.log(`Backend çalışıyor: http://localhost:${port}`);
});
