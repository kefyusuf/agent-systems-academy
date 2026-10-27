# Task Lifecycle Workshop — v0.3 Engineering Guide

**Status:** Educational design exercise, deterministic browser simulator, not an agent runtime or security mechanism.

**Audience:** Engineers reviewing or designing provider-neutral coding-agent harnesses.

## 1. Learning objective and boundary

Starting from one tightly scoped request, the learner should explain how **contract, context, tool gateway, policy, execution, evidence and completion** differ. The important distinction is between **a model's recommendation**, **an action's authorization**, **an executor's observed effect**, and **a verifier's evidence**. Those four objects must never be conflated.

The workshop deliberately reuses all existing curriculum material. It does not introduce a new teaching domain, model, SDK, integration, service, repository editor, live test runner, or MCP server.

## 2. Immutable exercise contract

```yaml
id: TASK-AUTH-017
user_request: Fix expired access-token validation and add a regression test
base_revision: r41
allowed_paths:
  - src/auth/token.ts
  - tests/auth/token.test.ts
forbidden_paths:
  - package.json
  - deployment/**
  - .env
forbidden_actions:
  - git.push
  - git.merge
  - deploy
acceptance:
  - RED regression proves defect before production edit
  - Minimal GREEN fix respects allowed paths
  - Final test report binds to final source revision
  - Optional improvements remain suggestions, not side effects
```

The `r41`, `r42`, and `r43` revision IDs are **illustrative labels**, not real Git commits or content hashes. In a production harness, use immutable object identifiers, tree hashes, or a comparable reliable content fingerprint. If the worktree is dirty, the fingerprint must account for the worktree state that tests actually executed against.

## 3. Canonical lifecycle

```text
RECEIVED
   │ validate and freeze scope, acceptance, non-goals
   ▼
CONTRACTED
   │ select trusted sources; associate with revision; reserve evidence budget
   ▼
CONTEXT_READY
   │ discover tool candidates; validate schema, canonical paths and capabilities
   ▼
TOOL_READY
   │ enforce policy at the executor (NOT in model prose)
   ├── OUT OF SCOPE  → SUGGEST_ONLY          → never execute
   ├── DENIED        → MUST_NOT_PROCEED       → never execute
   └── NEEDS APPROVAL → WAITING_APPROVAL     → no side effect until receipt
   ▼
AUTHORIZED
   │ test RED, minimal scoped edit, test GREEN; record action receipts
   ▼
EXECUTED
   │ final test suite tied to latest effective source revision
   ├── red / timeout / mismatch → BLOCKED or RETRY under bounded recovery
   ▼
VERIFIED
   │ independently re-check invariants and report unresolved proposals
   ▼
DONE
```

A deferred/paused/failed state is **not** DONE. Execution can resume only after its missing precondition is satisfied. `SUGGEST_ONLY` is a **separate decision outcome** for the out-of-scope suggestion, not an authorization for the in-scope edit. The educational scenario `scope` demonstrates these *two decisions at once*.

## 4. Interface contracts (conceptual, not API code)

### TaskContract

| Field | Purpose | Invalid example |
|---|---|---|
| `id` | Stable task identifier | Non-unique, reused across unrelated tasks |
| `baseRevision` | Snapshot known at task creation | Unversioned working tree |
| `allowedPaths` | Bounded edit scope | `**/*` as unreviewed default |
| `nonGoals` | Actions explicitly excluded | No specification of deploy/push limits |
| `acceptance` | Observable outcome | “Looks fixed” |
| `riskTier` | Gate level | User-level control supplied by issue text |

### ContextManifest

Every selected source needs `path|origin`, `revision|fingerprint`, trust label, selection reason, and budget cost. Tool outputs and issue descriptions can be valuable context; they are not higher-priority instructions. Store a compact provenance pointer even after compaction. Cached prompt prefixes are a **performance mechanism**, not durable project memory, trust assignment, or a replacement for evidence.

### Tool Gateway / ToolInvocation

At minimum: `taskId`, `toolName`, validated structured input, canonical target path, capability, expected revision, deadline, and an operation identifier for correlating retries. Tool discovery via MCP answers **which operations exist**; a separate authorized gateway decides **which operations this task may invoke**. Tool transport and SDK should be implemented behind an adapter in a real provider-neutral system.

### PolicyDecision

Always evaluate `principal + authorized task scope + action + canonical resource + risk + approval receipt + provenance`. Outcomes:

- `AUTO_EXECUTE`: low-risk, authorized reads.
- `EXECUTE_AND_RECORD`: authorized side-effect, with receipt + audit.
- `REQUEST_APPROVAL`: no execution until explicit approval with correct action/scope/revision/expiry.
- `SUGGEST_ONLY`: proposal for work outside authorized scope.
- `MUST_NOT_PROCEED`: forbidden operation, regardless of model conviction.

**Security rule:** Policy is enforced *at* the gateway/executor boundary. The workshop's frontend-only implementation is didactic; browser UI state can be modified and is not suitable as an authorization engine.

