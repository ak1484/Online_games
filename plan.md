## Plan: Agent-driven Online Game Website

TL;DR - Create a cleaner, more productive agent environment for `c:\Users\ankit\Downloads\Online_games` with focused agent roles, shared metadata, optional QA support, separate prod/dev/docs areas, and an exact folder tree for the initial project setup.

**Steps**
1. Create the root folders:
   - `agents/` - main agent workspace with subfolders and shared metadata.
   - `prod_games/` - completed live-ready games with deployment references.
   - `dev/` - active development, prototypes, tests, and feedback notes.
   - `docs/` - free hosting, database/auth guidance, deployment guides, and conventions.
   - `infra/` (optional) - future deployment/service configuration notes and scripts.
2. Define focused agent responsibilities:
   - `orchestrator-agent` handles SDLC planning, free hosting selection, free database/auth, and deployment readiness.
   - `game-creator-agent` handles game ideas, game specifications, local build/test, and deliverable packaging.
   - `main-agent` supervises both agents, reviews outputs, records decisions, and resolves blockers.
   - Optional `qa-agent` provides quality review and release validation, or it can be modeled as a checklist under `main-agent`.
3. Add shared metadata and lightweight task handoffs:
   - `agents/shared/agent-manifest.json` or `agents/shared/agent-directory.md` for agent roles and interfaces.
   - `agents/shared/deployment-checklist.md` and `agents/shared/game-status-template.md` for consistent tracking.
   - Agent-specific status files such as `task-log.md`, `backlog.md`, and `decision-log.md`.
4. Use a low-dependency workflow:
   - each agent works from shared markdown artifacts instead of tightly coupled code flows.
   - `main-agent` consumes status logs and decides remediation rather than re-running agent logic.
   - `orchestrator-agent` moves games from `dev/` to `prod_games/` with clear deployment notes.
5. Build the exact folder tree and file list:
   - `agents/main-agent/`
     - `skill.md`
     - `README.md`
     - `decision-log.md`
     - `task-log.md`
   - `agents/orchestrator-agent/`
     - `skill.md`
     - `README.md`
     - `workflow.md`
     - `free-infra-guide.md`
   - `agents/game-creator-agent/`
     - `skill.md`
     - `README.md`
     - `backlog.md`
     - `game-template.md`
   - `agents/qa-agent/` (optional)
     - `skill.md`
     - `README.md`
     - `qa-checklist.md`
   - `agents/shared/`
     - `agent-manifest.json`
     - `game-status-template.md`
     - `deployment-checklist.md`
   - `prod_games/`
     - `README.md`
     - `[game-name]/`
       - `README.md`
       - `config.json`
       - `live-url.md`
   - `dev/`
     - `README.md`
     - `[game-name]/`
       - `README.md`
       - `notes.md`
       - `test-results.md`
   - `docs/`
     - `hosting.md`
     - `database-auth.md`
     - `deployment-guide.md`
     - `contributing.md`
   - `README.md` (root)
   - `.gitignore`
6. Update the root plan to reflect these additions:
   - make the project less congested by pushing most logic into markdown-driven artifacts.
   - include deployment and hosting recommendations in `docs/`.
   - add optional QA workflow without forcing a new agent until needed.

**Relevant files**
- `c:\Users\ankit\Downloads\Online_games\README.md` — root project overview.
- `c:\Users\ankit\Downloads\Online_games\agents\main-agent\skill.md` — main agent oversight.
- `c:\Users\ankit\Downloads\Online_games\agents\orchestrator-agent\workflow.md` — SDLC and deployment workflow.
- `c:\Users\ankit\Downloads\Online_games\agents\game-creator-agent\game-template.md` — game creation logic.
- `c:\Users\ankit\Downloads\Online_games\agents\shared\agent-manifest.json` — shared agent metadata.
- `c:\Users\ankit\Downloads\Online_games\docs\hosting.md` — free hosting and distribution guidance.
- `c:\Users\ankit\Downloads\Online_games\prod_games\README.md` — production game records.
- `c:\Users\ankit\Downloads\Online_games\dev\README.md` — development workspace guidance.

**Verification**
1. Confirm the improved folder tree exists with `agents/`, `prod_games/`, `dev/`, `docs/`, and optional `infra/`.
2. Confirm each agent folder has a `skill.md` plus at least one task/workflow or tracking file.
3. Confirm the root `README.md` and `docs/` files document the project purpose, agent roles, and deployment strategy.

**Decisions**
- Use markdown files and shared templates for agent coordination, not executable agent code at this stage.
- Keep `main-agent` as the central decision taker and low-dependency coordinator.
- Add `qa-agent` only if explicit review workflow is needed; otherwise use `main-agent` plus checklist.
- Shared metadata in `agents/shared/` is the main integration point, reducing tight coupling.

**Further Considerations**
1. Should `agents/agent-manifest.json` include handoff rules and per-agent output formats now?
2. Should `infra/` be created immediately, or only when a hosting provider and deployment scripts are selected?
3. Do you want example YAML/JSON task definitions for future automation inside `agents/shared/`?
