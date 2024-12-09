// app.js

require('dotenv').config();
const express = require('express');
const { Sequelize, Op } = require('sequelize');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const rateLimit = require('express-rate-limit');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: 'https://stratovarious.github.io', // İzin verilen origin
    methods: ['GET', 'POST'],
    credentials: true,
  },
});
const port = process.env.PORT || 3000;

// Güvenilir Proxy Ayarı (Heroku için gerekli)
app.set('trust proxy', 1);

// Rate Limiting (İstek Sınırlandırma)
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 dakika
  max: 100, // Her IP için maksimum 100 istek
  message: 'Çok fazla istek gönderildi, lütfen daha sonra tekrar deneyin.',
});

app.use('/api/', apiLimiter);

// CORS Yapılandırması
app.use(cors({
  origin: 'https://stratovarious.github.io', // İzin verilen origin
  methods: ['GET', 'POST'],
  credentials: true,
}));

// JSON Body Parsing (Express 4.16+)
app.use(express.json());

// Veritabanı Bağlantısı ve ORM
const db = require('./models');

db.sequelize.authenticate()
  .then(() => {
    console.log('Veritabanına başarıyla bağlanıldı.');
  })
  .catch(err => {
    console.error('Veritabanı bağlantı hatası:', err);
  });

db.sequelize.sync()
  .then(() => {
    console.log('Veritabanı senkronize edildi.');
  })
  .catch(err => {
    console.error('Veritabanı senkronizasyon hatası:', err);
  });

// Middleware: Kullanıcı Ban Kontrolü
const checkIfBanned = async (req, res, next) => {
  try {
    const { user_id } = req.params;
    const userIdStr = String(user_id); // user_id'yi string'e dönüştür
    
    const user = await db.User.findByPk(userIdStr);
    if (user && user.is_banned) {
      return res.status(403).json({ error: 'Hesabınız banlanmıştır.' });
    }
    next();
  } catch (error) {
    console.error("Ban kontrolü sırasında hata:", error);
    res.status(500).json({ error: 'Sunucu hatası.' });
  }
};

// Middleware'i Uygula
app.use('/api/users/:user_id/*', checkIfBanned);

// Ana Route
app.get('/', (req, res) => {
  res.send('Stonemu Backend Çalışıyor!');
});

// API Endpoint'leri

// 1. Kullanıcı Kaydı/Güncelleme
app.post('/api/users', async (req, res) => {
  try {
    const { user_id, username } = req.body;
    console.log("Received POST /api/users with data:", req.body);

    if (typeof user_id !== 'string' || user_id.trim() === '') {
      console.error("Geçersiz veya eksik user_id.");
      return res.status(400).json({ error: 'Geçersiz veya eksik user_id.' });
    }

    const userIdStr = String(user_id);

    const [user, created] = await db.User.findOrCreate({
      where: { user_id: userIdStr },
      defaults: { username },
    });

    if (created) {
      console.log(`Yeni kullanıcı oluşturuldu: ${userIdStr} - ${username}`);
    } else {
      console.log(`Kullanıcı güncellendi: ${userIdStr} - ${username}`);
      user.username = username || user.username;
      await user.save();
      console.log(`Kullanıcı kaydedildi: ${userIdStr} - ${user.username}`);
    }

    res.json(user);
  } catch (error) {
    console.error("POST /api/users hata:", error);
    res.status(500).json({ error: 'Sunucu hatası.' });
  }
});

