const express = require('express');
const http = require('http');
const path = require('path');
const { Server } = require('socket.io');
const formatMessage = require('./utils/messages');
const {
  userJoin,
  getCurrentUser,
  userLeave,
  getRoomUsers
} = require('./utils/user');

const app = express();
const server = http.createServer(app);

const io = new Server(server);

app.use(express.static(path.join(__dirname, 'public')));

const botName = 'Système';

io.on('connection', (socket) => {
  console.log(`Nouveau client connecté: ${socket.id}`);
  
  socket.on('joinRoom', ({ username, room }) => {
    const user = userJoin(socket.id, username, room);
    
    socket.join(user.room);
    
    socket.emit('message', formatMessage(botName, `Bienvenue dans le salon ${user.room} !`));
    
    socket.broadcast
      .to(user.room)
      .emit('message', formatMessage(botName, `${user.username} a rejoint le salon`));
    
    io.to(user.room).emit('roomUsers', {
      room: user.room,
      users: getRoomUsers(user.room)
    });
  });
  
  socket.on('chatMessage', (msg) => {
    const user = getCurrentUser(socket.id);
    
    if (!user) return;
    
    if (msg.startsWith('@')) {
      const parts = msg.substring(1).split(' ');
      const targetUsername = parts[0];
      const privateMessage = parts.slice(1).join(' ');
      
      const targetUser = getRoomUsers(user.room).find(
        u => u.username.toLowerCase() === targetUsername.toLowerCase()
      );
      
      if (targetUser) {
        io.to(targetUser.id).emit(
          'message',
          formatMessage(user.username, `[Privé] ${privateMessage}`, true)
        );
        
        socket.emit(
          'message',
          formatMessage(user.username, `[Privé à ${targetUser.username}] ${privateMessage}`, true)
        );
      } else {
        socket.emit(
          'message',
          formatMessage(botName, `Utilisateur ${targetUsername} non trouvé dans ce salon.`)
        );
      }
    } else {
      io.to(user.room).emit('message', formatMessage(user.username, msg));
    }
  });
  
  socket.on('leaveRoom', () => {
    const user = userLeave(socket.id);
    
    if (user) {
      io.to(user.room).emit(
        'message',
        formatMessage(botName, `${user.username} a quitté le salon`)
      );
      
      io.to(user.room).emit('roomUsers', {
        room: user.room,
        users: getRoomUsers(user.room)
      });
    }
  });
  
  socket.on('disconnect', () => {
    const user = userLeave(socket.id);
    
    if (user) {
      io.to(user.room).emit(
        'message',
        formatMessage(botName, `${user.username} a quitté le salon`)
      );
      
      io.to(user.room).emit('roomUsers', {
        room: user.room,
        users: getRoomUsers(user.room)
      });
    }
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Serveur en écoute sur le port ${PORT}`);
});