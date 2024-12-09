// services/userService.js

const db = require('../models');

// WebSocket üzerinden kullanıcıya bildirim gönderme
exports.notifyUserOfCheat = (user_id, message) => {
  // Bu fonksiyon, Socket.io üzerinden kullanıcıya bildirim göndermek için kullanılacak.
  // Bunun için Socket.io bağlantılarının burada erişilebilir olması gerekiyor.
  // Bu implementasyon, gameSocket modülünde yapılacak.
  // Bu nedenle, bu fonksiyonun Socket.io entegrasyonuna göre güncellenmesi gerekmektedir.
  // Alternatif olarak, Socket.io bağlantılarını burada yönetebilirsiniz.
};
