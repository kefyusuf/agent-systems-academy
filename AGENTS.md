# Repository working agreements

## Purpose
Deliver a small, local-first training site that teaches agent harness engineering. It is **not** an agent runtime.

## Scope and authority
- Do not connect model APIs, execute user code, write project files, deploy, or add external services without explicit authorization.
- Propose out-of-scope improvements in a separate section; do not silently implement them.
- Preserve core content in `content/curriculum.json`; do not directly edit generated `public/curriculum.js` or `standalone.html`. Regenerate using scripts.
- Keep product UI and lessons in Turkish; repository documents, capstone templates and code identifiers in English.
- Never place provider secrets in browser files.

## Testing and change workflow
1. Describe the requested change, affected files, tests, non-goals and risks.
2. Add a failing test for core logic changes (RED) and verify expected failure.
3. Implement the narrowest code needed (GREEN).
4. Refactor, run `npm run check:content`, `npm test` and, if dependencies are available, `npm run build`.
5. Inspect the diff and report verified commands and limitations.
6. Commit on a scoped branch, review, and merge only on explicit approval.

Never assert tests passed unless you observed the commands finish successfully. Never sign off, add co-author metadata, or attribute commits to AI tools.

## v0.3 scope note

The guided lifecycle workshop is **not** a real executor or security enforcement boundary. Keep the core deterministic and side-effect free; never add live tools, credential access or a backend under the guise of deepening training. Expand by improving evidence-based explanations and test fixtures first.

## v0.4 scope note

The Context & Cache Studio extends the existing workshop without creating another laboratory or tool runtime. Keep the frozen `TASK-AUTH-017` contract, deterministic risk/guarded variants, and the invariant checks. Do not turn example read/write token multipliers into claims about provider billing. Deepen source-verified learning content and test scenarios before creating integrations.

## v0.5 scope lock

Preserve TASK-AUTH-017 and the 14/42/55/4 baseline. `compaction-core.js` is a deterministic read-only teaching model. Any receipt, approval, operation or revision values are synthetic. A handoff summary MUST NOT authorize a tool call, mint a human approval, transfer historical test evidence to new HEAD, or automatically grant DONE. Always add negative-path tests before changing decisions or routes. Do not introduce provider adapters, actual MCP calls, remote writes or extra core labs.

## v0.6 scoring scope lock

`reliability-core.js` reads the existing v0.5 fixtures and adds an offline educational evaluation. The `GOLD_AFTER` annotation is a fixed independent review label; do not derive a policy's expected output from that policy's own predictions. Always preserve the HOLD-positive confusion-matrix definitions, case prevalence and the 18-paired-observations disclaimer. Relative-effort scores are invented teaching parameters, **never** production telemetry. Do not turn “ALLOW RESUME” into DONE, user authorization, or a real tool write. Any extension requires a new negative-path test and must not alter the 14/42/55/4 baseline.

## v0.7 public release and evaluation integrity

- Preserve the v0.6 ground truth. All v0.7 alternate labels and distribution weights are *hypothetical sensitivity tests*, not adjudicated operational facts or new independent observations.
- Never split the incoming/recovered pair from the same scenario across holdout groups.
- If fixture, annotation, policy or grouping revision changes, invalidate prior published evaluation claims; the teaching manifest is not a cryptographic attestation.
- Public release contains **no secrets or user data**. Do not enable telemetry, backend, external integrations or new agent execution features.
- GitHub Pages currently publishes the portable edition; do not represent that as a verified Astro compilation. Keep the two outputs sourced from the same curriculum and browser code.
