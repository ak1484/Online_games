import { initializeApp } from 'https://www.gstatic.com/firebasejs/9.22.0/firebase-app.js';
import { getDatabase, ref, set, get, update, onValue, remove } from 'https://www.gstatic.com/firebasejs/9.22.0/firebase-database.js';
import { getAuth, signInAnonymously } from 'https://www.gstatic.com/firebasejs/9.22.0/firebase-auth.js';
import { loadFirebaseConfig } from './firebase-loader.js';

const createRoomButton = document.getElementById('create-room');
const joinRoomButton = document.getElementById('join-room');
const leaveRoomButton = document.getElementById('leave-room');
const roomCodeInput = document.getElementById('room-code');
const roomStatus = document.getElementById('room-status');
const gamePanel = document.getElementById('game-panel');
const currentRoom = document.getElementById('current-room');
const playerCount = document.getElementById('player-count');
const turnStatus = document.getElementById('turn-status');
const playerLegend = document.getElementById('player-legend');
const board = document.getElementById('board');
const showInstructionsButton = document.getElementById('show-instructions');
const instructionsModal = document.getElementById('instructions-modal');
const closeInstructionsButton = document.getElementById('close-instructions');
const closeInstructionsBottom = document.getElementById('close-instructions-bottom');

let app = null;
let db = null;
let auth = null;

let room = null;
let players = [];
let localPlayerId = null;
let playerIndex = 0;
let gameState = {
  markers: {},
  turn: 0,
};
let roomUnsubscribe = null;
const playerColors = ['#2563eb', '#14b8a6', '#f59e0b', '#ef4444'];

async function init() {
  try {
    const userCredential = await signInAnonymously(auth);
    localPlayerId = userCredential.user.uid;
    roomStatus.textContent = `Connected as ${localPlayerId}. Create or join a room.`;
    console.log('Auth successful, uid:', localPlayerId);
  } catch (err) {
    console.error('Anonymous sign-in failed:', err);
    roomStatus.textContent = `Auth failed: ${err.message || err}`;
    throw err;
  }
}

function normalizeArray(value) {
  if (Array.isArray(value)) return value;
  if (value && typeof value === 'object') return Object.values(value).filter((item) => item !== null && item !== undefined);
  return [];
}

function normalizeMarkers(value) {
  if (value && typeof value === 'object' && !Array.isArray(value)) return value;
  return {};
}

function getPlayerColor(playerId) {
  const index = players.indexOf(playerId);
  return playerColors[index >= 0 ? index % playerColors.length : 0];
}

function getPlayerLabel(playerId) {
  const index = players.indexOf(playerId);
  if (playerId === localPlayerId) {
    return `You (${index + 1})`;
  }
  return index >= 0 ? `Player ${index + 1}` : 'Guest';
}

function updatePlayerLegend() {
  if (!playerLegend) return;
  playerLegend.innerHTML = players.map((playerId, index) => {
    const isLocal = playerId === localPlayerId;
    const label = isLocal ? `You (${index + 1})` : `Player ${index + 1}`;
    return `<span class="player-chip" style="color:${getPlayerColor(playerId)}">${label}</span>`;
  }).join('');
}

function updateTurnStatus() {
  if (!turnStatus) return;
  if (!room || players.length === 0) {
    turnStatus.textContent = 'Waiting for a room.';
    return;
  }
  if (players.length === 1) {
    turnStatus.textContent = 'Waiting for another player to join...';
    return;
  }

  const markers = normalizeMarkers(gameState.markers);
  const claimedCells = Object.keys(markers).length;
  if (claimedCells >= 64) {
    const scores = players.reduce((acc, playerId) => {
      acc[playerId] = Object.values(markers).filter((owner) => owner === playerId).length;
      return acc;
    }, {});
    const winner = players.reduce((best, playerId) => {
      if (!best || scores[playerId] > scores[best]) return playerId;
      return best;
    }, null);
    const sorted = [...players].sort((a, b) => scores[b] - scores[a]);
    const topScore = scores[sorted[0]];
    const isTie = sorted.length > 1 && scores[sorted[0]] === scores[sorted[1]];
    if (isTie) {
      turnStatus.textContent = `Game over: tie with ${topScore} cells each.`;
    } else {
      turnStatus.textContent = `Game over: ${getPlayerLabel(winner)} wins with ${topScore} cells.`;
    }
    return;
  }

  const currentPlayer = players[gameState.turn] || null;
  if (!currentPlayer) {
    turnStatus.textContent = 'Waiting for player order...';
    return;
  }
  turnStatus.textContent = currentPlayer === localPlayerId
    ? `Your turn (${getPlayerLabel(currentPlayer)})`
    : `Waiting for ${getPlayerLabel(currentPlayer)}`;
}

