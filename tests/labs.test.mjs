import test from 'node:test';
import assert from 'node:assert/strict';
import '../public/labs-core.js';
const { estimateCache, policyDecision, inspectContext } = globalThis.LabEngine;

test('cache model: below threshold cannot hit', () => {
  const r = estimateCache({prefixTokens:500,variableTokens:200,requests:10,stability:100});
  assert.equal(r.eligible,false);assert.equal(r.hits,0);assert.equal(r.optimizedUnits,r.baselineUnits);
});
test('cache model: stable eligible prefix benefits from repeated reads', () => {
  const r=estimateCache({prefixTokens:3000,variableTokens:200,requests:20,stability:100});
  assert.equal(r.hits,19);assert.equal(r.writes,1);assert.ok(r.savedPercent>50);
});
test('cache model: first eligible request incurs write premium', () => {
  const r=estimateCache({prefixTokens:3000,requests:1,stability:100});
  assert.equal(r.hits,0);assert.ok(r.optimizedUnits>r.baselineUnits);
});
test('cache model: no stable matches can cost more', () => {
  const r=estimateCache({prefixTokens:3000,requests:10,stability:0});
  assert.equal(r.hits,0);assert.equal(r.writes,10);assert.ok(r.savedPercent<0);
});
test('cache model: non-finite and out-of-range inputs bounded', () => {
  const r=estimateCache({prefixTokens:-2,requests:Infinity,stability:300});
  assert.equal(r.prefixTokens,0);assert.equal(r.requests,12);assert.equal(r.hits,0);
});
test('policy: read is auto execution within authorized scope', () => assert.equal(policyDecision({action:'read'}).code,'AUTO_EXECUTE'));
test('policy: in-scope edit is recorded', () => assert.equal(policyDecision({action:'edit'}).code,'EXECUTE_AND_RECORD'));
test('policy: scoped deploy without approval requests approval', () => assert.equal(policyDecision({action:'deploy'}).code,'REQUEST_APPROVAL'));
test('policy: scoped deploy with approval permits execution and receipt', () => assert.equal(policyDecision({action:'deploy',approved:true}).code,'EXECUTE_AND_RECORD'));
test('policy: untrusted input cannot override user permission', () => assert.equal(policyDecision({action:'delete',trusted:false,approved:true}).code,'MUST_NOT_PROCEED'));
test('policy: explicit deny overrides approval', () => assert.equal(policyDecision({prohibited:true,approved:true}).code,'MUST_NOT_PROCEED'));
test('policy: out-of-scope change is only suggested, even if general approval flagged', () => assert.equal(policyDecision({action:'edit',inScope:false,approved:true}).code,'SUGGEST_ONLY'));
test('context: over-budget detected', () => {
  const r=inspectContext({budget:4000,system:2000,tools:2000,files:3000,history:0,evidence:0});
  assert.ok(r.available<0);assert.ok(r.warnings.some(w=>w.includes('Bütçe aşıldı')));
});
test('context: healthy evidence reserve and moderate tools produce no warnings', () => {
  const r=inspectContext({budget:16000,system:1700,tools:2100,files:4800,history:2200,evidence:1500});
  assert.equal(r.warnings.length,0);
});
test('cache break-even is 2 requests for 1.25 write / 0.1 read ratios', () => {
  assert.equal(globalThis.LabEngine.cacheBreakEvenRequests({writeRate:1.25,readRate:0.1}),2);
});
test('cache never pays back with both write and read rates >= 1', () => {
  assert.equal(globalThis.LabEngine.cacheBreakEvenRequests({writeRate:1.25,readRate:1}),null);
});
test('cache break-even at first request when writes are cheaper than uncached', () => {
  assert.equal(globalThis.LabEngine.cacheBreakEvenRequests({writeRate:0.5,readRate:0.1}),1);
});
