# v0.11 — Evaluation Oracle Reliability

## Objective

A test result is not inherently trustworthy merely because the test runner reports GREEN. Examine the **oracle**: the rule that decides whether evidence is acceptable. An oracle can accept corrupted evidence (false accept) or reject valid evidence (false reject). This educational exercise reuses the existing five claim-audit / failure-injection situations; it adds no new module, laboratory, route, backend, provider or MCP endpoint.

## Explicit oracle contract

Five deterministic cases, each with two controls:

1. `baseline`: a healthy, synthetic evidence record. Expected oracle decision: **valid**.
2. `injected`: the same record with precisely one corrupted field. Expected oracle decision: **invalid**.

Evaluate each control with a reference oracle and a deliberately defective mutant. Classifications are:

| Expected evidence validity | Oracle says valid | Oracle says invalid |
|---|---|---|
| Healthy | TRUE_ACCEPT | FALSE_REJECT |
| Corrupted | FALSE_ACCEPT | TRUE_REJECT |

Note that these classifications refer to **evidence validity**, not a coding agent's task-DONE state. Either oracle is forbidden to authorize tool execution or a production assurance claim.

## Five mutation probes

| Case | Oracle mutation | Expected detection |
|---|---|---|
| Paired-state leakage | Checks fixture identity but ignores grouped train/test disjointness | FALSE_ACCEPT on injected group overlap |
| Holdout contamination | Requires string `'true'` instead of boolean `true` | FALSE_REJECT on healthy holdout |
| Disputed labels | Checks fixture identity but skips adjudication receipt | FALSE_ACCEPT on missing receipt |
| Zero observed false negatives | Coerces `null >= 0` to true | FALSE_ACCEPT on missing denominator |
| Synthetic distribution shift | Rejects all synthetic provenance as too weak even for fixture-only claims | FALSE_REJECT on healthy synthetic fixture |

The reference oracle matches these ten hand-authored controls; the five mutants are each detected by at least one. This does **not** establish actual oracle sensitivity/specificity, production reliability, or correctness on unseen evidence. The fixture generator and reference share assumptions; independent field-level validation is absent.

## Version and provenance limits

`OracleReliabilityEngine.MANIFEST` records the fixed case family, reference inputs, educational mutation set, and fixture-only decision boundary. It is a version contract, not a cryptographic content hash. Changes to either the oracle logic, fixtures, or case semantics require fresh test execution and a revised manifest. A matching manifest alone is never a proof of correct behavior.

## UI and non-goals

The self-test is a **collapsed `<details>` panel within the existing v0.10 Failure Injection section**. No additional top-level navigation item, color system, persistent state, network access, or heavy visualization is introduced. A control switch replays deterministic data; no tool is called.

## Acceptance evidence

- [ ] Nine pure oracle contract tests pass.
- [ ] Two UI regressions prove collapsed default behavior, mode switching, and false-accept/false-reject display.
- [ ] Full curriculum checks remain at 14 modules / 42 lessons / 55 glossary terms / four labs.
- [ ] GitHub CI verifies the offline artifact and committed generated-source cleanliness.
- [ ] PR review confirms no network, authorization, or scope expansion.
- [ ] Pages deployment succeeds after merging only a CI-green revision.

## Interpretation

A reference test passing all *known* examples is not a guarantee that its expectations are independent, representative, or correct. Mutation detection is useful as a **test-of-tests** teaching technique, but the verdict must remain bounded to the fixed synthetic fixture.
