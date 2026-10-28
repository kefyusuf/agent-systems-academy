# Oracle Disagreement and Evidence Adjudication — Workbook (v0.13)

**Scope:** One fixed, synthetic `zero-fn` case; three existing witness modes. This workbook does not authorize tools, software delivery or real-world safety claims.

## Experiment

Open **Evaluation Robustness → Failure Injection → case 4 (Risk denominator) → Oracle Self-Test → Kaynak kayıtlarıyla çapraz kontrol → Kaynak çelişkisi ve adjudication**.

1. **Healthy**: 13 reported / 13 distinct / r42. Read `FIXTURE_ONLY`. Choose "Yalnız fixture sonucunu kaydet". Why is this not approval for a production claim?
2. **Duplicate ID**: 13 reported / 12 distinct / r42. Observe `DISPUTED_HOLD`. Compare "trust claim", "trust witness" and "request adjudication". Notice that a correct request still ends at `ADJUDICATION_REQUIRED`, not `RESOLVED`.
3. **Stale revision**: 13 reported / 13 distinct / r41. Observe `STALE_SOURCE_HOLD`. Compare using r41 vs requesting a fresh revision-bound source. Even with matching counts, do not accept an incomparable revision.
4. Switch back to Healthy. Verify all three fixture responses are repeatable, with no hidden state changes.

## Review questions

- Which actual source is authoritative for unique risk identifiers? What evidence would establish ownership?
- What can a reviewer infer from a discrepancy: that one side must be wrong, or which one is wrong?
- How do duplicate records and revision freshness affect evaluation denominators?
- What is the minimum provenance/receipt set needed before making a final external claim?
- What must be re-evaluated if the adjudicated source changes?
- Why are two locally authored synthetic sources *not* genuine independent validation?

## Decision record template

| Field | Entry |
|---|---|
| Fixture / task identity | |
| Reported denominator, source revision | |
| Witness unique IDs and source revision | |
| Conflict type (cardinality / freshness) | |
| Decision gate (DISPUTED_HOLD / STALE_SOURCE_HOLD) | |
| Adjudication reviewer / source owner required | |
| Authoritative records and provenance still missing | |
| Revision-bound verification to rerun | |
| External claim still forbidden | |

## Acceptance criteria

- [ ] I identify the disagreement rather than choosing an arbitrary winner.
- [ ] I never accept r41 evidence as proof of r42.
- [ ] I understand that a review request is not a completed review.
- [ ] I can list independently sourced evidence that real adjudication would need.
- [ ] I do not confuse a synthetic fixture result with production safety.
- [ ] I do not interpret any educational option as task-DONE or tool authorization.

**Permitted:** "Within this synthetic exercise, the two count-based checks disagree with the registry under a duplicate-ID case; adjudication must precede any stronger claim."

**Not permitted:** "The independent source established the true production risk denominator."
