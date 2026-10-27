import test from 'node:test';
import assert from 'node:assert/strict';
import '../public/context-studio-core.js';
const C=globalThis.ContextStudioEngine;
const CASE_IDS=['prefix-churn','tool-order','dynamic-prefix','stale-retrieval','lost-evidence','handoff','untrusted-elevation','budget','ttl-expired'];

test('nine bounded scenarios share the same contract and expose two explicit variants',()=>{
 assert.equal(C.CASES.length,9);
 assert.deepEqual(C.CASES.map(x=>x.id),CASE_IDS);
 for(const scenario of C.CASES){
   assert.ok(scenario.question && scenario.mechanism && scenario.discussion && scenario.sources.length);
   const risk=C.evaluate(scenario.id,'risk');
   const repair=C.evaluate(scenario.id,'guarded');
   assert.equal(risk.contractId,repair.contractId);
   assert.equal(risk.currentRevision,'r42');
   assert.equal(repair.currentRevision,'r42');
   assert.equal(repair.canComplete,true,scenario.id);
   assert.equal(repair.checks.length,6);
   assert.ok(repair.cache.baselineUnits>0);
 }
});
test('nonexistent fixtures and modes fail closed',()=>{
 assert.throws(()=>C.evaluate('not-real','risk'));
 assert.throws(()=>C.evaluate('prefix-churn','not-real'));
});
test('volatile prefix makes identical semantics miss one fixed cache checkpoint',()=>{
 const risk=C.evaluate('prefix-churn','risk');const repair=C.evaluate('prefix-churn','guarded');
 assert.equal(risk.cache.equalPrefix,false);
 assert.equal(risk.cache.hit,false);
 assert.equal(repair.cache.hit,true);
 assert.ok(repair.cache.optimizedUnits<risk.cache.optimizedUnits);
 assert.equal(risk.canComplete,true,'Cache churn is a cost issue, not a permission failure');
});
test('tool order is byte-sensitive even when tool definitions are semantically equivalent',()=>{
 assert.equal(C.evaluate('tool-order','risk').cache.hit,false);
 assert.equal(C.evaluate('tool-order','guarded').cache.hit,true);
});
test('task-specific user data in a prefix defeats a repeat even for the same toolset',()=>{
 assert.equal(C.evaluate('dynamic-prefix','risk').cache.hit,false);
 assert.equal(C.evaluate('dynamic-prefix','guarded').cache.hit,true);
});
test('cache can hit while retrieved source revision is stale',()=>{
 const risk=C.evaluate('stale-retrieval','risk');
 assert.equal(risk.cache.hit,true);
 assert.equal(risk.canComplete,false);
 assert.equal(risk.checks.find(x=>x.id==='REVISION_FRESH').pass,false);
});
test('compaction cannot replace revision-bound evidence with a summary claim',()=>{
 const risk=C.evaluate('lost-evidence','risk');
 assert.equal(risk.checks.find(x=>x.id==='EVIDENCE_BOUND').pass,false);
 assert.equal(risk.status,'BLOCKED');
});
test('handoff preserves contract and receipt, not a natural-language DONE assertion',()=>{
 const risk=C.evaluate('handoff','risk');
 assert.equal(risk.checks.find(x=>x.id==='HANDOFF_INTEGRITY').pass,false);
 assert.equal(C.evaluate('handoff','guarded').canComplete,true);
});
test('untrusted tool outputs cannot gain instruction authority through compaction',()=>{
 assert.equal(C.evaluate('untrusted-elevation','risk').checks.find(x=>x.id==='SOURCE_TRUST').pass,false);
});
test('budget pressure should trim irrelevant history rather than proof',()=>{
 const risk=C.evaluate('budget','risk');
 assert.equal(risk.checks.find(x=>x.id==='CONTEXT_BUDGET').pass,false);
 assert.equal(risk.checks.find(x=>x.id==='EVIDENCE_BOUND').pass,false);
 assert.equal(C.evaluate('budget','guarded').canComplete,true);
});
test('TTL expiration is a legitimate cache miss even if prefix is equal and DONE is safe',()=>{
 const safe=C.evaluate('ttl-expired','guarded');
 assert.equal(safe.cache.equalPrefix,true);
 assert.equal(safe.cache.hit,false);
 assert.equal(safe.cache.reason,'TTL_EXPIRED');
 assert.equal(safe.canComplete,true);
});
test('model reports are finite, bounded and use an explicit single breakpoint assumption',()=>{
 for(const scenario of C.CASES)for(const mode of ['risk','guarded']){
  const r=C.evaluate(scenario.id,mode);
  assert.equal(r.cache.model,'SINGLE_EXACT_PREFIX_BREAKPOINT');
  assert.ok(Number.isFinite(r.cache.optimizedUnits));
  assert.ok(r.cache.readTokens>=0);
  assert.ok(r.cache.savingsPercent<=100);
  assert.ok(r.cache.requestTokens<=100000);
 }
});
