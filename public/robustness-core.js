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

/* v0.9 educational claim audit. Decisions never authorize an operation. */
(function(root){
'use strict';
const CASES=[
 {id:'paired-leakage',title:'Aynı görevin iki fazı ayrıldı',setup:'Incoming ve recovered aynı task kimliğini, revizyonu ve onarım yolunu paylaşırken train/test kümelerine bölündü.',question:'Bağımsızlığı hangi karar korur?',options:[['group','Senaryo bazında birlikte ayır'],['shuffle','Satırları karıştır'],['weight','Satır ağırlığını artır']],correctId:'group',explanation:'İki faz bağımsız değildir. Grup temelli bölümleme gerekir; satırları karıştırmak contamination sorununu çözmez.',evidence:'Scenario ID ile grouped split; train/test grup kesişimi sıfır; sürümlü test manifesti.',limit:'Grouped split bile dokuz sentetik senaryonun ötesine genelleme sağlamaz.'},
 {id:'holdout-tuning',title:'Holdout üzerinde seçim yapıldı',setup:'Dört politika aynı test verisinde tekrar tekrar karşılaştırılıp en iyi görünen seçildi.',question:'İddiayı bağımsız doğrulamak için ne yaparsın?',options:[['freeze','Politikayı dondur, yeni untouched test ayır'],['reuse','Aynı skorla dış iddia yayımla'],['reweight','Test ağırlıklarını değiştir']],correctId:'freeze',explanation:'Seçim sırasında kullanılan holdout artık bağımsız test değildir; yeni dokunulmamış küme gerekir.',evidence:'Selection log, frozen policy ve seçimden bağımsız nihai holdout.',limit:'Yeni test de popülasyon ve örnekleme stratejisi olmadan üretim kanıtı olmaz.'},
 {id:'disputed-labels',title:'İtirazlı gold labels çıkarıldı',setup:'Dört tartışmalı kayıt atıldı ve skor yükseldi; bağımsız adjudication yapılmadı.',question:'Kanıtı hangi işlem korur?',options:[['review','Kör bağımsız adjudication yap ve duyarlılık raporla'],['omit','Zor kayıtları gizle'],['flip','Hipotezleri otomatik doğru say']],correctId:'review',explanation:'İtiraz yeni truth değildir; kanıt ve kör değerlendirme gerekir, dahil/hariç sonuçlar açık olmalıdır.',evidence:'Makbuz provenance, sürümlü gold labels, adjudication protokolü ve açık paydalar.',limit:'Etiket revizyonu önceki confusion matrix ile karşılaştırmayı geçersizleştirir.'},
 {id:'zero-fn',title:'13 riskli sentetik durumda FN sıfır',setup:'Dokuz senaryodan türeyen riskli durumlarda Evidence-gated için gözlenen FN=0.',question:'Hangi güvenlik iddiası geçerlidir?',options:[['fixture','Yalnız bu sabit fixture sonucunu bildir'],['production','Üretimde sıfır risk ilan et'],['weighted','Ağırlıkları yeni örnek say']],correctId:'fixture',explanation:'Sıfır gözlenen hata sıfır gerçek risk değildir; eşleşmiş sentetik satırlar bağımsız örnek sayılmaz.',evidence:'Yeni bağımsız görev örneklemesi, risk dilimleri, belirsizlik ve saha verisi.',limit:'Bağımsız Bernoulli varsayımı kurulmadığı için basit güven aralığı burada geçerli değildir.'},
 {id:'synthetic-shift',title:'Revizyon riski sentetik olarak ×4 ağırlıklandı',setup:'Üç eski senaryonun ağırlığı artırıldı; üretimden yeni gözlem alınmadı.',question:'Bulguyu nasıl yayımlarsın?',options:[['sensitivity','Yalnız sentetik duyarlılık analizi olarak'],['incidence','Gerçek hata insidansı dört kat arttı diyerek'],['sample','Ağırlıklı toplamı bağımsız n sayarak']],correctId:'sensitivity',explanation:'Ağırlıklar gerçek frekans ve yeni olay üretmez; yalnız varsayımsal dağılım etkisini gösterir.',evidence:'Temsili saha örneklemesi ve gerçek olay prevalansı verisi.',limit:'Yeniden ağırlıklandırma gerçek-world incidence veya dış geçerlilik kanıtı değildir.'}
].map(c=>Object.freeze({...c,options:Object.freeze(c.options.map(([id,label])=>Object.freeze({id,label})))}));
const byId=new Map(CASES.map(c=>[c.id,c]));
function assess(id,choiceId){
 const c=byId.get(id);if(!c)throw new Error('Unknown audit case: '+id);
 const choice=c.options.find(x=>x.id===choiceId);if(!choice)throw new Error('Unknown audit choice: '+choiceId);
 return Object.freeze({correct:choiceId===c.correctId,status:'ADVISORY_ONLY',explanation:c.explanation,evidence:c.evidence,limit:c.limit});
}
function summary(answers){
 if(!answers||Array.isArray(answers)||typeof answers!=='object')throw new Error('Invalid audit answers');
 let answered=0,correct=0;
 for(const [id,choice] of Object.entries(answers)){answered++;if(assess(id,choice).correct)correct++;}
 return {answered,correct,total:CASES.length,complete:answered===CASES.length};
}
function observationClaim({unsafeReleases,unsafeObservations,independent=false}){
 if(!Number.isInteger(unsafeObservations)||unsafeObservations<=0||!Number.isInteger(unsafeReleases)||unsafeReleases<0||unsafeReleases>unsafeObservations)throw new Error('Invalid observations');
 const p=unsafeReleases/unsafeObservations,z=1.96,z2=z*z,n=unsafeObservations;
 const upper=(p+z2/(2*n)+z*Math.sqrt((p*(1-p)+z2/(4*n))/n))/(1+z2/n);
 return {allowed:'FIXTURE_ONLY',observedRate:p,independenceAssured:independent===true,illustrativeUpperBound:independent===true?upper:null,productionGuarantee:false};
}
root.EvaluationAuditEngine=Object.freeze({CASES:Object.freeze(CASES),assess,summary,observationClaim});
})(typeof window!=='undefined'?window:globalThis);