async function debugLogRoom() {
  if (!room) {
    console.log('No active room to debug');
    return;
  }
  try {
    const roomRef = ref(db, `rooms/${room.roomId}`);
    const snap = await get(roomRef);
    console.log('Debug room snapshot:', snap.exists() ? snap.val() : null);
  } catch (e) {
    console.error('Error fetching room doc for debug:', e);
  }
}

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
  gameState.markers = normalizeMarkers(gameState.markers);
  if (gameState.markers[index]) return;

  gameState.markers[index] = localPlayerId;
  gameState.turn = players.length > 0 ? (gameState.turn + 1) % players.length : 0;
  saveRoomState();
}

function renderBoard() {
  const markers = normalizeMarkers(gameState.markers);
  document.querySelectorAll('.cell').forEach((cell) => {
    const index = Number(cell.dataset.index);
    const ownerId = markers[index] || null;
    const occupied = ownerId !== null;

    cell.classList.toggle('active', occupied);
    cell.textContent = ownerId ? `${players.indexOf(ownerId) + 1}` : '';
    if (ownerId) {
      cell.style.background = getPlayerColor(ownerId);
      cell.style.color = '#ffffff';
    } else {
      cell.style.background = '#1f2937';
      cell.style.color = '#f8fafc';
    }
  });
}

function updatePlayerCount() {
  playerCount.textContent = players.length.toString();
}

function updateRoomStatus(text) {
  roomStatus.textContent = text;
}

async function saveRoomState() {
  if (!room) return;
  const roomRef = ref(db, `rooms/${room.roomId}`);
  const normalizedPlayers = normalizeArray(players);
  const normalizedGameState = {
    markers: normalizeMarkers(gameState.markers),
    turn: typeof gameState.turn === 'number' ? gameState.turn : 0,
  };
  try {
    await update(roomRef, {
      gameState: normalizedGameState,
      players: normalizedPlayers,
      lastActiveAt: Date.now(),
    });
  } catch (err) {
    console.error('Failed to save room state:', err);
    roomStatus.textContent = `Save failed: ${err.message || err}`;
  }
}

async function createRoom() {
  const roomId = Math.random().toString(36).slice(2, 8).toUpperCase();
  gameState = {
    markers: {},
    turn: 0,
  };
  room = {
    roomId,
    host: localPlayerId,
    players: [localPlayerId],
    gameState,
  };
  players = [...room.players];
  playerIndex = 0;
  currentRoom.textContent = roomId;
  updateRoomStatus(`Room ${roomId} created. Share this code to invite another player.`);
  gamePanel.classList.remove('hidden');
  renderBoard();
  updatePlayerLegend();
  updatePlayerCount();
  updateTurnStatus();

  const roomRef = ref(db, `rooms/${roomId}`);
  try {
    await set(roomRef, {
      roomId,
      host: localPlayerId,
      players,
      gameState,
      createdAt: Date.now(),
      lastActiveAt: Date.now(),
    });
    subscribeRoom(roomId);
  } catch (err) {
    console.error('Failed to create room:', err);
    roomStatus.textContent = `Room create failed: ${err.message || err}`;
  }
}

async function joinRoom() {
  const roomId = roomCodeInput.value.trim().toUpperCase();
  if (!roomId) {
    updateRoomStatus('Enter a valid room code.');
    return;
  }

  const roomRef = ref(db, `rooms/${roomId}`);
  try {
    const roomSnapshot = await get(roomRef);
    if (!roomSnapshot.exists()) {
      updateRoomStatus(`Room ${roomId} does not exist.`);
      return;
    }

    room = roomSnapshot.val();
    const roomPlayers = normalizeArray(room.players);
    if (!roomPlayers.includes(localPlayerId)) {
      players = [...roomPlayers, localPlayerId];
      await update(roomRef, {
        players,
        lastActiveAt: Date.now(),
      });
    } else {
      players = [...roomPlayers];
    }
  } catch (err) {
    console.error('Failed to join room:', err);
    updateRoomStatus(`Join failed: ${err.message || err}`);
    return;
  }

  playerIndex = players.indexOf(localPlayerId);
  currentRoom.textContent = roomId;
  updateRoomStatus(`Joined room ${roomId}. Waiting for other player.`);
  gamePanel.classList.remove('hidden');
  renderBoard();
  updatePlayerLegend();
  updatePlayerCount();
  updateTurnStatus();

  subscribeRoom(roomId);
}

