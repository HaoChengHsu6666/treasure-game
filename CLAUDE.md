# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm install         # install dependencies (better-sqlite3 is a native module)
npm run dev         # Vite on :3000 (auto-opens browser) + API server on :3001, via concurrently
npm run dev:client  # Vite only; /api calls will fail, so the app falls back to the auth screen
npm run server      # API server only (node server/index.cjs)
npm run build       # production build of the frontend to ./build (not ./dist)
```

There is no test runner, linter, or `tsconfig.json`. Vite/SWC strips types without type-checking, so type errors will not fail the build. Check changes by running the dev server.

## Architecture

A React 18 + TypeScript game (originally exported from Figma Make, built with Vite + `@vitejs/plugin-react-swc`) with a small Express + SQLite backend for accounts and scores.

### Frontend

- **Game logic and UI live in `src/App.tsx`.** Three chests are created and one is picked at random to hold the treasure. The treasure chest gives +$150, a skeleton chest -$50. The game ends when the treasure is found, two skeletons are opened, or every chest is open; the result banner shows Win / Tie / Loss by the sign of the score. Opening a chest plays `chest_open.mp3` (treasure) or `chest_open_with_evil_laugh.mp3` (skeleton). `src/assets/key.png` is the cursor over closed chests (set via inline `style`).
- **App modes:** `mode` is `'loading' | 'auth' | 'guest' | 'user'`. On load `getMe()` restores a session from the cookie; failure shows `src/components/AuthScreen.tsx` (sign in / sign up / play as guest). When the game ends, signed-in users' scores are saved with `saveScore()`; guests store nothing.
- **`src/lib/api.ts`** is the only API client: `fetch('/api/...')` with `credentials: 'include'`, throwing `Error(data.error)` on non-2xx. Vite proxies `/api` to `http://localhost:3001` (`vite.config.ts`).
- **Animation** comes from `motion/react` (Framer Motion's successor): chest flip (`rotateY`), hover/tap scaling, reveal effects.
- **Assets** (`src/assets/*.png`, `src/audios/*.mp3`) are imported as ES modules so Vite resolves their URLs. `src/results/` holds reference screenshots, not app code.

### Backend (`server/`, CommonJS `.cjs`)

- `server/index.cjs`: Express 5 API. Routes: `POST /api/signup`, `/api/signin`, `/api/signout`, `GET /api/me`, `POST|GET /api/scores`. Auth is a JWT (`sub` = user id, 7 days) in an httpOnly cookie named `token`; `requireAuth` middleware loads `req.user`. Passwords are hashed with `bcryptjs`. Env: `PORT` (default 3001), `JWT_SECRET` (dev fallback; the server refuses to start without it when `NODE_ENV=production`, which also sets the `secure` cookie flag), `DB_PATH` (default `server/data.db`; point it at a scratch file to test without touching real data). The client sends the final score, so the server only bounds-checks it and cannot verify it.
- `server/db.cjs`: opens the database with better-sqlite3 (WAL mode) and creates `users` and `scores` tables with `CREATE TABLE IF NOT EXISTS`. There are no migrations, so schema changes to existing tables need manual `ALTER`s or deleting the gitignored `data.db*` files.
- `npm run build` only builds the frontend. Nothing serves `./build` together with the API, so a static deploy (Vercel / GitHub Pages) has no working auth or score saving.

### Shared conventions

- **`src/components/ui/`** is a stock shadcn/ui component library (Radix primitives plus `class-variance-authority`, with `cn()` in `ui/utils.ts`). The app currently uses only `Button`, `Input` and `Label`. Treat these files as vendored.
- **Path alias:** `@` → `./src`. `vite.config.ts` also maps versioned specifiers such as `'sonner@2.0.3'` to bare package names. These are Figma Make leftovers, so keep them if any import uses the versioned form.

## Styling caveat (important)

`src/index.css`, imported by `main.tsx`, is **pre-compiled Tailwind v4 output**. Tailwind is not installed and does not run during the build. Only utility classes that already exist in `index.css` will work. A new Tailwind class (for example a new color shade or arbitrary value) silently does nothing unless the matching CSS is added. Before relying on a class, grep `index.css` for it. If it isn't there, use inline `style` or add the rule by hand.

`src/styles/globals.css` holds the shadcn theme tokens as source. It is **not imported** anywhere.

## Notes

- `src/guidelines/Guidelines.md` is an empty Figma Make template with no project rules.
- `Attributions.md` lists the sources for the sound and icon assets. Add an entry there when you add a third-party asset.
- The README is a tutorial script for Claude Code features (memory, plan mode, custom commands for Vercel and GitHub Pages deployment). Its exercises (sounds, win/tie/loss result, key cursor, SQLite auth with guest mode) have been implemented. Treat it as history, not as a spec of current behavior.