/* v0.10: one-field evidence injection. Educational replay, no runtime permissions. */
(function(root){
'use strict';
const rows=[
 ['paired-leakage','Grouped split','groupDisjoint',true,false,'Train ve test aynı senaryoyu paylaşır; bağımsızlık kanıtı düşer.','Senaryo bazlı ayrım ve sıfır grup kesişimini gösteren yeniden hesaplanmış split manifesti.','group-split','Senaryo bazında yeniden ayır ve doğrula','shuffle','Satırları rastgele karıştır','weight','Örnek ağırlığını artır'],
 ['holdout-tuning','Untouched holdout','selectionIndependent',true,false,'Seçimde kullanılmış test artık bağımsız final holdout değildir.','Dondurulmuş policy, seçim geçmişi ve yeni untouched holdout değerlendirme makbuzu.','fresh-holdout','Yeni bağımsız holdout ile yeniden değerlendir','reuse','Aynı skorları dış iddiada kullan','reweight','Ağırlıkları değiştir'],
 ['disputed-labels','Label adjudication','adjudicationReceipt','adjudicated-v1',null,'Bağımsız label adjudication makbuzu kayıp; gold label kaynağı belirsiz.','Kör adjudication, kaynak makbuzu, sürümlü etiketler ve açık paydalar.','adjudicate','Bağımsız adjudication yap ve yeniden değerlendir','omit','Uyuşmazlıkları gizle','flip','İtirazları doğru kabul et'],
 ['zero-fn','Risk denominator','denominator',13,null,'FN=0 ifadesi artık doğrulanmış bir risk paydasına bağlı değil.','Kaynağa bağlı riskli örnek sayısı, bağımlılık bilgisi ve fixture manifesti.','restore-denominator','Otoritatif paydayı doğrula ve yeniden ölç','production','Sıfır üretim riski ilan et','independent','Eşleşmiş satırları bağımsız say'],
 ['synthetic-shift','Weight provenance','provenance','synthetic','observed','Sentetik ağırlık gözlemsel saha insidansı gibi yeniden etiketlendi.','Köken manifesti, varsayımsal ağırlık tanımı ve gerçek saha gözlemlerinden ayrım.','provenance','Kökeni düzelt ve yeniden değerlendir','incidence','Gerçek saha oranı olarak yayımla','sample','Ağırlıklı kütleyi yeni n say']
];
const CASES=Object.freeze(rows.map(r=>Object.freeze({
 id:r[0],title:r[1],evidenceKey:r[2],expected:r[3],corrupted:r[4],failure:r[5],requiredEvidence:r[6],
 correctId:r[7],
 options:Object.freeze([{id:r[7],label:r[8]},{id:r[9],label:r[10]},{id:r[11],label:r[12]}].map(o=>Object.freeze(o))),
 baselineEvidence:Object.freeze({fixture:'fixed-v0.9-synthetic', [r[2]]:r[3]})
})));
const map=new Map(CASES.map(c=>[c.id,c]));
function find(id){const c=map.get(id);if(!c)throw new Error('Unknown injection case: '+id);return c;}
function inspect(id,mode){
 const c=find(id);
 if(mode!=='baseline'&&mode!=='injected')throw new Error('Unknown injection mode: '+mode);
 const evidence=Object.freeze({...c.baselineEvidence,[c.evidenceKey]:mode==='baseline'?c.expected:c.corrupted});
 const passed=Object.is(evidence[c.evidenceKey],c.expected);
 return Object.freeze({id,mode,evidence,evidenceValid:passed,
  check:Object.freeze({name:c.evidenceKey,expected:c.expected,actual:evidence[c.evidenceKey],passed}),
  status:passed?'FIXTURE_ONLY':'CLAIM_BLOCKED',failure:c.failure,requiredEvidence:c.requiredEvidence,
  productionAuthorized:false,executionAuthorized:false});
}
function chooseRepair(id,actionId){
 const c=find(id),option=c.options.find(o=>o.id===actionId);
 if(!option)throw new Error('Unknown repair action: '+actionId);
 const appropriate=actionId===c.correctId;
 return Object.freeze({id,actionId,appropriate,status:appropriate?'REVERIFY_REQUIRED':'CLAIM_BLOCKED',
  message:appropriate?'Doğru kurtarma önerisi. Bağımsız kanıtı yeniden toplayıp kontrolleri tekrar çalıştır; otomatik PASS yok.':'Bu işlem eksik veya bozuk kanıtı onarmıyor. İddia engellenmeye devam eder.',
  requiredEvidence:c.requiredEvidence,productionAuthorized:false,executionAuthorized:false});
}
function summary(mode){
 if(mode!=='baseline'&&mode!=='injected')throw new Error('Unknown injection mode: '+mode);
 const results=CASES.map(c=>inspect(c.id,mode));
 return Object.freeze({total:results.length,blocked:results.filter(x=>x.status==='CLAIM_BLOCKED').length,fixtureOnly:results.filter(x=>x.status==='FIXTURE_ONLY').length});
}
root.EvidenceInjectionEngine=Object.freeze({CASES,inspect,chooseRepair,summary});
})(typeof window!=='undefined'?window:globalThis);


