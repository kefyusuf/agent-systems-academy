# v0.2.0 — Depth without feature creep

## Scope kept

- Remains Astro static, local-first, no backend, no model calls, no live MCP, no tool execution or cloud sync.
- Same 14 modules, 42 lessons, four labs, 55 glossary terms, and local browser progress model.

## Additions

- 42 authored mechanism / failure mode / trade-off / verification deep dives with primary-source links.
- One interactive, bounded design-review case for each of 14 modules, including consequences and evidence checks.
- Existing four labs include teaching hypotheses, fixed three-step experiments, caveats and expected evidence. Tool router now presents eight decision cases. Cache lab includes a full-prefix break-even *teaching* calculation.
- Static engineering capstone worksheet, eight eval fixtures, worked end-to-end design case and 20-point self-review rubric.
- Offline self-contained HTML regeneration and static UI-render smoke tests.

## Local verification

- `npm run check:content` — passed (schema, references, content sync, worksheet fixture presence, standalone sync).
- `npm test` — 24 passing tests (simulation engine and Node VM-rendered routes).
- `npm run build:offline` — passed (single-file static HTML generated).
- `npm run build` (real Astro build) — **not verified**: `npm install` could not reach registry.npmjs.org (EAI_AGAIN).
- Browser E2E using container Chromium — **not verified**: navigation was denied by the container environment (ERR_BLOCKED_BY_ADMINISTRATOR). The independent UI route tests passed in a simulated DOM environment; they are not substitutes for browser E2E.

## Review boundary

A preferred design-review answer is pedagogical feedback, not proof of engineering competence. Capstone artifacts require human self-review; no certification or live security guarantee is asserted.
