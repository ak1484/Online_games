// ============ THIS OR THAT GAME ============
// Firebase real-time multiplayer support

// ============ FIREBASE SETUP ============
let app = null;
let db = null;
let auth = null;
let currentUser = null;
let gameId = null;
let gameRef = null;
let unsubscribers = [];

// ============ QUESTION BANK ============
const QUESTIONS = {
  romantic: [
    { a: "Slow dancing in the kitchen", b: "Running through sprinklers like kids" },
    { a: "Candlelit dinner at home", b: "Picnic in the park with sandwiches" },
    { a: "Love notes slipped into pockets", b: "Surprise breakfast in bed" },
    { a: "Watching sunset together", b: "Stargazing all night" },
    { a: "Matching tattoos", b: "Couple's massage" },
    { a: "Surprise date night", b: "Spontaneous road trip" },
    { a: "Foreplay that lasts 2 hours", b: "Quickies that leave you wanting more" },
    { a: "Cooking together", b: "Ordering takeout and eating in bed" },
    { a: "Romantic getaway", b: "Staycation doing absolutely nothing" },
    { a: "Handwritten love letter", b: "Voice memo full of sappiness" },
    { a: "Surprise them with their favorite snack", b: "Remember that story they told once and act on it" },
    { a: "Slow morning cuddles", b: "Morning quickie before responsibilities" },
    { a: "Dinner reservations at 8pm sharp", b: "Pizza on the floor at midnight" },
    { a: "A couples' spa day", b: "A couples' adventure day" },
    { a: "Dream vacation to Paris", b: "Dream vacation to a tiny cabin with no WiFi" },
  ],
  silly: [
    { a: "Sneezing and farting simultaneously", b: "Tripping over nothing and blaming it on someone" },
    { a: "Being caught singing in the shower", b: "Being caught talking to yourself in public" },
    { a: "Having a new secretly weird smell", b: "Having a weird sleep talking habit" },
    { a: "Killer clowns chasing you", b: "Chasing a rogue shopping cart in the wind" },
    { a: "Always having toilet paper when you need it", b: "Always finding money in pockets" },
    { a: "Laughing so hard you cry", b: "Crying so hard you laugh" },
    { a: "Being the funny one", b: "Being the smart one" },
    { a: "Accidentally calling your partner by your ex's name", b: "Forgetting your anniversary" },
    { a: "Saying 'nothing' when clearly something is wrong", b: "Going full detective mode when asked what's wrong" },
    { a: "Food coma nap", b: "Coffee and power through" },
    { a: "Being perpetually late", b: "Being early but twiddling thumbs awkwardly" },
    { a: "Discovering you've been saying a word wrong your whole life", b: "Realizing you've been pronouncing someone's name wrong for years" },
    { a: "The toilet paper roll running out and not replacing it", b: "Leaving wet towels on the bed" },
    { a: "Being caught gossiping", b: "Being caught checking someone out" },
    { a: "Sarcasm as a love language", b: "Physical touch as a love language" },
  ],
  hypothetical: [
    { a: "Living forever as zombies", b: "Only living one more day as a billionaire" },
    { a: "Knowing when you die the exact date", b: "Knowing how you will die but not when" },
    { a: "Being famous but broke", b: "Being rich but anonymous" },
    { a: "Never being able to lie", b: "Never being able to be told a lie" },
    { a: "Having a tail", b: "Having wings (but can't fly far)" },
    { a: "Reliving the same day forever", b: "Skipping ahead 10 years every Monday" },
    { a: "Having a personal chef", b: "Having a personal chauffeur" },
    { a: "Reading minds", b: "Predicting the future (but only 30 seconds ahead)" },
    { a: "Never having to sleep", b: "Never having to eat" },
    { a: "Being invisible for a day", b: "Being able to fly for a day" },
    { a: "Time travel to fix one mistake", b: "See your whole future laid out before you" },
    { a: "Your partner becomes a ghost", b: "You become a ghost and watch your partner date again" },
    { a: "Wake up married to your partner but in a parallel universe", b: "Never meet your partner but become wildly successful" },
    { a: "A genie grants you 3 wishes but your partner gets double", b: "A genie grants your partner 3 wishes and you get none" },
    { a: "Only be able to whisper", b: "Only be able to scream" },
  ],
  hots: [
    { a: "Romantic comedies", b: "Horror movies" },
    { a: "Cats over dogs", b: "Dogs over cats" },
    { a: "Morning person", b: "Night owl" },
    { a: "Texting as communication", b: "In-person conversations" },
    { a: "Netflix and chill", b: "Actual Netflix and actual chilling" },
    { a: "Beach vacation", b: "Mountain vacation" },
    { a: "Introvert", b: "Extrovert" },
    { a: "Plan everything", b: "Live spontaneously" },
    { a: "Sweet breakfast", b: "Savory breakfast" },
    { a: "Summer over winter", b: "Winter over summer" },
    { a: "First date at a fancy restaurant", b: "First date at a food truck" },
    { a: "99 problems but a pet ain't one", b: "Never having to clean up pet mess" },
    { a: "The person who texts first", b: "The person who plans dates" },
    { a: "Sushi for the rest of your life", b: "Tacos for the rest of your life" },
    { a: "Co-writers on a couples' bucket list", b: "Co-savers of a couples' memory jar" },
  ],
  deep: [
    { a: "Being deeply understood", b: "Being deeply desired" },
    { a: "Having common dreams", b: "Having complementary personalities" },
    { a: "Growing old together", b: "Forever young at heart (and in body)" },
    { a: "The person who challenges you", b: "The person who supports you unconditionally" },
    { a: "Falling in love slowly", b: "Falling in love fast and hard" },
    { a: "Your partner's biggest fear", b: "Your partner's biggest dream" },
    { a: "The conversation you avoid", b: "The conversation you've been dreading" },
    { a: "What you'd change about your first year together", b: "What you'd never change about your first year together" },
    { a: "When the magic fades", b: "When the magic becomes something deeper" },
    { a: "The person you were before meeting them", b: "The person you became after meeting them" },
    { a: "Your partner's love in your language", b: "Your partner's love in their language" },
    { a: "Being each other's safe place", b: "Being each other's adventure" },
    { a: "The moment you knew", b: "The moment they knew" },
    { a: "Compatibility over passion", b: "Passion over compatibility" },
    { a: "What you fight about", b: "How you fight" },
  ]
};

