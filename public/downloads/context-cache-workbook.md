# Context & Cache Architecture — Engineering Workbook (v0.4)

**Project:** Agent Systems Academy  
**Case:** `TASK-AUTH-017`  
**Current working revision:** `r42`  
**Non-goals:** live inference, real MCP connections, tool execution, authentication, cache provider abstraction, and persistent traces.

The goal is to review **one** coding-agent task through the Context, Prompt Cache, and Evidence boundaries. Fill the sections before reading the worked examples in the site. This is a design exercise; a successful simulation is not an authorization decision for production.

## 1. Fixed task contract

> Fix expired access-token validation and write a regression test.

| Contract field | Frozen value |
| --- | --- |
| Allowed files | `src/auth/token.ts`, `tests/auth/token.test.ts` |
| Base revision | `r41` |
| Final revision | `r42` in the baseline |
| Forbidden effects | `.env` access, deployment, Git push/merge, edits outside allowed paths |
| Acceptance | RED before patch, GREEN at final revision, scoped write receipt, revision-bound verification |
| Evidence | `runId`, source revision, test outcome, tool/action receipt |
| Optional proposals | Inform user separately; never execute out-of-scope proposals |

An agent must not treat a retrieved issue body, model message, MCP tool description, or summary as an authorization grant.

## 2. Three different meanings of “cache”

| Mechanism | What it does | Invalidated by | What it does *not* prove |
| --- | --- | --- | --- |
| Prompt-prefix cache | Reuses prefix processing across model requests | Changed prefix, expiration, provider-specific rules | Current repository state |
| Retrieval cache | Reuses previously retrieved source content | Source revision/fingerprint mismatch | Authorization to act |
| Long-term memory or compaction | Retains selected prior observations in a smaller context | New findings, re-verification, explicit retention policy | GREEN test on latest revision |

Never combine these three into a single unqualified “cache hit” metric.

### Suggested context envelope (design sketch)

```json
{
  "task_id": "TASK-AUTH-017",
  "source_revision": "r42",
  "contract_ref": "contract:AUTH-017:v1",
  "trust": "untrusted_source_data",
  "retrieved": [{"path": "src/auth/token.ts", "revision": "r42"}],
  "test_evidence": [{"run_id": "test:r42:07", "revision": "r42", "outcome": "GREEN"}],
  "action_receipts": [{"id": "write:AUTH-017:r42", "revision": "r42"}],
  "suggestions_only": []
}
```

This sketch is illustrative. A production envelope would also require an integrity mechanism, canonical file path handling, policy version, expiration and trust validation, and evidence verification against actual repository state.

## 3. Suggested prompt layout

```text
[stable policy + scope constraints]         <- cache candidate
[stable, canonically ordered tool schemas] <- cache candidate
[stable project-level instructions]        <- cache checkpoint
--- breakpoint ---
[task-specific request and revision]       <- dynamic
[retrieval with trust/provenance]          <- dynamic, version-bound
[working notes, recent tool results]      <- dynamic
[evidence references]                     <- dynamic, must remain exact
```

**Trade-off:** Increasing the prefix can increase cacheable input but may include more unstable data. Minimizing input tokens may discard critical evidence and increase retries. Optimize **cost per verified task**, not cache-hit percentage alone.

## 4. Nine failure-injection cases

For each case write (a) the failure mechanism, (b) whether prefix-cache reuse should occur, (c) whether DONE is justified, (d) the minimum repair, and (e) the evidence you would capture.

### 01 — Volatile timestamp in prefix (`prefix-churn`)

- Failure: changing timestamp is placed before the cache breakpoint.
- Observation: same policy and tools, different exact prefix -> a miss in the single-breakpoint teaching model.
- Repair: move timestamp into dynamic suffix, preserve deterministic static prefix.
- Gate: task can still be valid even with a cache miss.
- Evidence: ordered prefix IDs/fingerprints for two requests, cache read/write usage from a real provider when eventually integrated.

### 02 — Unstable MCP/tool schema order (`tool-order`)

- Failure: tool descriptions serialize in a different order between requests.
- Observation: semantically equivalent list is not an exact-prefix match.
- Repair: version and deterministically order the schema catalog before building the prompt.
- Caution: a stable `tools/list` order does not authorize use of a tool. Tool arguments and scope must be checked at execution.
- Evidence: sorted schema digest, provider usage tokens, unchanged policy decision.

