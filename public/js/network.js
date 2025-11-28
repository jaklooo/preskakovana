import { state } from './state.js';

let socket = null;

export function initNetwork(callbacks) {
    // Pripojíme sa len ak ešte nie sme
    if (!socket) {
        // V produkcii (Render) to automaticky použije správnu URL
        socket = io();

        socket.on('connect', () => {
            console.log('Connected to server');
        });

        socket.on('waitingForOpponent', () => {
            callbacks.onWaiting();
        });

        socket.on('gameStart', (data) => {
            // data = { color, roomId, opponentId }
            state.roomId = data.roomId;
            callbacks.onGameStart(data.color);
        });

        socket.on('opponentMove', (move) => {
            callbacks.onOpponentMove(move);
        });
        
        socket.on('opponentDisconnected', () => {
            alert('Súper sa odpojil.');
            location.reload();
        });
    }
}

export function joinGame() {
    if (socket) {
        socket.emit('joinGame');
    }
}

export function sendMove(move) {
    if (socket && state.roomId) {
        socket.emit('makeMove', {
            roomId: state.roomId,
            move: move
        });
    }
}
