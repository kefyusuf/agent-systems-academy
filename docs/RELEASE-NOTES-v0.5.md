# v0.5.0 — Compaction & Handoff Verification

## Added

- A route `#compaction-studio` for nine deterministic investigation/decision/recovery cases on `TASK-AUTH-017`.
- A seven-invariant gate with read-only `inspect` / `choose` calls, matching real tool invocation count of zero.
- An after-action trace and status interpretation; approval, reverify and replan are distinguished from successful continuation.
- Detailed engineering workbook and architecture notes; tests for safe and deliberately incorrect decisions.

## Unchanged

14 modules, 42 lessons, 55 glossary terms, four labs, the v0.3 task lifecycle and v0.4 context/cache studio. No new dependencies, provider-specific networking, real tools or executable harness.

## Validation

`npm run verify:local` performs source validation and unit/UI fixture tests and regenerates the standalone HTML. `npm run verify` additionally requires Astro dependencies. Report both separately and do not assume that offline tests imply a successful production build.

## Portability regression corrected

The previous single-file generator inlined deferred scripts in the document `<head>`. Unlike external scripts, inline scripts do **not** honor `defer`; the application could run before `#page` existed and leave the loading indicator indefinitely. The v0.5 generator now appends scripts after the body content in dependency order. Checked in headless Chromium at desktop and mobile widths, including approval-hold, proposal-only decision and reset flows.
