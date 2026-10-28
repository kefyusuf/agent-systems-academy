# v0.13 — Oracle Disagreement and Evidence Adjudication

## Problem and scope

Two validators can agree on a reported risk denominator while a separately curated registry contradicts it. The previous v0.12 witness already detects a count mismatch or stale revision. v0.13 asks what an engineering system should **do when two sources disagree**.

Use only the existing `zero-fn` case and the same three witness modes. No new route, lab, curriculum module, new data connector, actual adjudicator, agent runtime, external API, or production-level verification. UI is a nested collapsed panel inside the existing Oracle Self-Test / Independent Witness exercise, preserving the quiet v0.8 design.

## Decision contract

The claim reports `denominator = 13`. The separately authored synthetic registry supplies a unique ID count and source revision.

| Mode | Claim | Unique IDs | Registry revision | Decision |
|---|---:|---:|---|---|
| healthy | 13 | 13 | r42 | `FIXTURE_ONLY` |
| duplicate-id | 13 | 12 | r42 | `DISPUTED_HOLD` |
| stale-revision | 13 | 13 | r41 | `STALE_SOURCE_HOLD` |

The status is determined by source revision/comparability **before** count comparison. A stale source cannot become reliable merely because its count matches the reported claim.

`DISPUTED_HOLD` is not a statement that either side is correct: it means the conflict needs adjudication by an appropriately authorized reviewer using independent, attributable source records. `STALE_SOURCE_HOLD` requires source refresh and revision-bound receipts.

### Options and outcome

- Healthy: record the **synthetic** fixture result → `FIXTURE_ONLY`. Claims about production remain prohibited.
- Conflict: request a source and identity adjudication → `ADJUDICATION_REQUIRED`. The request is **not** an adjudication result or permission.
- Stale revision: request authoritative source refresh → `REVERIFY_REQUIRED`. No corrected source has been received.
- All shortcut options (trust whichever source is louder, promote stale data, treat fixture-only as production) → `CLAIM_BLOCKED`.

All `choose(...)` responses explicitly retain `proofComplete=false`, `evidenceCollected=false`, `revisionValidated=false`, `resolved=false`, and the execution/production/DONE authorization flags set to false.

## Evidence protocol for real systems (design only)

A real adjudication would require separately governed and authenticated record sources, task/fixture and sampling identity, source ownership, immutable revision-bound receipts, deduplication rules, and an explicit reviewer decision. An authorized operator must reconcile the conflict, version revised labels or records, rerun evaluations and audit the resolution. Do not automatically approve work from an LLM summary or an untrusted tool result.

These requirements are **documentation only** in this release. No actual identity verification, cryptographic attestation, independent-source request, or human approval takes place.

## Trust and limitations

Both the claim and witness are synthetic teaching data bundled in this single repository and evaluated by the same local application. Their values were manually authored. Even a green healthy mode cannot prove oracle correctness or estimate a real agent's unsafe release rate. A matching version manifest is a version identifier, not cryptographic proof of data integrity.

## Verification gates

1. RED: eight new contract tests intentionally fail before the engine is implemented.
2. GREEN: deterministic fail-closed `OracleAdjudicationEngine`, two UI tests, and a downloadable workbook.
3. Verify no mutation of earlier fixture engines and no new authorizations.
4. Keep 14 modules / 42 lessons / 55 terms / 4 core labs.
5. Validate portable bundle and Pages artifact; inspect scope/security diff.
6. Merge only once GitHub PR CI is green, then verify post-merge CI and Pages deployment.

Avoid broadening this milestone into external services, live agent execution, or generic adjudication engines.
