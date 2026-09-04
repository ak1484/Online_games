import { initializeApp } from 'https://www.gstatic.com/firebasejs/9.22.0/firebase-app.js';
import { getDatabase, ref, set, push, onValue, remove, update, get } from 'https://www.gstatic.com/firebasejs/9.22.0/firebase-database.js';
import { getAuth, signInAnonymously } from 'https://www.gstatic.com/firebasejs/9.22.0/firebase-auth.js';
import { loadFirebaseConfig } from './firebase-loader.js';

// ============ STATE ============
let app = null;
let db = null;
let auth = null;
let currentUser = null;
let coupleId = localStorage.getItem('couple_space_id') || null;
let checklistItems = {};
let currentFilter = 'all';
let selectedItemId = null;

// ============ DEFAULT CHECKLIST ITEMS ============
const DEFAULT_ITEMS = [
  // Fun
  { text: "Watch a movie together", category: "fun" },
  { text: "Have a picnic in the park", category: "fun" },
  { text: "Play board games night", category: "fun" },
  { text: "Sing karaoke together", category: "fun" },
  { text: "Have a themed dinner night", category: "fun" },
  { text: "Do a puzzle together", category: "fun" },
  { text: "Watch the sunrise together", category: "fun" },
  { text: "Have a lazy day in bed", category: "fun" },

  // Romantic
  { text: "Watch sunset together", category: "romantic" },
  { text: "Cook a meal together", category: "romantic" },
  { text: "Recreate your first date", category: "romantic" },
  { text: "Write love letters to each other", category: "romantic" },
  { text: "Take a bubble bath together", category: "romantic" },
  { text: "Dance in the kitchen", category: "romantic" },
  { text: "Stargaze together", category: "romantic" },
  { text: "Give each other massages", category: "romantic" },

  // Adventure
  { text: "Go on a road trip", category: "adventure" },
  { text: "Try a new restaurant together", category: "adventure" },
  { text: "Explore a new city", category: "adventure" },
  { text: "Go hiking together", category: "adventure" },
  { text: "Try a new hobby together", category: "adventure" },
  { text: "Go camping under the stars", category: "adventure" },
  { text: "Visit an amusement park", category: "adventure" },
  { text: "Take a spontaneous trip", category: "adventure" },

  // Everyday Magic
  { text: "Morning coffee together", category: "everyday" },
  { text: "Late night drive with music", category: "everyday" },
  { text: "Cook breakfast for each other", category: "everyday" },
  { text: "Share daily highs and lows", category: "everyday" },
  { text: "Walk together after dinner", category: "everyday" },
  { text: "Hold hands while walking", category: "everyday" },
  { text: "Send good morning texts", category: "everyday" },
  { text: "Make breakfast in bed", category: "everyday" },

  // Dream Goals
  { text: "Learn a new language together", category: "dream" },
  { text: "Save for a dream vacation", category: "dream" },
  { text: "Get matching tattoos", category: "dream" },
  { text: "Renew your vows", category: "dream" },
  { text: "Start a garden together", category: "dream" },
  { text: "Build a bucket list", category: "dream" },
  { text: "Run a marathon together", category: "dream" },
  { text: "Live in another country", category: "dream" }
];

const CATEGORY_LABELS = {
  fun: "🎉 Fun",
  romantic: "💕 Romantic",
  adventure: "🌟 Adventure",
  everyday: "✨ Everyday",
  dream: "🌈 Dream"
};

// ============ FIREBASE SETUP ============
async function init() {
  if (!coupleId) {
    alert('No couple space found. Please create or join a space first.');
    window.location.href = 'login.html';
    return;
  }

  try {
    const config = await loadFirebaseConfig();
    app = initializeApp(config);
    db = getDatabase(app);
    auth = getAuth(app);

    const userCredential = await signInAnonymously(auth);
    currentUser = userCredential.user;
    console.log('Authenticated:', currentUser.uid);

    // Seed default items if needed
    await seedDefaultItems();

    // Listen to checklist changes
    subscribeToChecklist();
  } catch (err) {
    console.error('Initialization error:', err);
  }
}

