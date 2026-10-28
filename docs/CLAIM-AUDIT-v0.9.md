# v0.9 — Evaluation Claim Audit

## Purpose and scope
Extend only the existing #eval-robustness route. Five deterministic, advisory-only decisions teach which claims a fixed evaluation can and cannot support. No model, backend, tools, authorization, new lab, new route or new curriculum module. All 14 modules / 42 lessons / 55 terms / four labs and existing evaluation fixtures remain intact.

## Failure modes
1. **Paired-state leakage:** incoming and recovered states of the same task belong to one scenario group; splitting them across train/test contaminates holdout.
2. **Holdout selection bias:** choosing a policy based on holdout makes that set tuning data. Freeze the policy and use a new, untouched final test.
3. **Disputed labels:** reviewer hypotheses are not verified truth. Obtain independent evidence, blind adjudication and report sensitivity with explicit denominators.
4. **Zero observed FN:** 0 / 13 synthetic risky states is a fixture observation, not evidence that production risk is zero. Pair dependence precludes treating all 13 as independent Bernoulli trials. Even if independence were established, a two-sided 95% Wilson upper bound for 0/13 would be approximately 22.8%, not zero; that hypothetical calculation is NOT a valid interval for this fixture.
5. **Synthetic shift:** multiplying existing row weights by four changes score contributions, not sample count or measured incidence.

## Claim contract
An external claim would require a defined target population, independent and representative task-based sampling, grouped/time-aware partitions, an untouched final holdout, pinned prompt/model/policy/tool/fixture versions, unbiased gold label adjudication, provenance, clustered uncertainty analysis and risk-slice reporting. None is available here.

Each choice returns advisory feedback, what evidence is missing and the claim boundary. UI selections are in-memory and cannot approve tools, resume work, mutate policies or transition a task to DONE. This release preserves the v0.8 quiet layout.

## Verification
The deterministic core has four new unit tests; UI interaction has one regression test. Run npm run verify:local and npm run build:pages. GitHub Actions remains the final gate for this branch.
