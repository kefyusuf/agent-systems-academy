# v0.16 — Quiet Curriculum and Focused Lesson Reading

## Context

Following v0.15, the home screen shows one next-lesson action, but the curriculum still presents 14 large cards plus a decorative four-phase strip. The lesson screen competes with a second in-page navigation column and repeated contextual badges. The goal is to reduce simultaneous visual decision load, not to remove learning depth.

## Design contract

### Curriculum

- Render all 14 modules in one ordered, compact list (not multi-column cards).
- Each accessible link retains its canonical `#module/{id}` destination, displays a stable module index, title, and completed/total lesson count.
- Exactly one module is identified as the next step based on the existing first-incomplete-lesson logic. This remains a presentational `aria-current="step"` hint, not a change to persisted progress.
- Remove the decorative four-phase strip from this screen only. The learning path and course structure remain intact.
- Keep clear keyboard focus, 44px-or-greater pointer targets, wrapping on small viewports and reduced-motion behavior.

### Lesson

- Keep all existing semantic lesson anchors (`intro`, `engineering`, `example`, `assignment`, `quiz`, `deep-dive`), explanations, sources, quizzes, completion behavior and previous/next navigation.
- Remove the redundant secondary in-page aside and the decorative CORE CONCEPT byline. The lesson heading keeps its identifier and reading time.
- Present one reading column capped at 72 characters; do not add card dashboards, transitions, third-party UI dependencies or JS state.

## Verification

- RED: five new tests define 14 ordered links, active progress, essential content and readable width; the tests intentionally fail against v0.15.
- GREEN: update only client presentation, theme, display version and explanatory docs.
- Validate the unchanged core curriculum (14 modules / 42 lessons / 55 terms / four labs) and all historical regression tests.
- Verify portable offline HTML and Pages artifact generation; review PR diff and merge only on green CI.

## Important limitations

This release simplifies code and markup without deleting domain content. It does not claim a measured reduction in cognitive load, accessibility compliance or improved completion rates. Those require user study or direct browser/assistive-technology checks.