async function seedDefaultItems() {
  const checklistRef = ref(db, `couples/${coupleId}/checklist`);
  const snapshot = await get(checklistRef);

  if (!snapshot.exists()) {
    // First time - create default items
    const updates = {};
    DEFAULT_ITEMS.forEach((item, index) => {
      const itemId = `default_${index}`;
      updates[`${itemId}/text`] = item.text;
      updates[`${itemId}/category`] = item.category;
      updates[`${itemId}/completed`] = false;
      updates[`${itemId}/completedAt`] = null;
      updates[`${itemId}/completedBy`] = null;
      updates[`${itemId}/isCustom`] = false;
      updates[`${itemId}/createdBy`] = null;
      updates[`${itemId}/createdAt`] = Date.now();
      updates[`${itemId}/photos`] = {};
    });
    await update(checklistRef, updates);
  }
}

function subscribeToChecklist() {
  const checklistRef = ref(db, `couples/${coupleId}/checklist`);
  onValue(checklistRef, (snapshot) => {
    checklistItems = snapshot.val() || {};
    renderChecklist();
    updateOverallProgress();
  });
}

// ============ RENDER ============
function renderChecklist() {
  const container = document.getElementById('checklist-items');
  const emptyState = document.getElementById('empty-state');

  // Filter items
  let items = Object.entries(checklistItems).map(([id, data]) => ({ id, ...data }));

  if (currentFilter !== 'all') {
    items = items.filter(item => item.category === currentFilter);
  }

  // Sort: incomplete first, then by creation date
  items.sort((a, b) => {
    if (a.completed !== b.completed) return a.completed ? 1 : -1;
    return (a.createdAt || 0) - (b.createdAt || 0);
  });

  if (items.length === 0) {
    container.innerHTML = '';
    emptyState.classList.remove('hidden');
    return;
  }

  emptyState.classList.add('hidden');
  container.innerHTML = items.map(item => createItemHTML(item)).join('');

  // Attach event listeners
  container.querySelectorAll('.checklist-item').forEach(el => {
    const itemId = el.dataset.id;

    // Checkbox click
    el.querySelector('.item-checkbox').addEventListener('click', () => toggleItem(itemId));

    // Photo button click
    const photoBtn = el.querySelector('.item-photos-btn');
    if (photoBtn) {
      photoBtn.addEventListener('click', () => openPhotoModal(itemId));
    }

    // Delete button
    const deleteBtn = el.querySelector('.item-delete');
    if (deleteBtn) {
      deleteBtn.addEventListener('click', () => deleteItem(itemId));
    }
  });
}

function createItemHTML(item) {
  const isCompleted = item.completed;
  const photoCount = Object.keys(item.photos || {}).length;
  const canAddPhotos = isCompleted && photoCount < 3;

  return `
    <div class="checklist-item ${isCompleted ? 'completed' : ''}" data-id="${item.id}">
      <div class="item-checkbox ${isCompleted ? 'checked' : ''}">
        ${isCompleted ? '✓' : ''}
      </div>
      <div class="item-content">
        <div class="item-text">${escapeHtml(item.text)}</div>
        <div class="item-meta">
          <span class="item-category">${CATEGORY_LABELS[item.category] || item.category}</span>
          ${item.isCustom ? '<span class="item-custom-badge">Custom</span>' : ''}
          ${isCompleted && item.completedAt ? `<span class="item-date">Completed ${formatDate(item.completedAt)}</span>` : ''}
        </div>
      </div>
      <div class="item-actions">
        ${isCompleted ? `
          <button class="item-photos-btn" title="View/Add Photos (${photoCount}/3)">
            📸 ${photoCount > 0 ? photoCount : ''}
          </button>
        ` : ''}
        ${item.isCustom ? `<button class="item-delete" title="Delete">🗑️</button>` : ''}
      </div>
    </div>
  `;
}

function updateOverallProgress() {
  const items = Object.values(checklistItems);
  const total = items.length;
  const completed = items.filter(i => i.completed).length;
  const percent = total > 0 ? Math.round((completed / total) * 100) : 0;

  document.getElementById('overall-percent').textContent = `${percent}%`;
  document.getElementById('completed-count').textContent = completed;
  document.getElementById('total-count').textContent = total;

  // Update circle
  const circleFill = document.querySelector('.circle-fill');
  circleFill.style.strokeDasharray = `${percent}, 100`;
}

// ============ ACTIONS ============
async function toggleItem(itemId) {
  const item = checklistItems[itemId];
  if (!item) return;

  const newCompleted = !item.completed;
  const itemRef = ref(db, `couples/${coupleId}/checklist/${itemId}`);

  if (newCompleted) {
    // Marking as complete
    await update(itemRef, {
      completed: true,
      completedAt: Date.now(),
      completedBy: currentUser.uid
    });

    // Show celebration
    showCelebration(item.text);
  } else {
    // Unchecking - remove photos too
    await update(itemRef, {
      completed: false,
      completedAt: null,
      completedBy: null,
      photos: {}
    });
  }
}

