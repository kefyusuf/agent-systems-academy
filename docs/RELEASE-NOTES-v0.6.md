# Release notes — v0.6.0

## Scope authorization

Continue v0.5 in the same bounded learning project. Add decision-quality measurement to its nine context compaction/handoff cases. Do **not** add real agents, MCP, API calls, extra core labs, new modules, backend state or project writes.

## Delivered

- `public/reliability-core.js`: four deterministic decision strategies, independent reviewed labels for 18 paired fixture states, confusion matrices, error rates, evidence artifact completeness, and an adjustable relative-effort cost model.
- `#reliability-eval`: selectable policy, full comparison table, four-cell confusion matrix, adjustable error penalties, evidence/continuation before–after views and nine existing recovery-plan annotations.
- English engineering specification and learner assessment workbook with formulas, sample calculations, a case matrix and ADR template.
- Unit/regression UI tests, content integration checks and portable HTML inclusion.
- All previous lessons, sources, lab IDs, tests and scoped TaskContract remain unchanged.

## Verification

Use `npm run verify:local` for content validation, Node tests and portable HTML assembly. Use `npm install && npm run verify` to validate a complete Astro build in an environment that can install dependencies. Browser content and interactive selectors were checked in Chromium at desktop/mobile viewport sizes by loading the inline standalone HTML into an about:blank document; direct file and localhost navigation were blocked by the environment policy. This is **not** a complete end-to-end navigation or Astro build test. `npm install --offline` failed with `ENOTCACHED` (Astro was unavailable in npm cache). Do not claim any provider-side cache, real file execution or third-party approval service was exercised.

## Interpreting results

The reviewed class label is `HOLD required`. The fixture suite has 13 HOLD and 5 safe-to-resume states. The reported perfect evidence-gated score is **in-sample on deliberately curated synthetic fixtures**, not an estimate of true operational reliability, safety or effectiveness. Nine two-stage pairs are not 18 independent deployment samples. Relative-effort points are arbitrary. 100% hold recall for Hold-all means 0% safe throughput; the table deliberately makes this trade-off visible.

## Remaining non-goals

Instrumentation of a real coding agent, budget-to-invoice mapping, sampled real-world data, storage/export of evaluation results, provider integrations, auto-generated tasks or background execution. Each needs a new acceptance gate, real data and permission.