// Curveball questions - extra spicy
const CURVEBALLS = [
  { a: "Your partner in a sumo suit", b: "Your partner in a tuxedo doing dishes" },
  { a: "The last person you thought was cute", b: "That person from your dream last week" },
  { a: "Your biggest turn-off", b: "Your biggest surprise turn-on" },
  { a: "What you Googled last", b: "What you wish you could Google" },
  { a: "Your celebrity crush", b: "Your celebrity 'I'd actually do them' list" },
  { a: "A redo of your worst date together", b: "A redo of someone else's worst date" },
  { a: "Your partner's cooking", b: "Your partner's dancing (private)" },
  { a: "The song you cry to", b: "The song that makes you feel invincible" },
  { a: "Your browser history", b: "Your voice memo drafts" },
  { a: "Being caught arguing", b: "Being caught being disgustingly cute" },
  { a: "Your third date spot", b: "The place you realized it was real" },
  { a: "That thing they do that annoys you", b: "That thing they do that nobody else could replicate" },
  { a: "Your most embarrassing moment together", b: "Your proudest moment together" },
  { a: "The couple you both find adorable", b: "The couple you both find cringey" },
  { a: "Your partner at 80", b: "Your partner in a superpower era" },
];

// Fun facts for game end
const FUN_FACTS = [
  "You're officially a power couple! 💪",
  "You've either know each other really well or are master bluffers! 🎭",
  "This was either very revealing or totally chaotic! 🔮",
  "The fact you're playing this = relationship goals! 💕",
  "Either soulmates or professional arguers! ⚖️",
  "Scientists say couples who argue about This or That stay together! 📚",
  "You're either very compatible or very competitive! 🏆",
  "That was either wholesome or unhinged and we love it! 🎉",
];

// ============ GAME STATE ============
let gameState = {
  mode: 'local', // 'local' or 'online'
  playerNumber: null, // 1 or 2
  player1: '',
  player2: '',
  currentPlayer: 1,
  round: 1,
  totalRounds: 5,
  category: 'all',
  questions: [],
  currentQuestion: null,
  currentOption: null,
  picks: { 1: 0, 2: 0 },
  matches: 0,
  roundChoices: {},
  history: [],
  gameId: null,
  started: false,
  roundPickCount: 0 // tracks how many picks in current round (for online sync)
};

// ============ DOM ELEMENTS ============
const setupScreen = document.getElementById('setup-screen');
const gameScreen = document.getElementById('game-screen');
const resultsScreen = document.getElementById('results-screen');

const player1Input = document.getElementById('player1-name');
const player2Input = document.getElementById('player2-name');
const startGameBtn = document.getElementById('start-game-btn');

const turnPlayer1 = document.getElementById('turn-player-1');
const turnPlayer2 = document.getElementById('turn-player-2');
const questionCategory = document.getElementById('question-category');
const questionText = document.getElementById('question-text');
const optionA = document.getElementById('option-a');
const optionB = document.getElementById('option-b');

const reasonModal = document.getElementById('reason-modal');
const reasonPrompt = document.getElementById('reason-prompt');
const reasonOptionText = document.getElementById('reason-option-text');
const reasonInput = document.getElementById('reason-input');
const skipReasonBtn = document.getElementById('skip-reason-btn');
const submitReasonBtn = document.getElementById('submit-reason-btn');

const roundNumber = document.getElementById('round-number');
const totalRoundsDisplay = document.getElementById('total-rounds');

const playAgainBtn = document.getElementById('play-again-btn');
const newPlayersBtn = document.getElementById('new-players-btn');
const finalPlayer1 = document.getElementById('final-player-1');
const finalPlayer2 = document.getElementById('final-player-2');
const score1Picks = document.getElementById('score-1-picks');
const score2Picks = document.getElementById('score-2-picks');
const funFact = document.getElementById('fun-fact');

// Connection status
const connectionStatus = document.getElementById('connection-status');

// ============ INITIALIZATION ============
async function init() {
  setupEventListeners();

  // Try to auto-join if we have a game in progress
  const savedGameId = sessionStorage.getItem('tot_game_id');
  if (savedGameId) {
    await tryReconnect(savedGameId);
  }
}

