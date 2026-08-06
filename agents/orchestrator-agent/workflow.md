# Deployment Workflow

This file describes the orchestrator agent's workflow for moving games from development to production.

Steps:
1. Game creator produces a prototype in `dev/`
2. Orchestrator reviews readiness criteria
3. Orchestrator selects free hosting and DB/auth options
4. For multiplayer games, orchestrator defines room/session backend requirements and realtime sync paths
5. Game is prepared for publication in `prod_games/`
6. Live URL and deployment notes are recorded