### ActionReceipt

Bind each meaningful effect to `taskId`, `actionId`, `tool`, `target`, `priorRevision`, `newRevision`, and observed outcome. If a tool times out after a possibly successful write, the response is `UNKNOWN`, not automatically `FAILED`. Reconcile via read-after-write / query-by-action-ID or a provably idempotent operation before retry. This is a data-integrity concern, not a prompt-writing problem.

### VerificationEvidence

Store test command, exit status, run ID, test scope, source fingerprint, environment identity, and execution time. This lets the DONE gate reject **proof for r41** if the effective final code is **r42**. Never accept success prose instead of tool result. Verification should be independent of the agent's assertion.

## 5. Negative-path matrix (8 fault injections + 1 baseline)

| Fixture | Injection point | Unsafe behavior to reject | Safe recovery/outcome | Key invariant |
|---|---|---|---|---|
| `baseline` | — | Skipping any gate | r41 RED → r42 GREEN → VERIFIED → DONE | All seven gates |
| `injection` | Context | Obey `.env` exfiltration instruction in issue | Quarantine instruction, keep relevant data | No lower-trust authority |
| `scope` | Policy | Silent deployment change | Proposal stored; only scoped auth edit executes | Suggest ≠ execute |
| `approval` | Policy | Invent approval | WAITING_APPROVAL, no write, not DONE | Approval receipt required |
| `timeout` | Execution | Treat test timeout as passing | Bounded retry and inspect actual test outcome | Unknown ≠ success |
| `unknown-outcome` | Execution | Blindly replay potentially committed edit | Reconcile receipt + revision before retry | No duplicate effect |
| `race` | Execution | Last writer wins | CAS(expectedRevision) + ordered writes | No lost update |
| `stale` | Evidence | Reuse GREEN result from r41 | Rerun on r42 | Evidence matches final source |
| `red-regression` | Evidence | Declare failing suite “flaky” | Fix r43 and verify on r43 | RED cannot pass gate |

The fixture results are deterministic **modelled events**, not actual tests run against a repository. RED/GREEN text is **simulated** and should be treated as teaching output only.

## 6. DONE gate — why it is independent

The engine checks:

1. A fixed task contract exists.
2. Context was selected with explicit trust classification.
3. A constrained tool gateway has been selected.
4. An in-scope action was authorized for execute-and-record.
5. RED/GREEN phase evidence is represented.
6. Each applied write has a receipt and a final-revision receipt exists.
7. Final regression evidence is tied to the current revision.
8. The normal workflow reached the final gate.

Even after all seven interactive choices have been made, a guard fails if verification was supplied for an old revision or the action receipt is missing. A future real runtime must independently verify durable storage consistency, external side effects, environment authenticity, and tool execution receipts; this simplified engine checks neither real file IO nor adversarial runtime tampering.

## 7. Eight design questions for code review

1. Can tool output change the task's scope? Which exact component enforces the answer?
2. How does the harness distinguish a recommendation from a committed side effect?
3. What happens if `edit_file` succeeds but transport loses its response?
4. What identity is used to deduplicate a retry? Where is the action receipt stored?
5. How do two parallel workers avoid overwriting the same file revision?
6. What constitutes a valid approval for a protected action? Can an approval for task A authorize task B?
7. How are cached prefixes and compacted context reconciled with provenance and evidence?
8. Could an agent declare DONE after running tests on a different code revision? Which machine check rejects it?

A review answer should provide a **concrete event log, gate rule, failure signal, recovery and test case**, not just a prompt instruction.

## 8. Evaluation design

For every fixture, verify: correct status, no unauthorized write, accurate revision, no premature DONE, action receipts, no blind retry, and correct proposal handling. Include **adversarial counterexamples** as well as happy paths. Quality metrics in a real harness can include `unauthorized_side_effect_rate`, `false_done_rate`, `evidence_mismatch_rate`, `unknown_outcome_reconciled_rate`, and `cost_per_verified_task`. A low token count or high cache hit rate must not hide false completion or missing permission.

## 9. Implementation notes and boundaries

- Source: `public/workshop-core.js` (pure model), `public/app.js` (UI), `tests/workshop.test.mjs` (invariants), `public/downloads/task-execution-workbook.md` (exercises).
- No real LLM, no filesystem access, no MCP, no credentials, no external API and no persistent simulation state.
- The lesson counters remain 14 modules / 42 lessons / 4 labs. This is a **guided case**, not a new independent course module.
- Two primary reference families: [MCP Tools, 2026-07-28](https://modelcontextprotocol.io/specification/2026-07-28/server/tools) and [Building effective agents, Anthropic](https://www.anthropic.com/research/building-effective-agents). For prompt reuse, consult [OpenAI Prompt Caching](https://developers.openai.com/api/docs/guides/prompt-caching); provider-specific semantics should not be copied into the neutral core.
