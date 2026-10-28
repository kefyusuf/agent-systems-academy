import test from 'node:test';
import assert from 'node:assert/strict';
import '../public/compaction-core.js';
import '../public/reliability-core.js';
import '../public/robustness-core.js';

const D=globalThis.OracleAdjudicationEngine;
const I=globalThis.IndependentOracleEngine;
const F=globalThis.EvidenceInjectionEngine;

test('one zero-fn case reuses exactly the three v0.12 witness modes',()=>{
 assert.ok(D,'OracleAdjudicationEngine missing (expected RED)');
 assert.equal(D.CASE_ID,'zero-fn');
 assert.deepEqual(D.MODES.map(m=>m.id),I.MODES.map(m=>m.id));
 assert.equal(F.CASES.length,5);
});
test('healthy aligned records produce fixture-only, never production approval',()=>{
 const r=D.review('healthy');
 assert.equal(r.claim.denominator,13);
 assert.equal(r.witness.uniqueRecords,13);
 assert.equal(r.countAgreement,true);
 assert.equal(r.revisionComparable,true);
 assert.equal(r.status,'FIXTURE_ONLY');
 assert.equal(r.productionAuthorized,false);
 assert.equal(r.executionAuthorized,false);
 assert.equal(r.doneAuthorized,false);
});
test('conflicting cardinality holds claim rather than choosing the louder source',()=>{
 const r=D.review('duplicate-id');
 assert.equal(r.claim.denominator,13);
 assert.equal(r.witness.uniqueRecords,12);
 assert.equal(r.countAgreement,false);
 assert.equal(r.revisionComparable,true);
 assert.equal(r.status,'DISPUTED_HOLD');
 assert.ok(r.requiredEvidence.includes('provenance'));
});
test('stale source refuses comparison even when counts agree',()=>{
 const r=D.review('stale-revision');
 assert.equal(r.countAgreement,true);
 assert.equal(r.revisionComparable,false);
 assert.equal(r.status,'STALE_SOURCE_HOLD');
 assert.equal(r.witness.revision,'r41');
});
test('each mode has exactly one appropriate proposal and two rejected shortcuts',()=>{
 const expected={healthy:['record-fixture','FIXTURE_ONLY'], 'duplicate-id':['request-adjudication','ADJUDICATION_REQUIRED'], 'stale-revision':['refresh-source','REVERIFY_REQUIRED']};
 for(const mode of D.MODES){
  const options=D.options(mode.id);
  assert.equal(options.length,3);
  assert.equal(new Set(options.map(x=>x.id)).size,3);
  for(const option of options){
   const outcome=D.choose(mode.id,option.id);
   assert.equal(outcome.appropriate,option.id===expected[mode.id][0]);
   assert.equal(outcome.status,outcome.appropriate?expected[mode.id][1]:'CLAIM_BLOCKED');
   assert.equal(outcome.proofComplete,false);
   assert.equal(outcome.productionAuthorized,false);
   assert.equal(outcome.executionAuthorized,false);
   assert.equal(outcome.doneAuthorized,false);
  }
 }
});
test('requesting adjudication makes no assertion that approval or new evidence exists',()=>{
 const r=D.choose('duplicate-id','request-adjudication');
 assert.equal(r.status,'ADJUDICATION_REQUIRED');
 assert.equal(r.evidenceCollected,false);
 assert.equal(r.revisionValidated,false);
 assert.equal(r.resolved,false);
});
test('replay is deterministic and never mutates original witness, registry or task',()=>{
 const before=I.MODES.map(m=>I.evaluate(m.id));
 const one=D.review('duplicate-id');
 D.choose('duplicate-id','request-adjudication');
 assert.deepEqual(D.review('duplicate-id'),one);
 assert.deepEqual(I.MODES.map(m=>I.evaluate(m.id)),before);
});
test('unknown mode and action fail closed, stale manifest fails validation',()=>{
 assert.throws(()=>D.review('unknown'),/Unknown disagreement mode/);
 assert.throws(()=>D.options('unknown'),/Unknown disagreement mode/);
 assert.throws(()=>D.choose('duplicate-id','approve'),/Unknown adjudication action/);
 assert.deepEqual(D.verifyManifest(D.MANIFEST),{current:true,stale:[]});
 assert.deepEqual(D.verifyManifest({...D.MANIFEST,witness:'old'}),{current:false,stale:['witness']});
 assert.equal(D.verifyManifest({}).current,false);
});
