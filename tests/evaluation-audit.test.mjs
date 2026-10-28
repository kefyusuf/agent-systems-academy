import test from 'node:test';
import assert from 'node:assert/strict';
import '../public/compaction-core.js';
import '../public/reliability-core.js';
import '../public/robustness-core.js';
const A=globalThis.EvaluationAuditEngine;
test('five unique evidence-boundary cases with one correct option',()=>{
 assert.equal(A.CASES.length,5);
 assert.equal(new Set(A.CASES.map(x=>x.id)).size,5);
 for(const c of A.CASES){
  assert.equal(c.options.length,3);
  assert.equal(c.options.filter(x=>A.assess(c.id,x.id).correct).length,1);
  assert.ok(c.evidence.length>30&&c.limit.length>30);
  assert.equal(A.assess(c.id,c.correctId).status,'ADVISORY_ONLY');
 }
});
test('invalid case and choice fail closed; wrong answers are non-authorizing',()=>{
 assert.equal(A.assess('zero-fn','production').correct,false);
 assert.throws(()=>A.assess('missing','production'),/Unknown audit case/);
 assert.throws(()=>A.assess('zero-fn','missing'),/Unknown audit choice/);
});
test('summary is stable and validates all answer identities',()=>{
 assert.deepEqual(A.summary({}),{answered:0,correct:0,total:5,complete:false});
 const x=Object.fromEntries(A.CASES.map(c=>[c.id,c.correctId]));
 assert.deepEqual(A.summary(x),{answered:5,correct:5,total:5,complete:true});
 assert.throws(()=>A.summary({...x,foreign:'value'}),/Unknown audit case/);
});
test('zero observed errors never proves production safety',()=>{
 const x=A.observationClaim({unsafeReleases:0,unsafeObservations:13});
 assert.equal(x.allowed,'FIXTURE_ONLY');assert.equal(x.productionGuarantee,false);
 assert.equal(x.illustrativeUpperBound,null);
 const hypothetical=A.observationClaim({unsafeReleases:0,unsafeObservations:13,independent:true});
 assert.ok(hypothetical.illustrativeUpperBound>0.2&&hypothetical.illustrativeUpperBound<0.25);
 assert.throws(()=>A.observationClaim({unsafeReleases:14,unsafeObservations:13}),/Invalid observations/);
});
