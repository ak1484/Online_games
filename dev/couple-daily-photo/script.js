import { initializeApp } from 'https://www.gstatic.com/firebasejs/9.22.0/firebase-app.js';
import { getDatabase, ref, set, push, onValue, remove, update, onDisconnect } from 'https://www.gstatic.com/firebasejs/9.22.0/firebase-database.js';
import { getAuth, signInAnonymously } from 'https://www.gstatic.com/firebasejs/9.22.0/firebase-auth.js';
import { loadFirebaseConfig } from './firebase-loader.js';

// ============ SECURE SPACE MANAGEMENT ============

/**
 * Hash a passcode to create couple space ID
 * (Simple SHA-256 hash for deterministic space IDs)
 */
async function hashPasscode(passcode) {
  const encoder = new TextEncoder();
  const data = encoder.encode(passcode);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('').substring(0, 24);
}

/**
 * Generate invite link
 */
function generateInviteLink(coupleId) {
  const baseUrl = window.location.origin + window.location.pathname;
  return `${baseUrl}?space=${coupleId}`;
}

/**
 * Parse URL params to get space ID if shared
 */
function getSpaceFromUrl() {
  const params = new URLSearchParams(window.location.search);
  return params.get('space');
}

// ============ STATE & DOM ============

let app = null;
let db = null;
let auth = null;
let currentUser = null;
let currentDate = new Date();
let currentRoomCode = '';
let roomDataUnsubscribe = null;
let compressedBase64Image = null;

// Secure couple state
let coupleId = localStorage.getItem('couple_space_id') || null;
let coupleSpaceName = localStorage.getItem('couple_space_name') || '';
let userName = localStorage.getItem('couple_user_name') || 'My Love';
let userAvatar = localStorage.getItem('couple_user_avatar') || '👤';
let partnerName = null;
let partnerAvatar = null;
let partnerOnline = false;

// ============ SETUP MODAL ============

const setupModal = document.getElementById('setup-modal');
const createTab = document.getElementById('create-tab');
const joinTab = document.getElementById('join-tab');
const tabBtns = document.querySelectorAll('.tab-btn');
const setupCreateBtn = document.getElementById('setup-create-btn');
const setupJoinBtn = document.getElementById('setup-join-btn');
const setupError = document.getElementById('setup-error');

function showSetupModal() {
  setupModal.classList.remove('hidden');
}

function hideSetupModal() {
  setupModal.classList.add('hidden');
}

function showSetupError(message) {
  setupError.textContent = message;
  setupError.classList.remove('hidden');
  setTimeout(() => setupError.classList.add('hidden'), 5000);
}

// Tab switching
tabBtns.forEach(btn => {
  btn.addEventListener('click', (e) => {
    tabBtns.forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.tab-pane').forEach(p => p.classList.remove('active'));

    e.target.classList.add('active');
    const tabName = e.target.dataset.tab;
    document.getElementById(`${tabName}-tab`).classList.add('active');
  });
});

// Create new space
setupCreateBtn.addEventListener('click', async () => {
  const name = document.getElementById('setup-name').value.trim();
  const spaceName = document.getElementById('setup-space-name').value.trim();
  const passcode = document.getElementById('setup-passcode').value;

  if (!name || !spaceName || passcode.length < 6) {
    showSetupError('Please fill all fields. Passcode must be at least 6 characters.');
    return;
  }

  setupCreateBtn.disabled = true;
  setupCreateBtn.textContent = 'Creating...';

  try {
    const hashedId = await hashPasscode(passcode);
    coupleId = hashedId;
    coupleSpaceName = spaceName;
    userName = name;
    userAvatar = '😊';

    localStorage.setItem('couple_space_id', coupleId);
    localStorage.setItem('couple_space_name', coupleSpaceName);
    localStorage.setItem('couple_user_name', userName);
    localStorage.setItem('couple_user_avatar', userAvatar);

    // Initialize couple profile in Firebase
    const coupleRef = ref(db, `couples/${coupleId}`);
    await set(coupleRef, {
      spaceName: coupleSpaceName,
      createdAt: Date.now(),
      members: {
        [currentUser.uid]: {
          name: userName,
          avatar: userAvatar,
          joinedAt: Date.now()
        }
      }
    });

    hideSetupModal();
    initializeApp();
  } catch (err) {
    console.error('Create space error:', err);
    showSetupError('Failed to create space. Please try again.');
    setupCreateBtn.disabled = false;
    setupCreateBtn.textContent = 'Create My Space';
  }
});

