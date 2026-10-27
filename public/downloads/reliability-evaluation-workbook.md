# Reliability Evaluation Workbook — v0.6

**Exercise:** Determine whether an agent should continue after context compaction and handoff. This evaluates *continuation admission*, not task completion or execution authorization.

**Task:** `TASK-AUTH-017` / token expiry regression; only `src/auth/token.ts` and `tests/auth/token.test.ts` are permitted by the contract. No code is executed in the exercise.

## Learning outcomes

By completing the exercises you should be able to:

1. Define the positive class and produce a confusion matrix for a hold/resume decision.
2. Explain why perfect recall from a Hold-all strategy can coexist with zero useful task throughput.
3. Distinguish *artifact completeness* from *policy-boundary compliance* and *DONE evidence*.
4. Describe why summary claims cannot replace version-bound runner receipts or approvals.
5. Calculate a transparent relative-effort total without describing simulated units as production telemetry.
6. Propose a credible evaluation protocol for a real system, including annotation independence, holdouts and failure investigation.

## A. Freeze the dataset

Two phases of each of the nine cases are evaluated independently as scored decisions, though they share the same synthetic task context.

| Scenario | Incoming / reviewed label | Recovered / reviewed label |
|---|---|---|
| `summary-evidence` | HOLD | ALLOW RESUME |
| `revision-after-compaction` | HOLD | HOLD |
| `untrusted-relabel` | HOLD | ALLOW RESUME |
| `approval-handoff` | HOLD | HOLD |
| `unknown-write` | HOLD | ALLOW RESUME |
| `scope-proposal` | HOLD | ALLOW RESUME |
| `handoff-contract` | HOLD | ALLOW RESUME |
| `concurrent-change` | HOLD | HOLD |
| `misleading-green` | HOLD | HOLD |

**Exercise A1.** Why can the recovered `approval-handoff` state not be resumed even though the previous agent claimed to obtain approval? Explain the difference between an approval request and an authenticated human decision.

**Exercise A2.** For `revision-after-compaction`, write a state transition sequence from context revision `r42` to a safe new test receipt on `r43`. Do not claim a new test has been run by the educational model.

**Exercise A3.** Explain why an `ELIGIBLE_TO_RESUME` result cannot be used as a DONE receipt or an authorization to edit new files.

## B. Model four decisions

- `Summary-first`: continuation depends on a compacted text success claim.
- `Runner-only`: continuation depends only on the runner receipt check.
- `Evidence-gated`: continuation requires all seven continuation gates.
- `Hold-all`: no task is ever resumed.

**Exercise B1.** Annotate the predicted HOLD/ALLOW for all 18 states, then count TP/FN/FP/TN. Your positive label is **requires HOLD**.

| Policy | TP | FN | FP | TN | False allow rate | Unnecessary hold rate |
|---|---:|---:|---:|---:|---|---|
| Summary-first | | | | | | |
| Runner-only | | | | | | |
| Evidence-gated | | | | | | |
| Hold-all | | | | | | |

**Exercise B2.** A manager claims, “Hold-all has 100% safety recall, so this is the best strategy.” Give two concrete counterarguments about throughput, responsibility and the costs of needless stops.

**Exercise B3.** A second manager claims, “Runner-only checks tests, so approval and scope do not matter.” Demonstrate two counterexamples using the handoff cases.

## C. Evaluate evidence separately

Evidence-completeness numerator: how many of these **required, verified** checks pass? `CONTRACT_BINDING`, `REVISION_FRESH`, `RUNNER_RECEIPT`, `OPERATION_RECONCILED` and, only where an approval is required, `APPROVAL_AUTHORITY`.

**Exercise C1.** Estimate the verified-artifact coverage for the incoming and recovered forms of `summary-evidence`. Why is it incorrect to count “tests passed” as a verifiable runner receipt?

**Exercise C2.** In `untrusted-relabel`, the evidence items can be complete while the trust policy still fails. Explain how to calculate completeness and still reject the resume.

**Exercise C3.** For `approval-handoff`, explain why the recovered state remains 4/5. What exact kind of new *external* event would be needed to satisfy the missing requirement?