async function tryReconnect(gameIdToTry) {
  try {
    const { loadFirebaseConfig } = await import('./firebase-loader.js');
    const config = await loadFirebaseConfig();

    const { initializeApp } = await import('https://www.gstatic.com/firebasejs/9.22.0/firebase-app.js');
    const { getDatabase, ref, get } = await import('https://www.gstatic.com/firebasejs/9.22.0/firebase-database.js');

    app = initializeApp(config);
    db = getDatabase(app);

    const gameSnap = await get(ref(db, `tot_games/${gameIdToTry}`));
    if (gameSnap.exists()) {
      const gameData = gameSnap.val();
      if (gameData.status !== 'finished') {
        const playerName = localStorage.getItem('tot_player_name') || '';
        if (confirm(`You have a game in progress! Join it as ${playerName}?`)) {
          await joinGameById(gameIdToTry, playerName);
          return;
        }
      }
    }
    sessionStorage.removeItem('tot_game_id');
  } catch (e) {
    console.warn('Could not reconnect:', e);
    sessionStorage.removeItem('tot_game_id');
  }
}

function setupEventListeners() {
  // Mode selection
  document.querySelectorAll('.mode-card').forEach(card => {
    card.addEventListener('click', () => {
      const mode = card.dataset.mode;
      selectMode(mode);
    });
  });

  // Back to mode select
  const backToModeSelect = document.getElementById('back-to-mode-select');
  backToModeSelect?.addEventListener('click', () => {
    leaveGame();
    showModeSelection();
  });

  // Create game
  const createGameBtn = document.getElementById('create-game-btn');
  createGameBtn?.addEventListener('click', createOnlineGame);

  // Join game
  const joinGameBtn = document.getElementById('join-game-btn');
  joinGameBtn?.addEventListener('click', joinOnlineGame);

  const joinCodeInput = document.getElementById('join-code-input');
  joinCodeInput?.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') joinOnlineGame();
  });

  const playerNameInput = document.getElementById('player-name-input');
  playerNameInput?.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') createOnlineGame();
  });

  // Copy code
  const copyCodeBtn = document.getElementById('copy-code-btn');
  copyCodeBtn?.addEventListener('click', () => {
    const codeDisplay = document.getElementById('code-display');
    navigator.clipboard.writeText(codeDisplay.textContent).then(() => {
      copyCodeBtn.textContent = 'Copied!';
      setTimeout(() => copyCodeBtn.textContent = 'Copy', 2000);
    });
  });

  // Cancel online (both cancel buttons)
  document.querySelectorAll('[id^="cancel-online-btn"]').forEach(btn => {
    btn.addEventListener('click', () => {
      leaveGame();
      showModeSelection();
    });
  });

  // Local mode - category selection
  document.querySelectorAll('.cat-chip').forEach(chip => {
    chip.addEventListener('click', () => {
      document.querySelectorAll('.cat-chip').forEach(c => c.classList.remove('active'));
      chip.classList.add('active');
      gameState.category = chip.dataset.category;
    });
  });

  // Local mode - start game
  startGameBtn?.addEventListener('click', startLocalGame);

  // Option selection
  optionA.addEventListener('click', () => selectOption('a'));
  optionB.addEventListener('click', () => selectOption('b'));

  // Reason modal
  skipReasonBtn.addEventListener('click', submitReason);
  submitReasonBtn.addEventListener('click', submitReason);
  reasonInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter' && reasonInput.value.trim()) {
      submitReason();
    }
  });

  // Results screen
  playAgainBtn.addEventListener('click', playAgain);
  newPlayersBtn.addEventListener('click', newPlayers);

  // Enter key on inputs
  player1Input?.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') player2Input?.focus();
  });
  player2Input?.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') startLocalGame();
  });
}

// ============ MODE SELECTION ============
function selectMode(mode) {
  // Hide all screens
  ['mode-selection', 'local-section', 'join-section', 'waiting-section', 'game-screen', 'results-screen'].forEach(id => {
    const el = document.getElementById(id);
    if (el) {
      el.classList.remove('active');
      el.classList.add('hidden');
    }
  });

  if (mode === 'local') {
    gameState.mode = 'local';
    document.getElementById('local-section').classList.remove('hidden');
    document.getElementById('local-section').classList.add('active');
  } else {
    gameState.mode = 'online';
    document.getElementById('join-section').classList.remove('hidden');
    document.getElementById('join-section').classList.add('active');
  }
}

function showModeSelection() {
  // Hide all screens
  ['mode-selection', 'local-section', 'join-section', 'waiting-section', 'game-screen', 'results-screen'].forEach(id => {
    const el = document.getElementById(id);
    if (el) {
      el.classList.remove('active');
      el.classList.add('hidden');
    }
  });
  // Show mode selection
  document.getElementById('mode-selection').classList.remove('hidden');
  document.getElementById('mode-selection').classList.add('active');
  cleanupFirebase();
}

