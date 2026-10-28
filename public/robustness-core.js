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