function subscribeRoom(roomId) {
  if (roomUnsubscribe) {
    roomUnsubscribe();
  }

  const roomRef = ref(db, `rooms/${roomId}`);
  roomUnsubscribe = onValue(roomRef, (snapshot) => {
    const data = snapshot.val();
    if (!data) {
      updateRoomStatus('Room closed or removed.');
      return;
    }

    room = data;
    players = normalizeArray(room.players);
    gameState = room.gameState || { markers: {}, turn: 0 };
    gameState.markers = normalizeMarkers(gameState.markers);
    if (typeof gameState.turn !== 'number') {
      gameState.turn = 0;
    }
    playerIndex = players.indexOf(localPlayerId);
    currentRoom.textContent = room.roomId;
    renderBoard();
    updatePlayerLegend();
    updatePlayerCount();
    updateTurnStatus();

    if (players.length === 1) {
      updateRoomStatus(`Room ${room.roomId} waiting for another player.`);
    } else {
      updateRoomStatus(`Room ${room.roomId} synced. Your turn: ${players[playerIndex] === localPlayerId}`);
    }
  });
}

async function leaveRoom() {
  if (!room) return;
  const roomRef = ref(db, `rooms/${room.roomId}`);
  try {
    const nextPlayers = players.filter((id) => id !== localPlayerId);
    if (nextPlayers.length === 0) {
      await remove(roomRef);
    } else {
      await update(roomRef, {
        players: nextPlayers,
        lastActiveAt: Date.now(),
      });
    }
  } catch (err) {
    console.error('Failed to leave room:', err);
    roomStatus.textContent = `Leave failed: ${err.message || err}`;
  }

  if (roomUnsubscribe) {
    roomUnsubscribe();
    roomUnsubscribe = null;
  }

  room = null;
  players = [];
  playerIndex = 0;
  gameState = { markers: {}, turn: 0 };
  currentRoom.textContent = '—';
  updateRoomStatus('Room closed. Create a new room to start again.');
  if (playerLegend) playerLegend.innerHTML = '';
  if (turnStatus) turnStatus.textContent = 'Waiting for a room.';
  gamePanel.classList.add('hidden');
  board.innerHTML = '';
  createBoard();
}

async function main() {
  try {
    const cfg = await loadFirebaseConfig();
    console.log('Loaded Firebase config projectId:', cfg.projectId);
    app = initializeApp(cfg);
    db = getDatabase(app);
    auth = getAuth(app);
  } catch (err) {
    console.error('Failed to initialize Firebase:', err);
    roomStatus.textContent = `Firebase init failed: ${err.message || err}`;
    return;
  }

  createBoard();
  createRoomButton.addEventListener('click', createRoom);
  joinRoomButton.addEventListener('click', joinRoom);
  leaveRoomButton.addEventListener('click', leaveRoom);
  if (showInstructionsButton) showInstructionsButton.addEventListener('click', openInstructions);
  if (closeInstructionsButton) closeInstructionsButton.addEventListener('click', closeInstructions);
  if (closeInstructionsBottom) closeInstructionsBottom.addEventListener('click', closeInstructions);
  if (instructionsModal) instructionsModal.addEventListener('click', (event) => {
    if (event.target === instructionsModal || event.target.id === 'instructions-backdrop') {
      closeInstructions();
    }
  });

  try {
    await init();
    console.log('Firebase initialized', auth.currentUser ? auth.currentUser.uid : '(no user)');
  } catch (err) {
    // init logs errors already
  }

  const debugButton = document.getElementById('debug-log-room');
  if (debugButton) debugButton.addEventListener('click', debugLogRoom);
}

function openInstructions() {
  if (!instructionsModal) return;
  instructionsModal.classList.remove('hidden');
}

function closeInstructions() {
  if (!instructionsModal) return;
  instructionsModal.classList.add('hidden');
}

main();