// Join existing space
setupJoinBtn.addEventListener('click', async () => {
  const name = document.getElementById('join-name').value.trim();
  const passcode = document.getElementById('join-passcode').value;

  if (!name || passcode.length < 6) {
    showSetupError('Please enter your name and the passcode.');
    return;
  }

  setupJoinBtn.disabled = true;
  setupJoinBtn.textContent = 'Joining...';

  try {
    const hashedId = await hashPasscode(passcode);

    // Verify space exists
    const coupleRef = ref(db, `couples/${hashedId}`);
    const snapshot = await new Promise((resolve) => {
      onValue(coupleRef, resolve, { onlyOnce: true });
    });

    if (!snapshot.exists()) {
      showSetupError('Invalid passcode or space does not exist.');
      setupJoinBtn.disabled = false;
      setupJoinBtn.textContent = 'Join Space';
      return;
    }

    coupleId = hashedId;
    coupleSpaceName = snapshot.val().spaceName;
    userName = name;
    userAvatar = '❤️';

    localStorage.setItem('couple_space_id', coupleId);
    localStorage.setItem('couple_space_name', coupleSpaceName);
    localStorage.setItem('couple_user_name', userName);
    localStorage.setItem('couple_user_avatar', userAvatar);

    // Add self to couple members
    const memberRef = ref(db, `couples/${coupleId}/members/${currentUser.uid}`);
    await set(memberRef, {
      name: userName,
      avatar: userAvatar,
      joinedAt: Date.now()
    });

    hideSetupModal();
    initializeApp();
  } catch (err) {
    console.error('Join space error:', err);
    showSetupError('Failed to join space. Please check your passcode.');
    setupJoinBtn.disabled = false;
    setupJoinBtn.textContent = 'Join Space';
  }
});

// ============ PROFILE & MANAGEMENT MODAL ============

const profileModal = document.getElementById('profile-modal');
const openProfileBtn = document.getElementById('open-profile-btn');
const closeProfileBtn = document.getElementById('close-profile-modal');
const logoutBtn = document.getElementById('logout-btn');

openProfileBtn.addEventListener('click', () => {
  document.getElementById('profile-name').value = userName;
  document.getElementById('profile-space-name').textContent = coupleSpaceName;
  document.getElementById('profile-space-id').textContent = coupleId;
  document.getElementById('profile-invite-link').value = generateInviteLink(coupleId);

  profileModal.classList.remove('hidden');
});

closeProfileBtn.addEventListener('click', () => {
  profileModal.classList.add('hidden');
});

logoutBtn.addEventListener('click', () => {
  localStorage.clear();
  coupleId = null;
  location.reload();
});

document.getElementById('profile-copy-btn').addEventListener('click', () => {
  const link = document.getElementById('profile-invite-link');
  navigator.clipboard.writeText(link.value);
  const btn = document.getElementById('profile-copy-btn');
  btn.textContent = 'Copied!';
  setTimeout(() => btn.textContent = 'Copy', 2000);
});

