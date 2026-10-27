/* v0.7 - deterministic sensitivity analysis. Synthetic labels / weights, not observational evidence. */
(function(root){
'use strict';
const R=root.ReliabilityEngine;
if(!R)throw new Error('ReliabilityEngine must load before RobustnessEngine');
const PROFILES=Object.freeze([
 {id:'balanced',title:'Eşit ağırlık',description:'Her paired observation = 1 weight, original v0.6 baseline.'},
 {id:'revision-pressure',title:'Revizyon baskısı',description:'Revision, concurrent edits and failed tests receive ×4 synthetic sampling weight.'},
 {id:'boundary-pressure',title:'Yetki ve güven baskısı',description:'Approval, trust, scope and unknown outcomes receive ×3 synthetic sampling weight.'},
 {id:'recovery-pressure',title:'Recovery yoğunluğu',description:'Recovered states receive ×3 synthetic sampling weight.'}
]);
const DISPUTES=Object.freeze([
 {id:'summary-evidence:recovered',reason:'Second reviewer requests an independent receipt provenance check; the original fixture explicitly models a valid receipt.'},
 {id:'scope-proposal:recovered',reason:'Second reviewer doubts that a recorded proposal has stayed outside write scope; original fixture assumes no extra writes.'},
 {id:'approval-handoff:recovered',reason:'Second reviewer hypothesizes a completed human approval; original fixture explicitly says approval is absent.'},
 {id:'unknown-write:incoming',reason:'Second reviewer hypothesizes the operation ledger already reconciles the write; original fixture explicitly says outcome is unknown.'}
]);
const disputeIds=new Set(DISPUTES.map(d=>d.id));
const FOLDS=Object.freeze([
 {id:'revision',title:'Revision & verification',scenarioIds:['revision-after-compaction','concurrent-change','misleading-green']},
 {id:'boundary',title:'Trust & effects',scenarioIds:['approval-handoff','unknown-write','untrusted-relabel']},
 {id:'contract',title:'Contract & scope',scenarioIds:['summary-evidence','scope-proposal','handoff-contract']}
]);
const MANIFEST=Object.freeze({fixtures:'compaction-v0.5-nine-paired',labels:'reviewed-v0.6-13-hold-5-allow',policies:'v0.6-four-frozen',groups:'v0.7-three-scenario-folds'});
function verifyManifest(candidate){
 const stale=Object.keys(MANIFEST).filter(key=>candidate?.[key]!==MANIFEST[key]);
 return {current:stale.length===0,stale};
}
function check(profile,labels,policyId){
 if(!PROFILES.some(p=>p.id===profile))throw new Error('Unknown profile: '+profile);
 if(!['reviewed','disputed-flipped','disputed-excluded'].includes(labels))throw new Error('Unknown label mode: '+labels);
 if(!R.POLICY.some(p=>p.id===policyId))throw new Error('Unknown policy: '+policyId);
}
function weight(row,profile){
 if(profile==='revision-pressure'&&['revision-after-compaction','concurrent-change','misleading-green'].includes(row.scenarioId))return 4;
 if(profile==='boundary-pressure'&&['approval-handoff','unknown-write','untrusted-relabel','scope-proposal'].includes(row.scenarioId))return 3;
 if(profile==='recovery-pressure'&&row.phase==='recovered')return 3;
 return 1;
}
function evaluateRows(policyId,subset,options={}){
 const profile=options.profile??'balanced',labels=options.labels??'reviewed';
 check(profile,labels,policyId);
 const baseline=R.evaluatePolicy(policyId);
 const predictions=new Map(baseline.detail.map(x=>[x.id,x.hold]));
 const rows=[];
 const matrix={TP:0,FP:0,FN:0,TN:0};
 for(const row of subset){
  if(labels==='disputed-excluded'&&disputeIds.has(row.id))continue;
  const w=weight(row,profile);
  const gold=disputeIds.has(row.id)&&labels==='disputed-flipped'?!row.shouldHold:row.shouldHold;
  const predicted=predictions.get(row.id);
  if(typeof predicted!=='boolean')throw new Error('Unknown evaluated row: '+row.id);
  const classification=gold?(predicted?'TP':'FN'):(predicted?'FP':'TN');
  matrix[classification]+=w;
  rows.push({id:row.id,scenarioId:row.scenarioId,phase:row.phase,weight:w,disputed:disputeIds.has(row.id),reviewedHold:row.shouldHold,assumedHold:gold,predictedHold:predicted,classification});
 }
 const unsafe=matrix.TP+matrix.FN,safe=matrix.FP+matrix.TN;
 return {policyId,profile,labels,observations:rows.length,weightedTotal:rows.reduce((n,r)=>n+r.weight,0),matrix,rows,
  rates:{unsafeRelease:unsafe?matrix.FN/unsafe:null,unnecessaryHold:safe?matrix.FP/safe:null,safeThroughput:safe?matrix.TN/safe:null}};
}
function evaluate(policyId,options={}){return evaluateRows(policyId,R.fixtures(),options);}
function compare(options={}){return R.POLICY.map(p=>evaluate(p.id,options));}
function holdout(policyId,foldId,options={}){
 const fold=FOLDS.find(f=>f.id===foldId);
 if(!fold)throw new Error('Unknown fold: '+foldId);
 const testIds=new Set(fold.scenarioIds),rows=R.fixtures();
 return {fold,train:evaluateRows(policyId,rows.filter(x=>!testIds.has(x.scenarioId)),options),test:evaluateRows(policyId,rows.filter(x=>testIds.has(x.scenarioId)),options)};
}
root.RobustnessEngine=Object.freeze({TASK_ID:R.TASK_ID,PROFILES,DISPUTES,FOLDS,MANIFEST,verifyManifest,evaluate,compare,holdout});
})(typeof window!=='undefined'?window:globalThis);
