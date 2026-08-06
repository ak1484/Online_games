import { initializeApp } from 'https://www.gstatic.com/firebasejs/9.22.0/firebase-app.js';
import { getFirestore, doc, setDoc, getDoc, updateDoc, onSnapshot, arrayUnion, arrayRemove, serverTimestamp } from 'https://www.gstatic.com/firebasejs/9.22.0/firebase-firestore.js';
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
  const userCredential = await signInAnonymously(auth);
  localPlayerId = userCredential.user.uid;
  roomStatus.textContent = 'Connected. Create or join a room.';
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
  const roomRef = doc(db, 'rooms', room.roomId);
  await updateDoc(roomRef, {
    gameState,
    players,
    lastActiveAt: serverTimestamp(),
  });
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

  const roomRef = doc(db, 'rooms', roomId);
  await setDoc(roomRef, {
    roomId,
    host: localPlayerId,
    players,
    gameState,
    createdAt: serverTimestamp(),
    lastActiveAt: serverTimestamp(),
  });

  subscribeRoom(roomId);
}

async function joinRoom() {
  const roomId = roomCodeInput.value.trim().toUpperCase();
  if (!roomId) {
    updateRoomStatus('Enter a valid room code.');
    return;
  }

  const roomRef = doc(db, 'rooms', roomId);
  const roomSnapshot = await getDoc(roomRef);
  if (!roomSnapshot.exists()) {
    updateRoomStatus(`Room ${roomId} does not exist.`);
    return;
  }

  room = roomSnapshot.data();
  if (!room.players.includes(localPlayerId)) {
    await updateDoc(roomRef, {
      players: arrayUnion(localPlayerId),
      lastActiveAt: serverTimestamp(),
    });
  }

  players = room.players.includes(localPlayerId) ? [...room.players] : [...room.players, localPlayerId];
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

  const roomRef = doc(db, 'rooms', roomId);
  roomUnsubscribe = onSnapshot(roomRef, (snapshot) => {
    const data = snapshot.data();
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
  const roomRef = doc(db, 'rooms', room.roomId);
  await updateDoc(roomRef, {
    players: arrayRemove(localPlayerId),
    lastActiveAt: serverTimestamp(),
  });

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

createRoomButton.addEventListener('click', createRoom);
joinRoomButton.addEventListener('click', joinRoom);
leaveRoomButton.addEventListener('click', leaveRoom);

async function main() {
  const cfg = await loadFirebaseConfig();
  app = initializeApp(cfg);
  db = getFirestore(app);
  auth = getAuth(app);

  createBoard();
  createRoomButton.addEventListener('click', createRoom);
  joinRoomButton.addEventListener('click', joinRoom);
  leaveRoomButton.addEventListener('click', leaveRoom);

  await init();
}

main();
