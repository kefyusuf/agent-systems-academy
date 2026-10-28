# Agent Systems Academy

**A local-first Astro learning environment for coding-agent engineering.**

The learning UI and course material are in Turkish. Code, architectural documentation, identifiers, and contribution guidance are in English.

## Scope

- 14 curated learning modules and 42 lessons, each with mechanism, failure mode, trade-off, verification and linked primary references
- 55-term glossary, lesson search, official sources, conceptual harness architecture
- 14 scenario-driven module design reviews (three alternatives with one preferred, supported by evidence gates)
- 4 interactive, deterministic teaching labs with validation protocols: prompt caching, policy gates, tool routing (eight scenarios), context budgeting
- Task Lifecycle Workshop: seven gated stages, nine deterministic scenarios (eight faults + baseline), wrong-choice BLOCKED trace and revision-bound DONE checks
- v0.4 Context & Cache Studio: nine A/B scenarios testing prefix stability, schema ordering, freshness, evidence compaction, handoff, untrusted data, token budget and TTL; six revision/trust/evidence invariants
- English downloadable capstone worksheet (task contracts, policy matrix, eight eval fixtures), worked case and review rubric
- v0.7 robustness view: four hypothetical risk-distribution profiles, disputed labels, scenario-grouped holdout, evaluation manifest freshness
- v0.9 claim audit: five advisory cases on leakage, held-out evaluation, disputed labels, zero observed FN and synthetic weights
- v0.10 evaluation failure injection: one corrupted evidence field per existing case, explicit claim-blocking and re-verification-only recovery decisions
- v0.11 evaluation oracle reliability: optional, collapsed self-test comparing reference and five deliberately faulty validation predicates against fixed healthy/corrupted evidence controls; distinguishes false accept from false reject, without new modules or production claims
- v0.12 independent oracle witness: a single zero-FN common-mode teaching case compares two count-based validators with a separately authored synthetic risk registry, detecting duplicate identifiers and stale source revisions; no production independent-source claim.
- v0.13 oracle disagreement and evidence adjudication: fail-closed dispute and stale-source review of the same zero-FN fixture, with explicit source-review requests that never fabricate corrected evidence or permission.
- v0.14 accessibility maintenance: keyboard skip link, focused main navigation, persistent status announcements, visible nested disclosure focus, restoration after dynamic option updates, and calmer 44px mobile controls; no curriculum or evaluation model changes.
- v0.15 quiet learning layout: a single next-lesson action on the homepage; six advanced evaluation topics folded by default except the first, with native keyboard summary controls, preserved open states, and no content removal.
- v0.16 quiet curriculum and reading: fourteen keyboard-accessible compact module rows with one next-unfinished step; lesson content in one readable column without duplicate side navigation or decorative byline. All tasks, source links, evaluation controls, and progress remain unchanged.
- v0.17 learning flow assurance: regression coverage for the home → curriculum → module → lesson route chain across all 42 lessons, correct completed-course home state, and skip-to-main keyboard navigation without SPA hash corruption. No new learning content or services.
- Local progress tracking in browser `localStorage`
- Static Astro output, no accounts, backend, telemetry, LLM provider, paid API, or MCP access needed

**The simulations do not run a model or invoke real tools.** Their coefficients and policy cases teach design mechanics and must not be interpreted as a provider bill, an actual security boundary, or an evaluation result.

## Run locally

Prerequisites: Node.js 22+ recommended (the included Astro 5 dependency also supports compatible earlier LTS versions); npm; internet access for the **first** `npm install` only.

```bash
npm install
npm run dev
```

Open **http://127.0.0.1:4321** in your browser.

### Windows PowerShell

```powershell
cd E:\projects\agent-harness-academy
npm install
npm run dev
```

To open the static build:

```bash
npm run verify
npm run preview
```

When deploying static files, Astro outputs to `dist/`. No server-side application is required after build (although a static web server is recommended for serving the build).