// 2. Kullanıcının Puanlarını ve 'a' Değerini Almak
app.get('/api/users/:user_id/points', async (req, res) => {
  try {
    const { user_id } = req.params;
    const userIdStr = String(user_id); // user_id'yi string'e dönüştür

    const user = await db.User.findByPk(userIdStr);
    if (!user) {
      return res.status(404).json({ error: 'Kullanıcı bulunamadı.' });
    }

    // Geçen süreyi hesapla
    const now = Date.now();
    const lastUpdate = new Date(user.last_a_update).getTime();
    const elapsedSeconds = Math.floor((now - lastUpdate) / 1000);
    const dolumHizi = user.dolum_hizi || 10;
    const aIncrement = Math.floor(elapsedSeconds / dolumHizi);
    if (aIncrement > 0) {
      user.a += aIncrement;
      if (user.a > user.b) user.a = user.b;
      user.last_a_update = new Date(lastUpdate + aIncrement * dolumHizi * 1000);
      await user.save();
    }

    res.json({ 
      points: user.points, 
      a: user.a, 
      b: user.b, 
      dolum_hizi: user.dolum_hizi, 
      tiklama_hakki: user.tiklama_hakki 
    });
  } catch (error) {
    console.error("GET /api/users/:user_id/points hata:", error);
    res.status(500).json({ error: 'Sunucu hatası.' });
  }
});

// 3. Kullanıcının Puanlarını ve 'a' Değerini Güncellemek
app.post('/api/users/:user_id/points', async (req, res) => {
  try {
    const { user_id } = req.params;
    const { points, a } = req.body;
    const userIdStr = String(user_id); // user_id'yi string'e dönüştür

    const user = await db.User.findByPk(userIdStr);
    if (!user) {
      return res.status(404).json({ error: 'Kullanıcı bulunamadı.' });
    }

    if (typeof points === 'number') {
      user.points += points;
    }

    if (typeof a === 'number') {
      user.a = a;
    }

    await user.save();

    res.json({ points: user.points, a: user.a });
  } catch (error) {
    console.error("POST /api/users/:user_id/points hata:", error);
    res.status(500).json({ error: 'Sunucu hatası.' });
  }
});

// 4. Hile Algılama Eklemek
app.post('/api/users/:user_id/cheats', async (req, res) => {
  try {
    const { user_id } = req.params;
    const { cheat_type } = req.body;
    const userIdStr = String(user_id); // user_id'yi string'e dönüştür

    if (!cheat_type) {
      return res.status(400).json({ error: 'cheat_type gerekli.' });
    }

    const user = await db.User.findByPk(userIdStr);
    if (!user) {
      return res.status(404).json({ error: 'Kullanıcı bulunamadı.' });
    }

    const cheat = await db.Cheat.create({
      user_id: userIdStr,
      cheat_type,
    });

    // Kullanıcının hile sayısını güncelle
    user.cheat_count += 1;

    // Hile sayısına göre uyarı veya ban
    if (user.cheat_count >= 3) {
      user.is_banned = true;
    }

    await user.save();

    // Uyarı oluştur
    const warningMessage = user.is_banned
      ? "Hile yaptığınız tespit edildi, hesabınız banlanmıştır."
      : "Hile yaptığınız tespit edildi, lütfen tekrarlamayınız. Tekrarlamanız durumunda hesabınız kapatılacaktır.";

    await db.Warning.create({
      user_id: userIdStr,
      message: warningMessage,
    });

    // WebSocket üzerinden kullanıcıya bildirim gönder
    notifyUserOfCheat(userIdStr, warningMessage);

    res.json({ message: 'Hile tespit edildi.', is_banned: user.is_banned });
  } catch (error) {
    console.error("POST /api/users/:user_id/cheats hata:", error);
    res.status(500).json({ error: 'Sunucu hatası.' });
  }
});

// 5. Kullanıcının Banlı Olup Olmadığını Kontrol Etmek
app.get('/api/users/:user_id/is_banned', async (req, res) => {
  try {
    const { user_id } = req.params;
    const userIdStr = String(user_id); // user_id'yi string'e dönüştür

    const user = await db.User.findByPk(userIdStr);
    if (!user) {
      return res.status(404).json({ error: 'Kullanıcı bulunamadı.' });
    }
    res.json({ is_banned: user.is_banned });
  } catch (error) {
    console.error("GET /api/users/:user_id/is_banned hata:", error);
    res.status(500).json({ error: 'Sunucu hatası.' });
  }
});

