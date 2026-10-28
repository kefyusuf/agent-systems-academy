# Oracle Reliability — Engineering Workbook (v0.11)

**Scope:** Five existing synthetic evaluation cases. No production telemetry, model calls, real edits, approval, or external execution.

## Experiment protocol

1. Enter Evaluation Robustness → Failure Injection.
2. Open **Oracle öz testi (isteğe bağlı)**. By default the reference oracle is selected.
3. Check the **healthy** and **corrupted** control decisions: TRUE_ACCEPT / TRUE_REJECT.
4. Switch to **Hatalı kontrol**. Record the mutation detected, FALSE_ACCEPT or FALSE_REJECT, and the faulty assumption.
5. Choose another one of the existing five cases and repeat. The study is complete after all five defects have been explained.

## Record sheet

| Case | Reference healthy | Reference corrupted | Mutant error | Why did the oracle fail? |
|---|---|---|---|---|
| Group leakage | TRUE_ACCEPT | TRUE_REJECT | FALSE_ACCEPT | It ignores group membership |
| Holdout selection | TRUE_ACCEPT | TRUE_REJECT | FALSE_REJECT | It checks the wrong boolean type |
| Gold-label receipt | TRUE_ACCEPT | TRUE_REJECT | FALSE_ACCEPT | It ignores adjudication provenance |
| Zero-FN denominator | TRUE_ACCEPT | TRUE_REJECT | FALSE_ACCEPT | JavaScript coerces null in numeric comparison |
| Synthetic provenance | TRUE_ACCEPT | TRUE_REJECT | FALSE_REJECT | It rejects valid fixture-only evidence |

## Engineering questions

1. Why does a GREEN test not prove the test oracle is correct?
2. Why should a test-of-tests include both healthy and defective inputs?
3. Which mutants cause **false confidence**? Which cause **unnecessary blocking**?
4. Does killing five deliberately inserted mutants measure actual production reliability? Why not?
5. What independent data source would be needed to challenge a mistaken fixture label?
6. What must be re-run if the fixture manifest or validation predicate changes?

## Safety and evidence boundary

Each of the 10 controls is a deliberately selected synthetic observation, not an independent field sample. A correct diagnosis of these five mutants is only evidence that this small set of mistakes is detected. The paired examples are dependent. The reference predicate and fixture contract may share an unnoticed assumption; both can be simultaneously wrong.

**Permitted:** "The fixed educational controls detect these five intentionally defective oracle predicates."

**Not supported:** "The evaluator is guaranteed to classify agent behavior correctly in production."

## Self-review checklist

- [ ] I separated oracle false accept/reject from task-level false positives and negatives.
- [ ] I can explain the exact mutated predicate for each case.
- [ ] I can name an independent oracle-validation source.
- [ ] I did not turn an oracle diagnosis into authorization to execute an agent task.
- [ ] I can explain why fixture coverage does not imply distribution coverage.
