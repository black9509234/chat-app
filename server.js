const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  pingTimeout: 10000,
  pingInterval: 5000,
});

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/index.html');
});

const MAP_WIDTH = 3000;
const MAP_HEIGHT = 3000;

const players = {};
const COLORS = ['#e74c3c','#3498db','#2ecc71','#f39c12','#9b59b6','#1abc9c','#e67e22','#e91e63'];
let colorIndex = 0;

const JOB_STATS = {
  warrior: { hp: 150, maxHp: 150, atk: 15, def: 10, spd: 4 },
  mage:    { hp: 80,  maxHp: 80,  atk: 25, def: 5,  spd: 4 },
  archer:  { hp: 100, maxHp: 100, atk: 20, def: 7,  spd: 5 },
};

io.on('connection', (socket) => {
  console.log('접속: ' + socket.id);

  socket.on('ping_check', (timestamp) => {
    socket.emit('pong_check', timestamp);
  });

  socket.on('join', (data) => {
    const nickname = typeof data === 'string' ? data : data.nickname;
    const job = (typeof data === 'object' && data.job) ? data.job : 'warrior';
    const stats = JOB_STATS[job] || JOB_STATS.warrior;

    players[socket.id] = {
      id: socket.id,
      nickname,
      job,
      x: Math.random() * (MAP_WIDTH - 200) + 100,
      y: Math.random() * (MAP_HEIGHT - 200) + 100,
      color: COLORS[colorIndex % COLORS.length],
      vx: 0,
      vy: 0,
      level: 1,
      exp: 0,
      expNext: 100,
      ...stats,
    };
    colorIndex++;
    io.emit('players', players);
    io.emit('chat', { nickname: '시스템', message: nickname + '님이 입장했습니다. [' + job + ']', system: true });
  });

  socket.on('move', (dir) => {
    const p = players[socket.id];
    if (!p) return;
    const spd = p.spd || 4;
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

// 서버 게임 루프 - 20fps로 줄여서 서버 부담 감소
// 클라이언트에서 보간(interpolation)으로 부드럽게 처리
setInterval(() => {
  Object.values(players).forEach(p => {
    p.x = Math.max(20, Math.min(MAP_WIDTH - 20, p.x + p.vx));
    p.y = Math.max(20, Math.min(MAP_HEIGHT - 20, p.y + p.vy));
  });
  io.emit('players', players);
}, 1000 / 20); // 20fps

server.listen(3000, () => {
  console.log('서버 실행 중! http://localhost:3000');
});