// 6. Tıklama Verilerini ve Hile Algılamasını İşlemek
app.post('/api/users/:user_id/clicks', async (req, res) => {
  try {
    const { user_id } = req.params;
    const { click_timestamps, click_positions } = req.body;
    const userIdStr = String(user_id); // user_id'yi string'e dönüştür

    if (!Array.isArray(click_timestamps)) {
      return res.status(400).json({ error: 'Geçersiz veri formatı.' });
    }

    // Hile algılama kuralları:
    // 1. 3 dakikada 1000'den fazla tıklama
    // 2. 3 saatte sürekli tıklama
    // 3. Aynı pozisyona tekrarlayan tıklamalar

    const user = await db.User.findByPk(userIdStr);
    if (!user) {
      return res.status(404).json({ error: 'Kullanıcı bulunamadı.' });
    }

    // 1. 3 dakikada 1000'den fazla tıklama
    const threeMinutesAgo = Date.now() - (3 * 60 * 1000);
    const recentClicks = click_timestamps.filter(ts => ts >= threeMinutesAgo);
    if (recentClicks.length > 1000) {
      await handleCheatDetection(user, 'rapid_clicks');
      return res.status(200).json({ message: 'Hile tespit edildi.', is_banned: user.is_banned });
    }

    // 2. 3 saatte sürekli tıklama
    const threeHoursAgo = Date.now() - (3 * 60 * 60 * 1000);
    const clicksInThreeHours = click_timestamps.filter(ts => ts >= threeHoursAgo);
    if (clicksInThreeHours.length > (3 * 60 * 60 * 1000) / 10) { // Örnek: her 10ms'de bir tıklama
      await handleCheatDetection(user, 'continuous_clicking');
      return res.status(200).json({ message: 'Hile tespit edildi.', is_banned: user.is_banned });
    }

    // 3. Aynı pozisyona tekrarlayan tıklamalar
    if (click_positions && click_positions.length > 0) {
      const uniquePositions = new Set(click_positions);
      if (uniquePositions.size === 1 && click_positions.length > 100) {
        await handleCheatDetection(user, 'same_position_clicks');
        return res.status(200).json({ message: 'Hile tespit edildi.', is_banned: user.is_banned });
      }
    }

    // Hile algılanmadı, puanları güncelle
    const tiklamaHakki = user.tiklama_hakki || 1;
    const totalPointsToAdd = tiklamaHakki * click_timestamps.length;

    user.points += totalPointsToAdd;
    user.a -= click_timestamps.length;
    
    if (user.a < 0) user.a = 0;
    await user.save();
    res.json({ message: 'Tıklama verileri işlendi.', points: user.points, a: user.a });
  } catch (error) {
    console.error("POST /api/users/:user_id/clicks hata:", error);
    res.status(500).json({ error: 'Sunucu hatası.' });
  }
});

// Yardımcı Fonksiyon: Hile Algılama
const handleCheatDetection = async (user, cheatType) => {
  try {
    await db.Cheat.create({
      user_id: user.user_id,
      cheat_type: cheatType,
    });

    user.cheat_count += 1;

    if (user.cheat_count >= 3) {
      user.is_banned = true;
    }

    await user.save();

    // Uyarı oluştur
    const warningMessage = user.is_banned
      ? "Hile yaptığınız tespit edildi, hesabınız banlanmıştır."
      : "Hile yaptığınız tespit edildi, lütfen tekrarlamayınız. Tekrarlamanız durumunda hesabınız kapatılacaktır.";

    await db.Warning.create({
      user_id: user.user_id,
      message: warningMessage,
    });

    // WebSocket üzerinden kullanıcıya bildirim gönder
    notifyUserOfCheat(user.user_id, warningMessage);
  } catch (error) {
    console.error('Cheat Detection Error:', error);
  }
};

// Yardımcı Fonksiyon: WebSocket ile Kullanıcıya Bildirim Göndermek
function notifyUserOfCheat(user_id, message) {
  for (let [id, socket] of io.sockets.sockets) {
    if (socket.user_id === user_id) {
      socket.emit('cheatDetected', { message });
      break;
    }
  }
}

// Sunucu Tarafı Satranç Mantığı Sınıfı
// Comprehensive Server-Side Chess Logic Class
class ServerChessLogic {
  constructor() {
    this.history = [];
    this.loadFen("rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1");
  }

