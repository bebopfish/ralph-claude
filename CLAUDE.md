# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

### Development
```bash
npm run dev        # Start both frontend (port 5173) and backend (port 3001) concurrently
npm run build      # Build both workspaces
npm run start      # Start production build
```

### Frontend (from `/frontend`)
```bash
npm run dev        # Vite dev server on port 5173
npm run build      # TypeScript compile + Vite build
npm run lint       # ESLint
npm run preview    # Preview production build
```

### Backend (from `/backend`)
```bash
npm run dev        # tsx watch src/index.ts (hot reload)
npm run build      # tsc compile to dist/
npm run start      # node dist/index.js
```

## Architecture

**Ralph Claude** is a web UI that orchestrates Claude Code CLI to implement PRD stories automatically. The core loop:
1. User defines stories in `prd.json` via the UI
2. Clicking "Start Ralph" → backend spawns Claude CLI on the target project
3. Claude output streams via WebSocket to the frontend in real-time
4. After each story, backend runs type-check + tests, commits on success, marks story done
5. Repeats until all stories are complete

### Stack
- **Frontend**: React 18 + TypeScript + Vite, Zustand for state, TailwindCSS, React Router v6, @dnd-kit for drag-drop
- **Backend**: Express + Node.js, WebSocket (`ws` library), `tsx` for dev hot-reload
- **Monorepo**: npm workspaces (`frontend/` + `backend/`)
- **No database**: All persistence is file-based (`prd.json`, `progress.txt`, `~/.ralph/config.json`)

### Key Files
- `backend/src/services/ralphRunner.ts` — Core automation engine: spawns Claude CLI, streams output, runs quality checks, commits
- `backend/src/ws/wsHandler.ts` — WebSocket broadcast hub; events flow from runner → all clients
- `frontend/src/store/appStore.ts` — Single Zustand store for all app state (project, PRD, logs, WebSocket status)
- `frontend/src/hooks/useWebSocket.ts` — Connects to `/ws`, dispatches events into Zustand store
- `frontend/src/App.tsx` — Router with `RequireProject` guard; all routes redirect to project picker if none selected

### Frontend Pages
| Route | Page | Purpose |
|-------|------|---------|
| `/dashboard` | DashboardPage | Live logs + run controls |
| `/prd` | PrdPage | Drag-drop story board |
| `/brainstorm` | BrainstormPage | AI chat → auto-generate stories |
| `/progress` | ProgressPage | View `progress.txt` learning log |
| `/git` | GitPage | Browse Ralph's auto-commits |

### Backend Routes
- `GET/POST /api/projects` — Select project, list recent projects
- `GET/PUT /api/prd` — Read/write `prd.json` in target project
- `GET/PUT /api/progress` — Read/write `progress.txt` in target project
- `GET /api/git` — Git log for target project
- `POST /api/ralph/start`, `POST /api/ralph/stop`, `GET /api/ralph/status`
- `POST /api/brainstorm` — Call Claude API for story suggestion

### State & Persistence
- **Zustand store**: `currentProject`, `prd`, `logs`, `ralphRunning`, `wsConnected`
- **LocalStorage**: Logs persisted per project (`ralph-logs:{projectPath}`, max 500 entries)
- **PRD file**: `{projectPath}/prd.json` — stories with status and tasks
- **Config**: `~/.ralph/config.json` — recent projects list

### Vite Proxy
Frontend dev server proxies `/api` and `/ws` to `http://localhost:3001`, so no CORS issues in dev.

### Windows Support
`ralphRunner.ts` uses `claude.cmd` on Windows (`process.platform === 'win32'`).

## Design System
Follow the Apple-inspired design documented in `DESIGN.md`:
- Primary color: `#0071e3` (Apple Blue)
- Backgrounds: `#ffffff` / `#f5f5f7` alternating
- Text: `#1d1d1f` primary, `#86868b` secondary
- Font: SF Pro Display/Text via system font stack
- Avoid heavy borders, shadows, or bright accent colors outside the palette
