import test from 'node:test';
import assert from 'node:assert/strict';
import '../public/compaction-core.js';
import '../public/reliability-core.js';
import '../public/robustness-core.js';
const Q=globalThis.RobustnessEngine;
const R=globalThis.ReliabilityEngine;

test('four named fixed-distribution profiles preserve the 18-case identities',()=>{
 assert.equal(Q.PROFILES.length,4);
 for(const p of Q.PROFILES){
  const r=Q.compare({profile:p.id});
  assert.equal(r.length,4);
  for(const v of r){assert.equal(v.observations,18); assert.equal(v.matrix.TP+v.matrix.FP+v.matrix.FN+v.matrix.TN,v.weightedTotal);}
 }
});
test('baseline reproduces original v0.6 confusion matrices exactly',()=>{
 for(const p of R.POLICY)assert.deepEqual(Q.evaluate(p.id,{profile:'balanced'}).matrix,R.evaluatePolicy(p.id).matrix);
});
test('distribution shift reweights existing scenarios but cannot invent observations',()=>{
 const shifted=Q.evaluate('runner',{profile:'revision-pressure'});
 const balanced=Q.evaluate('runner',{profile:'balanced'});
 assert.notDeepEqual(shifted.matrix,balanced.matrix);
 assert.equal(shifted.observations,18);
 assert.ok(shifted.weightedTotal>18);
 assert.equal(new Set(shifted.rows.map(r=>r.id)).size,18);
});
test('disagreement is explicit and changing assumptions is not ground truth',()=>{
 assert.equal(Q.DISPUTES.length,4);
 const baseline=Q.evaluate('gated',{labels:'reviewed'});
 const flipped=Q.evaluate('gated',{labels:'disputed-flipped'});
 const excluded=Q.evaluate('gated',{labels:'disputed-excluded'});
 assert.equal(baseline.observations,18);
 assert.equal(flipped.observations,18);
 assert.equal(excluded.observations,14);
 assert.notDeepEqual(flipped.matrix,baseline.matrix);
 assert.equal(Q.DISPUTES.every(x=>x.reason.length>35),true);
 assert.deepEqual(R.evaluatePolicy('gated').matrix,{TP:13,FP:0,FN:0,TN:5});
});
test('scenario-level holdout keeps incoming and recovered pairs together, with no leakage',()=>{
 const all=new Set();
 for(const fold of Q.FOLDS){
  const result=Q.holdout('runner',fold.id);
  assert.equal(result.train.observations,12);
  assert.equal(result.test.observations,6);
  const trainIds=new Set(result.train.rows.map(r=>r.scenarioId));
  const testIds=new Set(result.test.rows.map(r=>r.scenarioId));
  assert.equal([...trainIds].some(x=>testIds.has(x)),false);
  for(const x of testIds)all.add(x);
 }
 assert.equal(all.size,9);
});
test('evaluation manifest refuses stale fixture, labels, and policy versions',()=>{
 assert.deepEqual(Q.verifyManifest(Q.MANIFEST),{current:true,stale:[]});
 const x=Q.verifyManifest({...Q.MANIFEST,labels:'prior-revision',policies:'prior-policy'});
 assert.equal(x.current,false);
 assert.deepEqual(x.stale,['labels','policies']);
 assert.equal(Q.verifyManifest({}).current,false);
});
test('unknown labels, shifts, policy, and fold are rejected without falling back silently',()=>{
 assert.throws(()=>Q.evaluate('gated',{profile:'magic'}),/Unknown profile/);
 assert.throws(()=>Q.evaluate('gated',{labels:'magic'}),/Unknown label mode/);
 assert.throws(()=>Q.evaluate('magic'),/Unknown policy/);
 assert.throws(()=>Q.holdout('gated','magic'),/Unknown fold/);
});