// Copy invite from header
const copyInviteBtn = document.getElementById('copy-invite-btn');
if (copyInviteBtn) {
  copyInviteBtn.addEventListener('click', async (e) => {
    e.preventDefault();
    e.stopPropagation();
    const link = generateInviteLink(coupleId);
    try {
      await navigator.clipboard.writeText(link);
      const btn = document.getElementById('copy-invite-btn');
      btn.textContent = '✓ Copied!';
      setTimeout(() => btn.textContent = '🔗 Invite', 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
      alert('Invite link: ' + link);
    }
  });
}

// Update profile name and avatar
document.getElementById('profile-name').addEventListener('change', async (e) => {
  userName = e.target.value.trim() || userName;
  localStorage.setItem('couple_user_name', userName);
  const memberRef = ref(db, `couples/${coupleId}/members/${currentUser.uid}/name`);
  await update(memberRef, { name: userName });
  updateUIUserInfo();
});

document.querySelectorAll('.emoji-select').forEach(btn => {
  btn.addEventListener('click', async (e) => {
    e.preventDefault();
    userAvatar = btn.dataset.emoji;
    localStorage.setItem('couple_user_avatar', userAvatar);
    const memberRef = ref(db, `couples/${coupleId}/members/${currentUser.uid}/avatar`);
    await update(memberRef, { avatar: userAvatar });
    updateUIUserInfo();

    document.querySelectorAll('.emoji-select').forEach(b => b.classList.remove('selected'));
    btn.classList.add('selected');
  });
});

// ============ DISPLAY UPDATES ============

function updateUIUserInfo() {
  document.getElementById('user-avatar-display').textContent = userAvatar;
  document.getElementById('user-name-display').textContent = userName;
  document.getElementById('my-bar-avatar').textContent = userAvatar;
  document.getElementById('my-bar-name').textContent = userName;
  document.getElementById('space-name-display').textContent = coupleSpaceName || 'My Space';
}

function updatePartnerStatus() {
  if (partnerName) {
    document.getElementById('partner-status-tag').classList.add('partner-online-tag');
    document.getElementById('partner-bar-avatar').textContent = partnerAvatar || '🤍';
    document.getElementById('partner-bar-name').textContent = partnerName;
    document.getElementById('partner-status-dot').classList.toggle('online', partnerOnline);
    document.getElementById('partner-status-dot').classList.toggle('offline', !partnerOnline);
  }
}

// ============ FIREBASE INITIALIZATION ============

async function initializeApp() {
  if (!coupleId) {
    showSetupModal();
    return;
  }

  updateUIUserInfo();

  // Subscribe to partner changes
  const membersRef = ref(db, `couples/${coupleId}/members`);
  onValue(membersRef, (snapshot) => {
    const members = snapshot.val() || {};
    const memberUids = Object.keys(members).filter(uid => uid !== currentUser.uid);

    if (memberUids.length > 0) {
      const partnerId = memberUids[0];
      const partner = members[partnerId];
      partnerName = partner.name;
      partnerAvatar = partner.avatar;
      // Check if partner is online (you'd need presence tracking for real-time status)
      updatePartnerStatus();
    }
  });

  // Subscribe to couple rooms (photos & comments)
  subscribeToRoom();
}

function subscribeToRoom() {
  if (roomDataUnsubscribe) roomDataUnsubscribe();

  currentRoomCode = formatDateToRoomCode(currentDate);
  const roomRef = ref(db, `couples/${coupleId}/rooms/${currentRoomCode}`);

  roomDataUnsubscribe = onValue(roomRef, (snapshot) => {
    const data = snapshot.val() || {};
    renderPhotos(data.photos || {});
    renderComments(data.comments || {});
    updateStatus(`Connected to ${coupleSpaceName}`, 'success');
  }, (error) => {
    console.error('Room sync error:', error);
    updateStatus(`Sync error: ${error.message}`, 'error');
  });
}

// ============ PHOTO & COMMENT RENDERING (unchanged from original) ============

function formatDateToRoomCode(date) {
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = String(date.getFullYear()).slice(-2);
  return `${day}-${month}-${year}`;
}

function formatDateToPickerValue(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function formatHumanDate(date) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const compareDate = new Date(date);
  compareDate.setHours(0, 0, 0, 0);
  const diffTime = today.getTime() - compareDate.getTime();
  const diffDays = Math.round(diffTime / (1000 * 3600 * 24));

  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays === -1) return 'Tomorrow';

  return date.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });
}

function updateStatus(message, type = 'info') {
  const statusBanner = document.getElementById('status-banner');
  statusBanner.textContent = message;
  statusBanner.className = `status-banner ${type}`;
}

