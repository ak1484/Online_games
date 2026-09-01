import { initializeApp } from 'https://www.gstatic.com/firebasejs/9.22.0/firebase-app.js';
import { getDatabase, ref, set, push, onValue, remove, update } from 'https://www.gstatic.com/firebasejs/9.22.0/firebase-database.js';
import { getAuth, signInAnonymously } from 'https://www.gstatic.com/firebasejs/9.22.0/firebase-auth.js';
import { loadFirebaseConfig } from './firebase-loader.js';

// DOM Elements
const partnerNicknameInput = document.getElementById('partner-nickname');
const displayDateElem = document.getElementById('display-date');
const currentRoomCodeElem = document.getElementById('current-room-code');
const datePickerInput = document.getElementById('date-picker-input');
const prevDayBtn = document.getElementById('prev-day-btn');
const nextDayBtn = document.getElementById('next-day-btn');
const todayBtn = document.getElementById('today-btn');
const yesterdayBtn = document.getElementById('yesterday-btn');
const statusBanner = document.getElementById('status-banner');

// Upload Elements
const openUploadBtn = document.getElementById('open-upload-btn');
const closeUploadBtn = document.getElementById('close-upload-btn');
const cancelUploadBtn = document.getElementById('cancel-upload-btn');
const uploadPanel = document.getElementById('upload-panel');
const dropzone = document.getElementById('dropzone');
const dropzonePrompt = document.getElementById('dropzone-prompt');
const photoFileInput = document.getElementById('photo-file-input');
const imagePreviewContainer = document.getElementById('image-preview-container');
const imagePreview = document.getElementById('image-preview');
const removePreviewBtn = document.getElementById('remove-preview-btn');
const photoCaptionInput = document.getElementById('photo-caption-input');
const submitPhotoBtn = document.getElementById('submit-photo-btn');
const uploadBtnText = document.getElementById('upload-btn-text');
const uploadSpinner = document.getElementById('upload-spinner');
const uploadDateTitle = document.getElementById('upload-date-title');
const photoCountBadge = document.getElementById('photo-count-badge');
const photosContainer = document.getElementById('photos-container');

// Comments Elements
const commentsList = document.getElementById('comments-list');
const commentForm = document.getElementById('comment-form');
const commentInput = document.getElementById('comment-input');
const emojiChips = document.querySelectorAll('.emoji-chip');

// Lightbox Elements
const lightboxModal = document.getElementById('lightbox-modal');
const lightboxImg = document.getElementById('lightbox-img');
const lightboxCaption = document.getElementById('lightbox-caption');
const closeLightboxBtn = document.getElementById('close-lightbox-btn');

// State
let app = null;
let db = null;
let auth = null;
let currentUser = null;
let currentDate = new Date();
let currentRoomCode = '';
let roomDataUnsubscribe = null;
let compressedBase64Image = null;

// User identity
let localNickname = localStorage.getItem('couple_app_nickname') || 'My Love';

/**
 * Format a Date object to DD-MM-YY room format (e.g. 18-11-26)
 */
function formatDateToRoomCode(date) {
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = String(date.getFullYear()).slice(-2);
  return `${day}-${month}-${year}`;
}

/**
 * Format a Date object to YYYY-MM-DD for HTML date picker
 */
function formatDateToPickerValue(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Human readable date format (e.g. "Today", "Yesterday", or "Nov 18, 2026")
 */
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
  statusBanner.textContent = message;
  statusBanner.className = `status-banner ${type}`;
}

/**
 * Compress an image File client-side to lightweight JPEG base64
 */
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

        const dataUrl = canvas.toDataURL('image/jpeg', quality);
        resolve(dataUrl);
      };
      img.onerror = () => reject(new Error('Failed to decode image.'));
      img.src = e.target.result;
    };
    reader.onerror = () => reject(new Error('Failed to read file.'));
    reader.readAsDataURL(file);
  });
}

/**
 * Switch the active day/room
 */
function setDate(newDate) {
  currentDate = new Date(newDate);
  currentRoomCode = formatDateToRoomCode(currentDate);

  displayDateElem.textContent = formatHumanDate(currentDate);
  currentRoomCodeElem.textContent = currentRoomCode;
  datePickerInput.value = formatDateToPickerValue(currentDate);
  uploadDateTitle.textContent = formatHumanDate(currentDate);

  // Update quick nav button styles
  const isToday = formatHumanDate(currentDate) === 'Today';
  const isYesterday = formatHumanDate(currentDate) === 'Yesterday';
  todayBtn.classList.toggle('active', isToday);
  yesterdayBtn.classList.toggle('active', isYesterday);

  subscribeToRoom(currentRoomCode);
}

