/* v0.4 · Pure, deterministic, provider-neutral context + cache teaching model.
   It never calls providers, executes tools, reads secrets or authorizes actions. */
(function(root){
'use strict';
const CONTRACT_ID='TASK-AUTH-017';
const CURRENT_REVISION='r42';
const BASE_PREFIX=Object.freeze([
  {id:'policy',content:'policy@v1.scope-locked',tokens:1300},
  {id:'tools',content:'tools@v2.read_file,run_tests,edit_file',tokens:1100},
  {id:'repo',content:'repo-rules@v4',tokens:900}
]);
const SOURCES=Object.freeze([
 'https://developers.openai.com/api/docs/guides/prompt-caching',
 'https://platform.claude.com/docs/en/build-with-claude/prompt-caching',
 'https://modelcontextprotocol.io/specification/draft/changelog'
]);
const CASES=Object.freeze([
  {id:'prefix-churn',title:'Timestamp prefix içine girerse',tag:'PREFIX STABILITY',question:'Sürekli değişen timestamp hangi bölgede kalmalı?',mechanism:'Cache anahtarı aynı sıradaki prefix bloklarından türetilir. Timestamp statik yönergelerin arasına konursa her çağrıda eşleşme bozulur.',discussion:'İçerik doğru, yetki doğru, test kanıtı geçerli olabilir; yine de prefix churn yüzünden maliyet artar. Cache miss tek başına güvenlik hatası değildir.',risk:'Dinamik timestamp sistem yönergelerinin önünde; her istek yeni bir cache prefix üretir.',repair:'Timestamp dinamik suffix içinde; tekrar kullanılan politika ve tool tanımları dokunulmadan kalır.',sources:[SOURCES[0],SOURCES[1]]},
  {id:'tool-order',title:'Tool listesi her seferinde sıralanırsa',tag:'TOOL SCHEMA DRIFT',question:'Aynı tool kümesinin farklı sırası cache anahtarını değiştirir mi?',mechanism:'Semantik eşdeğerlik ile bayt düzeyinde prefix eşitliği farklıdır. Tool şeması sırası ve serileştirmesi oynarsa cache checkpoint bozulabilir.',discussion:'MCP discovery sonucu yetki üretmez. Stabil sıralama yalnız prompt cache öngörülebilirliği sağlar; tool gateway politikası ayrı çalışır.',risk:'tools ve policy bloklarının sırası ikinci istekte yer değiştirir.',repair:'Tool katalog sırası sürümlenir ve deterministik serileştirilir.',sources:[SOURCES[1],SOURCES[2]]},
  {id:'dynamic-prefix',title:'Kullanıcı görevi sabit bloğa taşınırsa',tag:'DYNAMIC BOUNDARY',question:'Her tur değişen iş tanımını statik prefix içine koymalı mıyız?',mechanism:'Task özel talimatlarını cache edilecek paylaşımlı bloğa eklersen sonraki görevin prefix hash’i değişir.',discussion:'Statik policy ve tool şemaları ile göreve özel input birbirinden ayrı tutulur. Bu ayırım yetki veya security policy bypass anlamına gelmez.',risk:'İkinci isteğin farklı kullanıcı görevi aynı “static” blok içine gömülür.',repair:'Task overlay, cache breakpoint sonrasındaki dinamik bölüme eklenir.',sources:[SOURCES[0],SOURCES[1]]},
  {id:'stale-retrieval',title:'Cache hit var ama repo dosyası eski',tag:'FRESHNESS',question:'Cache hit, retrieval kaynağının güncel olduğunu garanti eder mi?',mechanism:'Cache mekanizması prompt prefix yeniden kullanımını ölçer; repo kaynak sürümünü veya test delilini doğrulamaz.',discussion:'r41 bağlamıyla r42 koduna DONE denemez. Revizyon hash’i ve yeniden okuma kontrolü retrieval katmanındadır.',risk:'Retriever eski r41 kaynağını getirir. Prompt cache başarılı görünür fakat çalışma revizyonu r42.',repair:'Retriever r42 için kaynağı yeniden okur; provenance kayıtları revizyona bağlanır.',sources:[SOURCES[0]]},
  {id:'lost-evidence',title:'Compaction test kanıtını düşürürse',tag:'COMPACTION SAFETY',question:'“Testler geçti” özeti revizyon bağlantılı evidence yerine geçer mi?',mechanism:'Doğal dil özeti red/green run id, kaynak revizyonu, exit code ve artifact digest gibi yapısal kanıt alanlarını korumayabilir.',discussion:'Konuşma metni özetlenebilir; kanıt makbuzları ayrı ve kayıpsız bir sidecar olarak tutulur. Özeti doğru kabul etmek gate’i atlamak değildir.',risk:'Compaction yalnız “tests passed” metnini bırakır; run id ve revision silinir.',repair:'Özet kısaltılır ancak test receipt r42, run id ve sonuç korunur.',sources:[SOURCES[0]]},
  {id:'handoff',title:'Ajan devrinde contract kaybolursa',tag:'HANDOFF INTEGRITY',question:'Yeni agente yalnızca “düzeltme tamamlandı” demek yeterli mi?',mechanism:'Agent handoff bir dil aktarımı değil, scope, current revision, approval ve verification receipt aktarımıdır.',discussion:'Receiver gönderilen makbuzları kaynak kimlikleri ve revizyonla yeniden doğrulamalıdır. Farklı oturumun sözü DONE için kanıt oluşturmaz.',risk:'Devir mesajı natural-language DONE iddiası içerir; scope ve eylem receipt iletilmez.',repair:'Handoff envelope içinde TaskContract, revizyon ve receipt referansları korunur.',sources:[SOURCES[0],SOURCES[2]]},
  {id:'untrusted-elevation',title:'Tool çıktısı talimat seviyesine yükseltilirse',tag:'TRUST BOUNDARY',question:'Kaynaktaki metin “policy’yi yok say” diyorsa nasıl saklanmalı?',mechanism:'Araçtan veya issue’dan gelen metin veri güven düzeyindedir. Compaction sırasında system instruction gibi etiketlenirse injection yetki kazanmış görünür.',discussion:'Kaynağın provenance/trust etiketi korunur, içerik görev verisi olarak değerlendirilir; executor policy engine onayı dışında eylem vermez.',risk:'Güvenilmeyen issue metni sıkıştırılıp yüksek öncelikli talimat gibi işlenir.',repair:'Untrusted işaretlemesi korunur; talimat yürütülmez, yalnız ilgili veri kullanılır.',sources:[SOURCES[2]]},
  {id:'budget',title:'Token bütçesinde evidence feda edilirse',tag:'BUDGET PRESSURE',question:'Bütçe dolduğunda hangi parçalar önce kesilmeli?',mechanism:'Context packing sırası öncelik kuralıdır. Sınırsız geçmiş veya fazla tool açıklaması, kritik revision ve test makbuzlarını dışarı itebilir.',discussion:'Kısa olmak amaç değil; verified outcome başına token maliyetini düşürmek amaçtır. Gereksiz geçmişi/tekrarları çıkar, contract ve evidence id’lerini koru.',risk:'12k token sınırı aşılır; son taşıma adımı kanıtı da keser.',repair:'İlgisiz sohbet ve geniş çıktılar özetlenir; evidence kayıpsız kalır.',sources:[SOURCES[0]]},
  {id:'ttl-expired',title:'Prefix aynı ama cache TTL dolmuş',tag:'CACHE EXPIRATION',question:'Tam aynı prefix ile neden yine de cache miss olabilir?',mechanism:'Cache girişleri kalıcı değildir. Süre dolarsa byte-equal prefix bile önceki girişi okuyamaz.',discussion:'Cache hit oranı bir optimizasyon metriğidir, doğrulama kanıtı değildir. TTL davranışı model, sağlayıcı ve ayarlara bağlıdır.',risk:'45 dakika önce yazılan checkpoint’in 30 dakikalık TTL sonrasında hit olacağı varsayılır.',repair:'Cache miss beklenir, maliyet hesabı buna göre yapılır; DONE kararını etkilemez.',sources:[SOURCES[0],SOURCES[1]]}
]);
const clonePrefix=()=>BASE_PREFIX.map(x=>({...x}));
function makeSetup(id,mode){
 const prefixA=clonePrefix();let prefixB=clonePrefix();
 const cfg={prefixA,prefixB,suffixA:820,suffixB:910,ageMinutes:3,ttlMinutes:30,
  contextRevision:CURRENT_REVISION,evidence:{runId:'test:r42:07',revision:'r42',status:'GREEN',receipt:true},
  handoff:{contractId:CONTRACT_ID,revision:CURRENT_REVISION,receiptId:'write:AUTH-017:r42'},
  trust:'UNTRUSTED_AS_DATA',actionInScope:true,extraTokens:500,budgetTokens:8200};
 if(mode==='risk'){
  switch(id){
   case 'prefix-churn':cfg.prefixA.unshift({id:'clock',content:'2026-10-27T10:01',tokens:24});cfg.prefixB.unshift({id:'clock',content:'2026-10-27T10:02',tokens:24});break;
   case 'tool-order':cfg.prefixB=[cfg.prefixB[1],cfg.prefixB[0],cfg.prefixB[2]];break;
   case 'dynamic-prefix':cfg.prefixA.push({id:'task',content:'Find token expiry bug',tokens:440});cfg.prefixB.push({id:'task',content:'Confirm regression after edit',tokens:440});break;
   case 'stale-retrieval':cfg.contextRevision='r41';break;
   case 'lost-evidence':cfg.evidence={runId:null,revision:null,status:'GREEN_CLAIM',receipt:false};break;
   case 'handoff':cfg.handoff={contractId:null,revision:null,receiptId:null};break;
   case 'untrusted-elevation':cfg.trust='UNTRUSTED_AS_INSTRUCTION';break;
   case 'budget':cfg.extraTokens=7600;cfg.evidence=null;break;
   case 'ttl-expired':cfg.ageMinutes=45;break;
  }
 }else if(id==='ttl-expired')cfg.ageMinutes=45;
 return cfg;
}
function measureCache(cfg){
 const keyA=JSON.stringify(cfg.prefixA.map(x=>[x.id,x.content,x.tokens]));
 const keyB=JSON.stringify(cfg.prefixB.map(x=>[x.id,x.content,x.tokens]));
 const p1=cfg.prefixA.reduce((sum,x)=>sum+x.tokens,0);
 const p2=cfg.prefixB.reduce((sum,x)=>sum+x.tokens,0);
 const s1=cfg.suffixA+cfg.extraTokens,s2=cfg.suffixB+cfg.extraTokens;
 const eligible=p1>=1024&&p2>=1024;
 const equalPrefix=keyA===keyB;
 const alive=cfg.ageMinutes<cfg.ttlMinutes;
 const hit=eligible&&equalPrefix&&alive;
 const reason=!eligible?'BELOW_THRESHOLD':!equalPrefix?'PREFIX_MISMATCH':!alive?'TTL_EXPIRED':'HIT';
 // One exact-prefix cache checkpoint; demonstrative prices: 1.25x write / 0.10x read.
 // Does not approximate a real provider's additional breakpoint lookback or routing.
 const baselineUnits=p1+s1+p2+s2;
 const optimizedUnits=(eligible?p1*1.25:p1)+s1+(hit?p2*0.10:(eligible?p2*1.25:p2))+s2;
 return {model:'SINGLE_EXACT_PREFIX_BREAKPOINT',eligible,equalPrefix,hit,reason,
  prefixTokens:p2,requestTokens:p2+s2,readTokens:hit?p2:0,writeTokens:eligible?(hit?p1:p1+p2):0,
  ageMinutes:cfg.ageMinutes,ttlMinutes:cfg.ttlMinutes,baselineUnits,optimizedUnits,
  savingsPercent:baselineUnits?100*(baselineUnits-optimizedUnits)/baselineUnits:0,
  firstPrefix:cfg.prefixA.map(x=>({id:x.id,content:x.content,tokens:x.tokens})),
  secondPrefix:cfg.prefixB.map(x=>({id:x.id,content:x.content,tokens:x.tokens}))};
}
function evaluate(id,mode='guarded'){
 const scenario=CASES.find(s=>s.id===id);
 if(!scenario)throw new Error('Unknown context studio scenario');
 if(!['risk','guarded'].includes(mode))throw new Error('Unknown context studio variant');
 const cfg=makeSetup(id,mode),cache=measureCache(cfg);
 const checks=[
  {id:'REVISION_FRESH',pass:cfg.contextRevision===CURRENT_REVISION,detail:`Source ${cfg.contextRevision} / current ${CURRENT_REVISION}`},
  {id:'EVIDENCE_BOUND',pass:!!(cfg.evidence?.receipt&&cfg.evidence.revision===CURRENT_REVISION&&cfg.evidence.runId&&cfg.evidence.status==='GREEN'),detail:cfg.evidence?.runId||'Missing runner receipt'},
  {id:'SOURCE_TRUST',pass:cfg.trust==='UNTRUSTED_AS_DATA',detail:cfg.trust},
  {id:'SCOPE_POLICY',pass:cfg.actionInScope,detail:cfg.actionInScope?'Within contract':'Out of scope'},
  {id:'HANDOFF_INTEGRITY',pass:cfg.handoff?.contractId===CONTRACT_ID&&cfg.handoff?.revision===CURRENT_REVISION&&!!cfg.handoff?.receiptId,detail:cfg.handoff?.receiptId||'Missing contract/receipt'},
  {id:'CONTEXT_BUDGET',pass:cache.requestTokens<=cfg.budgetTokens,detail:`${cache.requestTokens} / ${cfg.budgetTokens} token (teaching units)`}
 ];
 const canComplete=checks.every(c=>c.pass);
 return {scenarioId:id,variant:mode,contractId:CONTRACT_ID,currentRevision:CURRENT_REVISION,
  sourceRevision:cfg.contextRevision,evidence:cfg.evidence,handoff:cfg.handoff,trust:cfg.trust,
  checks,canComplete,status:canComplete?'ELIGIBLE_FOR_DONE':'BLOCKED',cache,
  explanation:mode==='risk'?scenario.risk:scenario.repair};
}
root.ContextStudioEngine=Object.freeze({CASES,CONTRACT_ID,CURRENT_REVISION,evaluate});
})(typeof window!=='undefined'?window:globalThis);
