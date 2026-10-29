# v0.19 — Mobile Viewport and Keyboard Focus QA

## Evidence provenance

- **Baseline**: public GitHub Pages build at `971ae40` (visible app v0.17), downloaded as the exact GitHub Actions Pages artifact from [run 40859642640](https://github.com/kefyusuf/agent-systems-academy/actions/runs/40859642640). The subsequent v0.18 checkpoint was docs-only.
- **Execution**: Chromium headless with the published self-contained HTML loaded using Playwright `page.set_content`, mobile touch emulation, real viewport sizes 390×844 and 320×720, plus a 1440×900 desktop control.
- **Routes examined at each viewport**: `#home`, `#curriculum`, `#module/01`, `#lesson/01-01`, `#lesson/01-02`. Additional 390px check on `#lesson/08-03`.
- **Evidence checks**: `documentElement.clientWidth`, `scrollWidth`, individual element bounding boxes, DOM headings, captured screenshots, and keyboard Tab/Enter focus. The screenshots are local QA outputs, not source files committed to the repository.
- **Limitations**: This is a local rendering of the actual Pages artifact, not a claim of verification on physical Android/iOS devices or with a real screen reader. Automated screenshots do not establish WCAG compliance.

## Measured findings

| Scenario | Client width | Before document scroll width | After local repair |
|---|---:|---:|---:|
| 390px, home → curriculum → module → first two lessons | 390px | 390px | unchanged |
| 320px, home / curriculum / module | 320px | 320px | unchanged |
| 320px, lesson 01-01 / 01-02 | 320px | **330px** | **320px** |
| 1440px, five core routes | 1440px | 1440px | unchanged |

The specific 320px overflow was measured at the topbar: `.topbar-right` ended at x=330 and `#search-trigger` ended at x=330 despite a 320px client width. The duplicate `.mobile-brand` consumed space next to the still-required Focus and Search controls. The minimal fix hides the duplicate brand **only at max-width 359px**; the permanent sidebar brand remains. Both Focus and Search remain usable.

A second confirmed browser observation: navigating with the SPA hash router programmatically focuses `main#page`, producing a prominent full-page default UA focus outline even with no keyboard skip-link action. The fix removes this incidental outline and explicitly applies a visible 2px accent outline when the actual `.skip-link` is activated. Its default offscreen-until-focused style remains unchanged.

## Local browser verification

- At 320px, added CSS reduced the affected route width from 330px to exactly 320px; Search's right edge became 308px, inside the viewport.
- At 390px, document width remained 390px.
- Pressing **Tab** from a fresh document focused the skip-link with a visible outline at top=10px. Pressing **Enter** focused `main#page` without altering the existing lesson hash; the focus marker remained visible.
- No JS exceptions or text-clipping regressions were observed on the inspected route set.

## Scope / acceptance

Only `public/styles.css`, `public/app.js`, version labels, documentation and narrow regression tests changed. Do not modify curriculum data, progress storage, lessons, labs, evaluation fixtures, routing IDs, agent engines, or offline build design.

Acceptance gates:

1. RED: four new source/behavior contract tests fail before implementation.
2. GREEN: minimal CSS and event-state patch; re-check 320px and 390px in Chromium.
3. Existing content and tests pass (14 modules, 42 lessons, 55 glossary terms, four core labs).
4. Portable Pages artifact builds; no untracked generated HTML committed.
5. PR reviewed for scope, no secrets, no new requests or dependencies. Merge only on green CI.
6. After merge, both `main` CI and GitHub Pages deploy must succeed.

## Remaining manual tests

A physical smartphone, 200% browser zoom, Android/iOS screen reader, and Safari/Firefox rendering remain outside this checkpoint. No general-purpose design overhaul is warranted on the observed evidence.
