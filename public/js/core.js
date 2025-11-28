import { BOARD_SIZE, WHITE, BLACK } from './constants.js';

export function createInitialBoard() {
    const board = Array(BOARD_SIZE).fill(null).map(() => Array(BOARD_SIZE).fill(null));
    
    for (let r = 0; r < BOARD_SIZE; r++) {
        for (let c = 0; c < BOARD_SIZE; c++) {
            if ((r + c) % 2 !== 0) { // Len tmavé políčka
                if (r < 2) board[r][c] = BLACK;
                if (r > 5) board[r][c] = WHITE;
            }
        }
    }
    return board;
}

export function isOnBoard(r, c) {
    return r >= 0 && r < BOARD_SIZE && c >= 0 && c < BOARD_SIZE;
}

export function getValidMoves(board, r, c, player, onlyJumps = false) {
    let moves = [];
    let directions = [[-1, -1], [-1, 1], [1, -1], [1, 1]]; // Všetky diagonály

    // 1. Skoky (Len dopredu)
    // Biely ide hore (r klesá), Čierny ide dole (r stúpa)
    let forwardDir = (player === WHITE) ? -1 : 1;

    directions.forEach(dir => {
        let dr = dir[0];
        let dc = dir[1];
        
        // Skok musí smerovať dopredu
        if (dr === forwardDir) {
            let midR = r + dr;
            let midC = c + dc;
            let toR = r + dr * 2;
            let toC = c + dc * 2;

            if (isOnBoard(toR, toC) && board[midR][midC] !== null && board[toR][toC] === null) {
                moves.push({ r: toR, c: toC, type: 'jump', midR, midC });
            }
        }
    });

    // Ak hľadáme len skoky (reťazenie), vrátime len tie.
    if (onlyJumps) return moves;

    // 2. Obyčajné ťahy (Všade, ak nie je vynútený skok inou logikou, ale tu zjednodušene)
    directions.forEach(dir => {
        let toR = r + dir[0];
        let toC = c + dir[1];

        if (isOnBoard(toR, toC) && board[toR][toC] === null) {
            moves.push({ r: toR, c: toC, type: 'move' });
        }
    });

    return moves;
}

export function checkWin(board) {
    let whiteWins = true;
    let blackWins = true;

    // Check White's victory (White pieces in rows 0 and 1)
    // Target zone for White is where Black started
    for (let r = 0; r < 2; r++) {
        for (let c = 0; c < BOARD_SIZE; c++) {
            if ((r + c) % 2 !== 0) { // Dark square
                if (board[r][c] !== WHITE) {
                    whiteWins = false;
                }
            }
        }
    }

    // Check Black's victory (Black pieces in rows 6 and 7)
    // Target zone for Black is where White started
    for (let r = 6; r < BOARD_SIZE; r++) {
        for (let c = 0; c < BOARD_SIZE; c++) {
            if ((r + c) % 2 !== 0) { // Dark square
                if (board[r][c] !== BLACK) {
                    blackWins = false;
                }
            }
        }
    }

    if (whiteWins) return WHITE;
    if (blackWins) return BLACK;
    return null;
}
