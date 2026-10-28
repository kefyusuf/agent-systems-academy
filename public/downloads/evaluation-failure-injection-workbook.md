# Evaluation Failure Injection — Engineering Workbook (v0.10)

**Scope:** Five v0.9 claim-audit cases, fixed synthetic evidence. All decisions are advisory only; they cannot authorize edits, tools, deployment or production assertions.

## How to run each experiment

1. Choose one of the five cases in the existing Evaluation Robustness screen.
2. Record the healthy evidence field, expected value and the bounded `FIXTURE_ONLY` verdict.
3. Select **Kanıtı boz**. Only one field changes. Record the actual value and `CLAIM_BLOCKED` reason.
4. Choose a recovery proposal. Compare the incorrect proposals to the intended recovery.
5. Even when `REVERIFY_REQUIRED` appears, do not mark the claim or task successful. Write down which authoritative source must be rechecked.

| Case | Field corruption | What was lost? | Evidence required to continue |
|---|---|---|---|
| A: paired leakage | groupDisjoint true → false | holdout independence | grouped split IDs, zero overlap, fresh evaluation |
| B: overfitting | selectionIndependent true → false | untouched final test | policy freeze, selection history, new final holdout |
| C: ambiguous labels | adjudicationReceipt → null | gold label provenance | blind adjudication, versioned labels and denominators |
| D: zero FN | denominator 13 → null | observed failure-rate denominator | exact source-bound count and clustered uncertainty |
| E: synthetic shift | provenance synthetic → observed | hypothetical-versus-field distinction | explicit provenance and representative field sample |

## Engineering worksheet

For each case, fill:

- Proposed claim and its scope:
- Source revision / test manifest:
- One modified evidence key and original value:
- Faulted value and failed invariant:
- Why the rejected recovery proposals are insufficient:
- Correct recovery proposal and how to verify it:
- What must remain blocked until new evidence exists:
- Which claims are **still prohibited** after repair:

## Completion criteria

- [ ] All five faults yield `CLAIM_BLOCKED`.
- [ ] Exactly one key differs from the healthy evidence record in each case.
- [ ] Appropriate recovery yields `REVERIFY_REQUIRED`, never `DONE`.
- [ ] Invalid action identifiers are rejected, not silently normalized.
- [ ] The student can articulate why zero FN in a synthetic fixture cannot prove production safety.
- [ ] The student can separate simulated sensitivity from observed prevalence.

### Example answer: zero FN

With `denominator = null`, the numerator `FN=0` is not an interpretable rate. The recovery proposal is to reattach the documented risky-observation denominator to the exact fixture and recalculate. This still leaves generalization, sample independence, risk slice coverage and field deployment effectiveness unproven.

**Permitted statement:** “In the fixed synthetic fixture, the policy showed 0 false negatives among 13 labeled unsafe *rows*.”

**Not permitted:** “The agent has zero unsafe-release probability in production.”
