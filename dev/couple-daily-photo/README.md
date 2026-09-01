# Couple Daily Moments 💕

A private daily photo diary and messaging space for couples.

## Features
- **🔒 Private Couple Spaces**: Create a secure, password-protected space for you and your partner only.
- **User Authentication**: Separate login page with create/join options for personalized experiences.
- **Daily Rooms (`DD-MM-YY`)**: Automatically connects to today's room (e.g. `01-09-26`) with easy navigation to past and future memories.
- **100% Free Photo Sharing**: Uses client-side image compression and stores photos directly in Firebase Realtime Database without needing paid Firebase Storage or credit card setup.
- **Real-time Sync**: Photos and love notes sync instantly between both partners.
- **Interactive Love Notes & Quick Reactions**: Drop messages and emojis under each day's photo dump.
- **Photo Lightbox & Full View**: Tap on any photo to see it full-screen.
- **Customizable Profiles**: Each partner can set their own name and emoji avatar.
- **🔗 Invite Links**: Generate and share a link for your partner to join your private space.
- **Partner Status Bar**: See your partner's name, avatar, and online status in real-time.

## Architecture
- **Multi-page Layout**: Separate `login.html` for authentication and `index.html` for the main app
- **Firebase Anonymous Auth**: Uses anonymous authentication for user identity
- **LocalStorage**: Persists couple space ID, user name, and avatar across sessions
- **Client-side Image Compression**: Photos are compressed to base64 JPEG before upload
- **Realtime Database Structure**:
  ```
  couples/
    {hashedPasscode}/
      spaceName: "Our Moments"
      createdAt: timestamp
      members/
        {userId}/
          name: "Alex"
          avatar: "😊"
          joinedAt: timestamp
      rooms/
        {DD-MM-YY}/
          photos/
            {photoId}/
              authorId, authorName, authorAvatar, imageData, caption, timestamp
          comments/
            {commentId}/
              authorId, authorName, authorAvatar, text, timestamp
  ```

## Security
- **Private Spaces**: Each couple gets a unique space identified by SHA-256 hashed passcode - only people with the passcode can access your photos and notes.
- **Author-Only Deletion**: Only the person who uploaded a photo/comment can delete it.
- **Firebase Security Rules**: Implemented to prevent unauthorized access and data tampering.
- **Session Persistence**: Login state stored in localStorage, redirects to login page if not authenticated.

## Getting Started

### First Time Setup
1. Open `login.html` - you'll see the login page with two tabs
2. **Create New Space**: 
   - Enter your name (e.g., "Alex")
   - Enter a space name (e.g., "Our Moments")
   - Create a secret passcode (min 6 characters)
   - Click "Create Our Space"
3. You'll be redirected to `index.html` with your space ready
4. Share the passcode OR the invite link with your partner

### Joining an Existing Space
1. Open `login.html`
2. Click "Join Existing" tab
3. Enter your name and your partner's passcode
4. Click "Join Space"
5. You'll be redirected to the shared space

### Invite Your Partner
- Click the **🔗 Invite** button in the header to copy a shareable link
- Your partner opens the link and enters the passcode to join
- Alternative: Use the profile settings (⚙️) to view/copy the invite link

## Running Locally

### Quick Start
1. Start an HTTP server from the project root:
   ```bash
   cd C:\Users\ankit\Downloads\Online_games
   python -m http.server 8080
   ```

2. Open in your browser:
   ```
   http://localhost:8080/dev/couple-daily-photo/login.html
   ```

3. Test multi-user:
   - Open another browser window (or incognito mode)
   - Visit the same URL
   - Join the space with the passcode you created
   - Send photos/messages and see them sync in real-time!

### Alternative Serving Methods
```bash
# Using Node.js serve
npx serve dev/couple-daily-photo
# Opens at http://localhost:3000

# Using Python from the app folder directly
cd dev/couple-daily-photo
python -m http.server 8080
# Opens at http://localhost:8080/login.html
```

## File Structure
```
dev/couple-daily-photo/
├── login.html           # Authentication page (create/join space)
├── index.html           # Main app page (photos, messages, navigation)
├── script.js            # Main app logic (Firebase, real-time sync)
├── style.css            # Unified styles for both pages
├── firebase-loader.js   # Firebase config loader
└── README.md            # This file
```

## Firebase Setup (for developers)

### Config File
- Update `../../infra/demo_database_config.json` with your Firebase project credentials:
  ```json
  {
    "firebase": {
      "apiKey": "YOUR_API_KEY",
      "authDomain": "YOUR_PROJECT.firebaseapp.com",
      "databaseURL": "https://YOUR_PROJECT.firebasedatabase.app",
      "projectId": "YOUR_PROJECT_ID",
      "storageBucket": "YOUR_PROJECT.appspot.com",
      "messagingSenderId": "YOUR_SENDER_ID",
      "appId": "YOUR_APP_ID"
    }
  }
  ```

### Security Rules
Deploy security rules from `../../infra/firebase-rtdb-rules.json` to your Firebase Realtime Database:
```bash
firebase deploy --only database
```

### Anonymous Authentication
Enable Anonymous Authentication in Firebase Console:
1. Go to Firebase Console > Authentication > Sign-in method
2. Enable "Anonymous" provider

## Recent Updates (2026-09-01)
- ✅ Added separate login page with create/join functionality
- ✅ Implemented user authentication flow with localStorage persistence
- ✅ Fixed button visibility issues by adding CSS variables
- ✅ Fixed date initialization - now populates immediately on login
- ✅ Added null-safety checks for DOM elements across pages
- ✅ Resolved Firebase function naming conflict (`initializeApp`)
- ✅ Updated profile management with avatar selection
- ✅ Added partner status bar with real-time member tracking

## Troubleshooting

### "Connecting to your shared space..." stuck
- Check browser console (F12) for errors
- Verify `firebase-loader.js` is loading the config correctly
- Ensure Firebase Realtime Database is enabled in your project

### Date not showing on first load
- Fixed in latest version - clear localStorage and refresh
- `setDate(new Date())` now called in `setupCoupleSpace()`

### Buttons not visible
- Fixed in latest version - CSS variables now defined at `:root`
- Refresh browser to load updated `style.css`

### Photos/messages not syncing
- Verify both users are in the same couple space (check passcode)
- Check Firebase Console > Realtime Database for data
- Ensure both users are authenticated (check console logs)

## Browser Support
- Chrome/Edge: ✅ Full support
- Firefox: ✅ Full support  
- Safari: ✅ Full support
- Mobile browsers: ✅ Responsive design

## Privacy & Data
- All data stored in Firebase Realtime Database
- Photos compressed to ~100-300KB base64 JPEG
- No external image hosting or third-party services
- Only users with the passcode can access the space
- LocalStorage used for session persistence (couple_space_id, couple_user_name, couple_user_avatar)

---

Made with 💕 for couples who want a private space to share daily moments
