# Publish Agent Systems Academy as a public GitHub Pages site

## Selected repository

- GitHub account: `kefyusuf`
- Suggested repository name: `agent-systems-academy`
- Visibility: **public**; no included secrets, API keys, private company/customer data or telemetry.
- GitHub Pages canonical project URL (only after a successful deploy): `https://kefyusuf.github.io/agent-systems-academy/`

**Important:** These files do not create a GitHub repository and do not publish a live URL by themselves. The user must create the repository in their own account and activate Pages under repository Settings.

## First push on Windows PowerShell

1. Create the repository at `https://github.com/new` using the exact name `agent-systems-academy`, select **Public**, and leave README/LICENSE/.gitignore initialization **unchecked**. A public repository does not automatically grant others reuse rights; choose a license separately after a deliberate decision.
2. Extract the supplied v0.7 ZIP into a clean directory. Its root must contain `package.json`, `src/`, `public/`, `.github/`, and `scripts/`.
3. Run the built-in offline validation, then publish the initial commit:

```powershell
npm run verify:local
npm run build:pages

git init
git add .
git commit -m "chore: initialize agent systems academy v0.7"
git branch -M main
git remote add origin https://github.com/kefyusuf/agent-systems-academy.git
git push -u origin main
```

4. On GitHub, go to **Settings → Pages → Build and deployment → Source → GitHub Actions**. The workflow `.github/workflows/pages.yml` will publish `_site/index.html` and the workbooks to the repository subpath. Look at Actions for the first successful run before treating the URL above as live.

## Why Pages publishes the portable edition first

The project remains an Astro source project, but the execution environment did not have access to the npm registry to verify the native Astro build. The offline page contains the same browser application, built by `node scripts/build-standalone.mjs`; Pages deployment uses `npm run verify:local`, `npm run build:pages`, and GitHub's official Pages artifact/deploy actions. It does **not** run `astro build` and it does not make an unverified claim about Astro bundling.

This zero-dependency publication path is a deliberate temporary choice: when an npm lockfile and a real Astro build are verified, a follow-up PR can switch Pages to Astro's official `withastro/action` + `deploy-pages` without changing the lesson/case scope.

## Change control

- Implement one scoped issue on a `feat/...` branch.
- Write negative-path tests (RED), implement the minimal fix (GREEN), then refactor and verify.
- Open a PR; `ci.yml` validates the existing project without installing packages.
- Review the diff and the generated portable edition; merge to main only after approval.
- The `pages.yml` workflow deploys main. Branch protection and environment protections can be configured in GitHub Settings if supported by the account's plan.

## Public data safety

Do not commit `.env`, account credentials, private customer code, personal files, browser `localStorage`, or user data. Lesson progress stays only in the visitor's own browser; no analytics, signup, or backend is added. Public visibility is not equivalent to choosing an open-source license; no license is included until a license is explicitly chosen.