  reset() {
    this.loadFen("rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1");
    this.history = [];
  }

  loadFen(fen) {
    let parts = fen.split(' ');
    let position = parts[0];
    this.activeColor = parts[1];
    this.castlingRights = parts[2];
    this.enPassantTarget = parts[3] === '-' ? null : parts[3];
    this.halfmoveClock = parseInt(parts[4], 10);
    this.fullmoveNumber = parseInt(parts[5], 10);

    this.board = [];
    let rows = position.split('/');
    for (let i = 0; i < 8; i++) {
      let row = rows[i].split('');
      let boardRow = [];
      for (let j = 0; j < row.length; j++) {
        let c = row[j];
        if (/[1-8]/.test(c)) {
          let emptyCount = parseInt(c, 10);
          for (let k = 0; k < emptyCount; k++) boardRow.push("");
        } else {
          boardRow.push(c);
        }
      }
      this.board.push(boardRow);
    }
  }

  fen() {
    let fenRows = [];
    for (let i = 0; i < 8; i++) {
      let empty = 0;
      let rowFen = "";
      for (let j = 0; j < 8; j++) {
        let piece = this.board[i][j];
        if (piece === "") {
          empty++;
        } else {
          if (empty > 0) {
            rowFen += empty;
            empty = 0;
          }
          rowFen += piece;
        }
      }
      if (empty > 0) rowFen += empty;
      fenRows.push(rowFen);
    }
    let fenPos = fenRows.join('/');
    let ep = this.enPassantTarget ? this.enPassantTarget : '-';
    return fenPos + " " + this.activeColor + " " + this.castlingRights + " " + ep + " " + this.halfmoveClock + " " + this.fullmoveNumber;
  }

  turn() {
    return this.activeColor;
  }

  game_over() {
    let moves = this.getAllValidMovesForTurn();
    if (moves.length > 0) return false;
    // No moves left, checkmate or stalemate
    if (this.inCheck(this.activeColor)) {
      return true; // Checkmate
    } else {
      return true; // Stalemate
    }
  }

  move(m) {
    // Current turn color
    let moves = this.getAllValidMovesForTurn();
    let chosen = moves.find(M => M.from === m.from && M.to === m.to);
    if (!chosen) return null;

    this.makeMove(chosen);
    return m;
  }

  getAllValidMovesForTurn() {
    // Generate all moves and filter out illegal ones
    let moves = this.generateMoves(this.activeColor);
    let legal = [];
    for (let mv of moves) {
      this.makeMove(mv);
      if (!this.inCheck(this.activeColor === 'w' ? 'b' : 'w')) {
        legal.push(mv);
      }
      this.undoMove();
    }
    return legal;
  }

  getValidMoves(square) {
    // Get moves from a specific square
    let all = this.getAllValidMovesForTurn();
    return all.filter(m => m.from === square);
  }

  isOnBoard(r, f) { return r >= 0 && r < 8 && f >= 0 && f < 8; }

  pieceAt(r, f) { return this.board[r][f]; }

  colorOf(piece) {
    if (piece === "") return null;
    return piece === piece.toUpperCase() ? 'w' : 'b';
  }

  inCheck(color) {
    // Find king position
    let kingPos = this.findKing(color);
    if (!kingPos) return false;
    return this.squareAttackedBy(kingPos.r, kingPos.f, color === 'w' ? 'b' : 'w');
  }

  findKing(color) {
    for (let r = 0; r < 8; r++) {
      for (let f = 0; f < 8; f++) {
        let p = this.board[r][f];
        if (p !== "") {
          let c = this.colorOf(p);
          if (c === color && p.toLowerCase() === 'k') return { r, f };
        }
      }
    }
    return null;
  }

  squareAttackedBy(r, f, attColor) {
    // Check if square (r,f) is attacked by attColor
    for (let rr = 0; rr < 8; rr++) {
      for (let ff = 0; ff < 8; ff++) {
        let p = this.board[rr][ff];
        if (p !== "" && this.colorOf(p) === attColor) {
          let moves = this.pseudoMoves(rr, ff, p);
          if (moves.some(m => m.tr === r && m.tf === f)) return true;
        }
      }
    }
    return false;
  }