async function addCustomItem() {
  const textInput = document.getElementById('new-item-text');
  const categorySelect = document.getElementById('new-item-category');

  const text = textInput.value.trim();
  const category = categorySelect.value;

  if (!text) {
    alert('Please enter a checklist item');
    return;
  }

  const itemRef = ref(db, `couples/${coupleId}/checklist`);
  const newItemRef = push(itemRef);

  await set(newItemRef, {
    text: text,
    category: category,
    completed: false,
    completedAt: null,
    completedBy: null,
    isCustom: true,
    createdBy: currentUser.uid,
    createdAt: Date.now(),
    photos: {}
  });

  textInput.value = '';
}

async function deleteItem(itemId) {
  const item = checklistItems[itemId];
  if (!item) return;

  if (!confirm(`Delete "${item.text}"?`)) return;

  const itemRef = ref(db, `couples/${coupleId}/checklist/${itemId}`);
  await remove(itemRef);
}

// ============ PHOTOS ============
function openPhotoModal(itemId) {
  selectedItemId = itemId;
  const item = checklistItems[itemId];
  if (!item) return;

  document.getElementById('photo-modal-title').textContent = item.text;
  renderPhotoGrid(item.photos || {});
  document.getElementById('photo-modal').classList.remove('hidden');
}

function closePhotoModal() {
  document.getElementById('photo-modal').classList.add('hidden');
  selectedItemId = null;
}

function renderPhotoGrid(photos) {
  const grid = document.getElementById('photo-grid');
  const photoEntries = Object.entries(photos);
  const slots = 3 - photoEntries.length;
  const currentCount = photoEntries.length;

  let html = '';

  // Existing photos
  photoEntries.forEach(([photoId, imageData]) => {
    html += `
      <div class="photo-slot existing">
        <img src="${imageData}" alt="Memory"/>
        <button class="remove-photo" data-photo-id="${photoId}">&times;</button>
      </div>
    `;
  });

  // Add slots
  for (let i = 0; i < slots; i++) {
    html += `
      <div class="photo-slot add-slot" id="add-slot-${i}">
        <input type="file" accept="image/*" class="photo-input" data-slot="${currentCount + i}"/>
        <div class="add-photo-hint">
          <span>📷</span>
          <span>Add Photo</span>
        </div>
      </div>
    `;
  }

  grid.innerHTML = html;

  // Photo input listeners
  grid.querySelectorAll('.photo-input').forEach(input => {
    input.addEventListener('change', handlePhotoSelect);
  });

  // Remove photo listeners
  grid.querySelectorAll('.remove-photo').forEach(btn => {
    btn.addEventListener('click', () => {
      const photoId = btn.dataset.photoId;
      removePhoto(photoId);
    });
  });
}

let pendingPhotos = {};

async function handlePhotoSelect(e) {
  const file = e.target.files[0];
  if (!file) return;

  const slot = e.target.dataset.slot;
  const preview = await compressAndPreview(file);

  // Show preview
  const slotEl = document.getElementById(`add-slot-${slot}`);
  slotEl.classList.add('has-preview');
  slotEl.innerHTML = `
    <img src="${preview}" alt="Preview"/>
    <button class="remove-photo remove-pending" data-slot="${slot}">&times;</button>
  `;

  // Store pending photo
  pendingPhotos[slot] = preview;

  // Add remove listener
  slotEl.querySelector('.remove-pending').addEventListener('click', () => {
    delete pendingPhotos[slot];
    slotEl.classList.remove('has-preview');
    slotEl.innerHTML = `
      <input type="file" accept="image/*" class="photo-input" data-slot="${slot}"/>
      <div class="add-photo-hint">
        <span>📷</span>
        <span>Add Photo</span>
      </div>
    `;
    slotEl.querySelector('.photo-input').addEventListener('change', handlePhotoSelect);
  });
}

async function compressAndPreview(file, maxDimension = 800, quality = 0.7) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        let { width, height } = img;
        if (width > height && width > maxDimension) {
          height = Math.round((height * maxDimension) / width);
          width = maxDimension;
        } else if (height > maxDimension) {
          width = Math.round((width * maxDimension) / height);
          height = maxDimension;
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);

        resolve(canvas.toDataURL('image/jpeg', quality));
      };
      img.onerror = reject;
      img.src = e.target.result;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

