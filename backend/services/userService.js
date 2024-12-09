// services/userService.js

const db = require('../models');
const io = require('../sockets/socketInstance'); // Socket.io instance'ını yönetecek bir dosya oluşturabilirsiniz

// WebSocket üzerinden kullanıcıya bildirim gönderme
exports.notifyUserOfCheat = (user_id, message) => {
  // Kullanıcının Socket ID'sini bulmak için kullanıcıya ait Socket'ları saklamak gerekir.
  // Bunun için kullanıcı kayıt olurken Socket ID'lerini bir yerde tutabilirsiniz.
  // Örneğin, bir Redis store kullanarak kullanıcı_id ile socket_id'yi eşleştirebilirsiniz.
  // Bu örnekte basit bir map kullanıyoruz, ancak bu yöntem uygulamanın ölçeklenebilirliği için uygun değildir.

  const socket = io.getSocketByUserId(user_id);
  if (socket) {
    socket.emit('cheatDetected', { message });
  }
};
