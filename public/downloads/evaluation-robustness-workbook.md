# Engineering Workbook — Evaluation Robustness (v0.7)

**Task:** TASK-AUTH-017  
**Source dataset:** nine synthetic recovery scenarios × incoming/recovered = 18 observations  
**Positive class:** HOLD required  
**Required evidence:** reasoned assumptions + confusion matrix + changed-denominator discussion

## Exercise 1 — Distribution shift (E01)

Select `revision-pressure` and compare `Summary-first`, `Runner-only`, `Evidence-gated`, and `Hold-all` with the balanced profile.

- What changed: samples, weights, ground truth or policy behavior?
- Which strategy misses more unsafe releases when revision failures are assumed to occur more often?
- Explain why a weighted total greater than 18 is **not** a larger independent sample size.

## Exercise 2 — Label uncertainty (E02)

Select `Evidence-gated` under `reviewed`, `disputed-flipped`, and `disputed-excluded`.

- Record TP, FP, FN, TN in each mode.
- Which assumptions must be independently verified to resolve the disagreements?
- Why may removing four disputed labels inflate reported performance?

## Exercise 3 — Holdout leakage (E03)

Select `Runner-only` and each of the three grouped holdout folds.

- Identify all six test-side observation IDs for one fold.
- Explain how splitting an incoming record into training and the corresponding recovered record into test would leak scenario-specific information.
- Why does an unchanged policy and grouped holdout still **not** establish out-of-sample predictive quality?

## Exercise 4 — Evaluation revision manifest (E04)

Change the hypothetical labels revision from `reviewed-v0.6-13-hold-5-allow` to `adjudicated-v2` in your written plan.

- Which recorded scores become stale?
- What evidence must be recomputed?
- Why is this string-based manifest weaker than a content-addressed evidence record?

## Review questions

1. What is the cost of an unsafe ALLOW compared with an unnecessary HOLD for a payment write?
2. Why do paired replays violate the naive assumption of 18 independent experiments?
3. What are the data governance and attribution requirements before publishing production performance?
4. Where does a suggested improvement end and authorization to modify the target repository begin?

## Answer guide

- E01: weights vary, unique states and labels remain frozen; `revision-pressure` emphasizes runner and revision failures, so comparisons shift in their *weighted* confusion matrices only.
- E02: original reviewed labels remain frozen; flip is a sensitivity bound, not a new adjudicated truth. Exclusion changes the evaluated population.
- E03: fold unit is a scenario, not a row. No model or policy tuning is performed; real external generalization is not measured.
- E04: all scores referencing changed labels become stale; re-annotate, rerun, record revisions, independent review, and integrity-hash if relying on an external audit.

## Scope and integrity statement

All numbers are deterministic, synthetic teaching values. `ALLOW RESUME` is not `DONE`, and none of the exercises performs a tool call, edits a real project, grants approval, or measures a commercial provider.