  pseudoMoves(r, f, piece) {
    // Generate pseudo moves for a piece
    let color = this.colorOf(piece);
    let mvs = [];
    const add = (tr, tf) => {
      mvs.push({ from: this.coordsToSquare(r, f), to: this.coordsToSquare(tr, tf) });
    };

    const isOpp = (tr, tf) => (this.isOnBoard(tr, tf) && this.pieceAt(tr, tf) !== "" && this.colorOf(this.pieceAt(tr, tf)) !== color);
    const isEmpty = (tr, tf) => (this.isOnBoard(tr, tf) && this.pieceAt(tr, tf) === "");

    let pieceType = piece.toLowerCase();
    if (pieceType === 'p') {
      let dir = color === 'w' ? -1 : 1;
      let startRank = color === 'w' ? 6 : 1;
      let fr = r + dir;
      if (this.isOnBoard(fr, f) && this.pieceAt(fr, f) === "") add(fr, f);
      if (r === startRank && this.isOnBoard(fr + dir, f) && this.pieceAt(fr + dir, f) === "" && this.pieceAt(fr, f) === "") add(fr + dir, f);
      [f - 1, f + 1].forEach(tf => {
        if (this.isOnBoard(fr, tf)) {
          let tP = this.pieceAt(fr, tf);
          if (tP !== "" && this.colorOf(tP) !== color) add(fr, tf);
          // en passant
          if (this.enPassantTarget && this.squareToCoords(this.enPassantTarget).r === fr && this.squareToCoords(this.enPassantTarget).f === tf) {
            add(fr, tf);
          }
        }
      });
    }
    else if (pieceType === 'n') {
      let offs = [[-2, -1], [-2, 1], [-1, -2], [-1, 2], [1, -2], [1, 2], [2, -1], [2, 1]];
      for (let off of offs) {
        let tr = r + off[0], tf = f + off[1];
        if (this.isOnBoard(tr, tf)) {
          let tp = this.pieceAt(tr, tf);
          if (tp === "" || this.colorOf(tp) !== color) add(tr, tf);
        }
      }
    }
    else if (pieceType === 'b') {
      this.addSliding(r, f, color, mvs, [[-1, -1], [-1, 1], [1, -1], [1, 1]]);
    }
    else if (pieceType === 'r') {
      this.addSliding(r, f, color, mvs, [[-1, 0], [1, 0], [0, -1], [0, 1]]);
    }
    else if (pieceType === 'q') {
      this.addSliding(r, f, color, mvs, [[-1, -1], [-1, 1], [1, -1], [1, 1], [-1, 0], [1, 0], [0, -1], [0, 1]]);
    }
    else if (pieceType === 'k') {
      let kingOff = [[-1, -1], [-1, 0], [-1, 1], [0, -1], [0, 1], [1, -1], [1, 0], [1, 1]];
      for (let off of kingOff) {
        let tr = r + off[0], tf = f + off[1];
        if (this.isOnBoard(tr, tf)) {
          let tp = this.pieceAt(tr, tf);
          if (tp === "" || this.colorOf(tp) !== color) add(tr, tf);
        }
      }
      // Castling
      // Castling rights fen: KQkq
      let canCastleKing = (color === 'w' ? this.castlingRights.includes('K') : this.castlingRights.includes('k'));
      let canCastleQueen = (color === 'w' ? this.castlingRights.includes('Q') : this.castlingRights.includes('q'));
      let rank = color === 'w' ? 7 : 0;
      if (r === rank && f === 4) {
        // Short castling
        if (canCastleKing && this.pieceAt(rank, 5) === "" && this.pieceAt(rank, 6) === ""
          && !this.squareAttackedBy(rank, 4, this.opColor(color))
          && !this.squareAttackedBy(rank, 5, this.opColor(color))
          && !this.squareAttackedBy(rank, 6, this.opColor(color))) {
          add(rank, 6);
        }
        // Long castling
        if (canCastleQueen && this.pieceAt(rank, 3) === "" && this.pieceAt(rank, 2) === "" && this.pieceAt(rank, 1) === ""
          && !this.squareAttackedBy(rank, 4, this.opColor(color))
          && !this.squareAttackedBy(rank, 3, this.opColor(color))
          && !this.squareAttackedBy(rank, 2, this.opColor(color))) {
          add(rank, 2);
        }
      }
    }

    return mvs;
  }

