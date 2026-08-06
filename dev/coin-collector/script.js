const board = document.getElementById('board');
const scoreEl = document.getElementById('score');
const coinsEl = document.getElementById('coins');
const restart = document.getElementById('restart');

const gridSize = 10;
const cellSize = 52;
const coinCount = 10;
let player = { x: 0, y: 0 };
let coins = [];
let score = 0;

function createBoard() {
  board.innerHTML = '';
  board.style.setProperty('--cell-size', `${cellSize}px`);
  for (let y = 0; y < gridSize; y += 1) {
    for (let x = 0; x < gridSize; x += 1) {
      const cell = document.createElement('div');
      cell.className = 'cell';
      cell.style.transform = `translate(${x * cellSize}px, ${y * cellSize}px)`;
      board.appendChild(cell);
    }
  }
}

function placePlayer() {
  let playerEl = document.querySelector('.player');
  if (!playerEl) {
    playerEl = document.createElement('div');
    playerEl.className = 'player';
    board.appendChild(playerEl);
  }
  playerEl.style.transform = `translate(${player.x * cellSize}px, ${player.y * cellSize}px)`;
}

function spawnCoins() {
  coins = [];
  for (let i = 0; i < coinCount; i += 1) {
    let x, y;
    do {
      x = Math.floor(Math.random() * gridSize);
      y = Math.floor(Math.random() * gridSize);
    } while ((x === player.x && y === player.y) || coins.some(c => c.x === x && c.y === y));
    coins.push({ x, y });
  }
  drawCoins();
}

function drawCoins() {
  document.querySelectorAll('.coin').forEach(el => el.remove());
  coins.forEach(({ x, y }) => {
    const coin = document.createElement('div');
    coin.className = 'coin';
    coin.style.transform = `translate(${x * cellSize}px, ${y * cellSize}px)`;
    board.appendChild(coin);
  });
}

function updateStats() {
  scoreEl.textContent = `Score: ${score}`;
  coinsEl.textContent = `Coins left: ${coins.length}`;
}

function movePlayer(dx, dy) {
  const newX = Math.max(0, Math.min(gridSize - 1, player.x + dx));
  const newY = Math.max(0, Math.min(gridSize - 1, player.y + dy));
  if (newX === player.x && newY === player.y) return;
  player.x = newX;
  player.y = newY;
  placePlayer();
  collectCoin();
}

function collectCoin() {
  const index = coins.findIndex(c => c.x === player.x && c.y === player.y);
  if (index >= 0) {
    coins.splice(index, 1);
    score += 10;
    updateStats();
    drawCoins();
    if (coins.length === 0) {
      setTimeout(() => alert(`You collected all coins! Final score: ${score}`), 100);
    }
  }
}

function resetGame() {
  player = { x: 0, y: 0 };
  score = 0;
  createBoard();
  placePlayer();
  spawnCoins();
  updateStats();
}

window.addEventListener('keydown', (event) => {
  const keyMap = {
    ArrowUp: [0, -1],
    ArrowDown: [0, 1],
    ArrowLeft: [-1, 0],
    ArrowRight: [1, 0],
    w: [0, -1],
    s: [0, 1],
    a: [-1, 0],
    d: [1, 0],
  };
  const move = keyMap[event.key];
  if (move) {
    event.preventDefault();
    movePlayer(...move);
  }
});

restart.addEventListener('click', resetGame);
resetGame();
