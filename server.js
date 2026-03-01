const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/index.html');
});

const MAP_WIDTH = 3000;
const MAP_HEIGHT = 3000;
const players = {};
const COLORS = ['#e74c3c','#3498db','#2ecc71','#f39c12','#9b59b6','#1abc9c','#e67e22','#e91e63'];
let colorIndex = 0;

io.on('connection', (socket) => {
  console.log('접속: ' + socket.id);

  socket.on('ping_check', (ts) => socket.emit('pong_check', ts));

  socket.on('join', (nickname) => {
    players[socket.id] = {
      id: socket.id,
      nickname,
      x: Math.random() * (MAP_WIDTH - 200) + 100,
      y: Math.random() * (MAP_HEIGHT - 200) + 100,
      color: COLORS[colorIndex % COLORS.length],
      vx: 0, vy: 0,
    };
    colorIndex++;
    io.emit('players', players);
    io.emit('chat', { nickname: '시스템', message: nickname + '님이 입장했습니다.', system: true });
  });

  socket.on('move', (dir) => {
    const p = players[socket.id];
    if (!p) return;
    const spd = 4;
    p.vy = dir.up ? -spd : dir.down ? spd : 0;
    p.vx = dir.left ? -spd : dir.right ? spd : 0;
  });

  socket.on('chat', (msg) => {
    const p = players[socket.id];
    if (!p) return;
    io.emit('chat', { id: socket.id, nickname: p.nickname, message: msg, system: false });
  });

  socket.on('disconnect', () => {
    if (players[socket.id]) {
      io.emit('chat', { nickname: '시스템', message: players[socket.id].nickname + '님이 퇴장했습니다.', system: true });
      delete players[socket.id];
      io.emit('players', players);
    }
  });
});

// 게임 루프 20fps
setInterval(() => {
  Object.values(players).forEach(p => {
    p.x = Math.max(20, Math.min(MAP_WIDTH - 20, p.x + p.vx));
    p.y = Math.max(20, Math.min(MAP_HEIGHT - 20, p.y + p.vy));
  });
  io.emit('players', players);
}, 1000 / 20);

server.listen(3000, () => {
  console.log('서버 실행 중! http://localhost:3000');
});