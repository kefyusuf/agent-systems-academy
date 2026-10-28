# v0.14 — Keyboard and Disclosure Accessibility Maintenance

## Scope

Repair keyboard interaction and state continuity in the existing Evaluation Robustness → Failure Injection → Oracle Self-Test → Independent Witness → Adjudication path. Preserve the full 14-module / 42-lesson / 55-term / four-lab curriculum, all five existing advanced workshops, evaluation engines, route IDs, static hosting model and restrained visual design.

## Verified code-level issues in v0.13

1. Replacing the whole `#page` markup after an evaluation option click destroys the pressed DOM button; a keyboard user can lose their active focus position.
2. Nested native `<details>` summaries update their actual `open` state without necessarily updating the JavaScript flags that control the *next* render.
3. The main application has no first-class keyboard skip link or stable offscreen live announcement region; feedback inside a replaced or closed panel may not be announced reliably.
4. Summary controls lack specific `:focus-visible` styling even though other buttons/links have an existing focus ring.

## Minimal repair

- Add a first-focus, visible-on-focus skip link to the existing `#page` landmark; label main content.
- Add a permanently mounted `#academy-live` `role=status` element outside the dynamically replaced `#page`. Announce bounded evaluation status text after oracle, witness and adjudication choices.
- Preserve the focus target by querying the re-created option and using `focus({preventScroll:true})` after replacement.
- Listen for native `toggle` **in capture phase** on `#page` because the `toggle` event does not bubble. Mirror the three known disclosure IDs into existing UI flags; ignore detached nodes so stale events cannot override the current page.
- Focus the labeled main landmark after a hash-based route change. Initial document load remains unchanged.
- Add a compact neutral focus ring to the three disclosure summaries and a 44px minimum target height for existing evaluation chips, plus overflow wrapping for narrow screens.

## Verification and limits

The regression tests execute the real client script in a minimal Node VM harness to verify focus requests, captured toggle events, retained open flags, status text, route focus and shell/CSS contracts. This is **not** a full assistive technology or browser accessibility certification. GitHub CI also validates unchanged content, existing tests, offline HTML and Pages artifact. A manual review with keyboard-only navigation and an actual screen reader remains desirable.

### Manual keyboard check

1. Reload the homepage. Press Tab once: **İçeriğe geç** becomes visible. Press Enter; focus should move to main.
2. Navigate to `#eval-robustness` with the keyboard. Select zero-FN in the existing five-case control.
3. Open each native summary with Enter or Space, including both nested panels. Use Shift+Tab to travel backwards.
4. Choose **Yinelenen kimlik** and **Kaynak ve kimlik incelemesi iste**. The chosen control should remain focused and relevant panels open. The offscreen status should announce `ADJUDICATION_REQUIRED` with assistive technology.
5. Close a child summary with Space. Change an outer oracle variant; the child should remain closed rather than reopening unexpectedly.
6. Repeat at 390px viewport and 200% zoom; controls should wrap rather than cause horizontal page scrolling.
7. Confirm the static GitHub Pages site also serves linked Markdown workbooks.

## Non-goals

No additional course content, oracle cases, analytics, network or model calls, new UI framework, third-party accessibility widget, rewritten router, or automatic production authorization.
