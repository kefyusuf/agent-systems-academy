import test from 'node:test';
import assert from 'node:assert/strict';
import '../public/compaction-core.js';
import '../public/reliability-core.js';
const R=globalThis.ReliabilityEngine;
const assertCounts=(a,b)=>assert.deepEqual({...a},{...b});

test('v0.6 freezes same task, same nine cases and 18 distinct paired fixtures',()=>{
 const fixtures=R.fixtures();
 assert.equal(R.TASK_ID,'TASK-AUTH-017');
 assert.equal(fixtures.length,18);
 assert.equal(new Set(fixtures.map(f=>f.id)).size,18);
 assert.equal(new Set(fixtures.map(f=>f.scenarioId)).size,9);
 assert.equal(fixtures.filter(f=>f.phase==='incoming').length,9);
 assert.equal(fixtures.filter(f=>f.phase==='recovered').length,9);
});
test('ground truth annotation has thirteen HOLD and five ALLOW states',()=>{
 const rows=R.fixtures();
 assert.equal(rows.filter(r=>r.shouldHold).length,13);
 assert.equal(rows.filter(r=>!r.shouldHold).length,5);
 assert.equal(rows.filter(r=>r.phase==='incoming'&&!r.shouldHold).length,0);
 assert.deepEqual(rows.filter(r=>r.phase==='recovered'&&!r.shouldHold).map(r=>r.scenarioId),
 ['summary-evidence','untrusted-relabel','unknown-write','scope-proposal','handoff-contract']);
});
test('pre and post states match externally specified continuation classifications',()=>{
 for(const row of R.fixtures()){
  const isResume=row.assessment.status==='ELIGIBLE_TO_RESUME';
  assert.equal(isResume,!row.shouldHold,`${row.id} golden annotation mismatch`);
 }
});
test('all four policies report complete confusion matrix with correct denominators',()=>{
 for(const policy of R.POLICY){
  const r=R.evaluatePolicy(policy.id);
  const {TP,FP,FN,TN}=r.matrix;
  assert.equal(TP+FP+FN+TN,18);
  assert.equal(TP+FN,13);
  assert.equal(TN+FP,5);
  assert.equal(r.detail.length,18);
  assert.equal(r.cost.inspectionUnits,r.policy.inspect*18);
 }
});
test('summary-first policy has both unsafe approvals and false stops',()=>{
 const report=R.evaluatePolicy('summary');
 assertCounts(report.matrix,{TP:1,FP:1,FN:12,TN:4});
 assert.equal(report.rates.unsafeRelease,12/13);
 assert.equal(report.rates.unnecessaryHold,1/5);
});
test('runner-only catches missing or failed runner but ignores other gates',()=>{
 const report=R.evaluatePolicy('runner');
 assertCounts(report.matrix,{TP:7,FP:0,FN:6,TN:5});
 assert.equal(report.detail.find(x=>x.id==='approval-handoff:incoming').classification,'FN');
 assert.equal(report.detail.find(x=>x.id==='misleading-green:incoming').classification,'TP');
});
test('gated policy passes this fixed fixture suite but does not claim production perfection',()=>{
 const r=R.evaluatePolicy('gated');
 assertCounts(r.matrix,{TP:13,FP:0,FN:0,TN:5});
 assert.equal(r.rates.safeThroughput,1);
 assert.equal(r.rates.unsafeRelease,0);
});
test('hold-all achieves recall 100% but safe throughput 0%',()=>{
 const r=R.evaluatePolicy('hold');
 assertCounts(r.matrix,{TP:13,FP:5,FN:0,TN:0});
 assert.equal(r.rates.holdRecall,1);
 assert.equal(r.rates.safeThroughput,0);
});
test('relative costs decompose exactly and respond predictably to penalties',()=>{
 const base=R.evaluatePolicy('hold',{falseAllowPenalty:50,falseHoldPenalty:8});
 assert.equal(base.cost.inspectionUnits,0);
 assert.equal(base.cost.recoveryUnits,78);
 assert.equal(base.cost.total,118);
 const more=R.evaluatePolicy('hold',{falseAllowPenalty:50,falseHoldPenalty:20});
 assert.equal(more.cost.total,178);
 const gated=R.evaluatePolicy('gated',{falseAllowPenalty:50,falseHoldPenalty:20});
 assert.equal(gated.cost.total,150);
 const runner=R.evaluatePolicy('runner',{falseAllowPenalty:100,falseHoldPenalty:8});
 assert.equal(runner.cost.total,688);
});
test('cost formula holds for all policies and settings',()=>{
 for(const settings of [{},{falseAllowPenalty:0,falseHoldPenalty:0},{falseAllowPenalty:1000,falseHoldPenalty:1000}]){
  for(const report of R.compare(settings)){
   const cost=report.cost;
   assert.equal(cost.total,cost.inspectionUnits+cost.recoveryUnits+cost.unsafeReleaseUnits+cost.unnecessaryHoldUnits);
   assert.ok(Number.isFinite(cost.total));
  }
 }
});
test('reject out-of-range settings and unknown selectors',()=>{
 assert.throws(()=>R.evaluatePolicy('bad'),/Unknown policy/);
 assert.throws(()=>R.evaluatePolicy('gated',{falseAllowPenalty:-1}),RangeError);
 assert.throws(()=>R.evaluatePolicy('gated',{falseAllowPenalty:Infinity}),RangeError);
 assert.throws(()=>R.evaluatePolicy('gated',{falseHoldPenalty:1001}),RangeError);
 assert.throws(()=>R.inspectScenario('missing'),/Unknown scenario/);
});
test('evidence completeness is verified-artifact coverage and excludes trust/scope',()=>{
 const before=R.inspectScenario('summary-evidence').rows[0];
 const after=R.inspectScenario('summary-evidence').rows[1];
 assert.equal(before.coverage.required,4);
 assert.equal(before.coverage.verified,3);
 assert.equal(after.coverage.verified,4);
 const approval=R.inspectScenario('approval-handoff');
 assert.equal(approval.rows[0].coverage.required,5);
 assert.equal(approval.rows[0].coverage.verified,4);
 assert.equal(approval.rows[1].coverage.verified,4);
 assert.equal(approval.rows[1].coverage.boundaryPass,2);
});
test('fixture objects are independent replays and do not mutate the source engine',()=>{
 const first=R.fixtures();
 const original=first[0].assessment.status;
 first[0].assessment.status='INJECTED';
 const next=R.fixtures();
 assert.equal(next[0].assessment.status,original);
 assert.equal(next[0].id,first[0].id);
});
test('all recovery plans have finite nonnegative units and a substantive reason',()=>{
 for(const c of globalThis.CompactionEngine.CASES){
  const x=R.inspectScenario(c.id);
  assert.equal(x.rows.length,2);
  for(const k of ['inspect','verify','coordinate'])assert.ok(Number.isInteger(x.plan[k])&&x.plan[k]>=0);
  assert.ok(x.plan.why.length>30);
 }
});