/* v0.11 - educational oracle mutation self-test. No real agent/tool authorization. */
(function(root){
'use strict';
const F=root.EvidenceInjectionEngine;
if(!F)throw new Error('EvidenceInjectionEngine must load before OracleReliabilityEngine');
const faults=Object.freeze({
 'paired-leakage':Object.freeze({fault:'The mutant checks a fixture name but ignores group disjointness, so leaked groups are accepted.',missingAssurance:'An independent oracle must inspect group membership and the train/test intersection.'}),
 'holdout-tuning':Object.freeze({fault:'The mutant expects the string "true" instead of the boolean true and incorrectly rejects healthy selection evidence.',missingAssurance:'Typed contract checks and a positive, healthy holdout reference example are required.'}),
 'disputed-labels':Object.freeze({fault:'The mutant checks only that some fixture exists and fails to examine the adjudication receipt, allowing a missing receipt.',missingAssurance:'A dedicated negative control must remove the gold-label adjudication receipt.'}),
 'zero-fn':Object.freeze({fault:'The mutant uses numeric coercion: null >= 0 evaluates true in JavaScript, falsely accepting a missing denominator.',missingAssurance:'A missing-value control and explicit positive-integer denominator validation are required.'}),
 'synthetic-shift':Object.freeze({fault:'The mutant rejects any synthetic provenance even when the claim is explicitly bounded to the synthetic fixture.',missingAssurance:'A healthy synthetic example is necessary to detect overly strict rejection, without claiming field validity.'})
});
const CASES=Object.freeze(F.CASES.map(c=>Object.freeze({id:c.id,title:c.title,fault:faults[c.id].fault,missingAssurance:faults[c.id].missingAssurance})));
const MANIFEST=Object.freeze({cases:'evaluation-claim-audit-five-v0.9',fixtures:'evidence-injection-v0.10-two-controls',oracle:'educational-mutations-v0.11',contract:'fixture-validity-only'});
function verifyManifest(candidate){
 const stale=Object.keys(MANIFEST).filter(key=>candidate?.[key]!==MANIFEST[key]);
 return {current:stale.length===0,stale};
}
function checkMode(mode){if(mode!=='reference'&&mode!=='mutant')throw new Error('Unknown oracle mode: '+mode);}
function oracleDecision(id,evidence,referenceExpected){
 if(id==='paired-leakage'||id==='disputed-labels')return evidence.fixture==='fixed-v0.9-synthetic';
 if(id==='holdout-tuning')return evidence.selectionIndependent==='true';
 if(id==='zero-fn')return evidence.denominator>=0;
 if(id==='synthetic-shift')return evidence.provenance==='field-observed';
 return Object.is(evidence[id],referenceExpected);
}
function evaluate(id,mode){
 const c=CASES.find(x=>x.id===id);
 if(!c)throw new Error('Unknown oracle case: '+id);
 checkMode(mode);
 const source=F.CASES.find(x=>x.id===id);
 const controls=Object.freeze(['baseline','injected'].map(fixtureMode=>{
  const fixture=F.inspect(id,fixtureMode);
  const expectedValid=fixtureMode==='baseline';
  const observedValid=mode==='reference'?Object.is(fixture.evidence[source.evidenceKey],source.expected):oracleDecision(id,fixture.evidence,source.expected);
  const classification=expectedValid?(observedValid?'TRUE_ACCEPT':'FALSE_REJECT'):(observedValid?'FALSE_ACCEPT':'TRUE_REJECT');
  return Object.freeze({mode:fixtureMode,expectedValid,observedValid,classification,matchesContract:expectedValid===observedValid});
 }));
 const falseAccepts=controls.filter(x=>x.classification==='FALSE_ACCEPT').length;
 const falseRejects=controls.filter(x=>x.classification==='FALSE_REJECT').length;
 const detected=falseAccepts+falseRejects>0;
 return Object.freeze({caseId:id,oracleId:mode,controls,falseAccepts,falseRejects,detected,
  status:detected?'ORACLE_FAULT_DETECTED':'FIXTURE_MATCH_ONLY',
  fault:c.fault,missingAssurance:c.missingAssurance,
  limitation:'The two controls are fixed synthetic fixtures, not independent field data or proof of oracle correctness.',
  productionAuthorized:false,executionAuthorized:false});
}
function summary(mode){
 checkMode(mode);
 const results=CASES.map(x=>evaluate(x.id,mode));
 return Object.freeze({
  cases:results.length,controls:results.reduce((n,r)=>n+r.controls.length,0),
  detected:results.filter(x=>x.detected).length,
  falseAccepts:results.reduce((n,r)=>n+r.falseAccepts,0),
  falseRejects:results.reduce((n,r)=>n+r.falseRejects,0)
 });
}
root.OracleReliabilityEngine=Object.freeze({CASES,MANIFEST,verifyManifest,evaluate,summary});
})(typeof window!=='undefined'?window:globalThis);