**No npm install yet?** Open `standalone.html` in a browser for a **single-file, no-install demo** (all assets embedded), or `preview.html` for a source-linked preview. It uses the same static learning application and curriculum as the Astro page; browser storage behavior may vary for `file://` pages. The single-file demo needs the full ZIP for its Markdown worksheet download.

## Development

```bash
npm run check:content    # validate detailed syllabus, case studies, citations, protocols and bundle
npm test                 # pure lab calculations and decision rules
npm run sync:content     # regenerate public/curriculum.js after editing JSON
npm run build:offline    # rebuild standalone.html; no dependencies needed
npm run verify:local     # content + tests + offline HTML regeneration
npm run build            # Astro static output
```

Source of truth: `content/curriculum.json`. Edit it; then run `npm run sync:content`. `public/curriculum.js` is generated, and both the Astro site and portable preview consume it. `public/labs-core.js`, `public/workshop-core.js`, `public/context-studio-core.js`, `public/compaction-core.js` and `public/reliability-core.js` hold deterministic, side-effect-free teaching models. `public/app.js` is browser-only UI code.

### Project structure

```text
src/pages/index.astro       Astro static page shell
content/curriculum.json     Source of truth for lessons, glossary, labs, sources
public/curriculum.js        Generated global content payload for offline preview
public/labs-core.js         Pure simulation rules
public/workshop-core.js     Pure lifecycle teaching state machine
public/context-studio-core.js Pure context/cache failure-injection model
public/compaction-core.js     v0.5 handoff and recovery replay engine
public/reliability-core.js    v0.6 labeled evaluation and cost engine
docs/RELIABILITY-EVALUATION.md v0.6 evaluation definitions and limitations
public/downloads/reliability-evaluation-workbook.md  Review tasks and answer key
docs/CONTEXT-CACHE-STUDIO.md   v0.4 technical design and acceptance
public/downloads/context-cache-workbook.md  A/B scenario and ADR workbook
docs/TRACE-WORKSHOP.md      Deep technical workshop and scenario matrix
public/downloads/task-execution-workbook.md  Downloadable English case workbook
public/app.js               Navigation, progress, quiz and lab rendering
public/styles.css           Local responsive design system
public/downloads/             Capstone review worksheet (Markdown)
docs/WORKED-CASE.md          One end-to-end worked system design case
docs/ASSESSMENT-RUBRIC.md    Self-review rubric and mandatory review gates
preview.html                No-install preview of same app
scripts/                    Bundle generation and content validation
npm test                    Lab unit tests
AGENTS.md                   Repository working agreements
```

## Known limitations

- Progress is per browser origin/device and not synced between computers.
- Quizzes require a correct answer; freeform practical exercises and 14 decision reviews require manual review. A "preferred" design choice is instructive, not proof of competence.
- Simulations are intentionally simplified and do not connect to models, Git repos or MCP servers.
- External reference links require internet when opened.
- Prompt cache minimum size, lifetime, costs and provider semantics can change over time; consult official docs before production use.

## Design principles

See `docs/ARCHITECTURE.md`, `docs/LEARNING-OUTCOMES.md`, and `docs/ROADMAP.md`. The initial release deliberately avoids a backend, auth, account sync, new agent runtime, framework libraries and provider-dependent integrations.

## v0.3 verification note

The v0.3 workshop is a guided case, not a fifth lab or a live agent runtime. Read `docs/TRACE-WORKSHOP.md` and `docs/RELEASE-NOTES-v0.3.md` for the exact failure-path guarantees and simulator limitations.

## v0.2 verification note

At preparation time, `npm run check:content`, all 24 unit/UI-render tests and `npm run build:offline` passed. A live Astro build could **not** be executed in the preparation environment because npm registry DNS resolution failed (`EAI_AGAIN`). Browser E2E is similarly not verified because Chromium navigation was blocked by the environment. See `docs/RELEASE-NOTES-v0.2.md`. On your local machine, run `npm install && npm run verify` to validate the actual Astro build.

## v0.5: Compaction & Handoff Verification