async function removePhoto(photoId) {
  if (!selectedItemId) return;

  const item = checklistItems[selectedItemId];
  if (!item || !item.photos) return;

  const updates = {};
  updates[`photos/${photoId}`] = null;

  const itemRef = ref(db, `couples/${coupleId}/checklist/${selectedItemId}`);
  await update(itemRef, updates);
}

async function savePhotos() {
  if (!selectedItemId || Object.keys(pendingPhotos).length === 0) {
    closePhotoModal();
    return;
  }

  const itemRef = ref(db, `couples/${coupleId}/checklist/${selectedItemId}`);

  // Get current photo count
  const item = checklistItems[selectedItemId];
  const currentPhotos = Object.keys(item?.photos || {}).length;
  const remaining = 3 - currentPhotos;

  if (Object.keys(pendingPhotos).length > remaining) {
    alert(`You can only add ${remaining} more photo(s). Maximum is 3.`);
    return;
  }

  // Add pending photos
  const updates = {};
  Object.entries(pendingPhotos).forEach(([slot, imageData]) => {
    const photoId = push(ref(db, `couples/${coupleId}/checklist/${selectedItemId}/photos`)).key;
    updates[`photos/${photoId}`] = imageData;
  });

  await update(itemRef, updates);
  pendingPhotos = {};
  closePhotoModal();
}

// ============ CELEBRATION ============
function showCelebration(itemText) {
  document.getElementById('celebration-item-text').textContent = `"${itemText}"`;
  document.getElementById('celebration-modal').classList.remove('hidden');

  // Confetti effect
  createConfetti();
}

function closeCelebration() {
  document.getElementById('celebration-modal').classList.add('hidden');
}

function createConfetti() {
  const colors = ['#be123c', '#f472b6', '#fbbf24', '#34d399', '#60a5fa'];
  const container = document.querySelector('.celebration-content');

  for (let i = 0; i < 50; i++) {
    const confetti = document.createElement('div');
    confetti.className = 'confetti';
    confetti.style.cssText = `
      position: fixed;
      width: 10px;
      height: 10px;
      background: ${colors[Math.floor(Math.random() * colors.length)]};
      left: ${Math.random() * 100}vw;
      top: -10px;
      border-radius: ${Math.random() > 0.5 ? '50%' : '0'};
      animation: confettiFall ${2 + Math.random() * 2}s linear forwards;
      animation-delay: ${Math.random() * 0.5}s;
      pointer-events: none;
      z-index: 1001;
    `;
    document.body.appendChild(confetti);
    setTimeout(() => confetti.remove(), 4000);
  }
}

// ============ CATEGORY FILTER ============
function setCategoryFilter(category) {
  currentFilter = category;

  // Update pill states
  document.querySelectorAll('.category-pill').forEach(pill => {
    pill.classList.toggle('active', pill.dataset.category === category);
  });

  renderChecklist();
}

// ============ UTILS ============
function escapeHtml(str) {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function formatDate(timestamp) {
  if (!timestamp) return '';
  const date = new Date(timestamp);
  const now = new Date();
  const diffDays = Math.round((now - date) / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return 'today';
  if (diffDays === 1) return 'yesterday';
  if (diffDays < 7) return `${diffDays} days ago`;

  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

// ============ EVENT LISTENERS ============
document.getElementById('add-item-btn').addEventListener('click', addCustomItem);

document.getElementById('new-item-text').addEventListener('keypress', (e) => {
  if (e.key === 'Enter') addCustomItem();
});

document.querySelectorAll('.category-pill').forEach(pill => {
  pill.addEventListener('click', () => setCategoryFilter(pill.dataset.category));
});

document.getElementById('close-photo-modal').addEventListener('click', closePhotoModal);
document.getElementById('photo-modal').addEventListener('click', (e) => {
  if (e.target.id === 'photo-modal') closePhotoModal();
});

document.getElementById('save-photos-btn').addEventListener('click', savePhotos);

document.getElementById('close-celebration').addEventListener('click', () => {
  closeCelebration();
  // Open photo modal after closing celebration
  if (selectedItemId) {
    setTimeout(() => openPhotoModal(selectedItemId), 300);
  }
});

// Add confetti animation style
const style = document.createElement('style');
style.textContent = `
  @keyframes confettiFall {
    to {
      transform: translateY(100vh) rotate(720deg);
      opacity: 0;
    }
  }
`;
document.head.appendChild(style);

// Start
init();
