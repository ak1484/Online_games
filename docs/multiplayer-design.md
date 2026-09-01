# Multiplayer Design

This document describes the architecture for future multiplayer or team-of-two games.

## Goals

- Support players creating or joining rooms.
- Keep game state synchronized across connected players.
- Automatically delete or expire rooms when all players leave.
- Use free services where possible for hosting, auth, and realtime sync.

## Room/session model

1. Player creates a room.
2. The room is stored in a backend session store.
3. Other players join the room using a room code or link.
4. All players receive realtime updates for session state.
5. When every player leaves, the room is removed or marked expired.

## Session state

Keep the following data for each room:
- `roomId`
- `hostPlayerId`
- `playerIds`
- `gameState` (positions, scores, turn state, etc.)
- `createdAt`
- `lastActiveAt`
- `status` (waiting, active, finished)

## Realtime sync

Use one of these free realtime options:
- Supabase Realtime
- Firebase Realtime Database / Firestore
- Vercel / Netlify functions plus a lightweight websocket or polling layer

Client workflow:
1. Connect to the room.
2. Subscribe to room state changes.
3. Send actions to the backend.
4. Receive the updated state and render it.

## Session lifecycle

- Room forms when a player creates one.
- Players join by code or link.
- Players can leave voluntarily.
- When no players remain, the backend deletes or expires the room.
- Use a TTL for inactive rooms (for example, 5–10 minutes after the last player leaves).

## Free deployment path

- Use GitHub Pages / Vercel / Netlify for the front-end static game.
- Use Supabase or Firebase for backend session state and auth.
- Use serverless functions for room creation, join validation, and cleanup.

## Suggested folder layout for multiplayer

- `dev/multiplayer-game/`
  - `public/`
  - `src/`
  - `server/` (serverless function handlers)
  - `README.md`
  - `notes.md`
  - `test-results.md`

## Agent updates

- `game-creator-agent` should document multiplayer flow in `game-template.md`.
- `orchestrator-agent` should select backend and realtime provider options.
- `main-agent` should validate that session cleanup and sync are covered.

## Notes

- Keep the static game frontend separate from backend session handling.
- Avoid long-lived rooms; use ephemeral state and cleanup.
- Start with a simple two-player room model before expanding to larger matches.
