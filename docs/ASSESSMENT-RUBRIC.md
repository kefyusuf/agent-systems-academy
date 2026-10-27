# Capstone assessment rubric

This rubric is for educational self-review, not automatic certification.

## Score (0 to 2 per criterion, total 20)

0 = absent/unsafe; 1 = partially defined or unverifiable; 2 = explicit and testable.

| Criterion | Evidence for full credit |
|---|---|
| Task boundary | intent, allowed paths/actions, forbidden effects, clear non-goals |
| Enforcement | policy executes at tool gateway, independent from model promises |
| Suggest-only behavior | useful out-of-scope ideas recorded without side effects |
| State machine | includes approval, failure, cancellation and uncertain outcomes |
| Revision-bound completion | test/verification manifest for final revision |
| Tool correctness | schema, target validation, idempotency and retry classes |
| Context engineering | provenance, trust separation, budget and compaction rules |
| Cache economics | measures token read/write, no quality regression |
| Evaluation | 8 fixtures with expected decisions and forbidden effects |
| Simplicity | fake-adapter first, no speculative infrastructure |

**Mandatory gates regardless of score:** a policy path permitting forbidden writes, absent revision-bound DONE gate, or repeated unknown-outcome side effect is automatic `REVISE`.

- 18–20 and no failed gate: `ACCEPT` as a *design brief* (not production approval).
- 14–17 and no failed gate: `REVISE` targeted missing acceptance cases.
- Below 14 or any failed gate: `REVISE` critical boundaries before implementation.

## Follow-up review prompts

1. Name one invariant that the model can ignore but the executor cannot.
2. Demonstrate `SUGGEST_ONLY` without any filesystem diff.
3. Explain why `tools/list` cannot confer authorization.
4. Produce a trace showing an unknown-outcome recovery without duplicate side effects.
5. Show where a test receipt becomes stale after file edits.
6. Distinguish cache-token hit rate from successful-task economics.