Navigate to `http://127.0.0.1:4321/#compaction-studio` or open the portable HTML `#compaction-studio` route. This is a depth extension of the existing lifecycle workshop, not a new core lab. Nine scenario fixtures cover lost evidence, stale HEAD, source-trust laundering, missing human approval, timeout/unknown side effect, scope-safe suggestions, invalid handoff envelope, concurrent writes and contradictory runner evidence.

Choose one of three recovery decisions per case. The engine checks seven proof invariants and shows `ELIGIBLE_TO_RESUME`, `NEEDS_REVERIFY`, `NEEDS_REPLAN`, `WAITING_APPROVAL` or `BLOCKED` with a deterministic audit trace. These values are **not** `DONE`, and no command, model, MCP server, ledger, or filesystem write is executed. The receipt and SHA-256-looking values are teaching fixtures, not cryptographic attestations.

Download the English [Compaction & Handoff Workbook](public/downloads/compaction-handoff-workbook.md) and review the technical specification in [COMPACTION-HANDOFF.md](docs/COMPACTION-HANDOFF.md). Use `npm run verify:local` without Astro dependencies; `npm run verify` additionally requires installing Astro. The baseline 14 modules, 42 lessons, 55 glossary terms and four labs are unchanged.

## v0.6: Reliability Evaluation Studio

Open `http://127.0.0.1:4321/#reliability-eval` or `standalone.html#reliability-eval` to compare four read-only continuation policies over the **same nine** v0.5 compaction/handoff cases in both incoming and recovered states (18 paired, reviewed decisions). Outputs include the HOLD-positive confusion matrix, unsafe release rate, unnecessary hold rate, safe throughput, verified evidence artifacts, and editable hypothetical penalty weights.

The evaluation is synthetic and intentionally small. The 13 HOLD / 5 safe-to-resume class mix and policy results are properties of this hand-authored fixture suite only. Evaluation cost is **relative effort points**, not actual dollars, real inference tokens, real recovery time or a field-reliability estimate. A safe-to-resume decision is not DONE. No tools are executed.

Read [Reliability Evaluation specification](docs/RELIABILITY-EVALUATION.md), [v0.6 release notes](docs/RELEASE-NOTES-v0.6.md), and download the [Reliability Evaluation Workbook](public/downloads/reliability-evaluation-workbook.md). `npm run verify:local` runs the local suite and recreates offline HTML. `npm run verify` additionally requires Astro dependencies and a successful build.

**v0.6 build limitation:** Source/DOM tests and Chromium `set_content` desktop/mobile interactions passed in the preparation environment, but direct URL navigation was blocked by browser policy. Astro's `npm install --offline` failed (`ENOTCACHED`), so the Astro production build remains unverified. Install Astro on your own machine to run `npm run verify`.

## v0.7 — Evaluation Robustness & Distribution Shift

Use `#eval-robustness` after `#reliability-eval`. Explore four synthetic sampling profiles, four disputed-label sensitivity examples, scenario-paired holdout, and evaluation revision freshness. All numbers are educational; this is **not** real predictive validation. See `docs/EVALUATION-ROBUSTNESS.md` and `public/downloads/evaluation-robustness-workbook.md`.

## Public GitHub Pages deployment

The public-repo publication path is documented in [`docs/PUBLISH-GITHUB-PAGES.md`](docs/PUBLISH-GITHUB-PAGES.md). A dependency-free Pages edition is built with:

```bash
npm run verify:local
npm run build:pages
```

The generated `_site/` directory is a static artifact, not tracked source. The Pages workflow publishes the **portable HTML edition** of the same educational app; it does not claim to have compiled Astro. The initial public URL is available only **after** repository creation, enabling Settings → Pages → GitHub Actions, and a successful deployment.

Repository visibility is independent of source-code licensing. No license has been selected for this project.

## v0.8 visual design

The interface uses a quieter reading-first hierarchy. Workspaces are grouped under **Atölyeler**, references under **Diğer kaynaklar**, and every lesson has an optional, reversible **Odak modu**. Reading mode never changes lesson progress, simulator outcomes, or permissions. See `docs/RELEASE-NOTES-v0.8.md`.
