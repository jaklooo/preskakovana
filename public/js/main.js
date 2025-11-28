import { WHITE, BLACK } from './constants.js';
import { state, resetState } from './state.js';
import { createInitialBoard, getValidMoves, checkWin } from './core.js';
import { getAIMove } from './ai.js';
import * as UI from './ui.js';
import * as Network from './network.js';

// DOM Elements
const boardElement = document.getElementById('board');
const statusText = document.getElementById('statusText');
const difficultyDisplay = document.getElementById('difficulty-display');

// Global functions for HTML buttons
window.showModeSelect = UI.showModeSelect;
window.showMainMenu = UI.showMainMenu;
window.showColorSelect = UI.showColorSelect;

window.selectMode = (mode) => {
    state.gameMode = mode;
    if (mode === 'pvp') {
        startGamePvP();
    } else if (mode === 'online') {
        startGameOnline();
    } else {
        UI.showColorSelect();
    }
};

window.selectColor = (color) => {
    state.playerColor = color;
    UI.showDifficultySelect();
};

window.startGameAI = (difficulty) => {
    state.aiDifficulty = difficulty;
    UI.hideMenu();
    
    const diffText = { 'easy': 'Ľahká', 'medium': 'Stredná', 'hard': 'Ťažká' };
    difficultyDisplay.innerText = `Obtiažnosť: ${diffText[difficulty]}`;
    difficultyDisplay.style.display = 'inline';
    
    state.isGameActive = true;
    initGame();
    
    if (state.playerColor === BLACK) {
        setTimeout(makeAIMove, 1000);
    }
};

window.returnToMenu = () => {
    state.isGameActive = false;
    UI.showMainMenu();
};

function startGamePvP() {
    UI.hideMenu();
    difficultyDisplay.style.display = 'none';
    state.isGameActive = true;
    initGame();
}

function startGameOnline() {
    Network.initNetwork({
        onWaiting: () => {
            UI.showWaitingScreen();
        },
        onGameStart: (myColor) => {
            state.playerColor = myColor; // V online mode je playerColor moja farba
            UI.hideMenu();
            difficultyDisplay.innerText = `Hráš za: ${myColor === WHITE ? 'Biely' : 'Čierny'}`;
            difficultyDisplay.style.display = 'inline';
            state.isGameActive = true;
            initGame();
        },
        onOpponentMove: (move) => {
            // Aplikujeme ťah súpera
            state.selectedPiece = { r: move.fromR, c: move.fromC };
            // Musíme nastaviť validMoves pre executeMove, aj keď vieme že je to validné od súpera
            // (alebo upraviť executeMove aby to nevyžadoval, ale pre konzistenciu...)
            state.validMoves = getValidMoves(state.board, move.fromR, move.fromC, state.currentPlayer);
            
            let realMove = state.validMoves.find(m => m.r === move.r && m.c === move.c);
            if (realMove) {
                executeMove(realMove, false); // false = neposielať späť na server
            }
        }
    });
    Network.joinGame();
}

function initGame() {
    resetState();
    state.board = createInitialBoard();
    state.isGameActive = true;
    render();
}

function render() {
    UI.renderBoard(boardElement, state.board, state.selectedPiece, state.validMoves, handleCellClick);
    UI.updateStatus(statusText, state.currentPlayer);
}

function handleCellClick(r, c) {
    if (!state.isGameActive) return;
    
    // PvE: Nemôžem hýbať súperom
    if (state.gameMode === 'pve' && state.currentPlayer !== state.playerColor) return;
    
    // Online: Nemôžem hýbať súperom (moja farba vs aktuálny hráč)
    if (state.gameMode === 'online' && state.currentPlayer !== state.playerColor) return;

    const piece = state.board[r][c];

    // 1. Must Jump
    if (state.mustJumpFrom) {
        if (r === state.mustJumpFrom.r && c === state.mustJumpFrom.c) return;
        let move = state.validMoves.find(m => m.r === r && m.c === c);
        if (move) executeMove(move);
        return;
    }

    // 2. Select Piece
    if (piece === state.currentPlayer) {
        state.selectedPiece = { r, c };
        state.validMoves = getValidMoves(state.board, r, c, state.currentPlayer);
        render();
        return;
    }

    // 3. Move to empty
    if (state.selectedPiece && piece === null) {
        let move = state.validMoves.find(m => m.r === r && m.c === c);
        if (move) executeMove(move);
    }
}

function executeMove(move, isLocalMove = true) {
    const fromR = state.selectedPiece.r;
    const fromC = state.selectedPiece.c;

    // Ak je to online hra a je to môj ťah, pošli ho na server
    if (state.gameMode === 'online' && isLocalMove) {
        Network.sendMove({
            fromR: fromR,
            fromC: fromC,
            r: move.r,
            c: move.c
        });
    }

    // Update board
    state.board[move.r][move.c] = state.currentPlayer;
    state.board[fromR][fromC] = null;

    if (move.type === 'jump') {
        let furtherJumps = getValidMoves(state.board, move.r, move.c, state.currentPlayer, true);
        
        if (furtherJumps.length > 0) {
            state.mustJumpFrom = { r: move.r, c: move.c };
            state.selectedPiece = { r: move.r, c: move.c };
            state.validMoves = furtherJumps;
            render();
            
            if (state.gameMode === 'pve' && state.currentPlayer !== state.playerColor) {
                setTimeout(makeAIMove, 500);
            }
            return;
        }
    }

    endTurn();
}

function endTurn() {
    const winner = checkWin(state.board);
    if (winner) {
        // Use setTimeout to allow the last move to render before alert
        setTimeout(() => {
            const winnerName = winner === WHITE ? 'Biely' : 'Čierny';
            alert(`Vyhral hráč: ${winnerName}!`);
            state.isGameActive = false;
            UI.showMainMenu();
        }, 100);
        return;
    }

    state.selectedPiece = null;
    state.validMoves = [];
    state.mustJumpFrom = null;
    state.currentPlayer = state.currentPlayer === WHITE ? BLACK : WHITE;
    render();

    if (state.gameMode === 'pve' && state.currentPlayer !== state.playerColor && state.isGameActive) {
        setTimeout(makeAIMove, 500);
    }
}

function makeAIMove() {
    if (!state.isGameActive) return;

    const move = getAIMove(state.board, state.currentPlayer, state.aiDifficulty, state.mustJumpFrom);

    if (move) {
        state.selectedPiece = { r: move.fromR, c: move.fromC };
        // Re-calculate valid moves for validation context if needed, though we trust AI move here
        state.validMoves = getValidMoves(state.board, move.fromR, move.fromC, state.currentPlayer);
        
        // Find the exact move object from validMoves to ensure type correctness
        let realMove = state.validMoves.find(m => m.r === move.r && m.c === move.c);
        if (realMove) {
            executeMove(realMove);
        }
    }
}

// Initial Start
UI.showMainMenu();
