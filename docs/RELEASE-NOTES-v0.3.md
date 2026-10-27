# Agent Systems Academy v0.3 — Release Notes

## Goal

Deepen the existing curriculum **without adding a new agent, integrations, dependencies or general-purpose features**. Link previously isolated teachings into one end-to-end, failure-oriented architecture case.

## Added

- `#workshop`: a dedicated guided Task Lifecycle Workshop view in the existing static Astro app.
- Seven gates: TaskContract → Context → Tool Gateway → Policy → Execution → Evidence → DONE.
- One fixed authentication expiry task contract with scope, non-goals and acceptance criteria.
- Nine deterministic fixtures: baseline, injection, scope creep, approval hold, timeout, unknown outcome, race, stale evidence and failing regression.
- Fail-closed training choices: blocked decisions do not advance the stage or create simulated writes; their reasons stay in an event trace.
- Special approval case terminates in `WAITING_APPROVAL` with zero writes, not DONE.
- Evidence gate checks final revision and write receipt presence; recovery after a failing regression creates a separate revision.
- Dedicated technical guide and an English workbook (`docs/TRACE-WORKSHOP.md`, `public/downloads/task-execution-workbook.md`).
- Pure workshop engine with unit tests and UI smoke tests, no new npm dependency.

## Unchanged

- 14 modules, 42 lessons, 55 glossary entries, 4 original teaching labs, quiz/progress storage, source library and capstone worksheet.
- No cloud accounts, model API, MCP calls, repository reads/writes, actual test executions, or provider binding.
- UI remains Turkish; engineering contracts, markdown docs and identifiers remain English.

## Verification and caveats

- `npm run check:content` checks the source curriculum + synchronized offline bundle and new workshop assets.
- `npm test` verifies pure stage transitions, failure paths, DONE receipts and serverless UI route rendering.
- `npm run build:offline` produces the single HTML file with the workshop engine embedded.
- Live Astro `npm run build` needs the first `npm install` (Astro dependency); report its status separately if this environment cannot access the registry.
- The workshop's `RED`/`GREEN` events are illustrative labels, not observed test executions or independently attested evidence. The JavaScript model provides teaching invariants, not tamper-proof security enforcement.
