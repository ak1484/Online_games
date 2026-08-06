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
