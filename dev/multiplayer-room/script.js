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
const board = document.getElementById('board');

let app = null;
let db = null;
let auth = null;

let room = null;
let players = [];
let localPlayerId = null;
let playerIndex = 0;
let gameState = {
  positions: [],
  turn: 0,
};
let roomUnsubscribe = null;

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
  if (gameState.positions.includes(index)) return;

  gameState.positions.push(index);
  gameState.turn = (gameState.turn + 1) % players.length;
  saveRoomState();
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

function updateRoomStatus(text) {
  roomStatus.textContent = text;
}

async function saveRoomState() {
  if (!room) return;
  const roomRef = ref(db, `rooms/${room.roomId}`);
  try {
    await update(roomRef, {
      gameState,
      players,
      lastActiveAt: Date.now(),
    });
  } catch (err) {
    console.error('Failed to save room state:', err);
    roomStatus.textContent = `Save failed: ${err.message || err}`;
  }
}

async function createRoom() {
  const roomId = Math.random().toString(36).slice(2, 8).toUpperCase();
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
  updatePlayerCount();

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
    if (!room.players.includes(localPlayerId)) {
      players = [...room.players, localPlayerId];
      await update(roomRef, {
        players,
        lastActiveAt: Date.now(),
      });
    } else {
      players = [...room.players];
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
  updatePlayerCount();

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
    players = room.players || [];
    gameState = room.gameState || { positions: [], turn: 0 };
    playerIndex = players.indexOf(localPlayerId);
    currentRoom.textContent = room.roomId;
    renderBoard();
    updatePlayerCount();

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
  gameState = { positions: [], turn: 0 };
  currentRoom.textContent = '—';
  updateRoomStatus('Room closed. Create a new room to start again.');
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

  try {
    await init();
    console.log('Firebase initialized', auth.currentUser ? auth.currentUser.uid : '(no user)');
  } catch (err) {
    // init logs errors already
  }

  const debugButton = document.getElementById('debug-log-room');
  if (debugButton) debugButton.addEventListener('click', debugLogRoom);
}

main();
