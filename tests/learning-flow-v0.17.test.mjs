import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
import '../public/labs-core.js';
import '../public/workshop-core.js';
import '../public/context-studio-core.js';
import '../public/compaction-core.js';
import '../public/reliability-core.js';
import '../public/robustness-core.js';

const read=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');
const D=JSON.parse(read('content/curriculum.json'));
const source=read('public/app.js');
const courseIds=D.modules.flatMap(m=>m.lessons.map(l=>l.id));

function boot(hash='#home',completed=[]){
 const windowHandlers={},nodes=new Map(),saved=[];
 const element=()=>({
  innerHTML:'',textContent:'',style:{},dataset:{},disabled:false,
  classList:{toggle(){},add(){},remove(){},replace(){}},
  handlers:{},addEventListener(name,fn){this.handlers[name]=fn;},
  setAttribute(){},getAttribute(){return null;},
  focus(){this.focused=(this.focused||0)+1;},contains(){return true;}
 });
 const page=element(),skip=element(),location={hash,protocol:'https:'};
 const doc={
  body:{classList:{toggle(){},add(){},remove(){}}},
  querySelector(selector){
   if(selector==='#page')return page;
   if(selector==='.skip-link')return skip;
   if(!nodes.has(selector))nodes.set(selector,element());
   return nodes.get(selector);
  },
  querySelectorAll(){return [];},addEventListener(){}
 };
 const windows={
  AGENT_CURRICULUM:D,LabEngine:globalThis.LabEngine,WorkshopEngine:globalThis.WorkshopEngine,
  ContextStudioEngine:globalThis.ContextStudioEngine,CompactionEngine:globalThis.CompactionEngine,
  ReliabilityEngine:globalThis.ReliabilityEngine,RobustnessEngine:globalThis.RobustnessEngine,
  EvaluationAuditEngine:globalThis.EvaluationAuditEngine,EvidenceInjectionEngine:globalThis.EvidenceInjectionEngine,
  OracleReliabilityEngine:globalThis.OracleReliabilityEngine,IndependentOracleEngine:globalThis.IndependentOracleEngine,
  OracleAdjudicationEngine:globalThis.OracleAdjudicationEngine,
  addEventListener(name,fn){windowHandlers[name]=fn;},scrollTo(){}
 };
 const storage={getItem(){return JSON.stringify({completed,passed:completed});},setItem(k,v){saved.push([k,v]);}};
 vm.runInNewContext(source,{window:windows,document:doc,location,navigator:{},localStorage:storage,setTimeout:()=>0,clearTimeout(){},console},{filename:'public/app.js'});
 const navigate=target=>{location.hash=target;windowHandlers.hashchange();return page.innerHTML;};
 return {page,skip,location,navigate,windowHandlers,nodes,saved};
}

test('the primary path resolves home -> curriculum -> module -> lesson without 404',()=>{
 const x=boot();
 assert.match(x.page.innerHTML,/href="#curriculum"/);
 assert.match(x.page.innerHTML,new RegExp('href="#lesson/'+courseIds[0]+'"'));
 const curr=x.navigate('#curriculum');
 assert.match(curr,/aria-label="Müfredat modülleri"/);
 assert.match(curr,new RegExp('href="#module/'+D.modules[0].id+'"'));
 const mod=x.navigate('#module/'+D.modules[0].id);
 assert.match(mod,new RegExp('href="#lesson/'+courseIds[0]+'"'));
 const lesson=x.navigate('#lesson/'+courseIds[0]);
 assert.match(lesson,/id="intro"/);
 assert.match(lesson,/id="quiz"/);
 assert.match(lesson,new RegExp('href="#lesson/'+courseIds[1]+'"'));
 assert.doesNotMatch(lesson,/404 — Yol bulunamadı/);
});
test('all 42 lessons provide a contiguous previous/next route, including both boundaries',()=>{
 const x=boot();
 for(let i=0;i<courseIds.length;i++){
  const html=x.navigate('#lesson/'+courseIds[i]);
  const back=i===0?'#curriculum':'#lesson/'+courseIds[i-1];
  const next=i===courseIds.length-1?'#architecture':'#lesson/'+courseIds[i+1];
  assert.ok(html.includes('href="'+back+'"'),courseIds[i]+': previous route');
  assert.ok(html.includes('href="'+next+'"'),courseIds[i]+': next route');
  assert.doesNotMatch(html,/404 — Yol bulunamadı/);
 }
 assert.equal(courseIds.length,42);
});
test('finished first lesson points home to next unfinished lesson without changing storage',()=>{
 const x=boot('#home',[courseIds[0]]);
 assert.match(x.page.innerHTML,/Kaldığın yerden devam et/);
 assert.match(x.page.innerHTML,new RegExp('href="#lesson/'+courseIds[1]+'"'));
 const s=x.navigate('#curriculum');
 assert.match(s,new RegExp('href="#module/'+D.modules[0].id+'" aria-current="step"'));
 assert.equal(x.saved.length,0);
});
test('when every lesson is complete, home does not present first lesson as new work',()=>{
 const x=boot('#home',courseIds);
 assert.match(x.page.innerHTML,/Tüm dersleri tamamladın/);
 assert.doesNotMatch(x.page.innerHTML,/href="#lesson\//);
 assert.doesNotMatch(x.page.innerHTML,/SIRADAKİ DERS|İlk derse başla|Kaldığın yerden devam et/);
 assert.match(x.page.innerHTML,/href="#curriculum"/);
 assert.doesNotMatch(x.navigate('#curriculum'),/aria-current="step"/);
});
test('skip-to-content activation prevents SPA hash routing and focuses existing main',()=>{
 const x=boot('#lesson/'+courseIds[0]);
 assert.equal(typeof x.skip.handlers.click,'function');
 let prevented=false;
 x.skip.handlers.click({preventDefault(){prevented=true;}});
 assert.equal(prevented,true);
 assert.equal(x.location.hash,'#lesson/'+courseIds[0]);
 assert.equal(x.page.focused,1);
 assert.match(x.page.innerHTML,/id="intro"/);
 assert.doesNotMatch(x.page.innerHTML,/404 — Yol bulunamadı/);
});
test('direct #page fragment is a safe home alias, not a 404 screen',()=>{
 const x=boot('#page');
 assert.match(x.page.innerHTML,/Bir konuya odaklan/);
 assert.doesNotMatch(x.page.innerHTML,/404 — Yol bulunamadı/);
});
test('existing shell and responsive styles keep keyboard and mobile navigation usable',()=>{
 for(const path of ['preview.html','src/pages/index.astro']){
  const html=read(path);
  assert.match(html,/<a class="skip-link" href="#page">İçeriğe geç<\/a>/);
  assert.match(html,/<main id="page" tabindex="-1" aria-label="Eğitim içeriği"/);
 }
 const css=read('public/styles.css');
 assert.match(css,/\.curriculum-row:focus-visible\{/);
 assert.match(css,/@media\(max-width:640px\)[\s\S]*\.curriculum-row\{/);
 assert.match(css,/\.lesson-view \.lesson-layout\{display:block/);
 assert.match(css,/@media\(prefers-reduced-motion:reduce\)/);
});