// ============ FIREBASE HELPERS ============
async function initFirebase() {
  if (db && auth && currentUser) return;

  const { loadFirebaseConfig } = await import('./firebase-loader.js');
  const config = await loadFirebaseConfig();
  const { initializeApp } = await import('https://www.gstatic.com/firebasejs/9.22.0/firebase-app.js');
  const { getDatabase } = await import('https://www.gstatic.com/firebasejs/9.22.0/firebase-database.js');
  const { getAuth, signInAnonymously } = await import('https://www.gstatic.com/firebasejs/9.22.0/firebase-auth.js');

  // Only initialize app once
  if (!app) {
    app = initializeApp(config);
  }
  db = getDatabase(app);
  auth = getAuth(app);

  // Wait for auth to complete
  if (!currentUser) {
    const userCredential = await signInAnonymously(auth);
    currentUser = userCredential.user;
  }
}

function cleanupFirebase() {
  unsubscribers.forEach(unsub => unsub());
  unsubscribers = [];
  gameRef = null;
  gameId = null;
}

// ============ ONLINE GAME ============
async function createOnlineGame() {
  const playerNameInput = document.getElementById('player-name-input');
  const playerName = playerNameInput?.value.trim();

  if (!playerName) {
    alert('Please enter your name');
    return;
  }

  try {
    await initFirebase();
  } catch (err) {
    console.error('Firebase init failed:', err);
    alert('Failed to connect to Firebase. Make sure you have internet access and Firebase is configured correctly.');
    return;
  }

  const { ref, set } = await import('https://www.gstatic.com/firebasejs/9.22.0/firebase-database.js');

  // Generate 4-letter code
  const code = generateJoinCode();

  // Create game
  gameId = code;
  gameRef = ref(db, `tot_games/${gameId}`);

  // Pre-select exactly 5 questions when room is created - this is the definitive question set for this game
  const gameQuestions = generateFreshQuestions(); // Always exactly 5 unique questions

  const gameData = {
    status: 'waiting',
    code: code,
    player1: {
      id: currentUser.uid,
      name: playerName,
      picks: 0,
      ready: true
    },
    player2: null,
    currentTurn: 1,
    round: 1,
    totalRounds: 5,
    category: gameState.category,
    questions: gameQuestions,
    currentQuestion: null,
    picks: { 1: 0, 2: 0 },
    matches: 0,
    roundChoices: {},
    history: [],
    roundPickCount: 0,
    createdAt: Date.now()
  };

  try {
    await set(gameRef, gameData);
  } catch (err) {
    console.error('Failed to create game:', err);
    alert('Failed to create game. Check Firebase rules are deployed and Anonymous Auth is enabled.');
    return;
  }

  // Save to localStorage
  localStorage.setItem('tot_game_id', gameId);
  localStorage.setItem('tot_player_name', playerName);
  gameState.playerNumber = 1;
  gameState.player1 = playerName;
  gameState.questions = gameQuestions; // Store locally too for reference

  // Show waiting screen - hide all, show waiting
  ['mode-selection', 'local-section', 'join-section', 'waiting-section', 'game-screen', 'results-screen'].forEach(id => {
    const el = document.getElementById(id);
    if (el) {
      el.classList.remove('active');
      el.classList.add('hidden');
    }
  });
  document.getElementById('waiting-section').classList.remove('hidden');
  document.getElementById('waiting-section').classList.add('active');

  const codeDisplay = document.getElementById('code-display');
  codeDisplay.textContent = code;

  // Listen for player 2
  subscribeToGame();
}

async function joinOnlineGame() {
  const playerNameInput = document.getElementById('player-name-input');
  const joinCodeInput = document.getElementById('join-code-input');
  const playerName = playerNameInput?.value.trim();
  const code = joinCodeInput?.value.trim().toUpperCase();

  if (!playerName) {
    alert('Please enter your name');
    return;
  }
  if (!code || code.length !== 4) {
    alert('Please enter a valid 4-letter code');
    return;
  }

  await initFirebase();
  const { ref, get, update } = await import('https://www.gstatic.com/firebasejs/9.22.0/firebase-database.js');

  gameId = code;
  gameRef = ref(db, `tot_games/${gameId}`);

  const snap = await get(gameRef);

  if (!snap.exists()) {
    alert('Game not found! Check the code and try again.');
    return;
  }

  const gameData = snap.val();

  if (gameData.status !== 'waiting') {
    alert('This game has already started or finished!');
    return;
  }

  if (gameData.player1?.id === currentUser.uid) {
    alert('You cannot join your own game!');
    return;
  }

  // Get the first question
  const questions = gameData.questions || [];
  const firstQuestion = questions[0] || null;

  // Join as player 2 - set status to playing and set first question
  await update(gameRef, {
    player2: {
      id: currentUser.uid,
      name: playerName,
      picks: 0,
      ready: true
    },
    status: 'playing',
    currentQuestion: firstQuestion,
    currentTurn: 1,
    roundPickCount: 0
  });

  localStorage.setItem('tot_game_id', gameId);
  localStorage.setItem('tot_player_name', playerName);
  gameState.playerNumber = 2;

  // Create updated gameData with player2 info (since Firebase hasn't sent us the update yet)
  const updatedGameData = {
    ...gameData,
    player2: {
      id: currentUser.uid,
      name: playerName,
      picks: 0,
      ready: true
    },
    status: 'playing',
    currentQuestion: firstQuestion,
    currentTurn: 1,
    roundPickCount: 0
  };

  // Start the game locally with updated data
  startOnlineGame(updatedGameData, gameId);
}

