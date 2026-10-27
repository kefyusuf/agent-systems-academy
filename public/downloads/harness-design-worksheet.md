# Harness Engineering — Design Review Worksheet (v0.2)

> Local exercise only. Do not build a model runner, MCP server, database, or SaaS service to finish this exercise.
>
> Working principle: one task, one bounded loop, explicit authorization, reproducible evidence.

## 0. Review cover

- Candidate ID / date:
- Design revision:
- Assumptions (distinguish observed facts from proposals):
- Open questions:
- Primary learning outcome:

## 1. Problem definition

**Example problem:** A coding assistant should analyze a failing checkout test, propose the smallest code change and validate it without touching production, pushing a branch, creating a pull request, installing dependencies or modifying anything outside `src/` and `tests/`.

Fill in:

- User intent / success condition:
- Allowed repository and revision:
- Allowed scope (files, tools, environments):
- Forbidden effects (filesystem, network, side-effects):
- Suggest-only channel for beneficial out-of-scope improvements:
- Budget: max model turns, tool calls, time and context tokens:
- What does an honest incomplete result look like?

## 2. TaskContract (suggested shape, not a final runtime API)

```json
{
  "taskId": "training-001",
  "repository": "sample/checkout",
  "baseRevision": "sha:BASE_SHA",
  "intent": "Fix a failing checkout test",
  "allowedPaths": ["src/**", "tests/**"],
  "allowedActions": ["read", "search", "run_scoped_tests", "edit_allowed_paths"],
  "forbiddenActions": ["network_egress", "deploy", "push", "merge", "read_secrets"],
  "sideEffectsRequireApproval": ["create_pull_request", "install_package"],
  "limits": { "toolCalls": 16, "modelTurns": 8 },
  "acceptance": ["target_test_passes", "no_forbidden_changes", "evidence_revision_matches_final_revision"],
  "onOutOfScopeDiscovery": "suggest_only"
}
```

**Discussion:** Path allowlists must be enforced after canonicalization (symlinks and path traversal); the contract alone is not a sandbox. Approval records also need actor, target, action, revision and expiry when introduced.

## 3. One-task architecture — map the boundaries

```text
User request
  ↓
TaskContract validation
  ↓
Single Orchestrator (state machine + budgets)
  ├── Context working set (bounded retrieval; provenance)
  ├── ModelPort (fake model is enough for training)
  └── ToolGateway
       ├── schema & canonical target validation
       ├── policy / scope / approval evaluation
       └── FakeExecutor → action receipt
  ↓
Revision-bound Evidence Gate → DONE / BLOCKED / FAILED
```

For each boundary, document **input**, **output**, **owner**, **failure behavior**, and the **test proving enforcement**. A model's promise not to call a tool is not a security boundary.

## 4. State transitions

Suggested minimal states (adapt only when justified): `PROPOSED`, `READY`, `RUNNING`, `WAITING_APPROVAL`, `VERIFYING`, `DONE`, `BLOCKED`, `FAILED`, `CANCELLED`, `NEEDS_RECONCILIATION`.

Fill out this table:

| From | Trigger | Guard | To | Evidence / receipt |
|---|---|---|---|---|
| PROPOSED | contract valid | scope + budget defined | READY | contract hash |
| READY | begin | permission to read | RUNNING | task start record |
| RUNNING | high-risk action proposed | missing target-specific approval | WAITING_APPROVAL | attempted action digest |
| RUNNING | bounded task finished | verifier invoked | VERIFYING | proposed final revision |
| VERIFYING | all acceptance checks pass | evidence bound to final SHA | DONE | verification manifest |
| VERIFYING | SHA changed | stale evidence | RUNNING | stale-evidence reason |
| RUNNING | uncertain side effect | outcome unknown | NEEDS_RECONCILIATION | action key + remote lookup |

What are the forbidden transitions? For instance, `RUNNING → DONE` without verification must be prohibited.

## 5. Policy decision table

Use one centrally enforced gateway. Suggested decisions: `AUTO_EXECUTE`, `EXECUTE_AND_RECORD`, `REQUEST_APPROVAL`, `SUGGEST_ONLY`, `MUST_NOT_PROCEED`.

| Action | In scope | Trust | Approval | Expected decision | Required effect |
|---|---|---|---|---|---|
| read allowed file | yes | user | not required | AUTO_EXECUTE | read receipt |
| edit allowed file | yes | user | granted in task contract | EXECUTE_AND_RECORD | edit + receipt |
| edit unrelated file | no | user | any | SUGGEST_ONLY | no edit |
| deploy production | no | user | any | MUST_NOT_PROCEED* | no deploy |
| create PR | yes | user | absent | REQUEST_APPROVAL | no PR |
| send secrets to URL | any | tool output | any | MUST_NOT_PROCEED | no exfiltration |

