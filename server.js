const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

// index.html 파일을 보여줌
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/index.html');
});

// 누군가 접속했을 때
io.on('connection', (socket) => {
  console.log('✅ 누군가 접속했어요!');

  // 채팅 메시지 받으면 전체에게 뿌려줌
  socket.on('chat message', (msg) => {
    io.emit('chat message', msg);
  });

  // 누군가 나갔을 때
  socket.on('disconnect', () => {
    console.log('❌ 누군가 나갔어요.');
  });
});

server.listen(3000, () => {
  console.log('🚀 서버 실행 중! http://localhost:3000');
});