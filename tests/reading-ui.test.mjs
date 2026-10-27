import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
const read = path => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');

for (const page of ['src/pages/index.astro', 'preview.html']) {
  test(`${page} keeps core navigation discoverable and groups optional workshops`, () => {
    const html = read(page);
    assert.match(html, /<details class="nav-advanced"/);
    assert.match(html, /<details class="nav-aux"/);
    assert.match(html, /<summary[^>]*>.*?Atölyeler/s);
    for (const route of ['home', 'curriculum', 'labs', 'architecture', 'glossary', 'workshop', 'context-studio', 'compaction-studio', 'reliability-eval', 'eval-robustness'])
      assert.match(html, new RegExp(`data-route="${route}"`));
    assert.match(html, /id="focus-toggle"/);
  });
}

test('home favors the learning path rather than decorative orbit visual', () => {
  const app = read('public/app.js');
  assert.doesNotMatch(app, /visual-orbit|hero-visual|terminal-demo/);
  assert.match(app, /Kaldığın yerden devam et/);
});

test('reading mode has a reversible explicit control and never alters learning progress', () => {
  const app = read('public/app.js');
  const css = read('public/styles.css');
  assert.match(app, /#focus-toggle/);
  assert.match(app, /reading-mode/);
  assert.match(app, /aria-pressed/);
  assert.match(css, /body\.reading-mode/);
  assert.match(css, /prefers-reduced-motion/);
});

test('design uses calm surfaces and bounded reading width', () => {
  const css = read('public/styles.css');
  assert.match(css, /\/* v0\.8: quiet reading experience/);
  assert.match(css, /\.lesson-article\s*\{[^}]*max-width:\s*7\dch/);
  assert.match(css, /\.hero-grid\s*\{display:none/);
});
