# v0.8 — Quiet Reading Interface

## Intent

Improve concentration during long-form engineering study without changing scope or expanding the agent system.

## Changes

- Reduced decorative elements and removed the home illustration and terminal mockup.
- Softened the contrast between surfaces, borders, and accent elements.
- Kept the essential learning paths visible and grouped workshops and references in native, keyboard-accessible disclosures.
- Added an explicit, reversible lesson-only reading mode. It hides global navigation and auxiliary panels, not educational content.
- Constrained article width, increased reading rhythm, and neutralized non-semantic background colors in lesson evidence blocks.
- Respected reduced-motion preferences.
- Preserved all previous 14 modules, 42 lessons, 55 glossary terms, four labs, and reliability/evaluation workshops.

## Out of scope

No changes to curriculum, evaluation logic, policy decisions, remote telemetry, backend integration, paid APIs, or agent execution.

## Verification

- RED → GREEN: five new reading-interface tests.
- 113 unit/integration assertions via `npm run verify:local`.
- Desktop/mobile Chromium checks on the generated standalone page.
- The static Pages build can be produced without installing Astro dependencies.
- The portable `standalone.html` is generated on demand rather than committed as a stale 300 KB artifact. CI builds it before executing browser-unit tests.

## Remaining gate

Review GitHub Actions and live Pages deployment in the PR before merging into `main`.
