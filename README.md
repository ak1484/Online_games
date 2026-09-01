# Online Games Project

This repository is the root for a collaborative online game website project.
It includes agent-based planning, development workflows, and a clean structure for production, development, and deployment guidance.

## Purpose

- Build a web portal hosting online player games.
- Support single-player, multiplayer, and couple games.
- Use a lightweight agent-driven workflow to manage planning, development, and deployment.

## Project structure

- `agents/` — agent directories, shared metadata, and workflow definitions.
- `prod_games/` — completed, live-ready games and deployment notes.
- `dev/` — active development, prototypes, and test progress.
- `docs/` — hosting, database/auth guidance, deployment process, and contribution notes.
- `infra/` — optional future service configuration and deployment scripts.
- `plan.md` — the shared project plan and agent structure.

## Deployment

This project has a static game prototype in `dev/coin-collector`.
You can deploy it for free using GitHub Pages, Vercel, or Netlify.

- GitHub Pages: site is available at `https://ak1484.github.io/Online_games/`
- Single-player game: `https://ak1484.github.io/Online_games/dev/coin-collector/index.html`
- Multiplayer prototype: `https://ak1484.github.io/Online_games/dev/multiplayer-room/index.html` - a turn-based click-to-claim room where each player claims cells in realtime.
- Couple Daily Photo Sharing: `https://ak1484.github.io/Online_games/dev/couple-daily-photo/index.html` - date-based daily room photo sharing and notes for couples.
- Vercel: import the repo and set the root directory to `dev/coin-collector`
- Netlify: import the repo and publish from `dev/coin-collector`

Future multiplayer versions will require a simple backend or realtime service.
Recommended free services include Supabase or Firebase for realtime sync, auth, and session state, with Vercel/Netlify hosting serverless match/room APIs.

### Deploying the multiplayer room with Firebase Hosting
1. Install Node.js and Firebase CLI: `npm install -g firebase-tools`
2. Log in: `firebase login`
3. Initialize hosting in the repo: `firebase init hosting`
   - Choose the existing Firebase project `multiplayerroomtest`
   - Set `dev/multiplayer-room` as the public directory
   - Configure as a single-page app if needed
4. Deploy: `firebase deploy`
5. Visit the Firebase Hosting URL from the Firebase console.

> Keep `dev/multiplayer-room/firebase-config.js` out of source control. It is already ignored by `.gitignore`.

See `docs/deployment-guide.md` and `docs/multiplayer-design.md` for full steps.

## Getting started

1. Read `plan.md` to understand the project strategy.
2. Open `agents/shared/agent-manifest.json` for agent roles.
3. Use `docs/` for free hosting and deployment guidance.

## Notes

- The current setup is intentionally markdown-first, with minimal dependency between agents.
- `main-agent` oversees decisions and issue tracking.
- `orchestrator-agent` plans deployment and free infrastructure.
- `game-creator-agent` builds game prototypes and local testing.
- `qa-agent` is optional and may be added later for quality review.

## Development demo database

- **Purpose**: A local developer/demo Firebase config is included for convenience when building prototypes and running agents that need a shared dev database.
- **File**: infra/demo_database_config.json (keep this file local; it is ignored by Git).
- **Usage**: Copy the `firebase` object values into `dev/multiplayer-room/firebase-config.js` for local testing, or configure your local agents to read the JSON when running in `development` mode.
- **Security**: This file contains project credentials for a development/testing Firebase project — do not commit it to source control or expose it in production.
