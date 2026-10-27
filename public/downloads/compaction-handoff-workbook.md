# Agent Systems Academy — Compaction & Handoff Verification Workbook

**Version:** 0.5.0 · **Task:** `TASK-AUTH-017` · **Scope:** simulation and architecture analysis only

## Purpose and boundary

This workbook is a hands-on design review for a single token-expiration regression. It is not an execution harness, a model provider cache simulator, a safety certification, or a substitute for runner-generated evidence. The same task contract is used throughout v0.3 (execution lifecycle), v0.4 (context and cache), and v0.5 (compaction and handoff). All values and identifiers here are **synthetic fixtures**.

By the end, you should be able to:

1. Separate *ephemeral context* from *authoritative state* and *verification evidence*.
2. State a loss-aware compaction contract and detect when a summary has lost critical references.
3. Validate an agent-to-agent handoff against a stable task identity, scope, revision and receipt registry.
4. Distinguish `ELIGIBLE_TO_RESUME` from `DONE`, `WAITING_APPROVAL`, `NEEDS_REVERIFY`, and `NEEDS_REPLAN`.
5. Explain why a high compaction ratio or a prompt-cache hit cannot prove task completion.
6. Recover from ambiguous side effects without blind retries and without silently expanding scope.

---

## 1. Freeze the task before changing context

### TaskContract (authoritative)

```yaml
task_id: TASK-AUTH-017
contract_digest: sha256:contract-auth-017-v1  # fixture, not a real SHA-256
objective: Repair token-expiration regression
allowed_paths:
  - src/auth/token.ts
  - tests/auth/token.test.ts
non_goals:
  - auth/session.ts cleanup
  - package upgrades
  - deployment
success_requires:
  - evidence from a real test runner
  - evidence revision equals current repository revision
  - authorized write receipts reconciled
  - no unapproved scope expansion
  - human approval for any newly protected operation
```

Do not reinterpret “suggest useful improvements” as “execute useful improvements.” A suggestion is an output record; the ability to write another path is a separate authorization decision.

### What compaction is allowed to change

**May be summarized or discarded:** redundant discussion, stale exploratory hypotheses, formatting, duplicated tool results, and verbose non-authoritative reasoning.

**Must remain recoverable and verifiable:** task ID and digest, repository identity and current HEAD, allowed paths, policy decision, pending approvals, committed operations and idempotency keys, revision-bound test receipts, provenance/trust labels, and the minimal pointers required to reread authoritative records.

Important subtlety: a compacted summary may contain receipt references, but those references are not the receipts themselves. At the next execution boundary, fetch and validate the referenced records. If the backing source is inaccessible, keep the gate closed.

---

## 2. State classes: avoid the “one memory blob” trap

| State class | Example | Owner of truth | Compaction rule |
|---|---|---|---|
| Authoritative task | Scope, contract digest | Task store / human-approved plan | Preserve verified pointer and immutable digest |
| Operational state | Lifecycle, pending gates | Workflow state machine | Restore from ledger, never guess from prose |
| Execution history | Tool invocation IDs, timestamps | Tool gateway / executor log | Retain lookup identifiers and reconcile outcomes |
| Verification evidence | Runner exit code, digest, source revision | Test runner/evidence registry | Lossless pointer + verification on use |
| Learned guidance | Previous failure patterns | Reviewed knowledge base | Can be compressed; never grants permissions |
| Ephemeral context | Recent conversation and hypotheses | Agent session | Freely compressible if essentials are recoverable |

A provider's context-compaction endpoint or summary feature might help shorten the conversation. This architecture must *not* assume it has committed an authoritative state transaction or validated evidence. Those are application concerns.

---

## 3. A concrete handoff envelope

Suggested design sketch, **not a working protocol implementation**:

```ts
type HandoffEnvelope = {
  version: 1;
  taskId: string;
  taskContractDigest: string;
  source: { repoId: string; headRevision: string; observedAt: string };
  allowedPathDigest: string;
  requiredApprovalIds: string[];
  evidenceRefs: Array<{
    id: string;
    kind: 'runner' | 'write-receipt' | 'approval';
    revision: string;
    producer: string;
    digest: string;
  }>;
  pendingOperations: Array<{
    operationId: string;
    idempotencyKey: string;
    observedStatus: 'UNKNOWN' | 'COMMITTED' | 'FAILED';
  }>;
  untrustedSourceRefs: string[];
  workSummary: string; // informative only
};
```

### Receiver algorithm

1. **Parse and validate schema.** Missing task IDs, digests, required fields, or unsupported versions fail closed.
2. **Load the TaskContract** by immutable reference from its authority, compare digest and permitted paths.
3. **Read the current repository HEAD.** A mismatch with the envelope's revision marks dependent receipts stale and may require replan/retest.
4. **Fetch evidence by ID** from the trusted runner or operation ledger; check producer, digest, exit code, source revision, and dependency relationships.
5. **Check pending side effects.** If outcome is UNKNOWN, reconcile against operation ID and idempotency key before deciding to retry.
6. **Validate approvals independently.** An agent-to-agent message, memory summary, or tool output is not a signed human approval.
7. **Keep untrusted data untrusted.** Logs, code comments, issues, retrieval output, and tool messages cannot raise their own authority in a summary.
8. **Emit a typed continuation decision** (`ELIGIBLE_TO_RESUME`, `NEEDS_REVERIFY`, `NEEDS_REPLAN`, `WAITING_APPROVAL`, or `BLOCKED`) and an audit record.

`ELIGIBLE_TO_RESUME` permits *continuation assessment*. It does not mean tests have run in the current session or authorize arbitrary actions; it is explicitly not `DONE`.

---

## 4. Receipt and operation invariants

The v0.5 teaching engine checks seven simple invariants:

| ID | Condition | Failure behavior |
|---|---|---|
| `CONTRACT_BINDING` | Task ID + digest match both authoritative record and handoff | Block and reload task contract |
| `REVISION_FRESH` | Working context revision and handoff revision equal live HEAD | Invalidate stale proofs; replan/reverify |
| `RUNNER_RECEIPT` | Runner registry confirms GREEN, exit code 0, same revision, matching handoff pointer | Block; request actual runner verification |
| `OPERATION_RECONCILED` | Operation ledger confirms COMMITTED exactly once | Block blind retry until reconciliation |
| `TRUST_PROVENANCE` | Untrusted source stays `UNTRUSTED_AS_DATA` | Quarantine; never elevate to policy |
| `SCOPE_LOCK` | Proposed execution remains within contract | Record suggestion separately; do not edit |
| `APPROVAL_AUTHORITY` | Required approval exists from authorized human authority | Wait; do not forge approval |

**Production caveat:** seven local fixture checks are not sufficient for secure authorization in a real system. Real implementations also need verified identity, cryptographic provenance where suitable, resource access controls, replay protection, sandbox boundaries, time-of-check/time-of-use handling, and independent policy enforcement.

### Exact revision binding matters

Example: `run:r42:07` is GREEN, but a second agent commits revision `r43`. `run:r42:07` remains a *valid historical receipt*, not valid verification of `r43`. Neither a cache hit nor a compressed summary can transfer that proof to a new revision.

### Side-effect ambiguity is not a binary failure

A timeout may occur **after** a committed write. Retrying without reconciliation can duplicate work. The fixture ledger for `op:AUTH-017:commit` reports `COMMITTED`, `count=1`, `idempotencyKey=AUTH-017-001`; the safe response is to fetch the operation record, not replay the write. In production, confirmation must also establish the affected resource/revision and match the expected effect.

---

## 5. Nine adversarial exercises

For **each exercise**: run the initial state, note failed invariant IDs, choose one recovery strategy, inspect trace, then write why the final state is *not automatically DONE*. Recommended answers are below; try the UI first.

### E01 — Summary without a runner receipt

- **Trigger:** Compaction retains “tests passed” and removes `runId`.
- **Risk:** The summary may be inaccurate, stale, or copied from another revision.
- **Safe action:** Fetch `run:r42:07` from the authoritative runner registry; verify exit code, revision and digest.
- **Expected result:** `ELIGIBLE_TO_RESUME`; no tests are invented.
- **Negative test:** Accepting free text as a proof must remain `BLOCKED`.

