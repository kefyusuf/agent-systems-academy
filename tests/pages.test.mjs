import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');

test('Pages base is isolated to deployment and local Astro stays at /',()=>{
 const config=read('astro.config.mjs');
 assert.match(config,/GITHUB_PAGES === 'true'/);
 assert.match(config,/\/agent-systems-academy\//);
 assert.match(config,/http:\/\/localhost:4321/);
 const page=read('src/pages/index.astro');
 assert.match(page,/import\.meta\.env\.BASE_URL/);
 for(const name of ['favicon.svg','styles.css','robustness-core.js','app.js'])assert.ok(page.includes('${base}'+name));
});
test('download links obey HTML flavor rather than origin root',()=>{
 const app=read('public/app.js');
 assert.match(app,/academy-download-base/);
 assert.doesNotMatch(app,/:\s*'\/downloads\//);
 for(const x of ['src/pages/index.astro','preview.html'])assert.ok(read(x).includes('academy-download-base'));
});
test('offline Pages build copies downloads to exactly the same relative locations',()=>{
 const script=read('scripts/build-pages.mjs');
 assert.ok(script.includes('standalone.html'));
 assert.ok(script.includes('public/downloads'));
 assert.ok(script.includes('_site'));
 assert.ok(existsSync(new URL('../.github/workflows/pages.yml',import.meta.url)));
});
