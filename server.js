const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.get('/', (req, res) => {
    res.sendFile(__dirname + '/index.html');
});

const players = {};
const COLORS = ['#e74c3c', '#3498db', '#2ecc71', '#f39c12', '#9b59b6', '#1abc9c', '#e67e22', '#e91e63'];
let colorIndex = 0;

io.on('connection', (socket) => {
    console.log('접속: ' + socket.id);

    socket.on('join', (nickname) => {
        players[socket.id] = {
            id: socket.id,
            nickname: nickname,
            x: Math.random() * 700 + 50,
            y: Math.random() * 500 + 50,
            color: COLORS[colorIndex % COLORS.length],
            vx: 0,
            vy: 0
        };
        colorIndex++;
        io.emit('players', players);
        io.emit('chat', { nickname: '시스템', message: nickname + '님이 입장했습니다.', system: true });
    });

    socket.on('move', (dir) => {
        const p = players[socket.id];
        if (!p) return;
        const speed = 4;
        if (dir.up) p.vy = -speed;
        else if (dir.down) p.vy = speed;
        else p.vy = 0;
        if (dir.left) p.vx = -speed;
        else if (dir.right) p.vx = speed;
        else p.vx = 0;
    });

    socket.on('chat', (msg) => {
        const p = players[socket.id];
        if (!p) return;
        io.emit('chat', { nickname: p.nickname, message: msg, system: false });
    });

    socket.on('disconnect', () => {
        if (players[socket.id]) {
            io.emit('chat', { nickname: '시스템', message: players[socket.id].nickname + '님이 퇴장했습니다.', system: true });
            delete players[socket.id];
            io.emit('players', players);
        }
    });
});

// 게임 루프 (60fps)
setInterval(() => {
    Object.values(players).forEach(p => {
        p.x = Math.max(20, Math.min(980, p.x + p.vx));
        p.y = Math.max(20, Math.min(580, p.y + p.vy));
    });
    io.emit('players', players);
}, 1000 / 60);

server.listen(3000, () => {
    console.log('서버 실행 중! http://localhost:3000');
});