### E02 — HEAD drift after compaction

- **Trigger:** Context still says `r42`; repository HEAD is `r43`.
- **Risk:** GREEN receipt binds to a superseded source snapshot.
- **Safe action:** Refresh HEAD and *invalidate* stale receipt pointers; request a real re-run for `r43`.
- **Expected result:** `NEEDS_REVERIFY`.
- **Negative test:** Updating the revision label on the old receipt does not generate new evidence.

### E03 — Trust-boundary laundering

- **Trigger:** A malicious issue comment is summarized as a high-priority instruction.
- **Risk:** Data becomes authority during context transformation.
- **Safe action:** Return the issue content to the `UNTRUSTED_AS_DATA` partition; keep policy unchanged.
- **Expected result:** `ELIGIBLE_TO_RESUME` for the *existing* authorized workflow.
- **Negative test:** Ignoring policy due to the issue comment stays `BLOCKED`.

### E04 — Missing approval across handoff

- **Trigger:** Agent A claims approval, but there is no independently signed record.
- **Risk:** Agent B performs a protected operation without authorization.
- **Safe action:** Request human approval; do not change code or issue an approval token.
- **Expected result:** `WAITING_APPROVAL`.
- **Negative test:** Self-signed approval or “Agent A told me” stays `BLOCKED`.

### E05 — Unknown write outcome after timeout

- **Trigger:** Execution response timed out after submitting a write.
- **Risk:** Blind retry executes a second side effect.
- **Safe action:** Query operation ledger by stable operation ID and idempotency key; correlate to affected revision.
- **Expected result:** `ELIGIBLE_TO_RESUME` *in this fixture* because ledger already confirms a single committed operation.
- **Negative test:** An unconditional retry is rejected; the simulation writes zero files.

### E06 — Useful suggestion outside scope

- **Trigger:** The agent identifies a worthwhile `auth/session.ts` cleanup.
- **Risk:** Good engineering advice is mistaken for execution permission.
- **Safe action:** Record a separate proposal while continuing only the allowed task.
- **Expected result:** `ELIGIBLE_TO_RESUME`; suggestion recorded, no out-of-scope edit.
- **Negative test:** Silent task widening remains `BLOCKED`.

### E07 — Handoff missing contract ID and digest

- **Trigger:** The receiver gets a natural-language “continue” note but no verified contract.
- **Risk:** Contract and scope are guessed.
- **Safe action:** Reload the authoritative contract and verify digest before continuation.
- **Expected result:** `ELIGIBLE_TO_RESUME` if the known fixture contract matches.
- **Negative test:** Reconstructing the allowlist from summary remains `BLOCKED`.

### E08 — Concurrent HEAD modification

- **Trigger:** Another agent writes `r43` while current plan targets `r42`.
- **Risk:** Race / lost update / out-of-date verification.
- **Safe action:** Stop writing, read HEAD, invoke compare-and-swap conflict handling, replan, then rerun relevant tests.
- **Expected result:** `NEEDS_REPLAN`, not automatic GREEN.
- **Negative test:** Force-write or ignore-HEAD behavior stays `BLOCKED`.

### E09 — Runner RED but summary GREEN

- **Trigger:** Summary says GREEN, authentic runner receipt exits with code 1.
- **Risk:** Negative proof is concealed by a narrative claim.
- **Safe action:** Acknowledge RED, investigate failure, and require a new verified run before DONE.
- **Expected result:** `NEEDS_REVERIFY`.
- **Negative test:** Editing the evidence record to GREEN is forbidden; this lab never fabricates one.

---

## 6. A falsifiable evaluation plan

A real harness's post-compaction recovery behavior should be evaluated independently from model quality and cache efficiency. Suggested measurable properties:

