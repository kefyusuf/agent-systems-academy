# v0.10 — Evaluation Failure Injection

## Scope and non-goals

Extend the existing `#eval-robustness` route; do not create a route, lab, course module, backend, model invocation, MCP server, authorization or execution environment. Preserve the v0.8 quiet visual hierarchy, 14 modules, 42 lessons, 55 terms, four teaching labs and all prior deterministic exercises.

## Learning objective

Each of the five v0.9 claim audit situations has a controlled, fictional evidence record. The student switches between the bounded, healthy educational fixture and **one intentionally corrupted field**. The engine checks the field explicitly and reports `CLAIM_BLOCKED` on any mismatch. No fault changes any other evidence field, and all fixtures are synthetic.

| Audit case | Evidence key | Healthy | Injected | Required recovery |
|---|---|---|---|---|
| Paired leakage | `groupDisjoint` | `true` | `false` | Recompute scenario-group split, verify no overlap |
| Holdout reuse | `selectionIndependent` | `true` | `false` | Freeze policy, evaluate on untouched holdout |
| Disputed labels | `adjudicationReceipt` | `adjudicated-v1` | `null` | Blind independent adjudication and label version |
| Zero FN | `denominator` | `13` | `null` | Rebind denominator to canonical fixture manifest |
| Synthetic shift | `provenance` | `synthetic` | `observed` | Restore source-bound weight provenance |

Healthy states return `FIXTURE_ONLY`, **not** verified production safety. An appropriate proposed repair returns `REVERIFY_REQUIRED`, **not** `FIXTURE_ONLY`, `DONE` or tool authorization. Inappropriate choices remain `CLAIM_BLOCKED`. No action mutates the evidence, calls a tool or adjusts the existing policy scoring.

## Fail-closed invariants

1. Unknown case, mode or repair action is rejected.
2. Only one evidence field is changed per injected fixture.
3. Injected evidence never authorizes a claim, execution, deployment or completion.
4. Correct recovery is a proposal: provenance and checks must be repeated.
5. Baseline and corrupted runs remain deterministic and independent of UI selection history.
6. A synthetic result cannot become a claim about a real model's production reliability.

## TDD and acceptance

RED: first commit the eight failure-injection core tests; GitHub PR CI must fail while the core does not yet exist.

GREEN: implement the engine and two UI regression tests, then run the established curriculum validation, complete test suite and offline Pages artifact generation. Confirm unchanged curriculum counts and deployment success before merging.

The workbook is downloadable at `public/downloads/evaluation-failure-injection-workbook.md`.
