---
description: Build this project and deploy it to GitHub Pages, then report the live URL
argument-hint: "[repo-name]  (optional, defaults to treasure-game)"
allowed-tools: Bash(gh:*), Bash(git:*), Bash(npm run build:*), Bash(npm install:*), Bash(curl:*), Read, Write, Edit
---

Deploy this project to GitHub Pages and give me the public URL.

Repo name: use `$ARGUMENTS` if given, otherwise `treasure-game`. GitHub repo names may contain letters, digits, `-`, `_` and `.`.

Follow these steps in order and stop with a clear explanation if any step fails.

1. **GitHub CLI and login.** Run `gh --version` and `gh auth status`.
   - If `gh` is missing, stop and tell me to run `! winget install --id GitHub.cli -e` and then restart the terminal.
   - If I'm not logged in, stop and tell me to run `! gh auth login` (GitHub.com, HTTPS, login with browser). Do not try to log in for me.
   - Get my username with `gh api user --jq .login`. Call it `<owner>`.

2. **Local git repo.** If the project is not a git repository, run `git init -b main`. Check `.gitignore` covers `node_modules/`, `build/`, `server/data.db`, `server/data.db-*`, `.env*` and `.vercel/` so the SQLite database (password hashes) and secrets are never pushed. Run `git status` and make sure none of those appear. Commit any uncommitted changes with a short message (`git add -A && git commit -m "..."`).

3. **GitHub repo.** Check with `gh repo view <owner>/<repo-name>`.
   - If it does not exist, create it as **public** (GitHub Pages on a free plan requires a public repo) and push the source: `gh repo create <repo-name> --public --source . --remote origin --push`.
   - If it exists, make sure `origin` points at it (`git remote -v`, add it if missing) and run `git push -u origin main`.

4. **Build with the right base path.** A project site is served from `https://<owner>.github.io/<repo-name>/`, so asset URLs need that prefix. Run `npm run build -- --base=/<repo-name>/` (do not edit `vite.config.ts`; that would break `npm run dev`). If the build fails, show me the error and stop. Then create an empty `build/.nojekyll` file so GitHub does not run Jekyll over the output.

5. **Publish the build to the `gh-pages` branch.** Push only the contents of `./build`, not the source:
   ```bash
   cd build
   git init -b gh-pages
   git add -A
   git commit -m "Deploy to GitHub Pages"
   git push -f https://github.com/<owner>/<repo-name>.git gh-pages
   rm -rf .git
   cd ..
   ```
   `build/` is gitignored, so this nested repo never touches the main repo.

6. **Enable Pages.** Check `gh api repos/<owner>/<repo-name>/pages`. If it returns 404, enable it with
   `gh api -X POST repos/<owner>/<repo-name>/pages -f "source[branch]=gh-pages" -f "source[path]=/"`.
   If Pages exists but the source is not `gh-pages` `/`, update it with the same fields using `-X PUT`.

7. **Wait for it to go live.** The first deploy takes a minute or two. Check `gh api repos/<owner>/<repo-name>/pages/builds/latest --jq .status` until it is `built` (or `errored`, then show me the error), then confirm `curl -s -o /dev/null -w "%{http_code}" https://<owner>.github.io/<repo-name>/` returns `200`.

8. **Report.** Reply with:
   - the live URL `https://<owner>.github.io/<repo-name>/` and the repo URL `https://github.com/<owner>/<repo-name>`,
   - one line on how to redeploy (`/deploy_github_page` again),
   - this caveat: GitHub Pages only serves the static frontend. The Express + SQLite API in `server/` is not deployed, so sign in / sign up and score saving will not work online. The game is playable through **Play as guest**.