async function compressImage(file, maxDimension = 1080, quality = 0.75) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        let { width, height } = img;
        if (width > height) {
          if (width > maxDimension) {
            height = Math.round((height * maxDimension) / width);
            width = maxDimension;
          }
        } else {
          if (height > maxDimension) {
            width = Math.round((width * maxDimension) / height);
            height = maxDimension;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);

        resolve(canvas.toDataURL('image/jpeg', quality));
      };
      img.onerror = () => reject(new Error('Failed to decode image.'));
      img.src = e.target.result;
    };
    reader.onerror = () => reject(new Error('Failed to read file.'));
    reader.readAsDataURL(file);
  });
}

function setDate(newDate) {
  currentDate = new Date(newDate);
  currentRoomCode = formatDateToRoomCode(currentDate);

  document.getElementById('display-date').textContent = formatHumanDate(currentDate);
  document.getElementById('current-room-code').textContent = currentRoomCode;
  document.getElementById('date-picker-input').value = formatDateToPickerValue(currentDate);
  document.getElementById('upload-date-title').textContent = formatHumanDate(currentDate);

  const isToday = formatHumanDate(currentDate) === 'Today';
  const isYesterday = formatHumanDate(currentDate) === 'Yesterday';
  document.getElementById('today-btn').classList.toggle('active', isToday);
  document.getElementById('yesterday-btn').classList.toggle('active', isYesterday);

  subscribeToRoom();
}

function renderPhotos(photosMap) {
  const photos = Object.entries(photosMap).map(([id, item]) => ({
    id,
    ...item
  })).sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));

  document.getElementById('photo-count-badge').textContent = photos.length;
  const photosContainer = document.getElementById('photos-container');

  if (photos.length === 0) {
    photosContainer.innerHTML = `
      <div class="empty-state">
        <div class="empty-emoji">🖼️</div>
        <h3>No photos shared for this day yet</h3>
        <p>Be the first one to share a memory from today!</p>
      </div>
    `;
    return;
  }

  photosContainer.innerHTML = '';
  photos.forEach((photo) => {
    const card = document.createElement('article');
    card.className = 'photo-card';

    const isMine = currentUser && photo.authorId === currentUser.uid;
    const authorDisplayName = isMine ? `${photo.authorName} (You)` : (photo.authorName || 'Partner');
    const timeFormatted = photo.timestamp
      ? new Date(photo.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      : '';

    card.innerHTML = `
      <div class="photo-meta">
        <span class="author-chip">
          <span>${photo.authorAvatar || (isMine ? userAvatar : partnerAvatar || '💕')}</span>
          <strong>${escapeHtml(authorDisplayName)}</strong>
        </span>
        <span class="photo-time">${timeFormatted}</span>
      </div>
      <div class="photo-frame" data-src="${photo.imageData}" data-caption="${escapeHtml(photo.caption || '')}">
        <img src="${photo.imageData}" alt="Moment" loading="lazy" />
      </div>
      ${photo.caption ? `<p class="photo-caption">${escapeHtml(photo.caption)}</p>` : ''}
      <div class="photo-footer">
        <span></span>
        ${isMine ? `<button class="delete-photo-btn" data-id="${photo.id}">Delete</button>` : ''}
      </div>
    `;

    const frame = card.querySelector('.photo-frame');
    frame.addEventListener('click', () => {
      openLightbox(photo.imageData, photo.caption);
    });

    const deleteBtn = card.querySelector('.delete-photo-btn');
    if (deleteBtn) {
      deleteBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        deletePhoto(photo.id);
      });
    }

    photosContainer.appendChild(card);
  });
}

