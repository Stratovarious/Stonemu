// sockets/socketInstance.js

const { Server } = require('socket.io');

class SocketInstance {
  constructor() {
    this.io = null;
    this.userSocketMap = new Map();
  }

  init(server) {
    if (!this.io) {
      this.io = new Server(server, {
        cors: {
          origin: 'https://stratovarious.github.io',
          methods: ['GET', 'POST'],
          credentials: true,
        },
      });

      this.io.on('connection', (socket) => {
        console.log('Bir kullanıcı bağlandı:', socket.id);

        socket.on('register', (data) => {
          const { user_id } = data;
          if (user_id) {
            this.userSocketMap.set(user_id, socket);
            socket.user_id = user_id;
            console.log(`Socket ${socket.id} için user_id: ${user_id}`);
          }
        });

        socket.on('disconnect', () => {
          if (socket.user_id) {
            this.userSocketMap.delete(socket.user_id);
            console.log(`Socket ${socket.id} için user_id: ${socket.user_id} silindi.`);
          }
        });
      });
    }
    return this.io;
  }

  getSocketByUserId(user_id) {
    return this.userSocketMap.get(user_id);
  }
}

module.exports = new SocketInstance();
