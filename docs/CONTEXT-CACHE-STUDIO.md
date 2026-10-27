# Context & Cache Studio — Technical Design (v0.4)

## Decision record

Extend the existing v0.3 Task Lifecycle training environment with a **single focused, read-only advanced workshop**, not another lab or a production harness. Use the same frozen `TASK-AUTH-017` contract and represent two design variants (risky and guarded) for nine fixtures.

## Learning objectives

1. Explain why prefix bytes/order and volatile segments affect hypothetical cache reuse.
2. Distinguish cache eligibility and hit from source freshness, authorization and final evidence.
3. Preserve provenance, trust, revision and receipts through compaction and handoff.
4. Quantify a two-request illustrative read/write cost, then qualify its limited validity.
5. Reject DONE whenever any evidence invariant fails even if cache reuse is modeled as a hit.

## Canonical evaluation fields

```
Evaluation {
  scenarioId, variant, contractId, currentRevision,
  sourceRevision, evidence, handoff, trust,
  cache: { model, eligible, equalPrefix, hit, reason,
           readTokens, writeTokens, baselineUnits, optimizedUnits,
           prefixTokens, requestTokens, savingsPercent, ageMinutes, ttlMinutes,
           firstPrefix[], secondPrefix[] },
  checks[6], canComplete, status, explanation
}
```

The engine is a pure, browser-compatible JavaScript function. It makes no I/O calls and does not mutate the selected contract. `CAN_COMPLETE` means *the illustrative fixture passes its internal prerequisites*, not that actual code, test runners, or approval systems were evaluated.

## Execution path

```
TASK-AUTH-017 (frozen)
    |-- A/B prompt materialization --------------------> single exact checkpoint
    |           |                                       -> hit/miss/units
    |           |-- current working revision (r42)
    |           |-- fetched source revision
    |           |-- untrusted-source label
    |           |-- compaction/handoff receipts
    |           '-- context token budget
    '-- DONE assessor: REVISION_FRESH, EVIDENCE_BOUND,
        SOURCE_TRUST, SCOPE_POLICY, HANDOFF_INTEGRITY, CONTEXT_BUDGET
          |-- all true: ELIGIBLE_FOR_DONE (teaching only)
          '-- any false: BLOCKED
```

## Nine fixture behaviors

| ID | Risky behavior | Guarded behavior | Teaching category |
| --- | --- | --- | --- |
| prefix-churn | Two distinct timestamp blocks inside prefix | Timestamp in suffix | Efficiency |
| tool-order | Tool and policy blocks reordered | Canonical order | Efficiency |
| dynamic-prefix | Distinct tasks prepended before breakpoint | Dynamic task suffix | Efficiency |
| stale-retrieval | `contextRevision=r41` | `contextRevision=r42` | Correctness |
| lost-evidence | Natural-language GREEN claim, missing receipt | `test:r42:07` receipt | Correctness |
| handoff | Contract/receipt missing | Structured handoff envelope | Correctness |
| untrusted-elevation | Source text as instruction | Source data remains untrusted | Trust |
| budget | Extra large history and missing evidence | Trim irrelevant history | Completeness |
| ttl-expired | Assumes hit after modeled TTL | Correctly classifies miss | Cache validity |

## Model boundaries

- Fixed example threshold `1024` and coefficients `1.25` write, `0.10` read are **teaching constants**, not pricing guarantees.
- The runtime does not emulate OpenAI or Anthropic APIs or their most recent cache-breakpoint strategies.
- Comparison uses two requests, a single exact prefix checkpoint and a deterministic TTL flag. Real prompts can have multiple breakpoints, lookback, sliding windows and different pricing, semantics or regional behavior.
- Neither hit nor miss should be used as an access-control condition.
- “Token” numbers represent illustrative counts attached to example blocks, not provider tokenizer output.
- The simulated status is not production verification or an audit certification.

## Threat model / invariant isolation

No model, browser network calls, user-defined URLs, filesystem writes or MCP calls. Displayed texts from curriculum/fixtures pass through an HTML escaping function. External documentation links are hardcoded in the engine and opened only through user action. No secrets, credentials or personal documents are read. Browser progress is still lesson-only; workshop answers do not persist.

## Acceptance gates

- All nine cases work in both variants and share the task contract.
- Stale retrieval produces `cache.hit=true` and `canComplete=false`.
- TTL expiry produces `equalPrefix=true`, `hit=false`, `canComplete=true`.
- Compaction evidence, handoff receipt, untrusted promotion and budget overflow independently fail appropriate invariants.
- Existing 14/42/55/4 content unchanged, v0.3 workshop still works.
- Standalone file includes exact same model and UI; offline build/content/test commands pass.
- If Astro dependencies are unavailable, report the limitation instead of claiming a successful static build.

## Sources

- https://developers.openai.com/api/docs/guides/prompt-caching
- https://platform.claude.com/docs/en/build-with-claude/prompt-caching
- https://modelcontextprotocol.io/specification/draft/changelog