## D. Risk-weighted relative effort

For a policy across 18 scored decisions:

```
TOTAL = 18 × inspection_cost_per_decision
      + recovery_effort_for_correct_HOLDs
      + false_allow_count × false_allow_penalty
      + false_hold_count × false_hold_penalty
```

Assumptions: policy inspection costs are Summary-first=1, Runner-only=2, Evidence-gated=4, Hold-all=0. Recovery effort from the fixed cases is 78 units when all true HOLDs are caught. These are fictional relative effort points, not measured runtime, currency or inference tokens.

**Exercise D1.** Use false-allow penalty 50 and false-hold penalty 8 to calculate the aggregate costs. Show every component and its provenance.

**Exercise D2.** Keep the former at 50 and change false-hold penalty from 8 to 20. Explain why the Hold-all strategy changes ranking.

**Exercise D3.** With fixed recovery effort, solve the break-even penalty at which Evidence-gated becomes cheaper than Hold-all. Explain why a single scalar cost still cannot express all safety requirements.

**Exercise D4.** Identify three aspects of real cost not reflected in these numbers (examples: real API token billing, queue time, human review, delay, outage impact, test time, or defect severity).

## E. Independent evaluation protocol

Write an ADR or experiment charter in English. Include:

- Population definition and unit of analysis: what is a distinct task, request, or unsafe side effect?
- Pre-registered ground truth, independent adjudication and policy holdout.
- Event provenance and immutable evidence revision binding.
- Dataset diversity: clean tasks, malicious tool output, HEAD drift, pending approvals, unknown write outcome and race conditions.
- Acceptance thresholds for false allows and safe throughput by risk tier, including stopping conditions.
- Causal and confounding risks: provider versions, prompt changes, cache TTL, tool schema variations and workload selection.
- Cost per *verified and accepted task*, not per cache request alone.
- A reporting plan with segment rates, denominators, sample sizes and uncertainty intervals.

### ADR template

```
ADR-ID:
Question:
Safety invariant:
Task population:
Positive label and annotation owner:
Unit of analysis:
Holdout design:
Failure taxonomy:
Policies compared:
Metrics and denominator:
Risk weights and reason:
Evidence retention / provenance:
Acceptance gates:
Stale evidence response:
Known limitations:
Decision and follow-up:
```

## Answer key (read only after attempting)

**A1:** Requested, claimed or summarized approval is not a signed human approval. Correct state remains `WAITING_APPROVAL`. **A2:** Refresh HEAD, invalidate old receipt, inspect diff, execute fresh tests outside the replay and attach a revision-bound receipt. **A3:** Continuation and completion have distinct contracts.

**B1:** Summary-first TP=1 FN=12 FP=1 TN=4; Runner-only TP=7 FN=6 FP=0 TN=5; Evidence-gated TP=13 FN=0 FP=0 TN=5; Hold-all TP=13 FN=0 FP=5 TN=0. Rates use 13 HOLD states for false allow and 5 ALLOW states for unnecessary hold. **B2:** Safe throughput is zero; wait queues and manual intervention grow even with no false allows. **B3:** Signed approval and scope checks are not runner properties; test success cannot authorize out-of-scope edits.

**C1:** 3/4 then 4/4. **C2:** Completeness is orthogonal to `TRUST_PROVENANCE`. **C3:** 4/5 both stages; only a genuine authorization from the human gate changes this (and it is not simulated here).

**D1:** Summary-first: 18 + 3 + 600 + 8 = **629**; Runner-only: 36 + 52 + 300 + 0 = **388**; Evidence-gated: 72 + 78 + 0 + 0 = **150**; Hold-all: 0 + 78 + 0 + 40 = **118**. **D2:** Hold-all becomes 0 + 78 + 0 + 100 = **178**; Evidence-gated stays 150. **D3:** `78 + 5×false_hold_penalty = 150`, so break-even is **14.4 relative units**. **D4:** No underlying provider/time/billing/real incident data exist here.

**E:** There is no single correct ADR. Refuse claims of measured production reliability, causal improvements or real savings without a representative labeled holdout and instrumented evidence.