  opColor(c) { return c === 'w' ? 'b' : 'w'; }

  addSliding(r, f, color, mvs, dirs) {
    for (let d of dirs) {
      let nr = r, nf = f;
      while (true) {
        nr += d[0]; nf += d[1];
        if (!this.isOnBoard(nr, nf)) break;
        let tp = this.pieceAt(nr, nf);
        if (tp === "") {
          mvs.push({ from: this.coordsToSquare(r, f), to: this.coordsToSquare(nr, nf) });
        } else {
          if (this.colorOf(tp) !== color) mvs.push({ from: this.coordsToSquare(r, f), to: this.coordsToSquare(nr, nf) });
          break;
        }
      }
    }
  }

  generateMoves(color) {
    // Generate all pseudo moves
    let moves = [];
    for (let r = 0; r < 8; r++) {
      for (let f = 0; f < 8; f++) {
        let p = this.board[r][f];
        if (p !== "" && this.colorOf(p) === color) {
          let pmoves = this.pseudoMoves(r, f, p);
          // Handle promotion
          pmoves.forEach(mv => {
            const toRank = parseInt(mv.to.charAt(1));
            if (p.toLowerCase() === 'p' && (toRank === 1 || toRank === 8)) {
              moves.push({ from: mv.from, to: mv.to, promotion: 'q' }); // Auto promote to queen
            } else {
              moves.push({ from: mv.from, to: mv.to });
            }
          });
        }
      }
    }
    return moves;
  }

  coordsToSquare(r, f) {
    return String.fromCharCode("a".charCodeAt(0) + f) + (8 - r);
  }

  squareToCoords(sq) {
    let f = sq.charCodeAt(0) - "a".charCodeAt(0);
    let r = 8 - parseInt(sq.charAt(1));
    return { r, f };
  }

