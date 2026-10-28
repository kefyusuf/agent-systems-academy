# v0.12 — Independent Oracle Witness (Common-Mode Failure)

## Scope freeze

Extend the **existing**, collapsed v0.11 oracle self-test with one more optional drill-down for the existing `zero-fn` case. Keep five claim-audit cases, five oracle cases, four teaching laboratories, fourteen modules, 42 lessons and 55 terms. No new route, tool, backend, model, MCP adapter, remote evidence collector, or production assertion.

## Problem

Two validators can agree while sharing the same erroneous assumption. If they both trust the reported `denominator=13`, they will accept the claim even if the underlying registry has thirteen rows but only twelve distinct risk IDs, or if the registry belongs to an old source revision.

An agreement between two predicates is **not** independent validation.

## Deliberately limited experiment

The claim source remains the fixed `EvidenceInjectionEngine` `zero-fn` baseline, containing `denominator=13` and the synthetic fixture label.

Two candidate predicates:
- A: `denominator === 13`.
- B: `Number.isInteger(denominator) && denominator > 0 && fixture === expected`.

Both trust the same reported count. They are not independent, regardless of different code syntax.

A separately authored **synthetic** registry provides 13 explicit risk identifiers and a source revision. A witness check evaluates: all IDs unique; cardinality equals reported denominator; revision equals `r42`; source name matches a versioned teaching manifest.

| Mode | Reported denominator | Registry rows | Distinct IDs | Revision | Two validators | Witness |
|---|---:|---:|---:|---|---|---|
| Healthy | 13 | 13 | 13 | r42 | ACCEPT | FIXTURE_ONLY |
| Duplicate ID | 13 | 13 | 12 | r42 | ACCEPT | CLAIM_BLOCKED |
| Stale revision | 13 | 13 | 13 | r41 | ACCEPT | CLAIM_BLOCKED |

`CLAIM_BLOCKED` is advisory; it triggers re-verification against an authoritative registry and revision-bound evidence. It cannot approve tool calls, deployment, task completion or real-world safety claims. `FIXTURE_ONLY` is a **teaching fixture result**, never production acceptance.

## Independence limitation

Although the claim and witness are authored as separate constants, they **ship in the same JS bundle, repository and CI pipeline**. The witness is not a separate trusted authority, independently sampled field data, or external cryptographic provenance. This is a demonstration of a *potential* common-mode blind spot, not assurance that our own reference model is correct.

Production-grade independence would require a genuinely separate and authorized source of records, source ownership, provenance, revision verification, and an adversarial review of its assumptions. Do not add those integrations to this educational milestone.

## Evidence contract and TDD

1. RED commit: eight isolated unit tests; CI fails because `IndependentOracleEngine` is absent.
2. GREEN commit: pure deterministic witness with three fixed modes, fail-closed mode handling and manifest checks.
3. UI: only within the zero-FN case, in a nested collapsed details element. No additional navigation or visual accent.
4. Regression: no mutation of v0.10 evidence, no real execution, unchanged curriculum and existing oracle tests.
5. CI: content validation, all tests, portable offline bundle, GitHub Pages artifact.
6. Review diff for scope drift, stale source paths, unsafe actions and author attribution. Merge only with a green head SHA.

The accompanying learner exercise is in `public/downloads/independent-oracle-witness-workbook.md`.