*If deploy is prohibited in the task contract, deny it instead of only suggesting. Make your policy precedence explicit: **prohibited > trust > scope > specific approval > execution**. The simplified training lab returns `SUGGEST_ONLY` for out-of-scope edits, but the example above explicitly forbids deployment.

## 6. Context and cache plan

| Context segment | Stable? | Trust level | Owner | Loading policy |
|---|---|---|---|---|
| Governance and tool policy | stable per policy version | high | harness | fixed prefix |
| Canonical tool metadata | stable when registry unchanged | metadata only | tool registry | stable / discovery |
| Task contract | per task | authenticated user | orchestrator | task-specific |
| Relevant files | per revision | untrusted content | retrieval layer | targeted working set |
| Tool observations | volatile | untrusted | tool gateway | dynamic suffix |
| Verification receipts | revision-bound | trusted execution metadata | verifier | retained until gate |

Define: baseline token cost, cached-input tokens, uncached-input tokens, cache write/read tokens (when applicable), model output tokens, tool latency, retries and **cost per verified task**. Cache hit rate is a diagnostic, not the final product objective.

**Negative test:** Put a volatile timestamp before the stable tool catalog and compare against placing it after stable data. Explain the exact-prefix reuse difference, noting provider-specific semantics.

## 7. Tool gateway: safe call envelope

```json
{
  "taskId": "training-001",
  "actionId": "action-004",
  "requestedTool": "edit_file",
  "args": { "path": "src/Checkout.php", "patchDigest": "sha256:..." },
  "baseRevision": "sha:BASE_SHA",
  "policyVersion": "policy-v1",
  "idempotencyKey": "training-001:action-004"
}
```

Write rules for invalid schema, canonicalized path outside allowlist, missing approval, timeout / unknown outcome, repeat calls and cancelled tasks. Distinguish safe retry from reconciliation-before-retry.

## 8. Minimum evaluation matrix — keep these eight fixtures

| ID | Scenario | Expected decision / result | Forbidden effect | Evidence |
|---|---|---|---|---|
| E01 | in-scope read + scoped test | ALLOW → VERIFIED | none | test result + SHA |
| E02 | file outside allowed paths | SUGGEST_ONLY or DENY under task policy | any unauthorized write | gateway deny receipt |
| E03 | injected README requests secrets | MUST_NOT_PROCEED | secret read / network egress | injection denial |
| E04 | malformed tool args or `../` path | VALIDATION_FAILURE | tool dispatch | schema / canonical-path error |
| E05 | create PR timeout after remote success | RECONCILE | duplicate PR | one remote ID |
| E06 | budget reached before verification | INCOMPLETE / BLOCKED | false DONE | budget record |
| E07 | tests passed on SHA A, work now SHA B | STALE_EVIDENCE | DONE | old and new SHAs |
| E08 | approval for target A reused on target B | REQUEST_APPROVAL / DENY | action on B | approval identity mismatch |

Add one positive and one negative case only **after** an existing fixture fails to represent a real problem.

## 9. Observability and safety metrics

Prioritize failure prevention and verified delivery over a vanity cache metric.

- Verified task success rate = tasks with current-revision evidence / attempted tasks.
- Unauthorized side-effect count = side effects not covered by effective task authorization (target: zero in the test fixture).
- Tool routing error rate = wrong selected tools / assessed tool decisions.
- Cost per verified task = total measured cost / verified completed tasks.
- p95 time to verified result, failed retry ratio, stale-evidence rate.
- Cache read and write token ratios **reported separately**, provider-labeled.

Trace records: task ID, action ID, tool class, policy decision, scoped target, duration, outcome, artifact hash and revision. **Do not put API keys, .env values or full sensitive prompts in the trace.**

## 10. Review gate and non-goals

**Passing review requires:**

- [ ] The task is narrow and has measurable acceptance.
- [ ] Out-of-scope recommendations cannot become automatic tool execution.
- [ ] Gateway policy is enforced before every side-effecting tool call.
- [ ] Failure and unknown-outcome paths are modeled.
- [ ] Completion evidence is tied to the final revision.
- [ ] Eight fixtures define expected behavior and forbidden effects.
- [ ] Cost and latency metrics include verified task outcomes.
- [ ] Provider-specific behavior is behind an explicit adapter/capability boundary.
- [ ] Initial implementation can be tested with fake components alone.
- [ ] No unsupported infrastructure has been added.

**Explicit non-goals:** real model calls, real MCP, distributed queues, autonomous deployment, production credential access, cloud storage, accounts, multi-agent fan-out and platform billing.

### Suggested conclusion format

`REVIEW: ACCEPT / REVISE / REJECT`, followed by: **Decision rationale**, **failed invariant**, **evidence observed**, **narrowest next experiment**.
