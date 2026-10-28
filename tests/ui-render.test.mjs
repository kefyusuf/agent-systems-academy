import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import '../public/labs-core.js';
import '../public/workshop-core.js';
import '../public/context-studio-core.js';
import '../public/compaction-core.js';
import '../public/reliability-core.js';
import '../public/robustness-core.js';
const data=JSON.parse(readFileSync(new URL('../content/curriculum.json',import.meta.url),'utf8'));
const app=readFileSync(new URL('../public/app.js',import.meta.url),'utf8');
const element=()=>({innerHTML:'',textContent:'',style:{},dataset:{},classList:{add(){},remove(){},toggle(){}},addEventListener(){},setAttribute(){},getAttribute(){return null;}});
function fixture(hash){
  const nodes=new Map();const handlers={};const page=element();
  page.addEventListener=(name,fn)=>handlers[name]=fn;
  const doc={
    querySelector(selector){if(selector==='#page')return page;if(!nodes.has(selector))nodes.set(selector,element());return nodes.get(selector);},
    querySelectorAll(){return [];},
    addEventListener(){},
  };
  const context={document:doc,window:{AGENT_CURRICULUM:data,LabEngine:globalThis.LabEngine,WorkshopEngine:globalThis.WorkshopEngine,ContextStudioEngine:globalThis.ContextStudioEngine,CompactionEngine:globalThis.CompactionEngine,ReliabilityEngine:globalThis.ReliabilityEngine,RobustnessEngine:globalThis.RobustnessEngine,EvaluationAuditEngine:globalThis.EvaluationAuditEngine,EvidenceInjectionEngine:globalThis.EvidenceInjectionEngine,OracleReliabilityEngine:globalThis.OracleReliabilityEngine,IndependentOracleEngine:globalThis.IndependentOracleEngine,addEventListener(){},scrollTo(){}},location:{hash,protocol:'http:'},navigator:{},localStorage:{getItem(){return null;},setItem(){}},setTimeout:()=>0,clearTimeout(){},console};
  vm.runInNewContext(app,context,{filename:'public/app.js'});
  return {page,nodes,handlers};
}
test('module renders one guided design review with exactly three alternatives',()=>{
 const {page}=fixture('#module/06');
 assert.match(page.innerHTML,/ENGINEERING DESIGN REVIEW/);
 assert.match(page.innerHTML,/Protocol negotiation/);
 assert.equal(page.innerHTML.match(/class="case-choice"/g)?.length,3);
});
test('lesson renders mechanism, failure, tradeoff, proof and source links',()=>{
 const {page}=fixture('#lesson/08-03');
 assert.equal(page.innerHTML.match(/class="deep-panel/g)?.length,4);
 assert.match(page.innerHTML,/revision-aware/);
 assert.match(page.innerHTML,/İlgili resmî kaynaklar/);
 assert.match(page.innerHTML,/id="deep-dive"/);
});
test('lab still renders in existing route, plus experiment protocol and calculated break-even',()=>{
 const {page,nodes}=fixture('#lab/cache');
 assert.match(page.innerHTML,/EXPERIMENT NOTEBOOK/);
 assert.equal(page.innerHTML.match(/<li>/g)?.length,3);
 assert.match(nodes.get('#cache-output').innerHTML,/başabaş eşiği/);
});
test('existing router lab has eight scenarios, not a fifth lab',()=>{
 const {page,nodes}=fixture('#lab/router');
 assert.match(page.innerHTML,/EXPERIMENT NOTEBOOK/);
 assert.match(nodes.get('#router-step').textContent,/08/);
 assert.equal(data.labs.length,4);
});
test('capstone module links a static worksheet',()=>{
 const {page}=fixture('#module/14');
 assert.match(page.innerHTML,/Harness Design Worksheet/);
 assert.match(page.innerHTML,/\/downloads\/harness-design-worksheet\.md/);
});
test('decision review reveals reasoning and evidence but cannot execute a tool',()=>{
 const {nodes,handlers}=fixture('#module/01');
 const fakeReview={dataset:{review:'01',choice:'2'}};
 const target={closest(selector){return selector==='[data-review]'?fakeReview:null;}};
 handlers.click({target});
 const result=nodes.get('#review-result-01').innerHTML;
 assert.match(result,/Beklenen doğrulama kanıtları/);
 assert.match(result,/Yürütme sınırı/);
});
test('case study content and inputs are escaped before rendering',()=>{
 const {page}=fixture('#module/01');
 assert.ok(!page.innerHTML.includes('<script>'));
 assert.match(page.innerHTML,/data-review="01"/);
});

test('workshop route exposes fixed contract, nine scenarios and seven stages',()=>{
 const {page}=fixture('#workshop');
 assert.match(page.innerHTML,/TASK-AUTH-017/);
 assert.match(page.innerHTML,/Task Lifecycle Workshop/);
 assert.equal(page.innerHTML.match(/data-workshop-scenario=/g)?.length,9);
 assert.equal(page.innerHTML.match(/class="workshop-stage /g)?.length,7);
 assert.match(page.innerHTML,/REVISION_BOUND_TESTS/);
});
test('workshop wrong decision stays blocked and shows recovery trace',()=>{
 const {page,handlers}=fixture('#workshop');
 const pressed={dataset:{workshopChoice:'expand-scope'}};
 const evt={target:{closest(selector){return selector==='[data-workshop-choice]'?pressed:null;}}};
 handlers.click(evt);
 assert.match(page.innerHTML,/BLOCKED \/ RECOVER/);
 assert.match(page.innerHTML,/data-workshop-choice="scope-lock"/);
 assert.match(page.innerHTML,/BLOCKED · expand-scope/);
});
test('approval case results in WAITING_APPROVAL and no simulated edits',()=>{
 const {page,handlers}=fixture('#workshop');
 function fire(selector,node){handlers.click({target:{closest(s){return s===selector?node:null;}}});}
 fire('[data-workshop-scenario]',{dataset:{workshopScenario:'approval'}});
 for(const id of ['scope-lock','revision-aware','minimal-tool','request-approval'])fire('[data-workshop-choice]',{dataset:{workshopChoice:id}});
 assert.match(page.innerHTML,/WAITING \/ HUMAN/);
 assert.match(page.innerHTML,/r41 · 0 simulated write/);
 assert.doesNotMatch(page.innerHTML,/data-workshop-choice="finish"/);
});

test('context studio shows nine cases without changing four core labs',()=>{
 const {page}=fixture('#context-studio');
 assert.equal(page.innerHTML.match(/data-context-case=/g)?.length,9);
 assert.match(page.innerHTML,/CACHE CHECKPOINT/);
 assert.match(page.innerHTML,/REVISION_FRESH/);
 assert.match(page.innerHTML,/TASK-AUTH-017/);
 assert.equal(data.labs.length,4);
});
test('context scenario switch and variant selection render model evidence',()=>{
 const {page,handlers}=fixture('#context-studio');
 function click(selector,node){handlers.click({target:{closest(s){return s===selector?node:null;}}});}
 click('[data-context-case]',{dataset:{contextCase:'stale-retrieval'}});
 assert.match(page.innerHTML,/Cache hit var ama repo dosyası eski/);
 click('[data-context-mode]',{dataset:{contextMode:'guarded'}});
 assert.match(page.innerHTML,/ELIGIBLE_FOR_DONE/);
 assert.match(page.innerHTML,/test:r42:07/);
});


test('v0.5 compaction route presents exactly nine cases and seven proof checks',()=>{
 const {page}=fixture('#compaction-studio');
 assert.match(page.innerHTML,/Compaction &amp; Handoff Verification/);
 assert.equal(page.innerHTML.match(/data-compaction-case=/g)?.length,9);
 assert.equal(page.innerHTML.match(/class="handoff-check"/g)?.length,7);
 assert.match(page.innerHTML,/TASK-AUTH-017/);
 assert.match(page.innerHTML,/READ-ONLY|Read-only replay/);
});
test('v0.5 user can choose recovery, see invariant re-evaluation and audit trace',()=>{
 const {page,handlers}=fixture('#compaction-studio');
 function click(selector,node){handlers.click({target:{closest(s){return s===selector?node:null;}}});}
 click('[data-compaction-case]',{dataset:{compactionCase:'approval-handoff'}});
 assert.match(page.innerHTML,/Ajan devrinde onay kayboldu/);
 click('[data-compaction-action]',{dataset:{compactionAction:'request-approval'}});
 assert.match(page.innerHTML,/WAITING_APPROVAL/);
 assert.match(page.innerHTML,/HUMAN_GATE/);
 assert.match(page.innerHTML,/0 real tool calls/);
 click('#compaction-reset',{});
 assert.doesNotMatch(page.innerHTML,/HUMAN_GATE/);
});
test('v0.5 invalid choice is visibly rejected and cannot authorize execution',()=>{
 const {page,handlers}=fixture('#compaction-studio');
 const btn={dataset:{compactionAction:'trust-summary'}};
 handlers.click({target:{closest(s){return s==='[data-compaction-action]'?btn:null;}}});
 assert.match(page.innerHTML,/Riskli veya yetersiz karar/);
 assert.match(page.innerHTML,/REJECTED_CHOICE/);
 assert.match(page.innerHTML,/BLOCKED/);
});


test('v0.6 reliability route renders four policies, nine scenarios, four matrix cells',()=>{
 const {page}=fixture('#reliability-eval');
 assert.match(page.innerHTML,/Reliability Evaluation Studio/);
 assert.equal(page.innerHTML.match(/data-eval-policy=/g)?.length,4);
 assert.equal(page.innerHTML.match(/data-eval-scenario=/g)?.length,9);
 assert.equal(page.innerHTML.match(/class="eval-matrix-cell /g)?.length,4);
 assert.match(page.innerHTML,/13 HOLD required/);
 assert.match(page.innerHTML,/5 ALLOW safe/);
 assert.match(page.innerHTML,/0 live executions/);
});
test('v0.6 UI responds to policy and cost settings and shows correct matrix',()=>{
 const {page,handlers}=fixture('#reliability-eval');
 function click(selector,node){handlers.click({target:{closest(s){return s===selector?node:null;}}});}
 click('[data-eval-policy]',{dataset:{evalPolicy:'hold'}});
 assert.match(page.innerHTML,/118 <span>relative units/);
 assert.match(page.innerHTML,/100%/);
 click('[data-eval-risk]',{dataset:{evalRisk:'hold:20'}});
 assert.match(page.innerHTML,/178 <span>relative units/);
 click('[data-eval-policy]',{dataset:{evalPolicy:'gated'}});
 assert.match(page.innerHTML,/150 <span>relative units/);
});
test('v0.6 UI compares before/after approval without inventing human approval',()=>{
 const {page,handlers}=fixture('#reliability-eval');
 const button={dataset:{evalScenario:'approval-handoff'}};
 handlers.click({target:{closest(s){return s==='[data-eval-scenario]'?button:null;}}});
 assert.match(page.innerHTML,/Ajan devrinde onay kayboldu/);
 assert.match(page.innerHTML,/WAITING_APPROVAL/);
 assert.match(page.innerHTML,/4 \/ 5 · 80%/);
 assert.equal(page.innerHTML.match(/class="eval-phase"/g)?.length,2);
 assert.match(page.innerHTML,/approval.*required|Approval|approval/i);
});

test('v0.7 robustness route renders distribution shift and label disagreement controls',()=>{
 const {page}=fixture('#eval-robustness');
 assert.match(page.innerHTML,/Evaluation Robustness/);
 assert.equal(page.innerHTML.match(/data-robust-profile=/g)?.length,4);
 assert.equal(page.innerHTML.match(/data-robust-fold=/g)?.length,3);
 assert.equal(page.innerHTML.match(/data-robust-labels=/g)?.length,3);
 assert.match(page.innerHTML,/13.*?TP|13.*?HOLD/);
});
test('v0.7 robustness UI can change shift, policy and annotation assumptions',()=>{
 const {page,handlers}=fixture('#eval-robustness');
 const click=(selector,dataset)=>handlers.click({target:{closest(s){return s.split(',').includes(selector)?{dataset}:null;}}});
 click('[data-robust-profile]',{robustProfile:'revision-pressure'});
 assert.match(page.innerHTML,/Revision, concurrent edits/);
 click('[data-robust-policy]',{robustPolicy:'runner'});
 assert.match(page.innerHTML,/Runner-only/);
 click('[data-robust-labels]',{robustLabels:'disputed-excluded'});
 assert.match(page.innerHTML,/14 \/ 18/);
 click('[data-robust-fold]',{robustFold:'boundary'});
 assert.match(page.innerHTML,/approval-handoff/);
});

test('claim audit shows one choice at a time and never grants execution',()=>{
 const {page,handlers}=fixture('#eval-robustness');
 assert.equal(page.innerHTML.match(/data-audit-case=/g)?.length,5);
 assert.equal(page.innerHTML.match(/data-audit-answer=/g)?.length,3);
 const click=dataset=>handlers.click({target:{closest(selector){return selector==='[data-audit-case],[data-audit-answer]'?{dataset}:null;}}});
 click({auditAnswer:'group'});
 assert.match(page.innerHTML,/Kanıt sınırı korundu/);
 assert.match(page.innerHTML,/Gerekli kanıt/);
 click({auditCase:'3'});
 assert.match(page.innerHTML,/13 riskli sentetik durumda/);
 click({auditAnswer:'production'});
 assert.match(page.innerHTML,/Bu karar kanıtı aşar/);
 assert.equal(page.innerHTML.match(/data-audit-answer=/g)?.length,3);
});

test('v0.10 shows five evidence faults with one active scenario',()=>{
 const {page}=fixture('#eval-robustness');
 assert.match(page.innerHTML,/FAILURE INJECTION/);
 assert.equal(page.innerHTML.match(/data-injection-case=/g)?.length,5);
 assert.equal(page.innerHTML.match(/data-injection-mode=/g)?.length,2);
 assert.match(page.innerHTML,/FIXTURE_ONLY/);
 assert.equal(page.innerHTML.match(/data-injection-choice=/g)?.length ?? 0,0);
});
test('v0.10 recovery cannot bypass re-verification and case switch resets the injected state',()=>{
 const {page,handlers}=fixture('#eval-robustness');
 const click=(selector,dataset)=>handlers.click({target:{closest(s){return s.split(',').includes(selector)?{dataset}:null;}}});
 click('[data-injection-mode]',{injectionMode:'injected'});
 assert.match(page.innerHTML,/CLAIM_BLOCKED/);
 assert.equal(page.innerHTML.match(/data-injection-choice=/g)?.length,3);
 click('[data-injection-choice]',{injectionChoice:'group-split'});
 assert.match(page.innerHTML,/REVERIFY_REQUIRED/);
 click('[data-injection-case]',{injectionCase:'3'});
 assert.match(page.innerHTML,/Risk denominator/);
 assert.match(page.innerHTML,/FIXTURE_ONLY/);
 click('[data-injection-mode]',{injectionMode:'injected'});
 assert.match(page.innerHTML,/denominator/);
 assert.match(page.innerHTML,/null/);
});

test('v0.11 oracle self-check is collapsed by default within existing failure injection section',()=>{
 const {page}=fixture('#eval-robustness');
 assert.match(page.innerHTML,/<details class="eval-recovery-plan oracle-self-check" id="oracle-self-check" >/);
 assert.equal(page.innerHTML.match(/data-oracle-mode=/g)?.length,2);
 assert.match(page.innerHTML,/FIXTURE_MATCH_ONLY/);
 assert.match(page.innerHTML,/TRUE_ACCEPT/);
 assert.match(page.innerHTML,/TRUE_REJECT/);
 assert.equal(data.modules.length,14);
 assert.equal(data.labs.length,4);
});
test('v0.11 oracle mutant detects false accepts and false rejects without authorizing actions',()=>{
 const {page,handlers}=fixture('#eval-robustness');
 const click=(selector,dataset)=>handlers.click({target:{closest(s){return s.split(',').includes(selector)?{dataset}:null;}}});
 click('[data-oracle-mode]',{oracleMode:'mutant'});
 assert.match(page.innerHTML,/id="oracle-self-check" open/);
 assert.match(page.innerHTML,/ORACLE_FAULT_DETECTED/);
 assert.match(page.innerHTML,/False accept: 1/);
 assert.match(page.innerHTML,/FALSE_ACCEPT/);
 click('[data-injection-case]',{injectionCase:'1'});
 click('[data-oracle-mode]',{oracleMode:'mutant'});
 assert.match(page.innerHTML,/False reject: 1/);
 assert.match(page.innerHTML,/FALSE_REJECT/);
 assert.doesNotMatch(page.innerHTML,/PRODUCTION_AUTHORIZED/);
});

test('v0.12 independent witness appears only inside zero-FN case and stays collapsed',()=>{
 const {page,handlers}=fixture('#eval-robustness');
 assert.doesNotMatch(page.innerHTML,/id="oracle-independent"/);
 const click=(selector,dataset)=>handlers.click({target:{closest(s){return s.split(',').includes(selector)?{dataset}:null;}}});
 click('[data-injection-case]',{injectionCase:'3'});
 assert.match(page.innerHTML,/<details class="oracle-independent" id="oracle-independent" >/);
 assert.equal(page.innerHTML.match(/data-witness-mode=/g)?.length,3);
 assert.match(page.innerHTML,/İki kontrol: ACCEPT/);
 assert.match(page.innerHTML,/FIXTURE_ONLY/);
});
test('v0.12 witness catches common-mode duplicate and stale revision without new navigation',()=>{
 const {page,handlers}=fixture('#eval-robustness');
 const click=(selector,dataset)=>handlers.click({target:{closest(s){return s.split(',').includes(selector)?{dataset}:null;}}});
 click('[data-injection-case]',{injectionCase:'3'});
 click('[data-witness-mode]',{witnessMode:'duplicate-id'});
 assert.match(page.innerHTML,/id="oracle-independent" open/);
 assert.match(page.innerHTML,/İki kontrol: ACCEPT/);
 assert.match(page.innerHTML,/CLAIM_BLOCKED/);
 assert.match(page.innerHTML,/Benzersiz kimlik: <strong>12/);
 click('[data-witness-mode]',{witnessMode:'stale-revision'});
 assert.match(page.innerHTML,/r41/);
 assert.match(page.innerHTML,/CLAIM_BLOCKED/);
 click('[data-witness-mode]',{witnessMode:'healthy'});
 assert.match(page.innerHTML,/FIXTURE_ONLY/);
 assert.doesNotMatch(page.innerHTML,/PRODUCTION_AUTHORIZED/);
});
