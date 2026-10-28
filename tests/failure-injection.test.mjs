import test from 'node:test';
import assert from 'node:assert/strict';
import '../public/compaction-core.js';
import '../public/reliability-core.js';
import '../public/robustness-core.js';

const F=globalThis.EvidenceInjectionEngine;

test('exactly the five existing claim-audit scenarios are covered',()=>{
 assert.ok(F, 'EvidenceInjectionEngine missing: expected RED before implementation');
 assert.deepEqual(F.CASES.map(x=>x.id),globalThis.EvaluationAuditEngine.CASES.map(x=>x.id));
 assert.equal(new Set(F.CASES.map(x=>x.id)).size,5);
});
test('every baseline authorizes only a bounded fixture observation',()=>{
 for(const c of F.CASES){
  const r=F.inspect(c.id,'baseline');
  assert.equal(r.status,'FIXTURE_ONLY');
  assert.equal(r.evidenceValid,true);
  assert.equal(r.check.passed,true);
  assert.equal(r.productionAuthorized,false);
  assert.equal(r.executionAuthorized,false);
 }
});
test('exactly one corrupt field blocks claims in every scenario',()=>{
 for(const c of F.CASES){
  const base=F.inspect(c.id,'baseline'),bad=F.inspect(c.id,'injected');
  assert.equal(bad.status,'CLAIM_BLOCKED');
  assert.equal(bad.evidenceValid,false);
  assert.equal(bad.check.passed,false);
  assert.equal(bad.check.name,c.evidenceKey);
  assert.equal(bad.productionAuthorized,false);
  assert.equal(bad.executionAuthorized,false);
  assert.deepEqual(Object.keys(base.evidence).filter(k=>base.evidence[k]!==bad.evidence[k]),[c.evidenceKey]);
  assert.ok(bad.failure.length>25&&bad.requiredEvidence.length>25);
 }
});
test('recovery is an advisory proposal, never a success receipt',()=>{
 for(const c of F.CASES){
  assert.equal(c.options.length,3);
  assert.equal(c.options.filter(x=>x.id===c.correctId).length,1);
  for(const option of c.options){
   const result=F.chooseRepair(c.id,option.id);
   assert.equal(result.status,option.id===c.correctId?'REVERIFY_REQUIRED':'CLAIM_BLOCKED');
   assert.equal(result.executionAuthorized,false);
   assert.equal(result.productionAuthorized,false);
  }
 }
});
test('repair does not mutate fixture evidence or convert injected state to PASS',()=>{
 const baseline=F.inspect('paired-leakage','baseline');
 const injected=F.inspect('paired-leakage','injected');
 F.chooseRepair('paired-leakage','group-split');
 assert.deepEqual(F.inspect('paired-leakage','baseline'),baseline);
 assert.deepEqual(F.inspect('paired-leakage','injected'),injected);
});
test('missing denominator never becomes an empirical zero-risk claim',()=>{
 const x=F.inspect('zero-fn','injected');
 assert.equal(x.evidence.denominator,null);
 assert.equal(x.status,'CLAIM_BLOCKED');
 assert.equal(F.chooseRepair('zero-fn','restore-denominator').status,'REVERIFY_REQUIRED');
});
test('synthetic sampling provenance cannot be reclassified as field incidence',()=>{
 const base=F.inspect('synthetic-shift','baseline'),injected=F.inspect('synthetic-shift','injected');
 assert.equal(base.evidence.provenance,'synthetic');
 assert.equal(injected.evidence.provenance,'observed');
 assert.equal(injected.status,'CLAIM_BLOCKED');
});
test('unknown inputs fail closed and summary is based only on fixed cases',()=>{
 assert.throws(()=>F.inspect('unknown','baseline'),/Unknown injection case/);
 assert.throws(()=>F.inspect('zero-fn','missing'),/Unknown injection mode/);
 assert.throws(()=>F.chooseRepair('zero-fn','unknown'),/Unknown repair action/);
 assert.deepEqual(F.summary('injected'),{total:5,blocked:5,fixtureOnly:0});
 assert.deepEqual(F.summary('baseline'),{total:5,blocked:0,fixtureOnly:5});
});
