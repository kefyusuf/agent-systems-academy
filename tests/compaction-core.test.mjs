import test from 'node:test';
import assert from 'node:assert/strict';
import '../public/compaction-core.js';
const H=globalThis.CompactionEngine;
const fixtures={
 'summary-evidence':['ELIGIBLE_TO_RESUME','RUNNER_RECEIPT'],
 'revision-after-compaction':['NEEDS_REVERIFY','REVISION_FRESH'],
 'untrusted-relabel':['ELIGIBLE_TO_RESUME','TRUST_PROVENANCE'],
 'approval-handoff':['WAITING_APPROVAL','APPROVAL_AUTHORITY'],
 'unknown-write':['ELIGIBLE_TO_RESUME','OPERATION_RECONCILED'],
 'scope-proposal':['ELIGIBLE_TO_RESUME','SCOPE_LOCK'],
 'handoff-contract':['ELIGIBLE_TO_RESUME','CONTRACT_BINDING'],
 'concurrent-change':['NEEDS_REPLAN','REVISION_FRESH'],
 'misleading-green':['NEEDS_REVERIFY','RUNNER_RECEIPT']
};
test('nine fixed scenarios reuse the original TaskContract and have three meaningful alternatives',()=>{
 assert.equal(H.TASK_ID,'TASK-AUTH-017');assert.equal(H.CASES.length,9);
 for(const c of H.CASES){
  assert.equal(c.actions.length,3,c.id);
  assert.equal(new Set(c.actions.map(x=>x[0])).size,3,c.id);
  assert.ok(c.actions.some(x=>x[0]===c.correct),c.id);
  assert.ok(c.symptom.length>25&&c.why.length>30);
 }
});
for(const [id,[expectedStatus,firstFailure]] of Object.entries(fixtures)){
 test(`${id}: prior invalid state is blocked; selected safe action does not fabricate DONE`,()=>{
  const b=H.inspect(id);
  assert.equal(b.assessment.status,'BLOCKED');
  assert.ok(b.assessment.failed.includes(firstFailure));
  const out=H.choose(id,b.scenario.correct);
  assert.equal(out.correct,true);
  assert.equal(out.after.status,expectedStatus);
  assert.equal(out.mutations,0);
  assert.equal(out.realToolCalls,0);
  assert.ok(out.trace.some(x=>x.kind==='GATE'));
  assert.equal(out.before.status,'BLOCKED');
  assert.equal(out.after.checks.length,7);
 });
}
test('all explicitly unsafe choices remain BLOCKED and cannot forge receipts or approvals',()=>{
 for(const c of H.CASES){
  for(const [id] of c.actions.filter(a=>a[0]!==c.correct)){
   const run=H.choose(c.id,id);
   assert.equal(run.correct,false,`${c.id} ${id}`);
   assert.equal(run.after.status,'BLOCKED',`${c.id} ${id}`);
   assert.deepEqual(run.after,run.before,`${c.id} ${id}`);
   assert.ok(run.trace.some(x=>x.kind==='REJECTED_CHOICE'));
  }
 }
});
test('stale revision repair only invalidates the old test receipt and requires a real rerun',()=>{
 const x=H.choose('revision-after-compaction','invalidate-evidence');
 assert.equal(x.after.contextRevision,'r43');
 assert.equal(x.after.verifiedRunner,null);
 assert.ok(x.after.failed.includes('RUNNER_RECEIPT'));
 assert.ok(x.trace.some(t=>t.message.includes('real test execution')));
});
test('concurrent write cannot automatically pass DONE by refreshing the source snapshot',()=>{
 const x=H.choose('concurrent-change','stop-replan');
 assert.equal(x.after.status,'NEEDS_REPLAN');
 assert.ok(x.after.failed.includes('RUNNER_RECEIPT'));
 assert.equal(x.after.contextRevision,'r43');
});
test('approval request never fabricates a signed human approval',()=>{
 const x=H.choose('approval-handoff','request-approval');
 assert.equal(x.after.approvalRequested,true);
 assert.ok(x.after.failed.includes('APPROVAL_AUTHORITY'));
 assert.equal(x.after.status,'WAITING_APPROVAL');
});
test('unknown write outcome is reconciled through the ledger and not executed twice',()=>{
 const x=H.choose('unknown-write','reconcile-ledger');
 assert.equal(x.after.operationClaim,'COMMITTED');
 assert.equal(x.after.ledger.count,1);
 assert.equal(x.mutations,0);
 assert.ok(x.trace.some(t=>t.message.includes('no write retry')));
});
test('suggesting out-of-scope work does not authorize any out-of-scope modification',()=>{
 const x=H.choose('scope-proposal','record-proposal');
 assert.equal(x.after.suggestionRecorded,true);
 assert.equal(x.mutations,0);
 assert.equal(x.after.status,'ELIGIBLE_TO_RESUME');
});
test('RED runner evidence overrides a misleading natural-language GREEN claim',()=>{
 const b=H.inspect('misleading-green');
 assert.equal(b.assessment.claim,'GREEN');
 assert.equal(b.assessment.verifiedRunner.exitCode,1);
 const x=H.choose('misleading-green','investigate-red');
 assert.equal(x.after.claim,'RED');
 assert.equal(x.after.verifiedRunner,null);
 assert.equal(x.after.status,'NEEDS_REVERIFY');
});
test('compaction ratio cannot stand in for evidence quality',()=>{
 const x=H.inspect('summary-evidence').assessment;
 assert.ok(x.compaction.reductionPercent>90);
 assert.equal(x.status,'BLOCKED');
});
test('inspect and choose do not mutate frozen cases, shared fixtures or caller state',()=>{
 const initial=JSON.stringify(H.CASES);
 const a=H.choose('handoff-contract','restore-contract');
 a.after.notes.push('tamper');
 const b=H.choose('handoff-contract','restore-contract');
 assert.ok(!b.after.notes.includes('tamper'));
 assert.equal(JSON.stringify(H.CASES),initial);
 assert.equal(H.inspect('handoff-contract').assessment.status,'BLOCKED');
});
test('unknown case or action is rejected, never silently allowed',()=>{
 assert.throws(()=>H.inspect('not-a-case'),/Unknown scenario/);
 assert.throws(()=>H.choose('not-a-case','skip'),/Unknown scenario/);
 assert.throws(()=>H.choose('summary-evidence','not-an-action'),/Unknown action/);
});
