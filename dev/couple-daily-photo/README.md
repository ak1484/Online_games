# Couple Daily Moments 💕

A private daily photo diary and messaging space for couples.

## Features
- **🔒 Private Couple Spaces**: Create a secure, password-protected space for you and your partner only.
- **Daily Rooms (`DD-MM-YY`)**: Automatically connects to today's room (e.g. `01-09-26`) with easy navigation to past and future memories.
- **100% Free Photo Sharing**: Uses client-side image compression and stores photos directly in Firebase Realtime Database without needing paid Firebase Storage or credit card setup.
- **Real-time Sync**: Photos and love notes sync instantly between both partners.
- **Interactive Love Notes & Quick Reactions**: Drop messages and emojis under each day's photo dump.
- **Photo Lightbox & Full View**: Tap on any photo to see it full-screen.
- **Customizable Profiles**: Each partner can set their own name and emoji avatar.
- **🔗 Invite Links**: Generate and share a link for your partner to join your private space.

## Security
- **Private Spaces**: Each couple gets a unique space identified by a hashed passcode - only people with the passcode can access your photos and notes.
- **Author-Only Deletion**: Only the person who uploaded a photo/comment can delete it.
- **Firebase Security Rules**: Implemented to prevent unauthorized access and data tampering.

## Getting Started

### First Time Setup
1. Open the app - you'll see the setup modal
2. **Create New Space**: Enter your name, a space name (e.g., "Our Moments"), and create a secret passcode (min 6 characters)
3. Share the passcode OR the invite link with your partner

### Joining an Existing Space
1. Open the invite link or app
2. Click "Join Existing" tab
3. Enter your name and your partner's passcode

### Invite Your Partner
- Click the **🔗 Invite** button in the header to copy a shareable link
- Your partner needs to enter the passcode you shared to join

## Running Locally
1. Start an HTTP server from the root or `dev/couple-daily-photo` folder:
   ```bash
   npx serve dev/couple-daily-photo
   # or
   python -m http.server 8000
   ```
2. Open `http://localhost:8000/dev/couple-daily-photo/index.html` in your browser.
3. Open another tab or share the URL on your phone to test the real-time couple interaction.

## Firebase Setup (for developers)
- Update `infra/demo_database_config.json` with your Firebase project credentials
- Deploy security rules from `infra/firebase-rtdb-rules.json` to your Firebase Realtime Database
