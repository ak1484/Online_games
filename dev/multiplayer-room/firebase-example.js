// Example Firebase initialization and session logic.

// import { initializeApp } from 'https://www.gstatic.com/firebasejs/9.22.0/firebase-app.js';
// import { getFirestore, doc, setDoc, getDoc, updateDoc, deleteDoc, onSnapshot } from 'https://www.gstatic.com/firebasejs/9.22.0/firebase-firestore.js';
// import { getAuth, signInAnonymously } from 'https://www.gstatic.com/firebasejs/9.22.0/firebase-auth.js';

// Uncomment and use this file when you have your Firebase credentials.

/*
import { initializeApp } from 'https://www.gstatic.com/firebasejs/9.22.0/firebase-app.js';
import { getFirestore, doc, setDoc, getDoc, updateDoc, deleteDoc, onSnapshot } from 'https://www.gstatic.com/firebasejs/9.22.0/firebase-firestore.js';
import { getAuth, signInAnonymously } from 'https://www.gstatic.com/firebasejs/9.22.0/firebase-auth.js';

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

async function signIn() {
  const userCredential = await signInAnonymously(auth);
  return userCredential.user.uid;
}

async function createRoom(roomId, playerId) {
  const roomRef = doc(db, 'rooms', roomId);
  await setDoc(roomRef, {
    host: playerId,
    players: [playerId],
    gameState: { positions: [], turn: 0 },
    createdAt: Date.now(),
    lastActiveAt: Date.now(),
    status: 'waiting'
  });
}

async function joinRoom(roomId, playerId) {
  const roomRef = doc(db, 'rooms', roomId);
  await updateDoc(roomRef, {
    players: arrayUnion(playerId),
    lastActiveAt: Date.now()
  });
}

async function subscribeRoom(roomId, callback) {
  const roomRef = doc(db, 'rooms', roomId);
  return onSnapshot(roomRef, (snapshot) => {
    callback(snapshot.data());
  });
}

async function leaveRoom(roomId, playerId) {
  const roomRef = doc(db, 'rooms', roomId);
  await updateDoc(roomRef, {
    players: arrayRemove(playerId),
    lastActiveAt: Date.now()
  });
}
*/
