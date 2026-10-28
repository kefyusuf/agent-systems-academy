# Evaluation Claim Audit — Engineering Workbook (v0.9)

**Boundary:** All cases are synthetic. This exercise cannot authorize a coding agent or certify a real product.

## Review form (repeat for each case)
1. Exact proposed claim and target population:
2. Observed unique tasks, paired states, selection history and versions:
3. Possible leakage, label ambiguity or distribution mismatch:
4. Whether a new independent holdout is required:
5. Evidence that would disprove the proposed claim:
6. Final allowed statement, including its limitations:

## Case A: leakage
When incoming and recovered states share task context, row-level random splitting contaminates evaluation. Show that distinct scenario IDs never cross train/test boundaries. Do not treat 18 paired rows as 18 independent tasks.

## Case B: overfitting to holdout
If four policies are ranked repeatedly on the same test set, that set influenced policy choice. Archive the selection trace, freeze parameters, and test once on an untouched sample. Report tuning and final-test scores separately.

## Case C: disputed gold labels
Four label differences are hypotheses, not corrections. Independently adjudicate the evidence, pin the new label version and report inclusion/exclusion sensitivity and denominators. Do not silently discard difficult examples.

## Case D: zero observed false negatives
FN=0 over 13 unsafe synthetic states does not demonstrate zero underlying error risk. The illustrative two-sided 95% Wilson upper bound for zero errors in 13 independent Bernoulli trials is about 22.8%, but these observations are paired and synthetic: that interval is not valid here. Require independent sampling and risk-specific uncertainty before making external claims.

## Case E: distribution shift
A ×4 weight applied to existing revision scenarios is not a fourfold increase in field prevalence. It creates no new observation or representative sample. Treat resulting score changes as sensitivity analysis only.

## Publication gate
- [ ] Group and deduplicate related task observations.
- [ ] Freeze the policy before untouched final evaluation.
- [ ] Independently adjudicate gold labels; version every change.
- [ ] Declare denominators, task dependence and uncertainty.
- [ ] Separate hypothetical weights from observed incidence.
- [ ] Pin all relevant model, prompt, tools, policies and fixtures.
- [ ] Bound every claim to the evaluated population and time window.

Allowed: "This fixed synthetic fixture had zero false negatives under policy X."
Not supported: "Policy X has zero unsafe releases in production."
