import { WHITE } from './constants.js';

export const state = {
    board: [],
    currentPlayer: WHITE,
    selectedPiece: null, // {r, c}
    validMoves: [], // Array of {r, c, type: 'move'|'jump'}
    mustJumpFrom: null, // {r, c}
    gameMode: 'pvp', // 'pvp' or 'pve'
    playerColor: WHITE,
    aiDifficulty: 'easy',
    isGameActive: false
};

export function resetState() {
    state.board = [];
    state.currentPlayer = WHITE;
    state.selectedPiece = null;
    state.validMoves = [];
    state.mustJumpFrom = null;
    state.isGameActive = false;
}