/* v0.12: fixed synthetic witness for common-mode oracle blind spots.
 * This is separately curated educational data, NOT an independent production source.
 */
(function(root){
'use strict';
const F=root.EvidenceInjectionEngine;
if(!F)throw new Error('EvidenceInjectionEngine must load before IndependentOracleEngine');
const CASE_ID='zero-fn', EXPECTED_REVISION='r42';
const MODES=Object.freeze([
 Object.freeze({id:'healthy',title:'Sağlam kayıt',description:'13 benzersiz risk kimliği ve güncel r42 revizyonu'}),
 Object.freeze({id:'duplicate-id',title:'Yinelenen kimlik',description:'13 kayıt satırı fakat yalnız 12 benzersiz kimlik'}),
 Object.freeze({id:'stale-revision',title:'Eski revizyon',description:'13 benzersiz kimlik ama r41 kaynak revizyonu'})
]);
/* The registry is deliberately written separately from the claimed denominator.
 * Do not derive witness IDs or labels from the field being checked.
 */
const REGISTRY=Object.freeze({
 healthy:Object.freeze({source:'synthetic-risk-registry-v1',revision:'r42',ids:Object.freeze(['risk-01','risk-02','risk-03','risk-04','risk-05','risk-06','risk-07','risk-08','risk-09','risk-10','risk-11','risk-12','risk-13'])}),
 'duplicate-id':Object.freeze({source:'synthetic-risk-registry-v1',revision:'r42',ids:Object.freeze(['risk-01','risk-02','risk-03','risk-04','risk-05','risk-06','risk-07','risk-08','risk-09','risk-10','risk-11','risk-12','risk-12'])}),
 'stale-revision':Object.freeze({source:'synthetic-risk-registry-v1',revision:'r41',ids:Object.freeze(['risk-01','risk-02','risk-03','risk-04','risk-05','risk-06','risk-07','risk-08','risk-09','risk-10','risk-11','risk-12','risk-13'])})
});
const MANIFEST=Object.freeze({fixture:'zero-fn-v0.10-synthetic',registry:'synthetic-risk-registry-v1',revision:EXPECTED_REVISION,contract:'identity-cardinality-revision-v0.12'});
function verifyManifest(candidate){
 const stale=Object.keys(MANIFEST).filter(key=>candidate?.[key]!==MANIFEST[key]);
 return {current:stale.length===0,stale};
}
function evaluate(mode){
 if(!MODES.some(x=>x.id===mode))throw new Error('Unknown witness mode: '+mode);
 const claim=F.inspect(CASE_ID,'baseline').evidence;
 const claimedDenominator=claim.denominator;
 /* Two different predicates share the same assumption: the claimed count is enough.
  * Agreement is not an independent evidence check.
  */
 const naiveChecks=Object.freeze([
  Object.freeze({name:'expected-count',passed:claimedDenominator===13}),
  Object.freeze({name:'positive-count-and-fixture',passed:Number.isInteger(claimedDenominator)&&claimedDenominator>0&&claim.fixture==='fixed-v0.9-synthetic'})
 ]);
 const source=REGISTRY[mode],totalRecords=source.ids.length,uniqueRecords=new Set(source.ids).size;
 const uniqueIds=totalRecords===uniqueRecords;
 const countMatches=uniqueRecords===claimedDenominator;
 const revisionFresh=source.revision===EXPECTED_REVISION;
 const provenanceMatches=source.source===MANIFEST.registry;
 const valid=uniqueIds&&countMatches&&revisionFresh&&provenanceMatches;
 const bothAccept=naiveChecks.every(x=>x.passed);
 const commonModeDetected=bothAccept&&!valid;
 return Object.freeze({
  mode,claimedDenominator,naiveChecks,bothAccept,
  witness:Object.freeze({source:source.source,revision:source.revision,expectedRevision:EXPECTED_REVISION,totalRecords,uniqueRecords,uniqueIds,countMatches,revisionFresh,provenanceMatches,valid}),
  status:valid?'FIXTURE_ONLY':'CLAIM_BLOCKED',
  commonModeDetected,requiredEvidence:'Otoritatif ve sürüme bağlı kaynak kayıtları, benzersiz risk kimlikleri, doğrulanmış payda ve yeni değerlendirme makbuzu.',
  limitation:'The registry and claim are separately authored synthetic teaching fixtures in the same codebase; no independent production evidence, trusted external witness or statistical assurance is provided.',
  executionAuthorized:false,productionAuthorized:false,doneAuthorized:false
 });
}
root.IndependentOracleEngine=Object.freeze({CASE_ID,MODES,MANIFEST,verifyManifest,evaluate});
})(typeof window!=='undefined'?window:globalThis);


