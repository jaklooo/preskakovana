const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

// Servovanie statických súborov z priečinka public
app.use(express.static(path.join(__dirname, 'public')));

let waitingPlayer = null;

io.on('connection', (socket) => {
    console.log('A user connected:', socket.id);

    socket.on('joinGame', () => {
        if (waitingPlayer) {
            // Máme čakajúceho hráča, vytvoríme hru
            const opponent = waitingPlayer;
            waitingPlayer = null;

            const roomId = opponent.id + '#' + socket.id;
            
            opponent.join(roomId);
            socket.join(roomId);

            // Priradenie farieb: Čakajúci je Biely, Nový je Čierny
            io.to(opponent.id).emit('gameStart', { 
                color: 'white', 
                roomId: roomId,
                opponentId: socket.id 
            });
            
            io.to(socket.id).emit('gameStart', { 
                color: 'black', 
                roomId: roomId,
                opponentId: opponent.id 
            });

            console.log(`Game started in room ${roomId}`);
        } else {
            // Žiadny čakajúci hráč, tento hráč čaká
            waitingPlayer = socket;
            socket.emit('waitingForOpponent');
            console.log('User waiting for opponent:', socket.id);
        }
    });

    socket.on('makeMove', (data) => {
        // data = { roomId, move: { fromR, fromC, r, c, ... } }
        socket.to(data.roomId).emit('opponentMove', data.move);
    });

    socket.on('disconnect', () => {
        console.log('User disconnected:', socket.id);
        if (waitingPlayer === socket) {
            waitingPlayer = null;
        }
        // Tu by sme mohli poslať 'opponentDisconnected' event do roomky
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Server beží na porte ${PORT}`);
});