function renderComments(commentsMap) {
  const comments = Object.entries(commentsMap).map(([id, item]) => ({
    id,
    ...item
  })).sort((a, b) => (a.timestamp || 0) - (b.timestamp || 0));

  const commentsList = document.getElementById('comments-list');

  if (comments.length === 0) {
    commentsList.innerHTML = `
      <div class="empty-comments">
        <p>No messages yet. Drop a sweet note below! 💌</p>
      </div>
    `;
    return;
  }

  commentsList.innerHTML = '';
  comments.forEach((c) => {
    const isMine = currentUser && c.authorId === currentUser.uid;
    const bubble = document.createElement('div');
    bubble.className = `comment-bubble ${isMine ? 'mine' : 'partner'}`;

    const timeFormatted = c.timestamp
      ? new Date(c.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      : '';

    bubble.innerHTML = `
      <span class="comment-author">${escapeHtml(c.authorName || (isMine ? 'You' : 'Partner'))}</span>
      <span class="comment-text">${escapeHtml(c.text)}</span>
      <span class="comment-time">${timeFormatted}</span>
    `;

    commentsList.appendChild(bubble);
  });

  commentsList.scrollTop = commentsList.scrollHeight;
}

async function handlePhotoUpload() {
  if (!compressedBase64Image) return;

  const submitPhotoBtn = document.getElementById('submit-photo-btn');
  const uploadSpinner = document.getElementById('upload-spinner');
  const uploadBtnText = document.getElementById('upload-btn-text');

  submitPhotoBtn.disabled = true;
  uploadSpinner.classList.remove('hidden');
  uploadBtnText.textContent = 'Uploading...';

  try {
    const photosRef = ref(db, `couples/${coupleId}/rooms/${currentRoomCode}/photos`);
    const newPhotoRef = push(photosRef);

    await set(newPhotoRef, {
      authorId: currentUser.uid,
      authorName: userName,
      authorAvatar: userAvatar,
      imageData: compressedBase64Image,
      caption: document.getElementById('photo-caption-input').value.trim(),
      timestamp: Date.now()
    });

    closeUploadModal();
    updateStatus('Photo shared! 💕', 'success');
  } catch (err) {
    console.error('Upload failed:', err);
    updateStatus(`Upload failed: ${err.message}`, 'error');
  } finally {
    submitPhotoBtn.disabled = false;
    uploadSpinner.classList.add('hidden');
    uploadBtnText.textContent = 'Share Photo 💕';
  }
}

async function deletePhoto(photoId) {
  if (!confirm('Delete this photo?')) return;
  try {
    const photoRef = ref(db, `couples/${coupleId}/rooms/${currentRoomCode}/photos/${photoId}`);
    await remove(photoRef);
  } catch (err) {
    console.error('Delete failed:', err);
    updateStatus(`Could not delete: ${err.message}`, 'error');
  }
}

async function sendComment(text) {
  if (!text || !text.trim() || !currentUser) return;

  const commentsRef = ref(db, `couples/${coupleId}/rooms/${currentRoomCode}/comments`);
  const newCommentRef = push(commentsRef);

  try {
    await set(newCommentRef, {
      authorId: currentUser.uid,
      authorName: userName,
      authorAvatar: userAvatar,
      text: text.trim(),
      timestamp: Date.now()
    });
    document.getElementById('comment-input').value = '';
  } catch (err) {
    console.error('Comment failed:', err);
    updateStatus(`Failed to send: ${err.message}`, 'error');
  }
}

function openLightbox(src, caption) {
  const lightboxImg = document.getElementById('lightbox-img');
  const lightboxCaption = document.getElementById('lightbox-caption');
  const lightboxModal = document.getElementById('lightbox-modal');

  lightboxImg.src = src;
  lightboxCaption.textContent = caption || '';
  lightboxModal.classList.remove('hidden');
}

function closeLightbox() {
  document.getElementById('lightbox-modal').classList.add('hidden');
}

function openUploadModal() {
  document.getElementById('upload-panel').classList.remove('hidden');
}

function closeUploadModal() {
  const uploadPanel = document.getElementById('upload-panel');
  uploadPanel.classList.add('hidden');
  document.getElementById('photo-file-input').value = '';
  document.getElementById('photo-caption-input').value = '';
  compressedBase64Image = null;
  document.getElementById('image-preview').src = '';
  document.getElementById('image-preview-container').classList.add('hidden');
  document.getElementById('dropzone-prompt').classList.remove('hidden');
  document.getElementById('submit-photo-btn').disabled = true;
}

async function handleFileSelected(file) {
  if (!file || !file.type.startsWith('image/')) {
    alert('Please select an image file.');
    return;
  }

  updateStatus('Optimizing image...', 'info');
  try {
    compressedBase64Image = await compressImage(file);
    document.getElementById('image-preview').src = compressedBase64Image;
    document.getElementById('image-preview-container').classList.remove('hidden');
    document.getElementById('dropzone-prompt').classList.add('hidden');
    document.getElementById('submit-photo-btn').disabled = false;
    updateStatus('Image ready!', 'success');
  } catch (err) {
    console.error('Error compressing image:', err);
    alert('Could not process image. Please try another.');
  }
}

function escapeHtml(str) {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

// ============ EVENT LISTENERS ============

document.getElementById('prev-day-btn').addEventListener('click', () => {
  const d = new Date(currentDate);
  d.setDate(d.getDate() - 1);
  setDate(d);
});

document.getElementById('next-day-btn').addEventListener('click', () => {
  const d = new Date(currentDate);
  d.setDate(d.getDate() + 1);
  setDate(d);
});

document.getElementById('today-btn').addEventListener('click', () => setDate(new Date()));
document.getElementById('yesterday-btn').addEventListener('click', () => {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  setDate(d);
});

document.getElementById('date-picker-input').addEventListener('change', (e) => {
  if (e.target.value) {
    const [y, m, d] = e.target.value.split('-').map(Number);
    setDate(new Date(y, m - 1, d));
  }
});

document.getElementById('open-upload-btn').addEventListener('click', openUploadModal);
document.getElementById('close-upload-btn').addEventListener('click', closeUploadModal);
document.getElementById('cancel-upload-btn').addEventListener('click', closeUploadModal);

document.getElementById('photo-file-input').addEventListener('change', (e) => {
  if (e.target.files && e.target.files[0]) {
    handleFileSelected(e.target.files[0]);
  }
});

document.getElementById('remove-preview-btn').addEventListener('click', (e) => {
  e.stopPropagation();
  document.getElementById('photo-file-input').value = '';
  compressedBase64Image = null;
  document.getElementById('image-preview').src = '';
  document.getElementById('image-preview-container').classList.add('hidden');
  document.getElementById('dropzone-prompt').classList.remove('hidden');
  document.getElementById('submit-photo-btn').disabled = true;
});

const dropzone = document.getElementById('dropzone');
dropzone.addEventListener('dragover', (e) => {
  e.preventDefault();
  dropzone.classList.add('dragover');
});

dropzone.addEventListener('dragleave', () => {
  dropzone.classList.remove('dragover');
});

dropzone.addEventListener('drop', (e) => {
  e.preventDefault();
  dropzone.classList.remove('dragover');
  if (e.dataTransfer.files && e.dataTransfer.files[0]) {
    handleFileSelected(e.dataTransfer.files[0]);
  }
});

document.getElementById('submit-photo-btn').addEventListener('click', handlePhotoUpload);

document.getElementById('comment-form').addEventListener('submit', (e) => {
  e.preventDefault();
  sendComment(document.getElementById('comment-input').value);
});

document.querySelectorAll('.emoji-chip').forEach((btn) => {
  btn.addEventListener('click', () => {
    sendComment(btn.dataset.emoji);
  });
});

document.getElementById('close-lightbox-btn').addEventListener('click', closeLightbox);
document.getElementById('lightbox-modal').addEventListener('click', (e) => {
  if (e.target === document.getElementById('lightbox-modal') || e.target.classList.contains('lightbox-backdrop')) {
    closeLightbox();
  }
});

// ============ INITIALIZATION ============

async function init() {
  try {
    const config = await loadFirebaseConfig();
    app = initializeApp(config);
    db = getDatabase(app);
    auth = getAuth(app);

    const userCredential = await signInAnonymously(auth);
    currentUser = userCredential.user;
    console.log('Authenticated:', currentUser.uid);

// Check for shared space in URL BEFORE auth so we can redirect to login if needed
const sharedSpace = getSpaceFromUrl();
if (sharedSpace && !coupleId) {
  // Store the intent to join this space so auth.js can pick it up
  localStorage.setItem('pending_join_space', sharedSpace);
  window.location.href = 'login.html';
  return;
} else if (!coupleId) {
  window.location.href = 'login.html';
  return;
}
  } catch (err) {
    console.error('Initialization error:', err);
    updateStatus(`Connection failed: ${err.message}`, 'error');
  }
}

init();
