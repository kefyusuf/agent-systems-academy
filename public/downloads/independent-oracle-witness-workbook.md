# Independent Oracle Witness — Engineering Exercise (v0.12)

**Case:** The existing `zero-fn` claim. All data is synthetic and illustrative.

## Learning objective

Spot common-mode oracle failures. Two separately written checks can accept the same unsupported claim when both depend on one questionable input.

## Experiment

1. Navigate to Evaluation Robustness → Failure Injection → case 4 (Risk denominator).
2. Open Oracle Self-Test (v0.11), then the collapsed **Kaynak kayıtlarıyla çapraz kontrol (v0.12)** panel.
3. Choose `Sağlam kayıt`. Both claim-based validators accept; the 13 distinct r42 entries match the claim, but only `FIXTURE_ONLY` is allowed.
4. Choose `Yinelenen kimlik`. The registry still has 13 rows but only 12 unique IDs. The two validators agree on ACCEPT; the witness emits `CLAIM_BLOCKED`.
5. Choose `Eski revizyon`. Cardinality is correct but the source is r41 instead of r42. The witness blocks the claim.
6. Return to the healthy mode; verify the original zero-FN claim fixture was not mutated.

## Review worksheet

| Question | Notes |
|---|---|
| What assumption do both validators share? | |
| Why does thirteen rows not necessarily mean thirteen distinct risky observations? | |
| Why must evidence be bound to the source revision? | |
| Why is a separately authored fixture not automatically an independently trusted authority? | |
| Which source would independently confirm the sample IDs in a real project? | |
| What additional evidence is required before publishing a real reliability claim? | |

## Acceptance and safeguards

- [ ] Both naive predicates say ACCEPT for all three modes.
- [ ] Healthy mode has 13 unique records and r42.
- [ ] Duplicate mode has 13 records and 12 unique IDs and is blocked.
- [ ] Stale mode has 13 unique records but r41 and is blocked.
- [ ] Any mismatch requires authoritative source re-verification.
- [ ] No result authorizes an actual coding-agent action.
- [ ] I can explain why the two validators and this synthetic witness do not certify production reliability.

**Permitted statement:** “This fixed teaching registry demonstrates that two count-based checks can agree while source identity or freshness is invalid.”

**Prohibited statement:** “An independently certified source verified that the deployed agent has zero unsafe releases.”
