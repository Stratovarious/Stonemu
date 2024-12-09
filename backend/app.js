// app.js

require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

// Middleware ve Route'lar
const rateLimiter = require('./middlewares/rateLimiter');
const userRoutes = require('./routes/userRoutes');
const gameRoutes = require('./routes/gameRoutes');
const cheatRoutes = require('./routes/cheatRoutes');

// Veritabanı Bağlantısı
const db = require('./models');

// Socket.io Yönetimi
const gameSocket = require('./sockets/gameSocket');

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

// CORS Yapılandırması
app.use(cors({
  origin: 'https://stratovarious.github.io', // İzin verilen origin
  methods: ['GET', 'POST'],
  credentials: true,
}));

// JSON Body Parsing
app.use(express.json());

// Rate Limiting
app.use('/api/', rateLimiter);

// Route'ları Kullan
app.use('/api/users', userRoutes);
app.use('/api/games', gameRoutes);
app.use('/api/cheats', cheatRoutes);

// Ana Route
app.get('/', (req, res) => {
  res.send('Stonemu Backend Çalışıyor!');
});

// Veritabanı Bağlantısı ve Senkronizasyonu
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

// Socket.io Bağlantılarını Yönet
io.on('connection', (socket) => {
  console.log('Bir kullanıcı bağlandı:', socket.id);
  gameSocket(io, socket);
});

// Sunucuyu Başlat
server.listen(port, () => {
  console.log('Sunucu çalışıyor: ' + port);
});
