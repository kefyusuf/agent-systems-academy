import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
const portable=readFileSync(new URL('../standalone.html',import.meta.url),'utf8');

test('single-file preview mounts only after page exists (inline scripts cannot be deferred)',()=>{
 const main=portable.indexOf('<main id="page"');
 const app=portable.indexOf('const H = window.CompactionEngine;');
 const endBody=portable.lastIndexOf('</body>');
 assert.ok(main>0&&app>main&&app<endBody);
 assert.ok(portable.includes('root.CompactionEngine='));
 assert.ok(portable.includes('root.ReliabilityEngine='));
 assert.doesNotMatch(portable,/<script src="\.\/public\/app\.js"/);
});
test('all inline teaching scripts load in dependency order',()=>{
 const marks=['window.AGENT_CURRICULUM =','root.LabEngine =','root.WorkshopEngine=','root.ContextStudioEngine=','root.CompactionEngine=','root.ReliabilityEngine=','const H = window.CompactionEngine;'];
 let prev=-1;
 for(const mark of marks){const found=portable.indexOf(mark);assert.ok(found>prev,mark);prev=found;}
});
