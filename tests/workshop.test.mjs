import test from 'node:test';
import assert from 'node:assert/strict';
import '../public/workshop-core.js';
const W=globalThis.WorkshopEngine;

test('workshop exposes one fixed contract, seven stages and nine deterministic cases',()=>{
  assert.equal(W.STAGES.length,7);
  assert.equal(W.SCENARIOS.length,9);
  assert.equal(new Set(W.SCENARIOS.map(s=>s.id)).size,9);
  assert.match(W.CONTRACT.inScope.join(' '),/src\/auth/);
});

test('normal path requires all gates before DONE with revision-bound evidence',()=>{
  let state=W.begin('baseline');
  assert.equal(W.canComplete(state).ok,false);
  for (const stage of W.STAGES){
    const option=W.getOptions(state).find(o=>o.recommended);
    assert.ok(option,`Missing safe choice for ${stage.id}`);
    state=W.choose(state,option.id);
  }
  assert.equal(state.status,'DONE');
  assert.equal(state.revision,'r42');
  assert.equal(state.evidenceRevision,'r42');
  assert.ok(W.canComplete(state).ok);
  assert.equal(state.events.filter(e=>e.result==='ACCEPTED').length,7);
});

test('wrong decision fails closed without advancing or performing a write',()=>{
  const original=W.begin('baseline');
  const rejected=W.choose(original,'expand-scope');
  assert.equal(original.cursor,0);
  assert.equal(rejected.cursor,0);
  assert.equal(rejected.status,'BLOCKED');
  assert.equal(rejected.writes,0);
  assert.equal(rejected.events.at(-1).result,'BLOCKED');
  const recovered=W.choose(rejected,'scope-lock');
  assert.equal(recovered.cursor,1);
  assert.equal(recovered.status,'IN_PROGRESS');
});

test('unknown choice cannot bypass current step',()=>{
  const s=W.choose(W.begin('baseline'),'run-deploy');
  assert.equal(s.cursor,0);
  assert.equal(s.writes,0);
  assert.equal(s.status,'BLOCKED');
});

test('injection is handled as data and not as authority',()=>{
  let s=W.begin('injection');
  s=W.choose(s,'scope-lock');
  assert.equal(W.getStep(s).id,'context');
  assert.equal(W.choose(s,'obey-issue').status,'BLOCKED');
  s=W.choose(s,'quarantine-issue');
  assert.equal(s.cursor,2);
  assert.equal(s.contextTrust,'verified');
});

test('scope creep must become proposal only',()=>{
  let s=W.begin('scope');
  for(const id of ['scope-lock','revision-aware','minimal-tool']) s=W.choose(s,id);
  assert.equal(W.choose(s,'silent-deploy').cursor,3);
  s=W.choose(s,'suggest-only');
  assert.equal(s.proposals.length,1);
  assert.equal(s.policyDecision,'EXECUTE_AND_RECORD');
});

test('explicit approval hold is terminal and cannot masquerade as completion',()=>{
  let s=W.begin('approval');
  for(const id of ['scope-lock','revision-aware','minimal-tool']) s=W.choose(s,id);
  s=W.choose(s,'request-approval');
  assert.equal(s.status,'WAITING_APPROVAL');
  assert.equal(s.writes,0);
  assert.equal(s.cursor,3);
  assert.equal(W.canComplete(s).ok,false);
  assert.equal(W.choose(s,'red-green'),s);
});

test('timeout, unknown side effect and race scenarios each reject unsafe recovery',()=>{
  for(const [scenario,unsafe,safe] of [
    ['timeout','assume-passed','bounded-retry'],
    ['unknown-outcome','blind-retry','reconcile-receipt'],
    ['race','last-write-wins','compare-and-swap']
  ]){
    let s=W.begin(scenario);
    for(const id of ['scope-lock','revision-aware','minimal-tool','bounded-edit']) s=W.choose(s,id);
    assert.equal(s.cursor,4);
    const failed=W.choose(s,unsafe);
    assert.equal(failed.cursor,4,scenario);
    assert.equal(failed.writes,0,scenario);
    const recovered=W.choose(failed,safe);
    assert.equal(recovered.cursor,5,scenario);
    assert.equal(recovered.writes,1,scenario);
  }
});

test('stale test evidence cannot validate modified revision',()=>{
  let s=W.begin('stale');
  for(const id of ['scope-lock','revision-aware','minimal-tool','bounded-edit','red-green']) s=W.choose(s,id);
  assert.equal(s.revision,'r42');
  assert.equal(W.choose(s,'reuse-r41').cursor,5);
  s=W.choose(s,'rerun-r42');
  assert.equal(s.evidenceRevision,'r42');
  assert.ok(W.canComplete(s).ok);
});

test('failed regression requires repair and new revision verification',()=>{
  let s=W.begin('red-regression');
  for(const id of ['scope-lock','revision-aware','minimal-tool','bounded-edit','red-green']) s=W.choose(s,id);
  assert.equal(W.choose(s,'accept-red').cursor,5);
  s=W.choose(s,'repair-rerun');
  assert.equal(s.revision,'r43');
  assert.equal(s.evidenceRevision,'r43');
  assert.ok(W.canComplete(s).ok);
});

test('done gate independently verifies receipt and revision invariants',()=>{
  let s=W.begin('baseline');
  for(const id of ['scope-lock','revision-aware','minimal-tool','bounded-edit','red-green','verify-r42']) s=W.choose(s,id);
  assert.ok(W.canComplete(s).ok);
  assert.equal(W.canComplete({...s,evidenceRevision:'r41'}).ok,false);
  assert.equal(W.canComplete({...s,receipts:[]}).ok,false);
  assert.equal(W.canComplete({...s,receipts:[{...s.receipts[0],path:'.env'}]}).ok,false);
  assert.equal(W.canComplete({...s,policyDecision:'SUGGEST_ONLY'}).ok,false);
  assert.equal(W.choose({...s,evidenceRevision:'r41'},'finish').status,'BLOCKED');
});

test('reset and scenario runs are deterministic and do not mutate caller',()=>{
  const a=W.begin('baseline'); const b=W.begin('baseline');
  assert.deepEqual(a,b);
  const after=W.choose(a,'scope-lock');
  assert.equal(a.cursor,0);
  assert.equal(after.cursor,1);
  assert.equal(W.getOptions(a).length,3);
});

test('all nine scenarios reach only DONE or WAITING_APPROVAL and avoid any hidden side effects',()=>{
 for(const scenario of W.SCENARIOS){
  let state=W.begin(scenario.id);
  for(let i=0;i<W.STAGES.length;i++){
    if(state.status==='WAITING_APPROVAL'||state.status==='DONE')break;
    const recommended=W.getOptions(state).filter(x=>x.recommended);
    assert.equal(recommended.length,1,scenario.id);
    state=W.choose(state,recommended[0].id);
  }
  assert.equal(state.status,scenario.id==='approval'?'WAITING_APPROVAL':'DONE',scenario.id);
  assert.equal(state.writes,scenario.id==='approval'?0:scenario.id==='red-regression'?2:1,scenario.id);
  assert.equal(W.canComplete(state).ok,scenario.id!=='approval',scenario.id);
  assert.ok(state.receipts.every(r=>W.CONTRACT.inScope.includes(r.path)),scenario.id);
 }
});