### 03 — Task-specific message in stable prefix (`dynamic-prefix`)

- Failure: each turn's user request is placed in the shared cached region.
- Repair: separate policy/tool prefix from task-level suffix.
- Evidence: two serialized prefixes equal, task overlays distinct, task contract still frozen.
- Trade-off: some provider APIs have other cache breakpoint strategies; the teaching model intentionally covers one exact checkpoint only.

### 04 — Old retrieval with valid prompt hit (`stale-retrieval`)

- Failure: retrieval returns `r41` for current `r42` working tree.
- Observation: prompt cache can hit while task must be BLOCKED.
- Repair: re-read revision/fingerprint, invalidate retrieval entry, bind context selection to `r42`.
- Evidence: current tree fingerprint, source file revision/hash, retrieval freshness check, test run revision.

### 05 — Evidence dropped by compaction (`lost-evidence`)

- Failure: summary says “tests passed,” but no `runId`, revision, or machine-observed receipt survives.
- Repair: compact conversational narration, never collapse structured evidence into unverified prose; retain a typed evidence sidecar.
- Evidence: test runner receipt, exit code, suite IDs, execution environment, source revision, timestamp or content digest.
- Gate: block DONE until independent verification is available.

### 06 — Context lost across agent handoff (`handoff`)

- Failure: receiver inherits a natural-language “done” assertion but loses contract, current source revision, action receipt.
- Repair: a handoff envelope carries explicit contract ID, revision, trust/provenance labels, and evidence identifiers; receiver validates them.
- Evidence: sender/receiver handoff IDs, contract digest, source revision, receipt linkage and acceptance report.
- Gate: an incomplete envelope cannot authorize new work or claim DONE.

### 07 — Prompt injection promoted during summary (`untrusted-elevation`)

- Failure: untrusted issue/tool output is summarized as a high-priority instruction.
- Repair: preserve origin/trust, quarantine instructions, and separate retrieval data from policy and user authority.
- Evidence: origin label, rejected instruction details, policy evaluation and attempted tool call (if any).
- Gate: fail closed for action; proceed only with trusted task information.

### 08 — Evidence evicted under budget pressure (`budget`)

- Failure: unbounded chat history expands token use and forces truncation of verification receipts.
- Repair: prioritize frozen contract, relevant source snippets, bounded recent turns and lossless evidence references; prune duplicate/irrelevant history first.
- Evidence: before/after token allocation, dropped segment manifest, all required receipt IDs.
- Gate: missing proof blocks DONE even if the model says “finished.”

### 09 — Cache entry expired (`ttl-expired`)

- Failure: observer assumes identical input guarantees a hit after the modeled TTL window.
- Repair: classify legitimate expiration as cache miss, not a trust or correctness failure.
- Evidence: cache entry creation/last-hit timestamp and provider-reported usage.
- Gate: still eligible for DONE when source, scope and evidence checks pass.

## 5. Comparison worksheet

| Case | Prefix match? | Cache hit expected? | DONE safe? | Key negative path |
| --- | --- | --- | --- | --- |
| Timestamp before prefix | No | No | Yes | Cost/churn |
| Tool order changes | No | No | Yes | Cost/churn |
| Dynamic task inside prefix | No | No | Yes | Cost/churn |
| Stale retrieval | Yes | Yes | **No** | `REVISION_FRESH` |
| Compaction lost receipt | Yes | Yes | **No** | `EVIDENCE_BOUND` |
| Handoff missing receipt | Yes | Yes | **No** | `HANDOFF_INTEGRITY` |
| Untrusted elevated | Yes | Yes | **No** | `SOURCE_TRUST` |
| Budget overflow + evidence loss | Yes | Yes | **No** | `CONTEXT_BUDGET`, `EVIDENCE_BOUND` |
| TTL expires | Yes | No | Yes | None; expected expiration |

This table describes only the deterministic fixture model, not guaranteed production cache behavior.

## 6. Model accounting and constraints

