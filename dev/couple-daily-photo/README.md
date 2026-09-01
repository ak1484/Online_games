# Couple Daily Moments 💕

A private daily photo diary and messaging space for couples.

## Features
- **Daily Rooms (`DD-MM-YY`)**: Automatically connects to today's room (e.g. `18-11-26`) with easy navigation to past and future memories.
- **100% Free Photo Sharing**: Uses client-side image compression and stores photos directly in Firebase Realtime Database without needing paid Firebase Storage or credit card setup.
- **Real-time Sync**: Photos and love notes sync instantly between both partners.
- **Interactive Love Notes & Quick Reactions**: Drop messages and emojis under each day's photo dump.
- **Photo Lightbox & Full View**: Tap on any photo to see it full-screen.
- **Customizable Nicknames**: Each partner can set their own name.

## Running Locally
1. Start an HTTP server from the root or `dev/couple-daily-photo` folder:
   ```bash
   npx serve dev/couple-daily-photo
   # or
   python -m http.server 8000
   ```
2. Open `http://localhost:8000/dev/couple-daily-photo/index.html` in your browser.
3. Open another tab or share the URL on your phone to test the real-time couple interaction.
