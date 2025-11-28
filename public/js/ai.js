import { BOARD_SIZE, WHITE, BLACK } from './constants.js';
import { getValidMoves } from './core.js';

export function getAIMove(board, currentPlayer, difficulty, mustJumpFrom) {
    let move = null;
    
    // Ak AI musí pokračovať v skákaní (reťazenie)
    if (mustJumpFrom) {
        const validMoves = getValidMoves(board, mustJumpFrom.r, mustJumpFrom.c, currentPlayer, true);
        if (validMoves.length > 0) {
            if (difficulty === 'hard') {
                 move = getBestMoveFromList(validMoves, currentPlayer);
            } else {
                 move = validMoves[Math.floor(Math.random() * validMoves.length)];
            }
            // Vrátime formát, ktorý main.js očakáva
            return { fromR: mustJumpFrom.r, fromC: mustJumpFrom.c, ...move };
        }
        return null;
    }

    // Štandardný výber ťahu
    if (difficulty === 'easy') {
        move = getRandomMove(board, currentPlayer);
    } else if (difficulty === 'medium') {
        move = getGreedyMove(board, currentPlayer);
    } else {
        move = getMinimaxMove(board, currentPlayer);
    }
    
    return move;
}

function getAllPossibleMoves(board, player) {
    let allMoves = [];
    for (let r = 0; r < BOARD_SIZE; r++) {
        for (let c = 0; c < BOARD_SIZE; c++) {
            if (board[r][c] === player) {
                let moves = getValidMoves(board, r, c, player);
                moves.forEach(m => {
                    allMoves.push({
                        fromR: r,
                        fromC: c,
                        r: m.r,
                        c: m.c,
                        type: m.type,
                        midR: m.midR,
                        midC: m.midC
                    });
                });
            }
        }
    }
    return allMoves;
}

function getRandomMove(board, player) {
    let allMoves = getAllPossibleMoves(board, player);
    if (allMoves.length === 0) return null;
    return allMoves[Math.floor(Math.random() * allMoves.length)];
}

function getGreedyMove(board, player) {
    let allMoves = getAllPossibleMoves(board, player);
    if (allMoves.length === 0) return null;
    return getBestMoveFromList(allMoves, player);
}

function getBestMoveFromList(moves, player) {
    let targetRow = (player === WHITE) ? 0 : 7;
    moves.sort((a, b) => {
        let distA = Math.abs(a.r - targetRow);
        let distB = Math.abs(b.r - targetRow);
        
        if (distA === distB) {
            if (a.type === 'jump' && b.type !== 'jump') return -1;
            if (b.type === 'jump' && a.type !== 'jump') return 1;
            return 0;
        }
        return distA - distB;
    });
    return moves[0];
}

// --- Minimax Implementation ---

function getMinimaxMove(board, player) {
    let bestMoveVal = -Infinity;
    let bestMove = null;
    let depth = 3;
    
    let allMoves = getAllPossibleMoves(board, player);
    if (allMoves.length === 0) return null;

    let alpha = -Infinity;
    let beta = Infinity;

    for (let move of allMoves) {
        let savedBoard = JSON.parse(JSON.stringify(board));
        applyMoveToBoard(savedBoard, move, player);
        
        let val = minimax(savedBoard, depth - 1, false, alpha, beta, player);
        
        if (val > bestMoveVal) {
            bestMoveVal = val;
            bestMove = move;
        }
        alpha = Math.max(alpha, bestMoveVal);
    }
    
    return bestMove;
}

function minimax(tempBoard, depth, isMaximizing, alpha, beta, maximizingPlayer) {
    if (depth === 0) {
        return evaluateBoard(tempBoard, maximizingPlayer);
    }

    let player = isMaximizing ? maximizingPlayer : (maximizingPlayer === WHITE ? BLACK : WHITE);
    let allMoves = getAllPossibleMoves(tempBoard, player);
    
    if (allMoves.length === 0) {
        return evaluateBoard(tempBoard, maximizingPlayer);
    }

    if (isMaximizing) {
        let maxEval = -Infinity;
        for (let move of allMoves) {
            let nextBoard = JSON.parse(JSON.stringify(tempBoard));
            applyMoveToBoard(nextBoard, move, player);
            let evaluation = minimax(nextBoard, depth - 1, false, alpha, beta, maximizingPlayer);
            maxEval = Math.max(maxEval, evaluation);
            alpha = Math.max(alpha, evaluation);
            if (beta <= alpha) break;
        }
        return maxEval;
    } else {
        let minEval = Infinity;
        for (let move of allMoves) {
            let nextBoard = JSON.parse(JSON.stringify(tempBoard));
            applyMoveToBoard(nextBoard, move, player);
            let evaluation = minimax(nextBoard, depth - 1, true, alpha, beta, maximizingPlayer);
            minEval = Math.min(minEval, evaluation);
            beta = Math.min(beta, evaluation);
            if (beta <= alpha) break;
        }
        return minEval;
    }
}

function applyMoveToBoard(brd, move, player) {
    brd[move.r][move.c] = player;
    brd[move.fromR][move.fromC] = null;
}

function evaluateBoard(brd, maximizingPlayer) {
    let score = 0;

    for (let r = 0; r < BOARD_SIZE; r++) {
        for (let c = 0; c < BOARD_SIZE; c++) {
            if (brd[r][c] === WHITE) {
                let val = (7 - r) * 10;
                if (r < 2) val += 50;
                score += (maximizingPlayer === WHITE) ? val : -val;
            } else if (brd[r][c] === BLACK) {
                let val = r * 10;
                if (r > 5) val += 50;
                score += (maximizingPlayer === BLACK) ? val : -val;
            }
        }
    }
    return score;
}
