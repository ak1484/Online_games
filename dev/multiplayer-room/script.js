const createRoomButton = document.getElementById('create-room');
const joinRoomButton = document.getElementById('join-room');
const leaveRoomButton = document.getElementById('leave-room');
const roomCodeInput = document.getElementById('room-code');
const roomStatus = document.getElementById('room-status');
const gamePanel = document.getElementById('game-panel');
const currentRoom = document.getElementById('current-room');
const playerCount = document.getElementById('player-count');
const board = document.getElementById('board');

let room = null;
let players = [];
let localPlayerId = Math.random().toString(36).slice(2, 10);
let playerIndex = 0;
let gameState = {
  positions: [],
  turn: 0,
};

function createBoard() {
  board.innerHTML = '';
  for (let i = 0; i < 64; i += 1) {
    const cell = document.createElement('div');
    cell.className = 'cell';
    cell.dataset.index = i;
    cell.addEventListener('click', () => handleCellClick(i));
    board.appendChild(cell);
  }
}

function handleCellClick(index) {
  if (!room) return;
  if (players[playerIndex] !== localPlayerId) return;

  if (gameState.positions.includes(index)) return;

  gameState.positions.push(index);
  gameState.turn = (gameState.turn + 1) % players.length;
  syncRoomState();
}

function syncRoomState() {
  renderBoard();
  updatePlayerCount();
  roomStatus.textContent = `Room ${room.roomId} - players: ${players.length}`;
}

function renderBoard() {
  document.querySelectorAll('.cell').forEach((cell) => {
    const index = Number(cell.dataset.index);
    cell.classList.toggle('active', gameState.positions.includes(index));
  });
}

function updatePlayerCount() {
  playerCount.textContent = players.length.toString();
}

function createRoom() {
  const roomId = Math.random().toString(36).slice(2, 8).toUpperCase();
  room = {
    roomId,
    host: localPlayerId,
    players: [localPlayerId],
    gameState,
    createdAt: Date.now(),
  };
  players = [...room.players];
  playerIndex = 0;
  currentRoom.textContent = roomId;
  roomStatus.textContent = `Room ${roomId} created. Share this code to invite another player.`;
  gamePanel.classList.remove('hidden');
  renderBoard();
  updatePlayerCount();
}

function joinRoom() {
  const roomId = roomCodeInput.value.trim().toUpperCase();
  if (!roomId) {
    roomStatus.textContent = 'Enter a valid room code.';
    return;
  }
  if (!room || room.roomId !== roomId) {
    room = {
      roomId,
      host: null,
      players: [localPlayerId],
      gameState,
      createdAt: Date.now(),
    };
  }
  if (!room.players.includes(localPlayerId)) {
    room.players.push(localPlayerId);
  }
  players = [...room.players];
  playerIndex = players.indexOf(localPlayerId);
  currentRoom.textContent = roomId;
  roomStatus.textContent = `Joined room ${roomId}. Waiting for other player.`;
  gamePanel.classList.remove('hidden');
  renderBoard();
  updatePlayerCount();
}

function leaveRoom() {
  if (!room) return;
  room.players = room.players.filter((id) => id !== localPlayerId);
  players = [...room.players];
  if (players.length === 0) {
    room = null;
    roomStatus.textContent = 'Room closed. Create a new room to start again.';
    currentRoom.textContent = '—';
    gamePanel.classList.add('hidden');
    board.innerHTML = '';
    createBoard();
    return;
  }
  playerIndex = 0;
  currentRoom.textContent = room.roomId;
  roomStatus.textContent = `Left room. Remaining players: ${players.length}.`;
  updatePlayerCount();
}

createRoomButton.addEventListener('click', createRoom);
joinRoomButton.addEventListener('click', joinRoom);
leaveRoomButton.addEventListener('click', leaveRoom);

createBoard();
