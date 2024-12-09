// services/cheatService.js

const db = require('../models');

// Socket.io üzerinden kullanıcıya bildirim gönderme fonksiyonu
exports.notifyUserOfCheat = (user_id, message) => {
  // Bu fonksiyon, Socket.io bağlantılarının burada erişilebilir olması gerekiyor.
  // Bu nedenle, bu fonksiyonun Socket.io entegrasyonuna göre güncellenmesi gerekmektedir.
  // Alternatif olarak, Socket.io bağlantılarını burada yönetebilirsiniz.
};
