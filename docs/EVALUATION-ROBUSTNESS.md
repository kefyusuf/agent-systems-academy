# Evaluation Robustness & Distribution Shift (v0.7)

## Scope

This is an offline, read-only extension of the existing v0.6 evaluation. It reuses `TASK-AUTH-017`, the same nine scenarios, the same eighteen *paired*, synthetic states, and the same four frozen policies. It is not a framework, an executor, production telemetry, a stochastic model, or a new curriculum module.

## Learner problem

A benchmark can declare `Evidence-gated` perfect against all 18 fixed labeled states, but that says nothing about its performance on new projects, new labels, unseen models or new operating conditions. A reviewer must distinguish sensitivity analysis from independent validation.

## Experiment protocol

1. **Distribution weighting:** `balanced` assigns all 18 observations weight 1. `revision-pressure` assigns both states from each of three revision/verification scenarios weight 4. `boundary-pressure` assigns both states from four trust/side-effect scenarios weight 3. `recovery-pressure` assigns all recovered states weight 3. These are assumed sampling weights, not observed event frequencies. The number of distinct observations always remains 18.
2. **Annotation disagreement:** keep `reviewed` for v0.6 labels, toggle four specifically documented disputed labels as a *hypothetical alternate review* (`disputed-flipped`), or exclude disputed observations (`disputed-excluded`). Flipped is **not** a new truth set. Exclusion changes denominators and can create apparent performance improvements by removing hard cases.
3. **Grouped holdout:** one of three preassigned scenario groups becomes holdout (three scenarios, six observations); the remaining six scenarios (12 observations) become training-side review. The two phases from the same scenario are never separated. No policy is fitted to the training side: this is leakage-awareness training, not cross-validated generalization evidence.
4. **Manifest freshness:** match fixture set, gold label set, policy set and grouping revision. Changing any identifier marks earlier evaluation results stale. This lightweight string manifest is **not a cryptographic content hash**.

## Confusion matrix contract

Positive class = **HOLD is required**.

- TP = required HOLD, predicted HOLD
- FN = required HOLD, predicted ALLOW RESUME (unsafe release)
- FP = safe ALLOW RESUME, predicted HOLD (unnecessary halt)
- TN = safe ALLOW RESUME, predicted ALLOW RESUME

Weighted metrics sum per-row sampling weights rather than counting new real samples. Rates are `FN/(TP+FN)` for unsafe release and `TN/(TN+FP)` for safe throughput. A zero denominator returns `null` and UI presents N/A. Accuracy alone and especially a zero FN on these same fixtures must not be advertised as evidence of production safety.

## Disputed labels

Four hypothesis-only disputes are explicitly listed in `public/robustness-core.js`: `summary-evidence:recovered`, `scope-proposal:recovered`, `approval-handoff:recovered`, and `unknown-write:incoming`. Their explanatory comments describe how reviewer B's assumed additional evidence conflicts with fixture assumptions. They are for demonstrating reviewer disagreement, not adjudicated replacement labels.

## Invariants and negative paths

- No new evaluations are silently invented; the same eighteen unique IDs must survive all distribution profiles.
- Changing assumed prevalence must not overwrite the original ground-truth labels, policy predictions or v0.6 metrics.
- No label dispute should be counted as resolved on a simulated click.
- Grouped holdout must never split incoming/recovered from the same scenario across the two partitions.
- Stale manifest (label/policy/fixture/group) must be rejected, not silently treated as current.
- No process, network, file-write action, approval or DONE can be authorized by the teaching scorer.

## What would be required to make an external quality claim?

Out-of-scope future work would require data from an authorized production environment, versioned policy + prompts + model + tool schemas, independent annotators and adjudication, proper train/validation/test separation by task and time, deduplication, confidence intervals, slice-level analysis, severity-weighted losses and an explicit data governance process. None are present in v0.7.

## Acceptance evidence

`node --test tests/robustness-core.test.mjs`, `node --test tests/ui-render.test.mjs`, `npm run verify:local`, and `npm run build:pages`. The portable Pages artifact must reproduce the offline route and relative Markdown links.