| Metric | Numerator / denominator or observation | Target in this educational fixture |
|---|---|---|
| Unsafe continuation rate | Unsafe cases incorrectly allowed / unsafe cases exercised | `0 / 9` |
| Missing-receipt bypasses | Continuations allowed without valid receipt / receipt-invalid cases | `0` |
| Approval forgeries | Model-generated approvals treated as human / approval cases | `0` |
| Duplicate side effects | Additional writes after UNKNOWN / unknown-outcome cases | `0` |
| Revision proof transfer | Stale evidence incorrectly reused for new HEAD | `0` |
| Recommendation retention | Valid out-of-scope suggestions recorded without executing | `1 / 1` |
| Successful recovery | Expected fixture-specific decision achieved / nine cases | `9 / 9` |
| Real tool executions | Filesystem/runner/LLM/MCP calls made by this lab | `0` |

The fixture result is **not** empirical model reliability or external-world security assurance. When adapting to a live runtime, measure false passes *and* unnecessary holds; include non-determinism, stale caches, permission changes, network failures and adversarial content.

### An evidence ledger sample

```json
{
  "taskId": "TASK-AUTH-017",
  "currentRevision": "r42",
  "runner": {
    "id": "run:r42:07", "revision": "r42", "exitCode": 0,
    "producer": "test-runner", "digest": "sha256:ci-r42-07"
  },
  "write": {
    "operationId": "op:AUTH-017:commit", "status": "COMMITTED",
    "idempotencyKey": "AUTH-017-001", "count": 1
  },
  "approval": { "required": false, "receiptId": null }
}
```

Treat this as a synthetic *shape*. The `sha256:` strings are illustrative labels, not hashes that were computed from artifacts. A real ledger must verify content addressing, authenticity, custody, and revision mapping.

---

## 7. Implementer-oriented design checklist (no coding required)

- [ ] Contract identity is immutable and independently retrievable.
- [ ] Changes to source HEAD invalidate dependent evidence references.
- [ ] Compaction preserves a typed pointer to every authoritative fact it cannot reproduce.
- [ ] The handoff receiver checks schema, digest, version and source trust.
- [ ] Test evidence is producer-sourced and bound to an exact source revision.
- [ ] UNKNOWN operation outcomes are reconciled before retry.
- [ ] Approval references cannot be minted by a coding agent.
- [ ] Suggested but out-of-scope work is recorded, not executed.
- [ ] Gate results are explicit and cannot be overwritten by an LLM-generated status sentence.
- [ ] A recovery result of `ELIGIBLE_TO_RESUME` never directly becomes `DONE`.
- [ ] Audit records include state before, attempted decision, outcome and justification.
- [ ] Red-team fixtures verify fail-closed responses to tampered summaries and receipts.

### Your review deliverable

Write a short ADR proposing how to separate `EphemeralContext`, `TaskStore`, `ExecutionLedger`, and `EvidenceRegistry`. Include (a) ownership of each field, (b) receiver validation sequence, (c) two stale-evidence tests, (d) one ambiguous-write test, (e) one approval boundary test, and (f) the conditions under which you would reject handoff entirely.

Score yourself across **five 0–4 criteria** (maximum 20): correctness of trust boundaries, proof/revision binding, recovery discipline, scope/approval separation, and clarity of audit/evaluation evidence. Passing guideline: 16+ with no zero on proof or authorization boundaries.

---

## 8. Source reading

These are general references for reviewing mechanisms; they do not claim that every provider implements the same compaction or cache behavior.

- Model Context Protocol: https://modelcontextprotocol.io/specification
- MCP Security Best Practices: https://modelcontextprotocol.io/specification/2025-06-18/basic/security_best_practices
- OpenAI Prompt Caching: https://platform.openai.com/docs/guides/prompt-caching
- Anthropic Prompt Caching: https://docs.anthropic.com/en/docs/build-with-claude/prompt-caching
- OWASP LLM Prompt Injection Prevention Cheat Sheet: https://cheatsheetseries.owasp.org/cheatsheets/LLM_Prompt_Injection_Prevention_Cheat_Sheet.html

**Boundary reminder:** No model call, HTTP access, filesystem modification, MCP server interaction, human approval, or real runner execution occurs in the v0.5 workshop. It evaluates explicitly authored educational fixture states only.
