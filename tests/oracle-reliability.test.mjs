import test from 'node:test';
import assert from 'node:assert/strict';
import '../public/compaction-core.js';
import '../public/reliability-core.js';
import '../public/robustness-core.js';

const F=globalThis.EvidenceInjectionEngine;
const O=globalThis.OracleReliabilityEngine;

test('five existing evaluation cases have one oracle experiment each',()=>{
 assert.ok(O,'OracleReliabilityEngine missing: expected RED before implementation');
 assert.deepEqual(O.CASES.map(x=>x.id),F.CASES.map(x=>x.id));
 assert.equal(new Set(O.CASES.map(x=>x.id)).size,5);
});
test('reference oracle accepts healthy evidence and rejects corrupted evidence',()=>{
 for(const c of O.CASES){
  const r=O.evaluate(c.id,'reference');
  assert.equal(r.controls.length,2);
  assert.deepEqual(r.controls.map(x=>x.expectedValid),[true,false]);
  assert.deepEqual(r.controls.map(x=>x.observedValid),[true,false]);
  assert.equal(r.falseAccepts,0);
  assert.equal(r.falseRejects,0);
  assert.equal(r.status,'FIXTURE_MATCH_ONLY');
  assert.equal(r.productionAuthorized,false);
  assert.equal(r.executionAuthorized,false);
 }
});
test('mutated oracle is killed by at least one positive or negative control per case',()=>{
 for(const c of O.CASES){
  const r=O.evaluate(c.id,'mutant');
  assert.equal(r.status,'ORACLE_FAULT_DETECTED');
  assert.equal(r.detected,true);
  assert.equal(r.falseAccepts+r.falseRejects,1);
  assert.equal(r.controls.filter(x=>!x.matchesContract).length,1);
  assert.ok(c.fault.length>30&&c.missingAssurance.length>30);
 }
});
test('false accept and false reject use evidence-valid semantics, not task-DONE semantics',()=>{
 for(const id of ['paired-leakage','disputed-labels','zero-fn']){
  const r=O.evaluate(id,'mutant');
  assert.equal(r.falseAccepts,1);
  assert.equal(r.falseRejects,0);
  assert.equal(r.controls[1].classification,'FALSE_ACCEPT');
 }
 for(const id of ['holdout-tuning','synthetic-shift']){
  const r=O.evaluate(id,'mutant');
  assert.equal(r.falseAccepts,0);
  assert.equal(r.falseRejects,1);
  assert.equal(r.controls[0].classification,'FALSE_REJECT');
 }
});
test('summary counts exactly ten paired controls without treating them as independent production samples',()=>{
 assert.deepEqual(O.summary('reference'),{cases:5,controls:10,detected:0,falseAccepts:0,falseRejects:0});
 assert.deepEqual(O.summary('mutant'),{cases:5,controls:10,detected:5,falseAccepts:3,falseRejects:2});
});
test('all oracle outcomes are advisory and cannot turn evidence recovery into automatic authorization',()=>{
 for(const c of O.CASES)for(const id of ['reference','mutant']){
  const result=O.evaluate(c.id,id);
  assert.equal(result.productionAuthorized,false);
  assert.equal(result.executionAuthorized,false);
  assert.ok(result.limitation.includes('synthetic'));
 }
});
test('oracle evaluation leaves baseline and corrupted fixture data unchanged',()=>{
 const before=F.CASES.map(c=>[F.inspect(c.id,'baseline'),F.inspect(c.id,'injected')]);
 for(const c of F.CASES){O.evaluate(c.id,'reference');O.evaluate(c.id,'mutant');}
 const after=F.CASES.map(c=>[F.inspect(c.id,'baseline'),F.inspect(c.id,'injected')]);
 assert.deepEqual(after,before);
});
test('unknown oracle id or case is rejected without permissive fallback',()=>{
 assert.throws(()=>O.evaluate('not-a-case','reference'),/Unknown oracle case/);
 assert.throws(()=>O.evaluate('zero-fn','not-a-mode'),/Unknown oracle mode/);
 assert.throws(()=>O.summary('unknown'),/Unknown oracle mode/);
});
test('oracle fixture provenance manifest rejects stale or incomplete revisions',()=>{
 assert.deepEqual(O.verifyManifest(O.MANIFEST),{current:true,stale:[]});
 assert.deepEqual(O.verifyManifest({...O.MANIFEST,oracle:'older-oracle'}),{current:false,stale:['oracle']});
 assert.equal(O.verifyManifest({}).current,false);
});