/* v0.13: synthetic oracle disagreement and evidence adjudication (advisory only).
 * Never assume these locally curated fixtures are independent production sources.
 */
(function(root){
'use strict';
const I=root.IndependentOracleEngine;
if(!I)throw new Error('IndependentOracleEngine must load before OracleAdjudicationEngine');
const CASE_ID=I.CASE_ID;
const MODES=I.MODES;
const MANIFEST=Object.freeze({
 case:'zero-fn-claim-v0.10',
 witness:'synthetic-risk-registry-v1-r42',
 policy:'hold-on-disagreement-v0.13',
 proof:'adjudication-not-executed'
});
const DECISIONS=Object.freeze({
 healthy:Object.freeze([
  Object.freeze({id:'record-fixture',label:'Yalnız fixture sonucunu kaydet'}),
  Object.freeze({id:'publish-guarantee',label:'Üretim güvencesi yayımla'}),
  Object.freeze({id:'skip-controls',label:'Kontrolleri atla'})
 ]),
 'duplicate-id':Object.freeze([
  Object.freeze({id:'request-adjudication',label:'Kaynak ve kimlik incelemesi iste'}),
  Object.freeze({id:'trust-claim',label:'Bildirilen 13 sayısını doğru kabul et'}),
  Object.freeze({id:'trust-witness',label:'12 sayısını kanıtsız doğru ilan et'})
 ]),
 'stale-revision':Object.freeze([
  Object.freeze({id:'refresh-source',label:'Güncel kaynağı yeniden doğrula'}),
  Object.freeze({id:'use-r41',label:'Eski r41 kaydını kabul et'}),
  Object.freeze({id:'assume-count',label:'Sayılar aynıysa devam et'})
 ])
});
const PREFERRED=Object.freeze({
 healthy:'record-fixture',
 'duplicate-id':'request-adjudication',
 'stale-revision':'refresh-source'
});
function assertMode(mode){
 if(!MODES.some(m=>m.id===mode))throw new Error('Unknown disagreement mode: '+mode);
}
function verifyManifest(candidate){
 const stale=Object.keys(MANIFEST).filter(k=>candidate?.[k]!==MANIFEST[k]);
 return {current:stale.length===0,stale};
}
function review(mode){
 assertMode(mode);
 const evidence=I.evaluate(mode), w=evidence.witness;
 const countAgreement=evidence.claimedDenominator===w.uniqueRecords;
 const revisionComparable=w.revisionFresh&&w.provenanceMatches;
 const status=!revisionComparable?'STALE_SOURCE_HOLD':!countAgreement||!w.uniqueIds?'DISPUTED_HOLD':'FIXTURE_ONLY';
 return Object.freeze({
  mode,caseId:CASE_ID,
  claim:Object.freeze({denominator:evidence.claimedDenominator,revision:w.expectedRevision,source:'zero-fn-synthetic-claim'}),
  witness:Object.freeze({uniqueRecords:w.uniqueRecords,totalRecords:w.totalRecords,revision:w.revision,source:w.source}),
  countAgreement,revisionComparable,status,
  requiredEvidence:'Independently review provenance, unique risk IDs, ownership, revision-bound source receipts, and adjudication before any external claim.',
  limitation:'Both sources here are authored synthetic educational fixtures in the same repo; no real independent adjudicator, source authentication or production evidence.',
  productionAuthorized:false,executionAuthorized:false,doneAuthorized:false
 });
}
function options(mode){assertMode(mode);return DECISIONS[mode];}
function choose(mode,actionId){
 assertMode(mode);
 const option=DECISIONS[mode].find(x=>x.id===actionId);
 if(!option)throw new Error('Unknown adjudication action: '+actionId);
 const appropriate=actionId===PREFERRED[mode];
 const status=!appropriate?'CLAIM_BLOCKED':mode==='duplicate-id'?'ADJUDICATION_REQUIRED':mode==='stale-revision'?'REVERIFY_REQUIRED':'FIXTURE_ONLY';
 const outcome=review(mode);
 return Object.freeze({
  mode,actionId,appropriate,status,proofComplete:false,evidenceCollected:false,revisionValidated:false,resolved:false,
  explanation:!appropriate?'This shortcut bypasses the conflicting source, version or evidence authority and cannot establish truth.':
    mode==='duplicate-id'?'A disagreement review is requested, but no source adjudication or corrected evidence has been received.':
    mode==='stale-revision'?'A fresh source and revision-bound receipts must still be collected and independently verified.':
    'Only the bounded synthetic fixture observation may be recorded. No external assurance follows.',
  requiredEvidence:outcome.requiredEvidence,
  productionAuthorized:false,executionAuthorized:false,doneAuthorized:false
 });
}
root.OracleAdjudicationEngine=Object.freeze({CASE_ID,MODES,MANIFEST,verifyManifest,review,options,choose});
})(typeof window!=='undefined'?window:globalThis);