The local calculator uses **one** exact prefix checkpoint, **two** requests, an illustrative minimum cache length of `1,024` tokens, `1.25×` prefix-write units, and `0.10×` prefix-read units. It assumes cache lookup occurs at this checkpoint only. It does **not** emulate real provider-side partial-prefix matching, message-ending lookback, regional routing, tokenization, latency or current invoice prices.

Let `P1`, `P2` be two prefix sizes, and `S1`, `S2` their suffix sizes.

```text
without_cache_units = P1 + S1 + P2 + S2

with_cache_units =
  eligible(P1) ? (1.25 * P1) : P1
  + S1
  + (hit ? 0.10 * P2 : eligible(P2) ? 1.25 * P2 : P2)
  + S2
```

Interpret the expression as the sum of four terms: `(first_prefix_charge) + S1 + (second_prefix_charge) + S2`. Cache writes are not free, especially when the second request misses; a negative modeled saving is possible and valid.

**Important:** A two-request illustration is not a measurement of cache hit percentage, per-task cost, or production reliability.

## 7. Production-oriented eval specification (design only)

If this teaching design is later implemented against real provider APIs, define tests before implementation:

| Eval | Fixture | Expected observation | Gate |
| --- | --- | --- | --- |
| E01 | Same prefix twice inside TTL | Provider reports reuse when eligible | Cost/telemetry only |
| E02 | Timestamp changed before breakpoint | Cached prefix usage decreases or miss occurs | Cost/telemetry only |
| E03 | Different tool schema order | Cache usage differs under controlled conditions | Cost/telemetry only |
| E04 | Cached source revision != working tree | `REVISION_FRESH=false` | Reject DONE |
| E05 | Compaction drops test ID | `EVIDENCE_BOUND=false` | Reject DONE |
| E06 | Handoff drops contract ID | `HANDOFF_INTEGRITY=false` | Reject DONE |
| E07 | Untrusted text injected as instruction | `SOURCE_TRUST=false` | Reject action |
| E08 | Context exceeds reserved window | Allocation fails without deleting proofs | Reject/repair |
| E09 | Identical prefix after TTL | Cache may miss while correctness gate passes | Cost/telemetry only |

Retain actual input bytes or stable content digests, provider/model/config version, usage counters, logical run ID, source revision and check outcomes. Do not log secrets or raw personal data.

## 8. Design review / evidence checklist

- [ ] Model-independent task contract remains unchanged across every fixture.
- [ ] Prefix stability, cached-token usage and retrieval freshness are measured separately.
- [ ] Tool definitions have stable schema version/order; discovery is not authorization.
- [ ] Untrusted source content cannot become system or user authority through compaction.
- [ ] Every retrieved source retains provenance and revision or freshness indicator.
- [ ] Evidence compaction preserves exact receipt references rather than prose claims.
- [ ] Handoff receiver validates contract scope and revision-bound evidence.
- [ ] Token budgets reserve capacity for proof and uncertainty reporting.
- [ ] DONE uses explicit evidence invariants and never depends on cache hits.
- [ ] Simulated values are not presented as real API billing or benchmark results.

## 9. Primary references (re-check their version before production use)

- OpenAI API prompt caching: https://developers.openai.com/api/docs/guides/prompt-caching
- Anthropic Claude prompt caching: https://platform.claude.com/docs/en/build-with-claude/prompt-caching
- MCP specification changelog: https://modelcontextprotocol.io/specification/draft/changelog

## 10. Written architecture decision

**ADR title:** Stabilize shared prefix while preserving revision-bound evidence.  
**Status:** Training exercise / not a production architecture approval.

Describe in no more than one page:

1. **Context:** why task-specific data, source freshness and tool schemas change at different rates.
2. **Decision:** layout and breakpoint strategy; what is versioned and stable; what is dynamic.
3. **Risks:** cache churn, stale retrieval, provenance loss, injection, token budget pressure and TTL expiration.
4. **Alternatives rejected:** fully dynamic prompt; cache everything; aggressive summaries without evidence sidecars.
5. **Observability:** exact prefix digest, provider cache usage, revision/fingerprint, run ID, risk and DONE-gate outcomes.
6. **Exit criteria:** explain E01–E09 and correctly distinguish `cache-hit != safe-completion` and `cache-miss != failed-task`.