  makeMove(m) {
    this.history = this.history || [];
    let state = {
      board: this.board.map(row => row.slice()),
      activeColor: this.activeColor,
      castlingRights: this.castlingRights,
      enPassantTarget: this.enPassantTarget,
      halfmoveClock: this.halfmoveClock,
      fullmoveNumber: this.fullmoveNumber
    };
    this.history.push(state);

    let from = this.squareToCoords(m.from);
    let to = this.squareToCoords(m.to);
    let piece = this.board[from.r][from.f];
    let target = this.board[to.r][to.f];
    let color = this.colorOf(piece);

    // Update halfmove clock
    if (piece.toLowerCase() === 'p' || target !== "") {
      this.halfmoveClock = 0;
    } else {
      this.halfmoveClock++;
    }

    // Move piece
    this.board[to.r][to.f] = m.promotion || piece;
    this.board[from.r][from.f] = "";

    // En passant
    if (piece.toLowerCase() === 'p') {
      if (Math.abs(to.r - from.r) === 2) {
        // Double push
        this.enPassantTarget = String.fromCharCode("a".charCodeAt(0) + from.f) + (8 - ((from.r + to.r) / 2));
      } else {
        if (this.enPassantTarget && to.f === this.squareToCoords(this.enPassantTarget).f && to.r === this.squareToCoords(this.enPassantTarget).r) {
          // En passant capture
          let dir = color === 'w' ? 1 : -1;
          this.board[to.r + dir][to.f] = "";
        }
        this.enPassantTarget = null;
      }
    } else {
      this.enPassantTarget = null;
    }

    // Castling
    if (piece.toLowerCase() === 'k') {
      let rank = color === 'w' ? 7 : 0;
      if (from.f === 4 && to.f === 6 && from.r === rank && to.r === rank) {
        // Short castling
        this.board[rank][5] = this.board[rank][7];
        this.board[rank][7] = "";
      }
      if (from.f === 4 && to.f === 2 && from.r === rank && to.r === rank) {
        // Long castling
        this.board[rank][3] = this.board[rank][0];
        this.board[rank][0] = "";
      }
      // Remove castling rights
      if (color === 'w') {
        this.castlingRights = this.castlingRights.replace('K', '').replace('Q', '');
      } else {
        this.castlingRights = this.castlingRights.replace('k', '').replace('q', '');
      }
    }

    // Rook moved
    if (piece.toLowerCase() === 'r') {
      let rank = color === 'w' ? 7 : 0;
      if (from.r === rank && from.f === 0) {
        // a rook
        if (color === 'w') this.castlingRights = this.castlingRights.replace('Q', '');
        else this.castlingRights = this.castlingRights.replace('q', '');
      }
      if (from.r === rank && from.f === 7) {
        // h rook
        if (color === 'w') this.castlingRights = this.castlingRights.replace('K', '');
        else this.castlingRights = this.castlingRights.replace('k', '');
      }
    }

    // Rook captured
    if (target !== "") {
      // Captured rook affects castling rights
      if (to.r === 7 && to.f === 0) this.castlingRights = this.castlingRights.replace('Q', '');
      if (to.r === 7 && to.f === 7) this.castlingRights = this.castlingRights.replace('K', '');
      if (to.r === 0 && to.f === 0) this.castlingRights = this.castlingRights.replace('q', '');
      if (to.r === 0 && to.f === 7) this.castlingRights = this.castlingRights.replace('k', '');
    }

    // King moved
    if (piece.toLowerCase() === 'k') {
      // No castling for this color
      if (color === 'w') {
        this.castlingRights = this.castlingRights.replace('K', '').replace('Q', '');
      } else {
        this.castlingRights = this.castlingRights.replace('k', '').replace('q', '');
      }
    }

    // Switch turn
    this.activeColor = this.activeColor === 'w' ? 'b' : 'w';
    if (this.activeColor === 'w') this.fullmoveNumber++;
  }

  undoMove() {
    if (this.history.length === 0) return;
    let state = this.history.pop();
    this.board = state.board;
    this.activeColor = state.activeColor;
    this.castlingRights = state.castlingRights;
    this.enPassantTarget = state.enPassantTarget;
    this.halfmoveClock = state.halfmoveClock;
    this.fullmoveNumber = state.fullmoveNumber;
  }

  validate_move(m) {
    let moves = this.getAllValidMovesForTurn();
    return moves.some(mv => mv.from === m.from && mv.to === m.to);
  }
}

// Socket.IO Bağlantıları ve Oyun Mantığı
let waitingPlayer = null;
let games = {};

io.on('connection', (socket) => {
  console.log('Bir kullanıcı bağlandı:', socket.id);

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
    matchPlayers(waitingPlayer, socket);
    waitingPlayer = null;
  } else {
    waitingPlayer = socket;
    socket.matchTimeout = setTimeout(() => {
      if (!socket.hasMatched && !socket.isBotGame) {
        assignBot(socket);
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
            setTimeout(() => botMove(socket.gameId), 2000);
          } else {
            if (socket.opponent && socket.opponent.id) {
              io.to(socket.opponent.id).emit('move', move);
            }
          }
          if (g.chess.game_over()) {
            endGame(socket, g);
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

// Oyuncuları Eşleştirme Fonksiyonu
function matchPlayers(player1, player2) {
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
function assignBot(socket) {
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
    setTimeout(() => botMove(gameId), 2000);
  }
}

// Bot Hamle Fonksiyonu
function botMove(gameId) {
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
      endGame(playerSocket, g);
    } else {
      if (playerSocket && g.chess.turn() !== playerSocket.color[0].toLowerCase()) {
        setTimeout(() => botMove(gameId), 2000);
      }
    }
  }
}

// Oyun Sonlandırma Fonksiyonu
function endGame(socket, g) {
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

server.listen(port, () => {
  console.log('Sunucu çalışıyor: ' + port);
});
