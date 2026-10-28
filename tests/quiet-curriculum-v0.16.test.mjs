import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import '../public/labs-core.js';
import '../public/workshop-core.js';
import '../public/context-studio-core.js';
import '../public/compaction-core.js';
import '../public/reliability-core.js';
import '../public/robustness-core.js';

const read=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');
const data=JSON.parse(read('content/curriculum.json'));
const app=read('public/app.js');
function fixture(hash,completed=[]){
 const handlers={};
 const element=()=>({innerHTML:'',textContent:'',style:{},dataset:{},classList:{add(){},remove(){},toggle(){}},addEventListener(){},setAttribute(){},getAttribute(){return null;}});
 const page=element();page.addEventListener=(name,fn)=>handlers[name]=fn;
 const nodes=new Map();
 const doc={querySelector(selector){if(selector==='#page')return page;if(!nodes.has(selector))nodes.set(selector,element());return nodes.get(selector);},querySelectorAll(){return [];},addEventListener(){}};
 const w={AGENT_CURRICULUM:data,LabEngine:globalThis.LabEngine,WorkshopEngine:globalThis.WorkshopEngine,ContextStudioEngine:globalThis.ContextStudioEngine,CompactionEngine:globalThis.CompactionEngine,ReliabilityEngine:globalThis.ReliabilityEngine,RobustnessEngine:globalThis.RobustnessEngine,EvaluationAuditEngine:globalThis.EvaluationAuditEngine,EvidenceInjectionEngine:globalThis.EvidenceInjectionEngine,OracleReliabilityEngine:globalThis.OracleReliabilityEngine,IndependentOracleEngine:globalThis.IndependentOracleEngine,OracleAdjudicationEngine:globalThis.OracleAdjudicationEngine,addEventListener(){},scrollTo(){}};
 const storage={getItem(){return JSON.stringify({completed,passed:[]})},setItem(){}};
 vm.runInNewContext(app,{document:doc,window:w,location:{hash,protocol:'https:'},navigator:{},localStorage:storage,setTimeout:()=>0,clearTimeout(){},console},{filename:'public/app.js'});
 return {page,nodes,handlers};
}

test('curriculum lists all fourteen modules as one orderly reading list',()=>{
 const {page}=fixture('#curriculum');
 assert.equal((page.innerHTML.match(/class="curriculum-item"/g)||[]).length,14);
 assert.equal((page.innerHTML.match(/class="curriculum-row/g)||[]).length,14);
 assert.doesNotMatch(page.innerHTML,/class="module-grid"|class="path-strip"|class="module-icon"/);
 for(const m of data.modules)assert.ok(page.innerHTML.includes('href="#module/'+m.id+'"'),m.id+' missing');
 assert.match(page.innerHTML,/aria-label="Müfredat modülleri"/);
});
test('curriculum marks exactly one current module and respects browser progress',()=>{
 const first=fixture('#curriculum').page.innerHTML;
 assert.equal((first.match(/aria-current="step"/g)||[]).length,1);
 assert.ok(first.includes('href="#module/'+data.modules[0].id+'" aria-current="step"'));
 const after=fixture('#curriculum',data.modules[0].lessons.map(l=>l.id)).page.innerHTML;
 assert.equal((after.match(/aria-current="step"/g)||[]).length,1);
 assert.ok(after.includes('href="#module/'+data.modules[1].id+'" aria-current="step"'));
 assert.match(after,/3\s*\/\s*3 ders|3 ders tamamlandı/);
});
test('completing all lessons removes next-module marker without hiding any module',()=>{
 const allLessons=data.modules.flatMap(m=>m.lessons.map(l=>l.id));
 const {page}=fixture('#curriculum',allLessons);
 assert.equal((page.innerHTML.match(/class="curriculum-item"/g)||[]).length,14);
 assert.doesNotMatch(page.innerHTML,/aria-current="step"|Sıradaki modül/);
 assert.match(page.innerHTML,/3 \/ 3 ders tamamlandı/);
});
test('lesson prioritizes one reading column without deleting educational material',()=>{
 const {page}=fixture('#lesson/08-03');
 for(const id of ['intro','engineering','example','assignment','quiz','deep-dive'])
  assert.ok(page.innerHTML.includes('id="'+id+'"'),id+' missing');
 assert.doesNotMatch(page.innerHTML,/class="lesson-aside"|class="lesson-byline"/);
 assert.match(page.innerHTML,/data-quiz=/);
 assert.match(page.innerHTML,/data-lesson=/);
 assert.match(page.innerHTML,/İlgili resmî kaynaklar/);
 assert.match(page.innerHTML,/href="#module\//);
});
test('focused reading rules avoid a second column and retain responsive typography',()=>{
 const css=read('public/styles.css');
 assert.match(css,/\/\* v0\.16: quiet curriculum and focused lesson reading \*\//);
 assert.match(css,/\.curriculum-list\{[^}]*max-width:\s*8\d\dpx/);
 assert.match(css,/\.curriculum-row:focus-visible\{/);
 assert.match(css,/\.lesson-view \.lesson-layout\{display:block/);
 assert.match(css,/\.lesson-view \.lesson-article\{max-width:7\dch/);
 assert.match(css,/@media\(max-width:640px\)/);
});
test('curriculum contract preserves source counts and canonical lesson navigation',()=>{
 assert.equal(data.modules.length,14);
 assert.equal(data.modules.reduce((n,m)=>n+m.lessons.length,0),42);
 assert.equal(data.glossary.length,55);
 assert.equal(data.labs.length,4);
 const {page}=fixture('#module/08');
 assert.match(page.innerHTML,/class="lesson-list"/);
 assert.match(page.innerHTML,/class="case-study"/);
});
