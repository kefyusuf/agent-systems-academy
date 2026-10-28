# v0.15 — Quiet Learning & Progressive Disclosure

## Product problem

The learner sees too many simultaneous calls to action and dense technical controls. Previous visual neutralization reduced color noise, but did not reduce on-screen decision count. On the homepage, six module cards compete with the next lesson button and a laboratory promotional panel. Evaluation Robustness renders six substantial exercise sections at once.

## Design decision

1. **Homepage = one next step**. Keep the existing first-incomplete lesson selection and local progress count. Show one prominent primary action and the single secondary curriculum route. Remove the duplicate six-card module gallery and lab promotion **only from the homepage**. Both full curriculum and four labs continue to exist on their canonical routes.
2. **Evaluation Robustness = progressive disclosure**. Group the existing six blocks (distribution, label disagreement, holdout, freshness, claim audit, failure injection) under native `<details>` + `<summary>`. The first opens initially, the rest are closed; users can open multiple sections intentionally. All controls, state machines, reviewed examples, and downloadable workbooks remain present in the same DOM; closing is only a presentation choice.
3. **State continuity**. Update six explicit local open flags using the existing capture-phase `toggle` handler; do not replace its accessibility handling or introduce third-party state management. Preserve flags across selection redraws. Ignore toggle events from detached DOM.
4. **Styling**. Keep the neutral existing typography, restrained colors and minimum touch targets. Give folded sections a clear focus outline and 44px evaluation controls. No imagery, animations, new dashboards, progress features or badges.

## Non-goals

No curriculum expansion (14 modules, 42 lessons, 55 glossary terms, four core labs), no changed training labels or evaluation policies, no new route or feature, no local storage schema migration, accounts, backend, network requests or provider integrations.

## Acceptance evidence

- RED tests require a homepage without the large card grid or lab promotion and require a disclosure-based robustness view.
- GREEN implementation passes these tests plus render / interaction regressions.
- Six blocks exist, with exactly one open by default.
- The user can open and close any block using native keyboard controls and retain the choice through an in-place redraw.
- Source documentation remains English, learner-facing UI Turkish.
- Existing curricula and all previous 164 tests remain valid; CI generates the same offline/Pages artifacts.
- PR review must verify there are no deleted curricula, scripts, external services or model calls.

## Manual visual review remaining

Inspect the rendered homepage and Evaluation Robustness at desktop and 390px mobile viewport. Check heading hierarchy, keyboard navigation on each summary, opening a block then selecting controls, and screen-reader announcement behavior. Automated markup and UI-event tests are not a substitute for a full accessibility audit.
