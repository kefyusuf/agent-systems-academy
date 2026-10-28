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

const read=name=>readFileSync(new URL('../'+name,import.meta.url),'utf8');
const data=JSON.parse(read('content/curriculum.json'));
const app=read('public/app.js');

function boot(hash='#eval-robustness'){
 const handlers={page:{},window:{}}, focused=[],nodes=new Map();
 const mk=()=>({textContent:'',innerHTML:'',style:{},dataset:{},classList:{toggle(){},add(){},remove(){}},setAttribute(){},getAttribute(){return null;},addEventListener(){}});
 const page=mk();
 page.addEventListener=(event,callback,capture)=>handlers.page[event]={callback,capture};
 page.querySelector=selector=>({focus(){focused.push(selector);}});
 page.contains=()=>true;
 page.focus=()=>focused.push('#page');
 const document={
  body:{classList:{toggle(){}}},
  querySelector(selector){if(selector==='#page')return page;if(!nodes.has(selector))nodes.set(selector,mk());return nodes.get(selector);},
  querySelectorAll(){return [];},
  addEventListener(){}
 };
 const window={AGENT_CURRICULUM:data,LabEngine:globalThis.LabEngine,WorkshopEngine:globalThis.WorkshopEngine,
  ContextStudioEngine:globalThis.ContextStudioEngine,CompactionEngine:globalThis.CompactionEngine,
  ReliabilityEngine:globalThis.ReliabilityEngine,RobustnessEngine:globalThis.RobustnessEngine,
  EvaluationAuditEngine:globalThis.EvaluationAuditEngine,EvidenceInjectionEngine:globalThis.EvidenceInjectionEngine,
  OracleReliabilityEngine:globalThis.OracleReliabilityEngine,IndependentOracleEngine:globalThis.IndependentOracleEngine,
  OracleAdjudicationEngine:globalThis.OracleAdjudicationEngine,
  addEventListener(name,fn){handlers.window[name]=fn;},scrollTo(){}
 };
 const location={hash,protocol:'https:'};
 vm.runInNewContext(app,{document,window,location,navigator:{},localStorage:{getItem(){return null;},setItem(){}},console,setTimeout:()=>0,clearTimeout(){}},{filename:'public/app.js'});
 const click=(selector,dataset)=>handlers.page.click.callback({target:{closest(s){return s.split(',').includes(selector)?{dataset}:null;}}});
 return {page,nodes,handlers,focused,click,location};
}

test('both publishing shells expose a keyboard skip link, labeled main and persistent status region',()=>{
 for(const path of ['preview.html','src/pages/index.astro']){
  const html=read(path);
  assert.match(html,/<a class="skip-link" href="#page">İçeriğe geç<\/a>/);
  assert.match(html,/<main id="page" tabindex="-1" aria-label="Eğitim içeriği"/);
  assert.match(html,/<div id="academy-live" class="sr-only" role="status" aria-live="polite" aria-atomic="true"><\/div>/);
 }
});

test('nested details use native keyboard summaries and visible focus indicators without visual noise',()=>{
 const html=read('public/app.js'),css=read('public/styles.css');
 assert.match(html,/<summary>Oracle öz testi/);
 assert.match(html,/<summary>Kaynak kayıtlarıyla çapraz kontrol/);
 assert.match(html,/<summary>Kaynak çelişkisi ve adjudication/);
 assert.match(css,/\.oracle-self-check summary:focus-visible/);
 assert.match(css,/\.oracle-independent summary:focus-visible/);
 assert.match(css,/\.oracle-adjudication summary:focus-visible/);
 assert.match(css,/\.eval-chip\s*\{[^}]*min-height:\s*44px/);
});

test('native toggle events preserve all three nested open states on a later rerender',()=>{
 const x=boot();
 x.click('[data-injection-case]',{injectionCase:'3'});
 assert.equal(x.handlers.page.toggle.capture,true);
 for(const id of ['oracle-self-check','oracle-independent','oracle-adjudication'])
  x.handlers.page.toggle.callback({target:{id,open:true}});
 x.click('[data-oracle-mode]',{oracleMode:'mutant'});
 for(const id of ['oracle-self-check','oracle-independent','oracle-adjudication'])
  assert.match(x.page.innerHTML,new RegExp('id="'+id+'" open'));
 assert.equal(x.focused.at(-1),'[data-oracle-mode="mutant"]');
});

test('keyboard focus stays on selected action and status is announced outside replaced content',()=>{
 const x=boot();
 x.click('[data-injection-case]',{injectionCase:'3'});
 x.click('[data-witness-mode]',{witnessMode:'duplicate-id'});
 assert.equal(x.focused.at(-1),'[data-witness-mode="duplicate-id"]');
 x.click('[data-adjudication-action]',{adjudicationAction:'request-adjudication'});
 assert.equal(x.focused.at(-1),'[data-adjudication-action="request-adjudication"]');
 assert.match(x.nodes.get('#academy-live').textContent,/ADJUDICATION_REQUIRED/);
 assert.match(x.page.innerHTML,/ADJUDICATION_REQUIRED/);
});

test('closing optional panels is preserved; hash navigation moves focus into labeled main',()=>{
 const x=boot();
 x.click('[data-injection-case]',{injectionCase:'3'});
 x.handlers.page.toggle.callback({target:{id:'oracle-self-check',open:true}});
 x.handlers.page.toggle.callback({target:{id:'oracle-independent',open:false}});
 x.click('[data-oracle-mode]',{oracleMode:'mutant'});
 assert.match(x.page.innerHTML,/id="oracle-self-check" open/);
 assert.match(x.page.innerHTML,/id="oracle-independent" >/);
 x.location.hash='#curriculum';
 x.handlers.window.hashchange();
 assert.equal(x.focused.at(-1),'#page');
});