async function joinGameById(id, playerName) {
  await initFirebase();
  const { ref, get } = await import('https://www.gstatic.com/firebasejs/9.22.0/firebase-database.js');

  gameId = id;
  gameRef = ref(db, `tot_games/${gameId}`);

  const snap = await get(gameRef);

  if (!snap.exists()) {
    alert('Game not found!');
    showModeSelection();
    return;
  }

  const gameData = snap.val();
  const playerSlot = gameData.player1?.id === currentUser.uid ? 1 : 2;

  if (playerSlot === 1) {
    gameState.playerNumber = 1;
    gameState.player1 = gameData.player1.name;
  } else {
    gameState.playerNumber = 2;
    gameState.player2 = gameData.player1.name;
  }

  startOnlineGame(gameData, gameId);
}

function subscribeToGame() {
  if (!gameRef) return;

  import('https://www.gstatic.com/firebasejs/9.22.0/firebase-database.js').then(({ ref: dbRef, onValue }) => {
    const unsubscribe = onValue(gameRef, (snap) => {
      if (!snap.exists()) {
        alert('Game was deleted!');
        leaveGame();
        showModeSelection();
        return;
      }

      const data = snap.val();

      // Update connection status
      updateConnectionStatus('connected');

      // Check if game started (player 2 joined)
      if (data.status === 'playing' && !gameState.started) {
        gameState.started = true;
        startOnlineGame(data, gameId);
        return;
      }

      // Check if player 2 joined waiting room
      if (data.player2 && data.status === 'waiting') {
        const waitingText = document.getElementById('waiting-text');
        if (waitingText) {
          waitingText.textContent = `${data.player2.name} joined! Game starting...`;
        }
      }

      // Check for game end
      if (data.status === 'finished') {
        handleGameEnd(data);
      }
    });

    unsubscribers.push(unsubscribe);
  });
}

function updateConnectionStatus(status) {
  if (!connectionStatus) return;
  connectionStatus.className = 'connection-status ' + status;
  connectionStatus.innerHTML = status === 'connected'
    ? '🟢 Connected'
    : '🔴 Reconnecting...';
}

function startOnlineGame(gameData, gId) {
  gameId = gId;
  gameState.mode = 'online';
  gameState.started = true;
  gameState.player1 = gameData.player1.name;
  gameState.player2 = gameData.player2?.name || 'Waiting...';
  gameState.round = gameData.round || 1;
  gameState.totalRounds = gameData.totalRounds || 5;
  gameState.picks = gameData.picks || { 1: 0, 2: 0 };
  gameState.matches = gameData.matches || 0;
  gameState.roundChoices = gameData.roundChoices || {};
  gameState.history = gameData.history || [];
  gameState.questions = gameData.questions || [];
  gameState.currentPlayer = gameData.currentTurn || 1;
  gameState.category = gameData.category || 'all';
  gameState.roundPickCount = gameData.roundPickCount || 0;

  // Set first question if not set
  const firstQuestion = gameData.currentQuestion || gameState.questions[0] || null;
  gameState.currentQuestion = firstQuestion;

  // Hide all screens, show game
  showScreen('game');

  setupOnlineSync();
  updateTurnIndicator();
  showOnlineQuestion(firstQuestion);

  // Show connection status
  if (connectionStatus) {
    connectionStatus.style.display = 'block';
  }
}

function setupOnlineSync() {
  import('https://www.gstatic.com/firebasejs/9.22.0/firebase-database.js').then(({ ref: dbRef, onValue }) => {
    const unsubscribe = onValue(gameRef, (snap) => {
      if (!snap.exists()) return;

      const data = snap.val();

      // Update other player's info
      if (data.player2 && !gameState.player2) {
        gameState.player2 = data.player2.name;
        updateTurnIndicator();
      }

      // Sync turn and round
      gameState.currentPlayer = data.currentTurn || 1;
      gameState.round = data.round || 1;
      gameState.picks = data.picks || { 1: 0, 2: 0 };
      gameState.matches = data.matches || 0;
      gameState.roundChoices = data.roundChoices || {};
      gameState.questions = data.questions || gameState.questions;
      gameState.roundPickCount = data.roundPickCount || 0;

      updateTurnIndicator();
      document.getElementById('round-number').textContent = gameState.round;
      document.getElementById('total-rounds').textContent = gameState.totalRounds || 5;

      // Check if it's our turn
      const isMyTurn = gameState.currentPlayer === gameState.playerNumber;

      if (isMyTurn && data.status === 'playing') {
        enableOptions();
      } else {
        disableOptions();
      }

      // Check for new question
      if (data.currentQuestion && (!gameState.currentQuestion ||
          questionKey(data.currentQuestion) !== questionKey(gameState.currentQuestion))) {
        gameState.currentQuestion = data.currentQuestion;
        showOnlineQuestion(data.currentQuestion);
      }

      // Handle game end
      if (data.status === 'finished') {
        handleGameEnd(data);
      }
    });

    unsubscribers.push(unsubscribe);
  });
}

function questionKey(question) {
  return question ? `${question.a}|${question.b}` : '';
}

