---
description: Build this project and deploy it to Vercel (production), then report the live URL
argument-hint: "[project-name]  (optional, defaults to treasure-game)"
allowed-tools: Bash(npx vercel:*), Bash(npm run build:*), Bash(npm install:*), Read, Write
---

Deploy this project to Vercel production and give me the public URL.

Project name: use `$ARGUMENTS` if given, otherwise `treasure-game`. Vercel project names must be lowercase letters, digits and `-`.

Follow these steps in order and stop with a clear explanation if any step fails.

1. **Vercel CLI and login.** Use the CLI through `npx vercel@latest` (it is not installed globally). Run `npx vercel@latest whoami`. If that fails because I'm not logged in, stop and tell me to run `! npx vercel@latest login` in the prompt, then run this command again. Do not try to log in for me.

2. **Vercel config.** This project builds to `./build`, not Vite's default `./dist`, so Vercel needs to be told. If `vercel.json` does not exist in the project root, create it with:
   ```json
   {
     "framework": "vite",
     "buildCommand": "npm run build",
     "outputDirectory": "build"
   }
   ```
   If it already exists, read it and make sure `outputDirectory` is `build`.
   Also make sure `.vercelignore` exists and excludes `node_modules`, `build`, `server`, `*.db`, `*.db-*`, `.claude`, `src/results`, `.env` and `.env.*`, so the SQLite database (password hashes) and local secrets are never uploaded.

3. **Local build check.** Run `npm run build` and make sure it succeeds before uploading anything. If it fails, show me the error and stop.

4. **Link the project.** If there is no `.vercel/` folder, run `npx vercel@latest link --yes --project <project-name>`.

5. **Deploy.** Run `npx vercel@latest deploy --prod --yes`. The deployment URL is printed on stdout.

6. **Report.** Reply with:
   - the production URL (the `https://<project-name>.vercel.app` alias if the output shows one, plus the unique deployment URL),
   - one line on how to redeploy (`/deploy_vercel` again),
   - this caveat: Vercel only serves the static frontend. The Express + SQLite API in `server/` is not deployed, so sign in / sign up and score saving will not work online. The game is playable through **Play as guest**.
