# Scope-controlled roadmap

## M0 — Previously delivered

Static Astro learning experience, 42 lessons, a glossary, curated official references, 4 local rule-based teaching labs, quizzes, local progress, content validation and simulation unit tests.

## M1 — Depth-focused curriculum upgrade (shipped in v0.2)

- 42 lesson-specific engineering analyses: mechanics, failure modes, trade-offs, proof plans and source links.
- 14 scenario-based design review choices with explicit acceptable evidence.
- Four existing labs strengthened by three-step experiment protocols; tool router upgraded to eight cases.
- Downloadable design worksheet, worked example, 20-point self-review rubric.
- Offline standalone regeneration command and schema checks.

## M1.1 — One end-to-end guided task case (shipped in v0.3)

- Seven-stage, one-contract lifecycle workshop with eight negative-path fixtures plus the clean baseline.
- Pure deterministic state machine with actionable BLOCKED trace, approval hold, revision-bound DONE checks and unit tests.
- In-depth execution design guide and downloadable workbook; no live tools, filesystem writes, MCP or provider integrations.

## M1.1.1 — Context & cache depth (shipped in v0.4)

- Nine side-by-side failure-injection cases about exact-prefix reuse, source freshness and evidence integrity using the frozen v0.3 task contract.
- One deterministic cache-checkpoint illustration plus six DONE invariants (not a real provider cache or security gate).
- Offline Context & Cache Studio, English review workbook, tests; 14/42/55/4 unchanged.

## M1.2 — Candidate only, not authorized

- Comparative vendor deep dives only where official implementation behavior can be verified.
- Downloadable learner exercise templates and ADR/eval worksheets.
- Local import/export of progress, after a documented privacy decision.
- Improved accessibility and browser E2E regression suite.

## M2 — Deliberately out of scope

Real MCP connectors, agent tool execution, model-provider integration, server-side accounts, distributed orchestration, SaaS monetization, and project editing. Any of these requires a separate brief, threat model and explicit approval.

## Release gate

Do not accept feature expansion without a concrete learner problem and a testable outcome. Prefer depth of one lab over five decorative integrations.

## M1.1.2 — Compaction & handoff depth (shipped in v0.5)

- Nine read-only recovery exercises on the original TaskContract; no fifth lab or 15th module.
- Seven explicit continuation invariants and typed `ELIGIBLE_TO_RESUME`, `NEEDS_REVERIFY`, `NEEDS_REPLAN`, `WAITING_APPROVAL`, `BLOCKED` results.
- Authenticated-evidence **modeling** through synthetic immutable fixture registries; no forged runner, approval or filesystem effects.
- English assessment workbook with negative-path exercise matrix and provenance/side-effect reasoning.
- No real agent orchestration or model interaction; planned M2 remains out of scope.

## M1.1.3 — Evaluation depth (shipped in v0.6)

- A deterministic scorer over the same nine v0.5 recovery cases, two paired states each (18 decisions).
- Four transparent continuation policies; confusion matrix with positive class defined as HOLD required.
- Separate unsafe-release, unnecessary-hold, safe-throughput, evidence artifact completeness, and a tunable **relative cost** metric.
- Synthetic independent reviewed labels and explicit error asymmetry limitations; **no claim of production reliability**.
- One advanced assessment route, engineering specification, workbook and unit/UI/content verification. Original 14/42/55/4 scope frozen. No live tools or model integrations.

## Candidate next deepening — requires another scoped decision

- Improve annotation robustness with adjudicator disagreements and distribution shifts **inside the same fixed workshop**.
- Do not add new capabilities or expand the original M2 exclusion list without explicit authorization.

## M1.1.4 — Evaluation robustness (v0.7)

- Sensitivity to synthetic scenario prevalence and reviewer-label disagreements within the same 18-state v0.6 evaluation.
- Grouped holdout (pair-preserving), manifest revision checks and explanatory exercises; no empirical generalization or production quality claim.
- Publish-ready, statically hosted, dependency-free Pages edition for the same Astro source; no real executor or additional core lab.
