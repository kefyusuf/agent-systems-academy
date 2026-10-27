# Compaction & Handoff Studio — Technical design (v0.5)

## Intent and frozen scope

Continue the `TASK-AUTH-017` thread established in v0.3/0.4. v0.5 deepens one learner question: “After summarization and agent handoff, when may a new agent safely continue, and what must it retrieve again?” Nine deterministic, read-only fixtures show state restoration, receipt provenance and appropriate holds. This is **not** a fifth lab, an agent runtime, a provider API integration, or a security boundary.

### Delivery constraints

- Keep the 14 modules, 42 lessons, 55 glossary terms and four core labs unchanged.
- Use `#compaction-studio` as an advanced workshop route, not a new module.
- Retain the original task identity, paths and scope semantics.
- No remote service, persistent new storage, tool execution, new npm dependency or server.
- Every unsafe choice blocks with zero simulated or real mutations.
- Every “safe” recovery gets a typed result; never conflate `ELIGIBLE_TO_RESUME` with `DONE`.

## Component anatomy

1. `public/compaction-core.js`: pure browser/Node-compatible deterministic case engine (`inspect`, `choose`), registry fixture, seven invariant checker and typed outcome.
2. `public/app.js`: rendering of investigation, three decisions, before/after checks and audit trace, via existing hash routing and event delegation.
3. `public/styles.css`: scoped responsive components reusing the existing design tokens.
4. `tests/compaction-core.test.mjs`, `tests/ui-render.test.mjs`: negative-path, outcome and UI route tests.
5. `public/downloads/compaction-handoff-workbook.md`: deeper English engineering worksheet; mirrored into root release files.

## Proof model

Authoritative fixture stores: `TaskContract`, `RECEIPTS`, `OPERATIONS`. These are hardcoded demonstration values, **not actual cryptographic hashes**. Each scenario corrupts one aspect of the *working* context or handoff while authoritative fixture records remain unchanged. `evaluate()` compares current fields against those reference records; the UI calls `inspect()` and then `choose()` after a button click. `choose()` never calls a tool or writes a file.

### Seven checks

| Check | Validation |
|---|---|
| CONTRACT_BINDING | Contract ID and digest match in working and handoff context |
| REVISION_FRESH | Context and handoff refer to live HEAD |
| RUNNER_RECEIPT | Trusted fixture runner GREEN + exit code 0, exact revision, matching handoff pointer |
| OPERATION_RECONCILED | Single committed operation present in immutable fixture ledger |
| TRUST_PROVENANCE | Untrusted content not elevated into instruction authority |
| SCOPE_LOCK | Current execution remains within TaskContract |
| APPROVAL_AUTHORITY | Human approval present if the fixture requires it |

Failures default to `BLOCKED`. Deliberate, **incomplete** safe recovery transitions may give `NEEDS_REVERIFY`, `NEEDS_REPLAN` or `WAITING_APPROVAL`. An entirely valid fixture may become `ELIGIBLE_TO_RESUME`, not `DONE`.

## Fixtures

| ID | Broken condition | Recovery | Expected result |
|---|---|---|---|
| `summary-evidence` | Runner ref compacted away | Reacquire from runner store | `ELIGIBLE_TO_RESUME` |
| `revision-after-compaction` | HEAD r43, evidence r42 | Refresh HEAD + invalidate evidence | `NEEDS_REVERIFY` |
| `untrusted-relabel` | Issue text elevated to instruction | Quarantine to data | `ELIGIBLE_TO_RESUME` |
| `approval-handoff` | Human approval claim has no receipt | Request approval | `WAITING_APPROVAL` |
| `unknown-write` | Tool timeout, result UNKNOWN | Query operation ledger | `ELIGIBLE_TO_RESUME` |
| `scope-proposal` | Useful suggestion outside scope | Record without editing | `ELIGIBLE_TO_RESUME` |
| `handoff-contract` | Lost task ID/digest | Reload authoritative contract | `ELIGIBLE_TO_RESUME` |
| `concurrent-change` | Stale writer after new r43 | Halt/replan/reverify | `NEEDS_REPLAN` |
| `misleading-green` | Summary GREEN but runner RED | Acknowledge RED/retest | `NEEDS_REVERIFY` |

## Safety claims and nonclaims

**Claims justified by tests:** Deterministic fixtures have explicit checks, correct fixture actions yield the expected typed response, incorrect actions fail to advance, source objects are not mutated and all executed actions report zero tool calls and zero writes. The educational model avoids *simulated* approval forgery, retry and stale evidence transfer.

**Not claimed:** Production authorization, secure operation-ledger reconciliation, prompt-injection resistance against arbitrary text, real revision authentication, cache correctness, actual cost optimization, model reliability or complete browser E2E testing. Ref strings beginning `sha256:` are labels; they are not cryptographic digests computed by this simulation.

## Exit criteria / self-review

- [ ] Engine unit tests, UI tests, content sync validation pass.
- [ ] Original v0.4 tests remain passing.
- [ ] No test grants DONE on the basis of a summary, cache hit, unknown write or missing approval.
- [ ] Both Astro entrypoint and portable HTML contain the same engine and route.
- [ ] `npm run build` is reported separately from `verify:local`; do not claim success if Astro cannot be installed.

After this release, reconsider **content depth**, not new runtime integrations. Live agent operations remain an M2 decision requiring a separate brief and threat model.
