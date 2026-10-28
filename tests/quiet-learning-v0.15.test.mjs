import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
test('quiet design removes decorative home grid, keeps path and labs routes',()=>{const app=read('public/app.js');const start=app.indexOf('function renderHome(){');const end=app.indexOf('\nfunction ',start+18);const home=app.slice(start,end);assert.ok(start>=0);assert.match(home,/Kaldığın yerden devam et/);assert.doesNotMatch(home,/module-grid|home-labs/);assert.match(home,/#curriculum/);});
test('robustness unfolds content progressively without hidden navigation or curriculum deletion',()=>{const app=read('public/app.js');assert.match(app,/data-eval-fold/);assert.match(app,/evalFoldOpen/);assert.match(app,/renderClaimAudit\(\)/);assert.match(app,/renderFailureInjection\(\)/);});