function showOnlineQuestion(q) {
  if (!q) {
    questionCategory.textContent = '🎲 ' + (gameState.category || 'ALL').toUpperCase();
    questionText.textContent = 'Get ready...';
    return;
  }

  const catLabels = {
    romantic: '💕 Romantic',
    silly: '😂 Silly',
    hypothetical: '🌈 Hypothetical',
    hots: '🔥 Hot Takes',
    deep: '🧠 Deep',
    curveball: '🌀 Curveball!'
  };

  questionCategory.textContent = catLabels[q.category] || '🎲';
  questionCategory.className = 'question-category ' + (q.category === 'curveball' ? 'curveball' : '');
  questionText.textContent = `${q.a} ... OR ... ${q.b}?`;
  optionA.querySelector('.option-text').textContent = q.a;
  optionB.querySelector('.option-text').textContent = q.b;
}

function disableOptions() {
  optionA.disabled = true;
  optionB.disabled = true;
}

function enableOptions() {
  optionA.disabled = false;
  optionB.disabled = false;
}

async function leaveGame() {
  // If we're player 1 and game is still waiting, delete it
  const roomToDelete = gameRef;
  if (roomToDelete && gameState.playerNumber === 1 && !gameState.started) {
    try {
      const { set } = await import('https://www.gstatic.com/firebasejs/9.22.0/firebase-database.js');
      await set(roomToDelete, null);
    } catch (e) {
      console.warn('Could not delete game:', e);
    }
  }

  cleanupFirebase();
  sessionStorage.removeItem('tot_game_id');
  gameState = {
    mode: 'local',
    playerNumber: null,
    player1: '',
    player2: '',
    currentPlayer: 1,
    round: 1,
    totalRounds: 5,
    category: 'all',
    questions: [],
    currentQuestion: null,
    currentOption: null,
    picks: { 1: 0, 2: 0 },
    history: [],
    gameId: null,
    started: false
  };
  showModeSelection();
}

// ============ LOCAL GAME ============
function startLocalGame() {
  const p1 = player1Input.value.trim() || 'Player 1';
  const p2 = player2Input.value.trim() || 'Player 2';

  gameState.player1 = p1;
  gameState.player2 = p2;
  gameState.currentPlayer = 1;
  gameState.round = 1;
  gameState.picks = { 1: 0, 2: 0 };
  gameState.history = [];
  gameState.mode = 'local';

  // Generate exactly 5 fresh unique questions for this game
  gameState.questions = generateFreshQuestions();
  gameState.totalRounds = 5; // Always exactly 5 rounds

  // Show game screen
  showScreen('game');
  updateTurnIndicator();
  showLocalQuestion();
}

function showLocalQuestion() {
  const q = gameState.questions[gameState.round - 1];
  gameState.currentQuestion = q;

  const catLabels = {
    romantic: '💕 Romantic',
    silly: '😂 Silly',
    hypothetical: '🌈 Hypothetical',
    hots: '🔥 Hot Takes',
    deep: '🧠 Deep',
    curveball: '🌀 Curveball!'
  };

  questionCategory.textContent = catLabels[q.category] || '🎲';
  questionCategory.className = 'question-category ' + (q.category === 'curveball' ? 'curveball' : '');

  questionText.textContent = `${q.a} ... OR ... ${q.b}?`;
  optionA.querySelector('.option-text').textContent = q.a;
  optionB.querySelector('.option-text').textContent = q.b;

  roundNumber.textContent = gameState.round;
  totalRoundsDisplay.textContent = gameState.totalRounds;

  optionA.disabled = false;
  optionB.disabled = false;
}

