# v0.17 — Learning Flow Verification

## Goal and scope

Verify and repair the existing **Home → Curriculum → Module → Lesson → Next Lesson** journey after the quiet UI changes in v0.15 and v0.16. Do not add new modules, activities, state keys, accounts, analytics, backend services, libraries, or simulated agent features.

## Findings from source inspection

### 1. Skip link corrupts hash routing

Both HTML shells correctly expose `<a class="skip-link" href="#page">İçeriğe geç</a>`. The client is a hash-router: any hash change triggers a route lookup. Prior to v0.17 the router did not recognize `#page`, so pressing Enter on the skip link could render the application's 404 view instead of just moving focus.

**Repair:** On activation, prevent only the skip link's default navigation and focus the already-labeled `<main id="page" tabindex="-1">` without updating the hash. A direct `#page` fragment is treated as a safe home alias, not as an unknown route. The skip link is still a normal anchor for users without JavaScript.

### 2. Completed users receive a false next lesson

The existing `nextLesson()` chose the first unfinished lesson but fell back to the first course when all 42 lessons were complete. The curriculum list already suppressed the next-step marker for completed users. The homepage did not.

**Repair:** `nextLesson()` returns `null` if there is no unfinished lesson. In that state the homepage shows "Tüm dersleri tamamladın." and a single "Müfredatı gözden geçir" action; it does not offer a new task or reset progress. All stored IDs and completion checks remain unchanged.

### 3. Route chain validation

Seven new Node VM tests exercise the actual client router and synthetic localStorage fixture:

1. Home → curriculum → first module → first lesson and next lesson.
2. All 42 lessons' previous/next links, including first and final boundaries.
3. Partially completed progression and no unexpected storage writes.
4. Fully completed home without an invented next lesson.
5. Keyboard skip-link activation preserves the current lesson URL and focuses main.
6. Direct `#page` fallback.
7. Source-shell landmarks and existing narrow-screen / focus CSS contracts.

These tests are deterministic **route and source-behavior checks**, not screenshot tests or quantitative user experience research.

## Acceptance and review

- [ ] RED commit fails until the current bugs are repaired.
- [ ] GREEN commit passes all seven journey tests plus every previous regression.
- [ ] 14 modules, 42 lessons, 55 glossary terms, four core labs and five workshop routes remain unchanged.
- [ ] The existing `agent-academy-progress-v1` localStorage schema is not changed or reset.
- [ ] No new dependencies, network requests, third-party widgets, provider calls, or real agent authority.
- [ ] GitHub CI validates portable Pages artifacts; the release is only considered deployed after the `deploy` job succeeds.

## Manual verification still required

1. On the live Pages site, press Tab from the homepage and activate "İçeriğe geç"; the content must receive focus and the current view remain unchanged.
2. Open Curriculum → first Module → first Lesson → Next. Check the same path using only keyboard controls.
3. Test a lesson that has not yet passed its quiz and confirm the completion button remains blocked.
4. With a 390px mobile viewport and 200% zoom, check layout wrapping and readable text width.
5. Using a test browser profile with all 42 lesson IDs completed, verify the homepage only offers curriculum review.

This is a **targeted flow integrity patch**, not a full visual, screen-reader, or WCAG audit. No actual mobile browser or screen-reader pass is claimed.
