import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');
const css=read('public/styles.css');
const app=read('public/app.js');

test('v0.19 narrow-screen topbar removes only redundant mobile brand, preserving both actions',()=>{
 assert.match(css,/\/\* v0\.19: measured narrow viewport and intentional main focus \*\//);
 assert.match(css,/@media\(max-width:359px\)\{[^}]*\.mobile-brand\{display:none\}/);
 assert.match(css,/@media\(max-width:359px\)[\s\S]*\.topbar-right\{margin-left:auto/);
 for(const path of ['preview.html','src/pages/index.astro']){
  const html=read(path);
  assert.match(html,/id="focus-toggle"/);
  assert.match(html,/id="search-trigger"/);
  assert.match(html,/class="skip-link"/);
 }
});

test('programmatic route focus avoids a permanent bright frame, but skip-to-main keeps a visible focus indication',()=>{
 assert.match(css,/#page:focus\{outline:none\}/);
 assert.match(css,/#page\.skip-target:focus\{outline:2px solid var\(--accent\)/);
 assert.match(css,/\.skip-link:focus-visible\{/);
});

test('the skip link marks its target before focus and preserves hash routing',()=>{
 assert.match(app,/document\.querySelector\('\.skip-link'\)\?\.addEventListener\('click',e=>\{e\.preventDefault\(\);page\.classList\.add\('skip-target'\);page\.focus\?\.\(\);\}\)/);
 assert.match(app,/window\.addEventListener\('hashchange',\(\)=>\{page\.classList\.remove\('skip-target'\);render\(\);page\.focus/);
});

test('v0.19 changes neither educational content nor persisted progress',()=>{
 const data=JSON.parse(read('content/curriculum.json'));
 assert.equal(data.modules.length,14);
 assert.equal(data.modules.reduce((n,m)=>n+m.lessons.length,0),42);
 assert.equal(data.glossary.length,55);
 assert.equal(data.labs.length,4);
 assert.match(app,/agent-academy-progress-v1/);
});
