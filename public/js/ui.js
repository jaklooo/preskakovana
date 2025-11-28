import { BOARD_SIZE, WHITE, BLACK } from './constants.js';

export function renderBoard(boardElement, board, selectedPiece, validMoves, onCellClick) {
    boardElement.innerHTML = '';

    for (let r = 0; r < BOARD_SIZE; r++) {
        for (let c = 0; c < BOARD_SIZE; c++) {
            const cell = document.createElement('div');
            const isDark = (r + c) % 2 !== 0;
            cell.className = `cell ${isDark ? 'dark' : 'light'}`;

            if (isDark) {
                if (r < 2) cell.classList.add('target-zone-white');
                if (r > 5) cell.classList.add('target-zone-black');
            }

            if (board[r][c]) {
                const piece = document.createElement('div');
                piece.className = `piece ${board[r][c]}`;
                
                if (selectedPiece && selectedPiece.r === r && selectedPiece.c === c) {
                    piece.classList.add('selected');
                }
                
                cell.appendChild(piece);
            }

            let isHint = validMoves.find(m => m.r === r && m.c === c);
            if (isHint) {
                const hint = document.createElement('div');
                hint.className = 'hint';
                cell.appendChild(hint);
            }

            cell.onclick = () => onCellClick(r, c);

            boardElement.appendChild(cell);
        }
    }
}

export function updateStatus(statusText, currentPlayer) {
    const colorName = currentPlayer === WHITE ? "Biely" : "Čierny (Tmavý)";
    statusText.innerText = `Na ťahu: ${colorName}`;
    statusText.style.color = currentPlayer === WHITE ? "#ecf0f1" : "#b58863";
}

export function showMainMenu() {
    document.getElementById('menu-overlay').classList.remove('hidden');
    document.getElementById('main-menu').classList.remove('hidden');
    document.getElementById('mode-select').classList.add('hidden');
    document.getElementById('color-select').classList.add('hidden');
    document.getElementById('difficulty-select').classList.add('hidden');
}

export function showModeSelect() {
    document.getElementById('main-menu').classList.add('hidden');
    document.getElementById('mode-select').classList.remove('hidden');
    document.getElementById('color-select').classList.add('hidden');
}

export function showColorSelect() {
    document.getElementById('mode-select').classList.add('hidden');
    document.getElementById('color-select').classList.remove('hidden');
    document.getElementById('difficulty-select').classList.add('hidden');
}

export function showDifficultySelect() {
    document.getElementById('color-select').classList.add('hidden');
    document.getElementById('difficulty-select').classList.remove('hidden');
}

export function showWaitingScreen() {
    document.getElementById('mode-select').classList.add('hidden');
    document.getElementById('waiting-screen').classList.remove('hidden');
}

export function hideMenu() {
    document.getElementById('menu-overlay').classList.add('hidden');
    document.getElementById('waiting-screen').classList.add('hidden');
}
