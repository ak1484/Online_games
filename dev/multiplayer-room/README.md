# Multiplayer Room Prototype

This folder contains a starter prototype for a multiplayer room-based game.

The game is designed for 2 players to connect in a shared room, synchronize state, and cleanup the session when the room is empty.

## Developer: loader & local usage

- The `firebase-loader.js` module attempts to load `infra/demo_database_config.json` (development) and falls back to the local `firebase-config.js` export if the JSON is not available.
- To run locally, serve the repo over HTTP (the loader fetches the JSON) and open [dev/multiplayer-room/index.html](dev/multiplayer-room/index.html).

Example (Python):

```bash
python -m http.server 8000
```

Then open: `http://localhost:8000/dev/multiplayer-room/index.html`

- If you prefer a permanent local file, create `dev/multiplayer-room/firebase-config.js` exporting `firebaseConfig` as before.
- Security: `infra/demo_database_config.json` is for development only and is ignored by Git — do not use these credentials in production.
