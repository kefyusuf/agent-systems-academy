# Architecture

## Local training application

Browser-only, static Astro page. There is no server-side state, authentication, inference, or network-dependent training engine.

- Astro owns the HTML shell and static build.
- Vanilla JavaScript owns hash-based navigation, search, quizzes, and progress persistence.
- `content/curriculum.json` is canonical lesson data. A synchronization script publishes it as a browser-global payload, enabling both Astro and a no-install HTML preview to use identical content.
- `labs-core.js` provides deterministic calculations with Node test coverage.

## Reference harness architecture taught in the curriculum

```text
User request -> TaskContract(scope, budget, acceptance)
    -> Orchestrator / state machine
       -> Context manager / retrieval / cache / memory
       -> Model port -> provider adapter
       -> Policy evaluation -> tool gateway
          -> local adapters / MCP client / sandbox
       -> Evidence / traces -> verification gate
```

Model decisions are untrusted until validated against schema, scope, policy and user authorization at an enforcement boundary. Discovery of a tool is not equivalent to authorization to call it. Completion is revision-bound.

## Provider-agnostic constraints

- Different providers can have different tool choice, cache, persistence and context semantics.
- Runtime contracts must report unsupported capabilities explicitly.
- Policy, scope and approvals should be enforced outside natural-language model instructions.
- Operational telemetry records observed actions and verification evidence without relying on hidden reasoning traces.

## Training models vs production behavior

Cache Lab models eligible cache writes at 1.25x and reads at 0.10x, with a 1,024-token eligibility threshold. These numbers are a documented **teaching scenario**, not a provider-independent law. Hits are a user-configured assumption, not a prediction. The lab's `tokenHitRate` is a token-level ratio; the app separately presents request-level read/write counts.

Policy Lab illustrates a four-decision gate plus `SUGGEST_ONLY`. It does not enforce permissions on an operating system. Router Lab checks 5 illustrative cases. Context Lab is a heuristic budget planner, not a real tokenizer.

## Threat model

No user input leaves the browser in app code. External source anchors only open if clicked. Never add dynamic HTML from arbitrary external URLs to this code without sanitization. Local storage contains only completed/passed lesson identifiers.

## Teaching content and review changes (v0.2)

- Each lesson has `deepDive` (mechanism, failureMode, tradeoff, verification, sourceIds).
- Each module has a `caseStudy` with three alternatives, one preferred answer and evidence gates.
- Each lab has `depth`: hypothesis, a fixed three-step protocol, simulation caveat, evidence and sourceIds.
- All structured content remains in `content/curriculum.json`. UI events stay client-only.
- Choosing the preferred case-study answer does not grant permissions, run tools or automatically mark a lesson complete.
- The final worksheet is static Markdown; the site does not execute it. Use `npm run build:offline` to regenerate the single-file preview after UI or content changes.

## Context & Cache Studio (v0.4)

The dedicated `#context-studio` route is an **advanced view within the existing workshop**, not a fifth lab. `context-studio-core.js` is a pure two-request, single-breakpoint illustrative cache model. It models nine A/B risk vs guarded fixtures using the unchanged `TASK-AUTH-017` contract. A separate six-invariant evidence assessor prevents caching decisions from being mistaken for authorization or DONE. See `docs/CONTEXT-CACHE-STUDIO.md` for the data contract and full failure matrix.

The model does not calculate production token counts or reproduce provider-specific cache lookback behavior. Source provenance and safety decisions are fixture metadata, not real external validation.

## Compaction & Handoff Studio (v0.5)

`#compaction-studio` reuses `TASK-AUTH-017` and models nine recovery decisions. `public/compaction-core.js` owns all immutable teaching fixtures and proof conditions; `public/app.js` renders before/after checks and choice-dependent audit traces. Evidence validity is derived from hardcoded runner/operation registry metadata, never from natural-language claims alone. `ELIGIBLE_TO_RESUME` is not `DONE`. The module performs no real side effects and is deliberately not a production authorization layer. See `docs/COMPACTION-HANDOFF.md` and the downloadable workbook.

## Reliability Evaluation (v0.6)

`#reliability-eval` is an assessment view over the v0.5 fixed `TASK-AUTH-017` fixtures. `public/reliability-core.js` produces 18 pre/post decisions from nine compaction cases, then compares four deliberately simple HOLD/ALLOW policies against a reviewed gold-label table. Positive label is **must hold**; therefore FN is a premature, unsafe resume and FP is an unnecessary hold. `public/app.js` renders error asymmetry, an explicit confusion matrix, relative effort and validated-artifact coverage. No new core labs, data collection, analytics network calls, or policy enforcement were added. See `docs/RELIABILITY-EVALUATION.md` for exact formulas and limitations.