// ============ SHARED GAME LOGIC ============
// Fisher-Yates shuffle for proper randomization
function shuffleArray(array) {
  const arr = [...array]; // Create a copy to avoid mutating original
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function buildQuestionPool() {
  const pool = [];
  const cats = gameState.category === 'all'
    ? ['romantic', 'silly', 'hypothetical', 'hots', 'deep']
    : [gameState.category];

  cats.forEach(cat => {
    if (QUESTIONS[cat]) {
      pool.push(...QUESTIONS[cat].map(q => ({ ...q, category: cat })));
    }
  });

  // Add 2-3 curveballs (using our proper shuffle)
  const curveballCount = Math.min(3, Math.floor(pool.length / 5));
  const shuffledCurveballs = shuffleArray(CURVEBALLS);
  for (let i = 0; i < curveballCount; i++) {
    pool.push({ ...shuffledCurveballs[i], category: 'curveball' });
  }

  return pool;
}

function generateFreshQuestions() {
  // Build a fresh pool and return exactly 5 UNIQUE questions
  const pool = buildQuestionPool();
  const shuffled = shuffleArray(pool);
  const questions = shuffled.slice(0, 5);

  // Safety check: ensure all 5 questions are unique
  const seen = new Set();
  const uniqueQuestions = [];
  for (const q of questions) {
    const key = q.a + '|' + q.b;
    if (!seen.has(key)) {
      seen.add(key);
      uniqueQuestions.push(q);
    }
    if (uniqueQuestions.length >= 5) break;
  }

  // If somehow we don't have 5 unique, pad from pool
  while (uniqueQuestions.length < 5) {
    const q = pool[uniqueQuestions.length % pool.length];
    const key = q.a + '|' + q.b;
    if (!seen.has(key)) {
      seen.add(key);
      uniqueQuestions.push(q);
    } else {
      // Pick a random one from remaining pool
      const randomIdx = Math.floor(Math.random() * pool.length);
      const randomQ = pool[randomIdx];
      const randomKey = randomQ.a + '|' + randomQ.b;
      if (!seen.has(randomKey)) {
        seen.add(randomKey);
        uniqueQuestions.push(randomQ);
      }
    }
  }

  return uniqueQuestions;
}

function selectOption(option) {
  const q = gameState.currentQuestion;
  if (!q) return;

  optionA.disabled = true;
  optionB.disabled = true;

  gameState.currentOption = option;
  gameState.currentAnswer = option === 'a' ? q.a : q.b;

  // Update reason modal
  const playerName = gameState.currentPlayer === 1 ? gameState.player1 : gameState.player2;
  reasonPrompt.textContent = `${playerName}, why did you pick?`;
  reasonOptionText.textContent = gameState.currentAnswer;
  reasonInput.value = '';

  // Show modal
  reasonModal.classList.remove('hidden');
  reasonInput.focus();

  // Update picks
  gameState.picks[gameState.currentPlayer]++;
}

async function submitReason() {
  const reason = reasonInput.value.trim();
  const playerName = gameState.currentPlayer === 1 ? gameState.player1 : gameState.player2;

  console.log(`${playerName} picked: ${gameState.currentAnswer}`);
  if (reason) {
    console.log(`Reason: ${reason}`);
  }

  // Record in history
  gameState.history.push({
    round: gameState.round,
    player: gameState.currentPlayer,
    playerName: playerName,
    option: gameState.currentOption,
    answer: gameState.currentAnswer,
    reason: reason || 'No reason given 😅'
  });

  // Hide modal
  reasonModal.classList.add('hidden');

  recordRoundChoice();

  if (gameState.mode === 'online') {
    await submitOnlinePick();
  } else {
    nextLocalTurn();
  }
}

function recordRoundChoice() {
  gameState.roundChoices[gameState.round] = {
    ...(gameState.roundChoices[gameState.round] || {}),
    [gameState.currentPlayer]: gameState.currentOption
  };

  const choices = gameState.roundChoices[gameState.round];
  if (choices[1] && choices[2] && choices[1] === choices[2]) {
    gameState.matches++;
  }
}

async function submitOnlinePick() {
  const { ref, update } = await import('https://www.gstatic.com/firebasejs/9.22.0/firebase-database.js');

  // Increment round pick count
  const currentPickCount = (gameState.roundPickCount || 0) + 1;
  gameState.roundPickCount = currentPickCount;

  // Check if both players have picked (2 picks per round)
  if (currentPickCount >= 2) {
    // Round complete - move to next round
    const nextRound = gameState.round + 1;

    if (nextRound > gameState.totalRounds) {
      // Game over
      await update(gameRef, {
        status: 'finished',
        picks: gameState.picks,
        matches: gameState.matches,
        roundChoices: gameState.roundChoices,
        history: gameState.history,
        round: gameState.round,
        roundPickCount: 0
      });
    } else {
      // Next round - reset pick count
      const nextQuestion = gameState.questions[nextRound - 1];
      const nextPlayer = gameState.currentPlayer === 1 ? 2 : 1;
      await update(gameRef, {
        round: nextRound,
        currentTurn: nextPlayer,
        currentQuestion: nextQuestion,
        picks: gameState.picks,
        matches: gameState.matches,
        roundChoices: gameState.roundChoices,
        history: gameState.history,
        roundPickCount: 0
      });

      // Reset local pick count
      gameState.roundPickCount = 0;
    }
  } else {
    // Wait for other player
    const nextPlayer = gameState.currentPlayer === 1 ? 2 : 1;
    await update(gameRef, {
      currentTurn: nextPlayer,
      picks: gameState.picks,
      matches: gameState.matches,
      roundChoices: gameState.roundChoices,
      history: gameState.history,
      roundPickCount: currentPickCount
    });
  }
}

function nextLocalTurn() {
  // Alternate players
  const wasPlayer1 = gameState.currentPlayer === 1;
  gameState.currentPlayer = wasPlayer1 ? 2 : 1;

  // Check if BOTH players have picked this round (we just switched back to player 1)
  if (gameState.currentPlayer === 1) {
    // Both players have picked - move to next round
    gameState.round++;

    // Check if game over (after both players picked for round N)
    if (gameState.round > gameState.totalRounds) {
      showResults();
      return;
    }
  }

  updateTurnIndicator();
  showLocalQuestion();
}

function updateTurnIndicator() {
  const p1Active = gameState.currentPlayer === 1;
  const p2Active = gameState.currentPlayer === 2;

  turnPlayer1.classList.toggle('active', p1Active);
  turnPlayer2.classList.toggle('active', p2Active);

  turnPlayer1.querySelector('.turn-avatar').textContent = '👤';
  turnPlayer2.querySelector('.turn-avatar').textContent = '👤';
  turnPlayer1.querySelector('.turn-name').textContent = gameState.player1 || 'Player 1';
  turnPlayer2.querySelector('.turn-name').textContent = gameState.player2 || 'Player 2';

  // For online mode - highlight whose turn it is
  if (gameState.mode === 'online') {
    const isMyTurn = gameState.currentPlayer === gameState.playerNumber;

    document.querySelectorAll('.turn-label').forEach(l => l.textContent = '');
    const activeLabel = p1Active
      ? turnPlayer1.querySelector('.turn-label')
      : turnPlayer2.querySelector('.turn-label');
    activeLabel.textContent = isMyTurn ? 'YOUR TURN!' : 'THEIR TURN';
    activeLabel.style.color = isMyTurn ? '#22c55e' : '#f59e0b';
    activeLabel.style.fontWeight = '800';
  }
}

function showResults() {
  showScreen('results');

  finalPlayer1.querySelector('.score-name').textContent = gameState.player1;
  finalPlayer2.querySelector('.score-name').textContent = gameState.player2;
  score1Picks.textContent = `${gameState.picks[1]} picks`;
  score2Picks.textContent = `${gameState.picks[2]} picks`;
  const matchSummary = document.getElementById('match-summary');
  if (matchSummary) {
    matchSummary.textContent = `${gameState.matches || 0} / ${gameState.totalRounds} matched answers`;
  }

  // Pick a random fun fact
  funFact.textContent = FUN_FACTS[Math.floor(Math.random() * FUN_FACTS.length)];

  if (gameState.mode === 'online') {
    // Save to Firebase
    const { ref, set } = window.firebaseDatabase || {};
    if (gameRef && typeof set === 'function') {
      import('https://www.gstatic.com/firebasejs/9.22.0/firebase-database.js').then(({ ref: dbRef, set: dbSet }) => {
        set(gameRef, {
          ...gameState,
          status: 'finished'
        });
      });
    }

    // Show play again options
    playAgainBtn.textContent = 'Play Again 🔄';
    newPlayersBtn.textContent = 'Leave Game';
    newPlayersBtn.onclick = () => {
      leaveGame();
      showModeSelection();
    };
  } else {
    playAgainBtn.textContent = 'Play Again 🔄';
    newPlayersBtn.textContent = 'New Players';
    newPlayersBtn.onclick = newPlayers;
  }
}

function handleGameEnd(data) {
  gameState.picks = data.picks || { 1: 0, 2: 0 };
  gameState.matches = data.matches || 0;
  gameState.roundChoices = data.roundChoices || {};
  gameState.history = data.history || [];
  gameState.round = data.round || gameState.totalRounds;

  // Prevent double handling
  if (resultsScreen.classList.contains('active')) return;

  showResults();
}

async function playAgain() {
  if (gameState.mode === 'online') {
    // Reset online game with FRESH questions
    const { runTransaction } = await import('https://www.gstatic.com/firebasejs/9.22.0/firebase-database.js');

    // Only the first replay request creates the shared question set.
    await runTransaction(gameRef, (currentData) => {
      if (!currentData || currentData.status !== 'finished') return;

      const freshQuestions = generateFreshQuestions();
      return {
        ...currentData,
        status: 'playing',
        round: 1,
        currentTurn: 1,
        picks: { 1: 0, 2: 0 },
        matches: 0,
        roundChoices: {},
        history: [],
        questions: freshQuestions,
        currentQuestion: freshQuestions[0],
        roundPickCount: 0
      };
    });

    showScreen('game');
    updateTurnIndicator();
  } else {
    // Reset local game with FRESH questions
    gameState.round = 1;
    gameState.currentPlayer = 1;
    gameState.picks = { 1: 0, 2: 0 };
    gameState.matches = 0;
    gameState.roundChoices = {};
    gameState.history = [];
    gameState.totalRounds = 5;

    // Generate brand new 5 unique questions
    gameState.questions = generateFreshQuestions();

    showScreen('game');
    updateTurnIndicator();
    showLocalQuestion();
  }
}

function newPlayers() {
  // Full reset
  gameState = {
    mode: 'local',
    playerNumber: null,
    player1: '',
    player2: '',
    currentPlayer: 1,
    round: 1,
    totalRounds: 5,
    category: 'all',
    questions: [],
    currentQuestion: null,
    currentOption: null,
    picks: { 1: 0, 2: 0 },
    matches: 0,
    roundChoices: {},
    history: [],
    gameId: null,
    started: false
  };

  player1Input.value = '';
  player2Input.value = '';

  cleanupFirebase();
  showScreen('setup');
  showModeSelection();
}

// ============ SCREEN MANAGEMENT ============
function showScreen(screen) {
  // Hide all screens
  ['mode-selection', 'local-section', 'join-section', 'waiting-section', 'game-screen', 'results-screen'].forEach(id => {
    const el = document.getElementById(id);
    if (el) {
      el.classList.remove('active');
      el.classList.add('hidden');
    }
  });

  // Show target screen
  const targetEl = document.getElementById(screen + '-screen') || document.getElementById(screen);
  if (targetEl) {
    targetEl.classList.remove('hidden');
    targetEl.classList.add('active');
  }
}

// ============ UTILITIES ============
function generateJoinCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Removed confusing chars
  let code = '';
  for (let i = 0; i < 4; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

// ============ START ============
init();
