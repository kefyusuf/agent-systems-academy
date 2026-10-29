# v0.18 — Live Visual QA Checkpoint

**Review date:** 2026-10-29 (Türkiye)  
**Target:** https://kefyusuf.github.io/agent-systems-academy/  
**Canonical code revision:** `971ae40abeb64e4e86bc993b281474d8ab4506e5` (v0.17)  
**Evidence:** [Read-only browser QA session](https://agent.tinyfish.ai/runs/a16208c5-1306-493c-8fab-fd95294fb603), completed, 33 interaction steps, 9 reported desktop screenshots.

## Outcome

**Desktop inspected; no confirmed product defect requiring a UI patch. Mobile and real keyboard / assistive-technology coverage remain open.**

This is a **documentation-only QA checkpoint**, **not** a new application release. The displayed app version stays `v0.17`. Do not mark mobile or WCAG checks as passing just because source or Node regression tests exist. No design changes, new learning content, dependencies, data, progress state, or agent capabilities were introduced.

## Method and observed journey

A browser automation session opened the deployed GitHub Pages application and interacted with its hash-routed pages. The reported desktop viewport was **approximately 1440 × 900**. The session captured 9 desktop screenshots; the linked run should be used as the visual evidence record. Screenshots were **not** exported as repository files.

| Step | Live route | Status | Relevant observations |
|---|---|---|---|
| 1 | `#home` | Observed — pass | Primary next-lesson action, sidebar and heading hierarchy readable |
| 2 | `#curriculum` | Observed — pass | Module navigation accessible; no observed clipping or horizontal overflow |
| 3 | `#module/01` | Observed — pass | Module header and lesson list visible without element overlap |
| 4 | `#lesson/01-01` | Observed — pass | Lesson sections, code example and bottom previous/next navigation rendered |
| 5 | `#lesson/01-02` | Observed — pass | Next-lesson navigation reached the correct heading and content |
| 6 | Cross-route desktop layout | Observed — pass | No visible horizontal overflow, clipped labels or overlapping controls in visited views |
| 7 | 390 × 844 mobile viewport | **Not tested** | The browser automation did not offer reliable viewport switching or mobile emulation |
| 8 | Keyboard-only skip link | **Not conclusively tested** | Only programmatic click; Tab/Enter focus and post-activation visual focus not established |
| 9 | Screen reader / WCAG conformance | **Not tested** | No screen reader or formal conformance assessment |
| 10 | Quiz completion and localStorage persistence | Not tested in this session | Existing Node regression tests address logic; live end-to-end behavior was not established |

The tested learning path was **Home → Curriculum → Module 01 → Lesson 01-01 → Lesson 01-02**. The session did not check all 42 lesson pages visually. Historical CI exercises route transitions separately.

## Findings and triage

### A. Skip link hidden when unfocused — expected, not a bug

The browser automation reported the link as visually absent until invoked. Source inspection confirms the CSS deliberately places `.skip-link` outside the viewport and reveals it at `.skip-link:focus-visible`. This is a standard skip-link pattern intended to avoid a permanently visible distraction. **No change recommended without a keyboard-specific failure.**

### B. Main focus indication after skip-link programmatic click — uncertain

The automation did not consistently observe a visible focus indicator after programmatic activation. The v0.17 handler calls `page.focus()` without altering the SPA hash. Programmatic clicks are not evidence of whether real Tab → Enter interaction meets keyboard focus visibility expectations. A blanket outline around `#page` on every route change could increase the visual noise the user explicitly wants reduced. **Do not change CSS on this evidence alone.**

### C. No observed desktop layout defects

The inspected desktop pages presented readable headings, consistent spacing, valid navigation and no observed horizontal overflow, clipping or overlapping controls. This is a **sampled visual result**, not a universal statement about every breakpoint, browser or zoom setting.

## Required next verification gate (not complete)

Conduct the following in a browser that can set viewport dimensions and emulate keyboard input. Record screenshots and concrete reproduction evidence before changing styles:

- [ ] 390 × 844 mobile, fresh profile: home → curriculum → module → first lesson → next lesson
- [ ] 320px narrow viewport and/or 200% browser zoom, checking horizontal scrolling and fixed-position controls
- [ ] Tab from initial document: skip link must visibly appear on focus; Enter should focus `main` without changing the current lesson route
- [ ] Shift+Tab and focus retention across navigation and optional disclosure panels
- [ ] Quiz, completion gate and local progress persistence in an isolated test profile
- [ ] Optional manual screen-reader check of headings, live status messages and collapsed summaries

If a concrete failure is reproduced: write the minimal RED regression, apply only the relevant GREEN repair, review for visual clutter, obtain green CI and open a separate fix PR. Do not add features or restructure the curriculum speculatively.

## Scope preserved

- 14 modules; 42 lessons; 55 glossary terms; 4 core laboratories
- Five existing workshop routes and synthetic evaluation engines
- Quiet learning UI and one-action home, compact curriculum list, single-column lesson body
- `agent-academy-progress-v1` storage model and existing navigation addresses

## Verification provenance

- v0.17 baseline CI and Pages workflow succeeded for `971ae40`, as previously documented.
- v0.18 checkpoint contains **no runtime changes**; it should be reviewed and merged as documentation only after the repository's regular CI passes.
- The browser run's qualitative summary, screenshots and UI observations are external evidence, not a reproducible automated screenshot test suite. The missing mobile verification must not be marked complete.
