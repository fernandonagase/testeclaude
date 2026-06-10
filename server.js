const express = require('express');
const http = require('http');
const os = require('os');
const path = require('path');
const { Server } = require('socket.io');
const { Chess } = require('chess.js');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

const PORT = process.env.PORT || 3000;

app.use(express.static(path.join(__dirname, 'public')));

// Single shared game, authoritative on the server.
const chess = new Chess();

// socket.id -> 'w' | 'b'
const players = {};

function getPlayerCounts() {
  let white = null;
  let black = null;
  for (const [id, color] of Object.entries(players)) {
    if (color === 'w') white = id;
    if (color === 'b') black = id;
  }
  return { white, black, spectators: io.engine.clientsCount - (white ? 1 : 0) - (black ? 1 : 0) };
}

function gameStatus() {
  let status = 'playing';
  if (chess.isCheckmate()) status = 'checkmate';
  else if (chess.isStalemate()) status = 'stalemate';
  else if (chess.isThreefoldRepetition()) status = 'threefold';
  else if (chess.isInsufficientMaterial()) status = 'insufficient';
  else if (chess.isDraw()) status = 'draw';
  else if (chess.isCheck()) status = 'check';

  return {
    fen: chess.fen(),
    turn: chess.turn(),
    history: chess.history({ verbose: true }),
    status,
    isGameOver: chess.isGameOver(),
  };
}

function broadcastState() {
  io.emit('state', gameStatus());
}

function broadcastPlayers() {
  const { white, black, spectators } = getPlayerCounts();
  io.emit('players', {
    white: !!white,
    black: !!black,
    spectators: Math.max(spectators, 0),
  });
}

io.on('connection', (socket) => {
  // Assign a color if a slot is free, otherwise the client is a spectator.
  const { white, black } = getPlayerCounts();
  let assigned = 'spectator';
  if (!white) {
    players[socket.id] = 'w';
    assigned = 'w';
  } else if (!black) {
    players[socket.id] = 'b';
    assigned = 'b';
  }

  socket.emit('welcome', { color: assigned, ...gameStatus() });
  broadcastPlayers();

  socket.on('move', ({ from, to, promotion }) => {
    const color = players[socket.id];
    if (!color) return; // spectators can't move
    if (chess.turn() !== color) return; // not your turn
    if (chess.isGameOver()) return;

    try {
      const move = chess.move({ from, to, promotion });
      if (move) {
        broadcastState();
      }
    } catch (err) {
      // Illegal move: tell the sender to resync without affecting others.
      socket.emit('illegalMove', gameStatus());
    }
  });

  socket.on('reset', () => {
    chess.reset();
    broadcastState();
  });

  socket.on('disconnect', () => {
    delete players[socket.id];
    broadcastPlayers();
  });
});

server.listen(PORT, '0.0.0.0', () => {
  console.log('Xadrez 3D rodando!');
  console.log(`Local:   http://localhost:${PORT}`);

  const nets = os.networkInterfaces();
  for (const name of Object.keys(nets)) {
    for (const net of nets[name]) {
      if (net.family === 'IPv4' && !net.internal) {
        console.log(`Rede:    http://${net.address}:${PORT}`);
      }
    }
  }
});
