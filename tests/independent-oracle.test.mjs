import test from 'node:test';
import assert from 'node:assert/strict';
import '../public/compaction-core.js';
import '../public/reliability-core.js';
import '../public/robustness-core.js';

const F=globalThis.EvidenceInjectionEngine;
const I=globalThis.IndependentOracleEngine;

test('one existing zero-FN claim is challenged without adding new cases or labs',()=>{
 assert.ok(I,'IndependentOracleEngine is not yet implemented (RED expected)');
 assert.equal(I.CASE_ID,'zero-fn');
 assert.deepEqual(I.MODES.map(x=>x.id),['healthy','duplicate-id','stale-revision']);
 assert.equal(F.CASES.length,5);
});
test('both candidate validators accept the same 13-row claim in all three fixtures',()=>{
 for(const mode of I.MODES){
  const result=I.evaluate(mode.id);
  assert.equal(result.claimedDenominator,13);
  assert.equal(result.naiveChecks.length,2);
  assert.equal(result.naiveChecks.every(x=>x.passed),true);
  assert.equal(result.bothAccept,true);
 }
});
test('separate synthetic risk registry allows only the healthy fixture',()=>{
 const r=I.evaluate('healthy');
 assert.equal(r.witness.revision,'r42');
 assert.equal(r.witness.expectedRevision,'r42');
 assert.equal(r.witness.totalRecords,13);
 assert.equal(r.witness.uniqueRecords,13);
 assert.equal(r.witness.valid,true);
 assert.equal(r.status,'FIXTURE_ONLY');
 assert.equal(r.commonModeDetected,false);
});
test('duplicate IDs defeat the shared denominator assumption despite 13 registry rows',()=>{
 const r=I.evaluate('duplicate-id');
 assert.equal(r.witness.totalRecords,13);
 assert.equal(r.witness.uniqueRecords,12);
 assert.equal(r.witness.uniqueIds,false);
 assert.equal(r.witness.countMatches,false);
 assert.equal(r.witness.revisionFresh,true);
 assert.equal(r.witness.valid,false);
 assert.equal(r.status,'CLAIM_BLOCKED');
 assert.equal(r.commonModeDetected,true);
});
test('stale registry revision fails closed even when count and identity checks pass',()=>{
 const r=I.evaluate('stale-revision');
 assert.equal(r.witness.totalRecords,13);
 assert.equal(r.witness.uniqueRecords,13);
 assert.equal(r.witness.countMatches,true);
 assert.equal(r.witness.uniqueIds,true);
 assert.equal(r.witness.revisionFresh,false);
 assert.equal(r.status,'CLAIM_BLOCKED');
 assert.equal(r.commonModeDetected,true);
});
test('source disagreement is a re-verification trigger, never an automated repair or authorization',()=>{
 for(const mode of I.MODES){
  const result=I.evaluate(mode.id);
  assert.equal(result.executionAuthorized,false);
  assert.equal(result.productionAuthorized,false);
  assert.equal(result.doneAuthorized,false);
  assert.ok(result.requiredEvidence.length>35);
  assert.match(result.limitation,/synthetic/i);
 }
});
test('strict mode validation and deterministic replay leave v0.10 source untouched',()=>{
 assert.throws(()=>I.evaluate('unknown'),/Unknown witness mode/);
 const baseline=F.inspect('zero-fn','baseline');
 const a=I.evaluate('duplicate-id'),b=I.evaluate('duplicate-id');
 assert.deepEqual(a,b);
 assert.deepEqual(F.inspect('zero-fn','baseline'),baseline);
});
test('manifest requires independent source version and bound revision',()=>{
 assert.deepEqual(I.verifyManifest(I.MANIFEST),{current:true,stale:[]});
 assert.deepEqual(I.verifyManifest({...I.MANIFEST,registry:'old-source'}),{current:false,stale:['registry']});
 assert.equal(I.verifyManifest({}).current,false);
});
