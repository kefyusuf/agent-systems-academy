# Learning outcomes

The learner should be able to:

1. Separate LLM capabilities, the agent loop, harness/runtime, workflow and agentic-OS claims.
2. Specify an enforceable task contract with scope, authorization, forbidden actions and acceptance criteria.
3. Plan context retrieval and compaction with token budgets, provenance and revision-aware handoff.
4. Explain why cacheable prefixes benefit from stable ordering and how to instrument cache-token hit rates.
5. Route tools by task fit, permission, side effects, schema and recoverable error class.
6. Explain MCP host/client/server boundaries, resources/tools/prompts, current specification changes and remote trust risks.
7. Author lean skills with precise trigger conditions and progressive disclosure.
8. Apply TDD gates, meaningful Git units, PR review and revision-bound verification evidence.
9. Decide whether to use subagents with a dependency graph and explicit handoff contracts.
10. Define memory promotion, versioning, snapshots, replay and invalidation.
11. Threat-model injection, exfiltration, sensitive logs, network egress and sandbox enforcement.
12. Construct a minimal provider-neutral harness plan with eval baseline and negative test cases.

## Final artifact to prepare as a learner

Produce one design brief (no implementation required): problem, task contract, ports and adapters, policy matrix, state diagram, 8-case eval suite, threat model, cache budget, and a minimal vertical slice with measurable acceptance checks.

## v0.2 depth assessment

The learner should now explain the internal mechanism, one realistic failure mode, a trade-off, and a verification method for **each lesson**. Each module includes one design review scenario; finishing the quiz alone does not certify applied competence.

For a full capstone, use `public/downloads/harness-design-worksheet.md`, review `docs/WORKED-CASE.md`, and self-score with `docs/ASSESSMENT-RUBRIC.md`. The safety-critical gates override score.