/**
 * Realtime sync listener for current room
 */
function subscribeToRoom(roomCode) {
  if (roomDataUnsubscribe) {
    roomDataUnsubscribe();
    roomDataUnsubscribe = null;
  }

  if (!db) return;

  updateStatus(`Connected to room ${roomCode}`, 'success');

  const roomRef = ref(db, `couple_rooms/${roomCode}`);
  roomDataUnsubscribe = onValue(roomRef, (snapshot) => {
    const data = snapshot.val() || {};
    renderPhotos(data.photos || {});
    renderComments(data.comments || {});
  }, (error) => {
    console.error('Room sync error:', error);
    updateStatus(`Sync error: ${error.message}`, 'error');
  });
}

/**
 * Render photos list
 */
function renderPhotos(photosMap) {
  const photos = Object.entries(photosMap).map(([id, item]) => ({
    id,
    ...item
  })).sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));

  photoCountBadge.textContent = photos.length;

  if (photos.length === 0) {
    photosContainer.innerHTML = `
      <div class="empty-state">
        <div class="empty-emoji">🖼️</div>
        <h3>No photos shared for this day yet</h3>
        <p>Be the first one to dump a memory or snap from today!</p>
      </div>
    `;
    return;
  }

  photosContainer.innerHTML = '';
  photos.forEach((photo) => {
    const card = document.createElement('article');
    card.className = 'photo-card';

    const isMine = currentUser && photo.authorId === currentUser.uid;
    const authorDisplayName = isMine ? `${photo.authorName || 'You'} (You)` : (photo.authorName || 'Partner');
    const timeFormatted = photo.timestamp
      ? new Date(photo.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      : '';

    card.innerHTML = `
      <div class="photo-meta">
        <span class="author-chip">
          <span>${isMine ? '💖' : '💌'}</span>
          <strong>${escapeHtml(authorDisplayName)}</strong>
        </span>
        <span class="photo-time">${timeFormatted}</span>
      </div>
      <div class="photo-frame" data-src="${photo.imageData}" data-caption="${escapeHtml(photo.caption || '')}">
        <img src="${photo.imageData}" alt="Daily moment" loading="lazy" />
      </div>
      ${photo.caption ? `<p class="photo-caption">${escapeHtml(photo.caption)}</p>` : ''}
      <div class="photo-footer">
        <span></span>
        ${isMine ? `<button class="delete-photo-btn" data-id="${photo.id}">Delete</button>` : ''}
      </div>
    `;

    // Lightbox trigger
    const frame = card.querySelector('.photo-frame');
    frame.addEventListener('click', () => {
      openLightbox(photo.imageData, photo.caption);
    });

    // Delete photo trigger
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

/**
 * Render Comments list
 */
function renderComments(commentsMap) {
  const comments = Object.entries(commentsMap).map(([id, item]) => ({
    id,
    ...item
  })).sort((a, b) => (a.timestamp || 0) - (b.timestamp || 0));

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

  // Scroll comments to bottom
  commentsList.scrollTop = commentsList.scrollHeight;
}

/**
 * Upload Photo
 */
async function handlePhotoUpload() {
  if (!compressedBase64Image) return;

  submitPhotoBtn.disabled = true;
  uploadSpinner.classList.remove('hidden');
  uploadBtnText.textContent = 'Uploading...';

  try {
    const photosRef = ref(db, `couple_rooms/${currentRoomCode}/photos`);
    const newPhotoRef = push(photosRef);

    await set(newPhotoRef, {
      authorId: currentUser.uid,
      authorName: localNickname,
      imageData: compressedBase64Image,
      caption: photoCaptionInput.value.trim(),
      timestamp: Date.now()
    });

    // Reset upload form
    closeUploadModal();
    updateStatus('Photo shared successfully! 💕', 'success');
  } catch (err) {
    console.error('Upload failed:', err);
    updateStatus(`Upload failed: ${err.message}`, 'error');
  } finally {
    submitPhotoBtn.disabled = false;
    uploadSpinner.classList.add('hidden');
    uploadBtnText.textContent = 'Share Photo 💕';
  }
}

/**
 * Delete photo
 */
async function deletePhoto(photoId) {
  if (!confirm('Are you sure you want to delete this photo?')) return;
  try {
    const photoRef = ref(db, `couple_rooms/${currentRoomCode}/photos/${photoId}`);
    await remove(photoRef);
  } catch (err) {
    console.error('Failed to delete photo:', err);
    updateStatus(`Could not delete photo: ${err.message}`, 'error');
  }
}

/**
 * Send comment
 */
async function sendComment(text) {
  if (!text || !text.trim() || !currentUser) return;

  const commentsRef = ref(db, `couple_rooms/${currentRoomCode}/comments`);
  const newCommentRef = push(commentsRef);

  try {
    await set(newCommentRef, {
      authorId: currentUser.uid,
      authorName: localNickname,
      text: text.trim(),
      timestamp: Date.now()
    });
    commentInput.value = '';
  } catch (err) {
    console.error('Comment failed:', err);
    updateStatus(`Failed to send note: ${err.message}`, 'error');
  }
}

/**
 * Lightbox
 */
function openLightbox(src, caption) {
  lightboxImg.src = src;
  lightboxCaption.textContent = caption || '';
  lightboxModal.classList.remove('hidden');
}

function closeLightbox() {
  lightboxModal.classList.add('hidden');
  lightboxImg.src = '';
}

/**
 * Upload Modal UI
 */
function openUploadModal() {
  uploadPanel.classList.remove('hidden');
}

function closeUploadModal() {
  uploadPanel.classList.add('hidden');
  photoFileInput.value = '';
  photoCaptionInput.value = '';
  compressedBase64Image = null;
  imagePreview.src = '';
  imagePreviewContainer.classList.add('hidden');
  dropzonePrompt.classList.remove('hidden');
  submitPhotoBtn.disabled = true;
}

/**
 * Handle file selection & compression
 */
async function handleFileSelected(file) {
  if (!file || !file.type.startsWith('image/')) {
    alert('Please select an image file.');
    return;
  }

  updateStatus('Optimizing image for fast & free sharing...', 'info');
  try {
    compressedBase64Image = await compressImage(file);
    imagePreview.src = compressedBase64Image;
    imagePreviewContainer.classList.remove('hidden');
    dropzonePrompt.classList.add('hidden');
    submitPhotoBtn.disabled = false;
    updateStatus('Image ready to share!', 'success');
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

/**
 * Main Initialization
 */
async function init() {
  partnerNicknameInput.value = localNickname;
  partnerNicknameInput.addEventListener('change', (e) => {
    localNickname = e.target.value.trim() || 'My Love';
    localStorage.setItem('couple_app_nickname', localNickname);
  });

  // Date Navigation handlers
  prevDayBtn.addEventListener('click', () => {
    const d = new Date(currentDate);
    d.setDate(d.getDate() - 1);
    setDate(d);
  });

  nextDayBtn.addEventListener('click', () => {
    const d = new Date(currentDate);
    d.setDate(d.getDate() + 1);
    setDate(d);
  });

  todayBtn.addEventListener('click', () => {
    setDate(new Date());
  });

  yesterdayBtn.addEventListener('click', () => {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    setDate(d);
  });

  datePickerInput.addEventListener('change', (e) => {
    if (e.target.value) {
      const [y, m, d] = e.target.value.split('-').map(Number);
      setDate(new Date(y, m - 1, d));
    }
  });

  // Upload UI handlers
  openUploadBtn.addEventListener('click', openUploadModal);
  closeUploadBtn.addEventListener('click', closeUploadModal);
  cancelUploadBtn.addEventListener('click', closeUploadModal);

  photoFileInput.addEventListener('change', (e) => {
    if (e.target.files && e.target.files[0]) {
      handleFileSelected(e.target.files[0]);
    }
  });

  removePreviewBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    photoFileInput.value = '';
    compressedBase64Image = null;
    imagePreview.src = '';
    imagePreviewContainer.classList.add('hidden');
    dropzonePrompt.classList.remove('hidden');
    submitPhotoBtn.disabled = true;
  });

  // Dropzone drag & drop
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

  submitPhotoBtn.addEventListener('click', handlePhotoUpload);

  // Comment Handlers
  commentForm.addEventListener('submit', (e) => {
    e.preventDefault();
    sendComment(commentInput.value);
  });

  emojiChips.forEach((btn) => {
    btn.addEventListener('click', () => {
      sendComment(btn.dataset.emoji);
    });
  });

  // Lightbox handlers
  closeLightboxBtn.addEventListener('click', closeLightbox);
  lightboxModal.addEventListener('click', (e) => {
    if (e.target === lightboxModal || e.target.classList.contains('lightbox-backdrop')) {
      closeLightbox();
    }
  });

  // Initialize Firebase
  try {
    const config = await loadFirebaseConfig();
    app = initializeApp(config);
    db = getDatabase(app);
    auth = getAuth(app);

    const userCredential = await signInAnonymously(auth);
    currentUser = userCredential.user;
    console.log('Signed in anonymously with UID:', currentUser.uid);

    // Default to today's room
    setDate(new Date());
  } catch (err) {
    console.error('Firebase initialization error:', err);
    updateStatus(`Connection failed: ${err.message}`, 'error');
  }
}

init();
