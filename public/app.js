(function () {
'use strict';
const D = window.AGENT_CURRICULUM;
const E = window.LabEngine;
const W = window.WorkshopEngine;
const C = window.ContextStudioEngine;
const H = window.CompactionEngine;
const R = window.ReliabilityEngine;
const Q = window.RobustnessEngine;
const A = window.EvaluationAuditEngine;
const F = window.EvidenceInjectionEngine;
const O = window.OracleReliabilityEngine;
const I = window.IndependentOracleEngine;
const J = window.OracleAdjudicationEngine;
const page = document.querySelector('#page');
if (!D || !E || !W || !C || !H || !R || !Q || !A || !F || !O || !I || !J || !page) return;
const courses = D.modules.flatMap(m => m.lessons.map(l => ({...l,module:m})));
const STORAGE = 'agent-academy-progress-v1';
function loadProgress(){try{const s=JSON.parse(localStorage.getItem(STORAGE)||'{}');return {completed:Array.isArray(s.completed)?s.completed:[],passed:Array.isArray(s.passed)?s.passed:[]};}catch{return {completed:[],passed:[]};}}
const progress = loadProgress();
function saveProgress(){try{localStorage.setItem(STORAGE,JSON.stringify(progress));}catch{notify('Bu tarayıcıda ilerleme saklanamadı.');}}
const esc=s=>String(s ?? '').replace(/[&<>"']/g, c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const slug=s=>String(s).toLocaleLowerCase('tr-TR');
const f=n=>Math.round(n).toLocaleString('tr-TR');
const downloadUrl=name=>(document.querySelector('meta[name="academy-download-base"]')?.getAttribute('content')||'./public/downloads/')+name;
const pct=n=>Math.min(100,Math.max(0,n));
let currentRoute='home';let timer;
let workshop = W.begin('baseline');
let contextCase = 'prefix-churn';
let contextMode = 'risk';
let compactionCase = 'summary-evidence';
let compactionAction = null;
let evalPolicy='gated';
let evalScenario='summary-evidence';
let evalFalseAllow=50;
let evalFalseHold=8;
let robustProfile='balanced';
let robustLabels='reviewed';
let robustFold='revision';
let robustPolicy='gated';
let auditIndex=0;
const auditAnswers={};
let injectionIndex=0;
let injectionMode='baseline';
let injectionChoice=null;
let oracleMode='reference';
let oracleOpen=false;
let witnessMode='healthy';
let witnessOpen=false;
let adjudicationOpen=false;
let adjudicationAction=null;
const evalFoldOpen={distribution:true,labels:false,holdout:false,freshness:false,claims:false,injection:false};
function repaintEvaluation(selector,announcement){
 page.innerHTML=renderEvaluationRobustness();
 const live=document.querySelector('#academy-live');
 if(live&&announcement)live.textContent=announcement;
 if(selector)page.querySelector?.(selector)?.focus?.({preventScroll:true});
}
function notify(msg){const t=document.querySelector('#toast');t.textContent=msg;t.classList.add('show');clearTimeout(timer);timer=setTimeout(()=>t.classList.remove('show'),3200);}
function done(m){return m.lessons.filter(l=>progress.completed.includes(l.id)).length;}
function status(){const n=progress.completed.length;const total=courses.length;document.querySelector('#sidebar-done').textContent=`${n} / ${total}`;document.querySelector('#sidebar-bar').style.width=`${n/total*100}%`;document.querySelector('#course-count').textContent=D.modules.length;}
function navLink(text,href,extra=''){return `<a class="text-link ${extra}" href="${href}">${esc(text)} <span>↗</span></a>`;}
function crumb(text){document.querySelector('#crumb-current').textContent=text;}
function areaLabel(text){return `<div class="section-label"><span class="label-square"></span>${esc(text)}</div>`;}
function secHead(kicker,title,description){return `<div class="section-heading">${areaLabel(kicker)}<h1>${esc(title)}</h1><p>${esc(description)}</p></div>`;}
function moduleRow(m,index,currentId){
 const completed=done(m),total=m.lessons.length,current=m.id===currentId;
 return `<li class="curriculum-item"><a class="curriculum-row ${current?'is-next':''}" href="#module/${m.id}"${current?' aria-current="step"':''}>
 <span class="curriculum-index">${String(index+1).padStart(2,'0')}</span>
 <span class="curriculum-title"><strong>${esc(m.title)}</strong>${current?'<small>Sıradaki modül</small>':''}</span>
 <span class="curriculum-progress">${completed} / ${total} ders${completed===total?' tamamlandı':''}</span>
 </a></li>`;
}
function sourceLinks(ids){
  return (ids || []).map(id=>D.sources.find(s=>s.id===id)).filter(Boolean)
    .map(s=>`<a href="${esc(s.url)}" target="_blank" rel="noopener noreferrer">${esc(s.publisher)} · ${esc(s.title)} ↗</a>`).join('');
}
function caseStudyMarkup(m){
 const c=m.caseStudy;
 return `<section class="case-study" aria-label="${esc(m.title)} tasarım incelemesi">
 <div class="case-kicker">ENGINEERING DESIGN REVIEW · MODULE ${esc(m.id)}</div>
 <h2>Gerçekçi mimari karar</h2>
 <p class="case-scenario">${esc(c.scenario)}</p><div class="case-constraints"><b>Görev sınırı</b><p>${esc(c.constraints)}</p></div>
 <h3>Hangi yaklaşımı savunursun?</h3><div class="case-alternatives">${c.alternatives.map((a,i)=>`<button class="case-choice" type="button" data-review="${esc(m.id)}" data-choice="${i}" aria-label="Seçenek ${i+1}: ${esc(a.label)}"><span>${String(i+1).padStart(2,'0')}</span>${esc(a.label)}</button>`).join('')}</div>
 <div id="review-result-${esc(m.id)}" class="case-result" role="status" aria-live="polite">Kararını seç. Ardından gerekçe ve kabul kanıtları açılacak.</div>
 <div class="case-sources"><small>DAYANAKLAR</small>${sourceLinks(c.sourceIds)}</div>
 </section>`;
}
function deepDiveMarkup(l){
 const d=l.deepDive;
 return `<section id="deep-dive" class="lesson-block deep-dive"><div class="deep-header"><span>ENGINEERING FIELD NOTES</span><h2><span>06</span> Derin teknik analiz</h2><p>Prensibi mekanizma, başarısızlık, maliyet ve doğrulama boyutlarında değerlendir.</p></div>
 <div class="deep-grid"><div class="deep-panel"><span class="deep-index">A · MECHANISM</span><h3>Nasıl işler?</h3><p>${esc(d.mechanism)}</p></div>
 <div class="deep-panel risk"><span class="deep-index">B · FAILURE MODE</span><h3>Nasıl bozulur?</h3><p>${esc(d.failureMode)}</p></div>
 <div class="deep-panel"><span class="deep-index">C · TRADE-OFF</span><h3>Bedeli nedir?</h3><p>${esc(d.tradeoff)}</p></div>
 <div class="deep-panel evidence-panel"><span class="deep-index">D · VERIFICATION</span><h3>Nasıl kanıtlarsın?</h3><p>${esc(d.verification)}</p></div></div>
 <div class="deep-sources"><strong>İlgili resmî kaynaklar</strong>${sourceLinks(d.sourceIds)}</div>
 </section>`;
}
function nextLesson(){return courses.find(l=>!progress.completed.includes(l.id))||null;}
function renderHome(){
 crumb('Overview');
 const count=progress.completed.length, next=nextLesson();
 return `<div class="home-view"><section class="hero"><div class="hero-content">
 <div class="hero-tag">ÖĞRENME YOLU · 14 MODÜL</div>
 <h1>Bir konuya odaklan.<br><em>Adım adım ilerle.</em></h1>
 <p>Güvenilir coding agent sistemlerini temel kavramlardan başlayarak öğren. Her adımda tek ders, tek hedef.</p>
 <p class="home-next-label">${next?'SIRADAKİ DERS':'ÖĞRENME YOLU TAMAMLANDI'}</p>
 <p class="home-next-title">${next?esc(next.title):'Tüm dersleri tamamladın.'}</p>
 <div class="hero-actions">${next?`<a class="btn btn-primary" href="#lesson/${next.id}">${count?'Kaldığın yerden devam et':'İlk derse başla'} <span>→</span></a><a class="btn btn-secondary" href="#curriculum">Tüm dersler</a>`:'<a class="btn btn-primary" href="#curriculum">Müfredatı gözden geçir <span>→</span></a>'}</div>
 <p class="hero-foot">${count} / ${courses.length} ders tamamlandı. İlerleme bu tarayıcıda saklanır.</p>
 </div></section></div>`;
}
function renderCurriculum(){
 crumb('Learning path');
 const nextUnfinished=courses.find(l=>!progress.completed.includes(l.id));
 const currentId=nextUnfinished?.module.id??null;
 return `<div class="page-inner quiet-curriculum">${secHead('ÖĞRENME YOLU','Müfredat','14 modül, 42 ders. Bir modül seçerek sırayla ilerle.')}<ol class="curriculum-list" aria-label="Müfredat modülleri">${D.modules.map((m,i)=>moduleRow(m,i,currentId)).join('')}</ol></div>`;
}
function renderModule(id){const idx=D.modules.findIndex(m=>m.id===id);if(idx<0)return render404();const m=D.modules[idx];crumb('Module '+m.id);return `<div class="page-inner"><a class="back-link" href="#curriculum">← Tüm modüller</a><div class="module-banner"><span class="micro-tag">${esc(m.kicker)}</span><h1>${esc(m.title)}</h1><p>${esc(m.description)}</p><div class="module-meta"><span>${m.lessons.length} ders</span><span>·</span><span>${m.lessons.reduce((s,l)=>s+l.readingMinutes,0)} dakika</span><span>·</span><span>${done(m)} tamamlandı</span></div><div class="progress-track"><div class="progress-fill" style="width:${done(m)/m.lessons.length*100}%"></div></div></div><div class="section-title-row">${areaLabel('MODULE LESSONS')}<span class="tiny-muted">SIRALI ÖĞRENME</span></div><div class="lesson-list">${m.lessons.map((l,i)=>`<a class="lesson-row" href="#lesson/${l.id}"><span class="lesson-row-num">${String(i+1).padStart(2,'0')}</span><span class="lesson-row-main"><strong>${esc(l.title)}</strong><small>${esc(l.summary)}</small></span><span class="lesson-row-time">${l.readingMinutes} DK</span><span class="lesson-state ${progress.completed.includes(l.id)?'passed':''}">${progress.completed.includes(l.id)?'✓':'↗'}</span></a>`).join('')}</div>${caseStudyMarkup(m)}${m.id==='14'?`<div class="worksheet-link"><strong>Bitirme çalışması: Harness Design Worksheet</strong><p>Görev sözleşmesi, policy matrix, 8 eval vakası ve revizyon bazlı kanıt planı.</p><a href="${downloadUrl('harness-design-worksheet.md')}" download>İngilizce çalışma şablonunu indir ↗</a><p><a href="#workshop">Önce yedi aşamalı Task Lifecycle Workshop senaryosunu çöz ↗</a></p></div>`:''}<div class="module-next">${idx<D.modules.length-1?`<span>SONRAKİ MODÜL</span><a href="#module/${D.modules[idx+1].id}">${esc(D.modules[idx+1].title)} →</a>`:`<span>ÖĞRENME YOLUNUN SONU</span><a href="#workshop">Uçtan uca yürütme vakasına geç →</a>`}</div></div>`;}
function renderLesson(id){const l=courses.find(x=>x.id===id);if(!l)return render404();const idx=courses.indexOf(l);const passed=progress.passed.includes(l.id),completed=progress.completed.includes(l.id);crumb(`Lesson ${l.id}`);return `<div class="page-inner lesson-view"><a class="back-link" href="#module/${l.module.id}">← ${esc(l.module.title)}</a><div class="lesson-layout"><article class="lesson-article"><div class="lesson-overline"><span>LESSON ${l.id}</span><span>${l.readingMinutes} MIN READ</span></div><h1>${esc(l.title)}</h1><p class="lesson-lead">${esc(l.summary)}</p><section id="intro" class="lesson-block"><h2><span>01</span> Basit açıklama</h2><p>${esc(l.concept)}</p></section><section id="engineering" class="lesson-block"><h2><span>02</span> Mühendislik perspektifi</h2><p>${esc(l.engineering)}</p><div class="insight"><span>!</span> Prensip: Konuyu model bağımsız bir sözleşmeyle düşün; sağlayıcı özelliklerini adaptör düzeyinde ele al.</div></section><section id="example" class="lesson-block"><h2><span>03</span> Somut örnek</h2><div class="snippet-head"><span>DESIGN SKETCH</span><button class="copy-btn" data-copy="${esc(l.example)}">Kopyala ↗</button></div><pre class="code-example"><code>${esc(l.example)}</code></pre></section><section id="assignment" class="lesson-block"><h2><span>04</span> Pratik görev</h2><div class="assignment-box"><div class="assignment-top"><span class="assignment-icon">◇</span><strong>WORKSHOP EXERCISE</strong></div><p>${esc(l.assignment)}</p><small>Bu görevi kendi notlarınla çöz. Cevaplar burada otomatik AI değerlendirmesinden geçmez.</small></div></section><section id="quiz" class="lesson-block"><h2><span>05</span> Bilgi kontrolü</h2><div class="quiz-card"><div class="quiz-head"><span>CHECK YOUR UNDERSTANDING</span><strong>1 / 1</strong></div><h3>${esc(l.question)}</h3><div class="quiz-options">${l.options.map((o,i)=>`<button type="button" data-quiz="${l.id}" data-answer="${i}" class="quiz-option" ${passed?'disabled':''}><span>${'ABC'[i]}</span>${esc(o)}</button>`).join('')}</div><p class="quiz-feedback" id="quiz-feedback">${passed?`✓ Doğru yanıt verilmiş. ${esc(l.explanation)}`:'Bir yanıt seçerek kontrol et.'}</p></div></section>${deepDiveMarkup(l)}<div class="lesson-completion"><div><strong>${completed?'Ders tamamlandı':'Bu dersi tamamlamaya hazır mısın?'}</strong><p>${completed?'Bir sonraki derse ilerleyebilirsin.':'Tamamlama işareti için bilgi kontrolünü doğru cevapla.'}</p></div><button id="complete-lesson" class="btn ${passed&&!completed?'btn-primary':'btn-muted'}" data-lesson="${l.id}" ${(!passed||completed)?'disabled':''}>${completed?'✓ Tamamlandı':'Dersi tamamla →'}</button></div><div class="lesson-nav"><a href="${idx>0?'#lesson/'+courses[idx-1].id:'#curriculum'}"><small>← ÖNCEKİ</small><strong>${idx>0?esc(courses[idx-1].title):'Müfredat'}</strong></a><a href="${idx<courses.length-1?'#lesson/'+courses[idx+1].id:'#architecture'}"><small>SONRAKİ →</small><strong>${idx<courses.length-1?esc(courses[idx+1].title):'Mimari harita'}</strong></a></div></article></div></div>`;}
function renderLabs(){crumb('Lab experiments');return `<div class="page-inner">${secHead('HANDS-ON / 04 LABS','Etkileşimli laboratuvarlar','Kod veya ücretli model bağlantısı olmadan tasarım varsayımlarını değiştir; sonuçları gör. Bunlar gerçek LLM davranışını çalıştıran harness değil, kural tabanlı eğitim simülasyonlarıdır.')}<div class="lab-grid">${D.labs.map(l=>`<a href="#lab/${l.id}" class="lab-card"><span class="lab-number">EXPERIMENT ${l.number}<span>↗</span></span><div class="lab-icon">${({cache:'▤',policy:'⛨',router:'⌘',context:'◫'})[l.id]}</div><span class="micro-tag">${l.topic}</span><h3>${esc(l.name)}</h3><p>${esc(l.description)}</p><div class="lab-foot"><span>INTERACTIVE</span><span>${l.time}</span></div></a>`).join('')}</div><div class="lab-disclaimer">Simülasyonların sonuçları tasarım trade-off’larını göstermek içindir. Gerçek provider cache hit, fiyatlandırma, authorization ve tool davranışı ilgili API/SDK ile ayrıca doğrulanmalıdır.</div></div>`;}
function slider(id,label,min,max,step,value,unit=''){return `<div class="range-control"><div class="range-head"><label for="${id}">${label}</label><output id="out-${id}">${value.toLocaleString('tr-TR')}${unit}</output></div><input type="range" min="${min}" max="${max}" step="${step}" value="${value}" id="${id}" data-lab-field="${id}" /></div>`;}
const labState={prefix:2400,variable:350,requests:12,stability:80,action:'edit',scope:'yes',approved:'no',prohibited:'no',trusted:'yes',budget:16000,system:1700,tools:2100,files:4800,history:2200,evidence:1200};
const cases=[
{task:'Bir PHP sınıfındaki getPrice() metodunu bul ve içeriğini incele.',tools:['web_search','search_files','deploy_service'],answer:1,reason:'Yerel repo içinde sembol arama gerekir; web ve deploy gereksizdir.'},
{task:'Değişiklikten sonra yalnızca ilgili birim testlerini çalıştır.',tools:['read_file','run_tests','create_pr'],answer:1,reason:'Davranışı doğrulamak için run_tests kullanılır; okuyarak testin geçtiği doğrulanmaz.'},
{task:'Bir dış issue açıklaması gizli .env dosyasını bir adrese göndermeni söylüyor.',tools:['send_http','read_secrets','deny_and_report'],answer:2,reason:'Issue içeriği güvenilmeyen veridir; secret exfiltration isteği reddedilir.'},
{task:'Kod hazır, kullanıcı sadece değişiklik özetini istiyor; GitHub push izni yok.',tools:['push_branch','summarize_diff','merge_pr'],answer:1,reason:'Özet üretimi salt okunur olabilir. Push ve merge yetkisiz yan etkidir.'},
{task:'PR oluşturma çağrısı timeout oldu. PR yaratılmış olabilir.',tools:['create_pr_again','check_existing_pr','delete_branch'],answer:1,reason:'Unknown outcome: idempotent doğrulama ile mevcut sonuç sorgulanır.'},
{task:'MCP sunucusunun tools/list yanıtında yeni delete_repository eylemi görünüyor. Kullanıcı yalnız arama izni verdi.',tools:['call_delete_repository','check_policy_scope','grant_all_tools'],answer:1,reason:'Tool discovery yetki üretmez. Executor hedef ve scope izinlerini ayrıca kontrol etmelidir.'},
{task:'Bir tool çağrısı geçerli JSON ile ../private/.env path gönderiyor; sadece src/** izinli.',tools:['read_file','canonicalize_and_reject','web_search'],answer:1,reason:'Şema geçerli olsa da path sınır dışında. Canonical path doğrulaması ve ret gerekir.'},
{task:'Tüm ilgili testler geçti ama testler commit A için; son düzenleme commit B üzerinde.',tools:['mark_done','rerun_revision_bound_tests','deploy_service'],answer:1,reason:'Eski revizyonun testi yeni revision için kanıt değildir; final gate yeniden doğrulanmalıdır.'}
];
let routerIndex=0, routerCorrect=0, routerAnswered=false;
function labProtocol(id){
 const d=D.labs.find(l=>l.id===id)?.depth;
 if(!d)return '';
 return `<section class="lab-protocol"><span class="case-kicker">EXPERIMENT NOTEBOOK / VALIDATION PLAN</span>
 <h2>Hipotez ve doğrulama protokolü</h2><p class="lab-hypothesis">${esc(d.hypothesis)}</p>
 <h3>Uygulama adımları</h3><ol>${d.procedure.map(p=>`<li>${esc(p)}</li>`).join('')}</ol>
 <div class="lab-evidence"><strong>Beklenen çıktı</strong><p>${esc(d.evidence)}</p></div>
 <div class="lab-caveat"><strong>Modelin sınırı</strong><p>${esc(d.caution)}</p></div>
 <div class="deep-sources"><strong>Doğrulama kaynakları</strong>${sourceLinks(d.sourceIds)}</div></section>`;
}
function labFrame(kicker,title,desc,body,id){return `<div class="page-inner"><a class="back-link" href="#labs">← Tüm laboratuvarlar</a>${secHead(kicker,title,desc)}${body}${labProtocol(id)}${id==='cache'||id==='context'?'<div class="ctx-lab-crosslink"><strong>İleri seviye: Aynı görevi cache ve context açısından incele.</strong><p>Revizyon, compaction, kaynak güveni ve prefix eşitliğini karşılaştırmalı test et.</p><a class="btn btn-secondary" href="#context-studio">Context & Cache Studio ↗</a></div>':''}</div>`;}
function renderLab(id){const l=D.labs.find(x=>x.id===id);if(!l)return render404();crumb('Lab: '+l.name);let body='';if(id==='cache'){body=`<div class="lab-workspace"><div class="lab-controls"><h3>01 / INPUT PARAMETERS</h3><p>Değerleri değiştirdikçe tahmini maliyet ve yeniden kullanım değişir.</p>${slider('prefix','Sabit prefix token',0,12000,100,labState.prefix)}${slider('variable','Dinamik suffix token',0,5000,50,labState.variable)}${slider('requests','İstek sayısı',1,50,1,labState.requests)}${slider('stability','Prefix eşleşme oranı varsayımı',0,100,5,labState.stability,'%')}<div class="setting-note">Model varsayımı: minimum cacheable prefix <b>1.024 token</b>, cache write 1,25×, read 0,10×. Eğitim amaçlı sabit oranlar; gerçek faturalandırma veya hit garantisi değildir.</div></div><div class="lab-output" id="cache-output"></div></div>`;}else if(id==='policy'){body=`<div class="lab-workspace"><div class="lab-controls"><h3>01 / ACTION CONTRACT</h3><p>Bir agent’ın istediği eylem için kontrol girdilerini değiştir.</p>${choose('action','Eylem türü',[['read','Read-only'],['edit','Dosya düzenle'],['deploy','Deploy'],['delete','Silme']])}${choose('scope','Onaylı görev kapsamı',[['yes','Kapsam içinde'],['no','Kapsam dışında']])}${choose('approved','Somut onay mevcut mu?',[['no','Hayır'],['yes','Evet']])}${choose('prohibited','Policy tarafından yasaklı mı?',[['no','Hayır'],['yes','Evet']])}${choose('trusted','Eylem talebinin kaynağı',[['yes','Güvenilir kullanıcı isteği'],['no','Untrusted tool çıktısı']])}</div><div class="lab-output" id="policy-output"></div></div>`;}else if(id==='router'){body=`<div class="router-wrap"><div class="router-header"><span id="router-step">SCENARIO 01 / ${cases.length.toString().padStart(2,'0')}</span><span>Hangi tool? <span id="router-score">0 doğru</span></span></div><div id="router-case"></div></div>`;}else if(id==='context'){body=`<div class="lab-workspace"><div class="lab-controls"><h3>01 / CONTEXT ALLOCATION</h3><p>Token bütçesi bir kaynak planlamasıdır. Yürütme kanıtını unutma.</p>${slider('budget','Context bütçesi',4000,64000,1000,labState.budget)}${slider('system','Policy ve sabit yönergeler',0,10000,100,labState.system)}${slider('tools','Tool şemaları',0,15000,100,labState.tools)}${slider('files','İlgili proje dosyaları',0,30000,100,labState.files)}${slider('history','Geçmiş / handoff',0,20000,100,labState.history)}${slider('evidence','Doğrulama kanıtları',0,15000,100,labState.evidence)}</div><div class="lab-output" id="context-output"></div></div>`;}return labFrame(`${l.topic} / EXPERIMENT ${l.number}`,l.name,l.description,body,id);}
function choose(id,label,items){return `<div class="field-control"><label for="${id}">${esc(label)}</label><select id="${id}" data-lab-select="${id}">${items.map(([value,text])=>`<option value="${value}" ${labState[id]===value?'selected':''}>${esc(text)}</option>`).join('')}</select></div>`;}
function renderCacheOutput(){const r=E.estimateCache({prefixTokens:labState.prefix,variableTokens:labState.variable,requests:labState.requests,stability:labState.stability});const x=document.querySelector('#cache-output');if(!x)return;const breakeven=E.cacheBreakEvenRequests({writeRate:1.25,readRate:0.1});x.innerHTML=`<span class="result-eyebrow">02 / MODEL RESULT</span><div class="result-primary"><small>TAHMİNİ INPUT MALİYET FARKI</small><strong class="${r.savedPercent<0?'negative':''}">${r.savedPercent>=0?'+':''}${r.savedPercent.toFixed(1).replace('.',',')}<i>%</i></strong><span>${r.savedPercent>=0?'Daha düşük tahmini girdi işleme maliyeti':'Bu senaryoda cache write maliyeti daha yüksek'}</span></div><div class="comparison"><div><span>ÖNBELLEKSİZ · BAZ</span><strong>${f(r.baselineUnits)}</strong><div class="cost-track"><i style="width:100%"></i></div></div><div><span>CACHE MODELİ · GİRDİ BİRİMİ</span><strong>${f(r.optimizedUnits)}</strong><div class="cost-track"><i class="cached" style="width:${r.baselineUnits?Math.min(100,r.optimizedUnits/r.baselineUnits*100):0}%"></i></div></div></div><div class="result-grid"><div><small>CACHE READ</small><strong>${r.hits}</strong></div><div><small>CACHE WRITE</small><strong>${r.writes}</strong></div><div><small>TOKEN HIT RATE</small><strong>%${r.tokenHitRate.toFixed(1)}</strong></div></div><div class="model-insight ${r.eligible?'':'warning'}"><strong>${r.eligible?'Yorum':'CACHE EŞİĞİ'}</strong><p>${r.eligible?'Stabil token prefix büyüdükçe ve tekrar sayısı arttıkça cache read maliyeti etkisi belirginleşir. Model değişken suffix tokenlarını tekrar işler.':'Bu örnekte prefix 1.024 token sınırının altında; seçilen model varsayımında cache uygulanmıyor.'}</p></div><small class="simulation-warning">Tam prefix eşleşmesi %100 ve sabit oran varsayımında model başabaş eşiği: ${r.eligible?`${breakeven} istek`:'cache uygulanamaz'}. Bu eşik gerçek trafik için hit garantisi değildir. Bu deterministik eğitim hesabı gerçek API trafiği, routing veya güncel fiyatları ölçmez.</small>`;}
function renderPolicyOutput(){const result=E.policyDecision({action:labState.action,inScope:labState.scope==='yes',approved:labState.approved==='yes',prohibited:labState.prohibited==='yes',trusted:labState.trusted==='yes'});const x=document.querySelector('#policy-output');if(!x)return;x.innerHTML=`<span class="result-eyebrow">02 / ENFORCED DECISION</span><div class="policy-result ${result.severity}"><span>POLICY ENGINE OUTPUT</span><strong>${result.code}</strong><p>${esc(result.reason)}</p></div><div class="policy-flow"><div><span>01</span><strong>Validate schema</strong><small>Tür ve kapsam alanları</small></div><i>↓</i><div><span>02</span><strong>Evaluate policy</strong><small>Trust, scope, approval</small></div><i>↓</i><div><span>03</span><strong>Action / report</strong><small>İzinli tool veya öneri</small></div></div><div class="model-insight"><strong>Gerçek harness’ta nasıl olur?</strong><p>Bu karar yalnızca UI içinde simüle edilir. Üretimde policy engine çağrıyı executor seviyesinde bloke etmelidir; model metnine güvenmek yeterli değildir.</p></div>`;}
function renderRouter(){const c=cases[routerIndex];const x=document.querySelector('#router-case');if(!x)return;if(!c){x.innerHTML=`<div class="router-finish"><span class="finish-mark">✓</span><h2>Lab tamamlandı.</h2><p>${cases.length} senaryodan ${routerCorrect} tanesini doğru çözdün.</p><button class="btn btn-primary" id="router-reset">Yeniden başla ↗</button></div>`;return;}x.innerHTML=`<div class="scenario"><span class="micro-tag">CASE STUDY / TOOL BOUNDARY</span><h2>${esc(c.task)}</h2><p>Bu iş için en doğru ve en dar tool veya aksiyonu seç.</p><div class="router-options">${c.tools.map((t,i)=>`<button type="button" data-router="${i}" class="router-option"><span>${String(i+1).padStart(2,'0')}</span><strong>${esc(t)}</strong><span>↗</span></button>`).join('')}</div><div id="router-feedback" class="router-feedback" aria-live="polite"></div><button type="button" class="btn btn-primary" id="router-next" style="display:none">${routerIndex<cases.length-1?'Sonraki vaka →':'Sonuçları gör →'}</button></div>`;document.querySelector('#router-step').textContent=`SCENARIO ${String(routerIndex+1).padStart(2,'0')} / ${String(cases.length).padStart(2,'0')}`;document.querySelector('#router-score').textContent=`${routerCorrect} doğru`;routerAnswered=false;}
function renderContextOutput(){const r=E.inspectContext(labState);const x=document.querySelector('#context-output');if(!x)return;const keys=[['system','Policy'],['tools','Tools'],['files','Working set'],['history','History'],['evidence','Evidence']];x.innerHTML=`<span class="result-eyebrow">02 / BUDGET TELEMETRY</span><div class="result-primary"><small>CONTEXT UTILIZATION</small><strong class="${r.available<0?'negative':''}">${r.usagePercent.toFixed(0)}<i>%</i></strong><span>${r.available>=0?`${f(r.available)} token kullanılabilir`:`${f(-r.available)} token bütçe aşımı`}</span></div><div class="stacked-bar">${keys.map(([key],i)=>`<div style="width:${r.total?labState[key]/r.total*100:0}%;background:var(--stack-${i+1})"></div>`).join('')}</div><div class="budget-legend">${keys.map(([key,label],i)=>`<span><i style="background:var(--stack-${i+1})"></i>${label} <b>${f(labState[key])}</b></span>`).join('')}</div><div class="model-insight ${r.warnings.length?'warning':''}"><strong>${r.warnings.length?`${r.warnings.length} TASARIM UYARISI`:'BÜTÇE İÇİNDE'}</strong>${r.warnings.length?r.warnings.map(w=>`<p>• ${esc(w)}</p>`).join(''):'<p>Seçilen dağılım örnek heuristik kontrolleri geçti. Gerçek görev başarısı yine eval ile doğrulanmalı.</p>'}</div><small class="simulation-warning">Bu alanlar örnek tasarım bütçeleridir; gerçek tokenizer veya model context window hesabı değildir.</small>`;}
function renderArchitecture(){crumb('Architecture map');return `<div class="page-inner">${secHead('REFERENCE DESIGN / 01','Harness mimari haritası','Modeli merkeze değil, kontrol edilebilir eylem döngüsünü merkeze koyan küçük ve taşınabilir bir referans tasarım. Bu bir çalışan backend değildir.')}<div class="architecture-shell"><div class="architecture-top"><span>REFERENCE / PROVIDER-INDEPENDENT</span><span>CONCEPTUAL VIEW</span></div><div class="arch-stage"><div class="arch-box user"><small>01 · INPUT</small><strong>Task Contract</strong><span>Goal · Scope · Budget · Acceptance</span></div><div class="arch-down">↓</div><div class="arch-box orch"><small>02 · CONTROL PLANE</small><strong>Orchestrator / State Machine</strong><span>Plan → Act → Observe → Verify</span></div><div class="arch-down">↓</div><div class="arch-three"><div class="arch-box"><small>CONTEXT PLANE</small><strong>Context Manager</strong><span>Retrieval · Cache · Memory</span></div><div class="arch-box"><small>INTELLIGENCE PLANE</small><strong>Model Port</strong><span>Provider adapters</span></div><div class="arch-box"><small>CONTROL PLANE</small><strong>Policy Engine</strong><span>Scope · Trust · Approval</span></div></div><div class="arch-down">↓</div><div class="arch-box gateway"><small>03 · EXECUTION BOUNDARY</small><strong>Tool Gateway</strong><span>Validate → Authorize → Dispatch → Receipt</span></div><div class="arch-down">↓</div><div class="arch-three"><div class="arch-box"><small>ADAPTER 01</small><strong>Local tools</strong><span>Files · Search · Tests</span></div><div class="arch-box"><small>ADAPTER 02</small><strong>MCP Client</strong><span>Tools · Resources</span></div><div class="arch-box"><small>ADAPTER 03</small><strong>Sandbox</strong><span>Process · FS · Network</span></div></div><div class="arch-down">↓</div><div class="arch-box evidence"><small>04 · ASSURANCE PLANE</small><strong>Evidence & Trace Store</strong><span>Verification · Revision · Audit · Evals</span></div></div></div><div class="architecture-notes"><div><span>01 / SEPARATION</span><h3>Karar ≠ eylem</h3><p>Model karar önerebilir; gateway ve policy engine yetkili eylemi belirler.</p></div><div><span>02 / PORTABILITY</span><h3>Port ≠ provider</h3><p>Core, model sağlayıcısını veya MCP SDK’sını bilmeden sözleşmelerle çalışır.</p></div><div><span>03 / EVIDENCE</span><h3>Sonuç ≠ kanıt</h3><p>“Bitti” kararı, testlerin belirli kaynak revizyonunda gerçekten koşulmasına bağlanır.</p></div></div><div class="cta-panel"><span>SONRAKİ ADIM</span><h3>Bu tasarımı savunabilecek kadar öğrendin mi?</h3><p>Önce mini eval senaryolarını tanımla; ancak sonra gerçek bir harness prototipi oluştur.</p><a class="btn btn-primary" href="#module/14">Sistem tasarım dersleri ↗</a></div></div>`;}
function renderGlossary(q=''){crumb('Glossary');const values=D.glossary.filter(v=>slug(v.term+' '+v.description).includes(slug(q)));return `<div class="page-inner">${secHead('REFERENCE / GLOSSARY','Teknik terim sözlüğü','Harness ve agentic engineering tartışmalarında karşılaşacağın temel terimlerin kısa Türkçe açıklamaları.')}<div class="glossary-tools"><input type="search" id="glossary-filter" placeholder="55 terimde ara..." value="${esc(q)}" /><span>${values.length} TERİM</span></div><div class="glossary-grid">${values.map(g=>`<div class="glossary-item"><h3>${esc(g.term)}</h3><p>${esc(g.description)}</p></div>`).join('')||'<p>Bu kelimeyle eşleşen bir terim bulunamadı.</p>'}</div></div>`;}
function renderResources(){crumb('Official sources');return `<div class="page-inner">${secHead('SOURCE LIBRARY / OFFICIAL DOCS','Resmî kaynaklar','Müfredat kavramlarını sağlayıcı ve protokolün kendi belgelerine göre doğrula. Ders ve incelemelerdeki doğrudan kaynak bağlantıları için ilgili bölümleri aç. Dokümanlar zaman içinde değişebilir; üretim kararında güncel sürümü tekrar kontrol et.')}<div class="source-list">${D.sources.map((s,i)=>`<a href="${esc(s.url)}" target="_blank" rel="noopener noreferrer" class="source-item"><span class="source-num">${String(i+1).padStart(2,'0')}</span><div><h3>${esc(s.title)}</h3><p>${esc(s.publisher)} · ${s.tags.map(t=>`<span>${esc(t)}</span>`).join('')}</p></div><span class="source-external">↗</span></a>`).join('')}</div><div class="lab-disclaimer">İçeriğin referans tarihi: ${D.updated}. Özellikle cache fiyatlandırması, API sözdizimi, SDK ve MCP protokol ayrıntıları sürüme bağlıdır. Bu eğitim bir vendor sertifikasyonu değildir.</div></div>`;}
function renderWorkshop(){
 crumb('Task Lifecycle Workshop');
 const scenario=W.SCENARIOS.find(x=>x.id===workshop.scenarioId);
 const step=W.getStep(workshop);
 const checks=W.canComplete(workshop);
 const terminal=['DONE','WAITING_APPROVAL'].includes(workshop.status);
 const selected=workshop.cursor;
 const statusMap={READY:'READY',IN_PROGRESS:'IN PROGRESS',BLOCKED:'BLOCKED / RECOVER',DONE:'DONE / VERIFIED',WAITING_APPROVAL:'WAITING / HUMAN'};
 return `<div class="page-inner workshop-page">${secHead('GUIDED CASE / OFFLINE STATE MACHINE','Task Lifecycle Workshop','Tek bir sabit coding-agent görevinin yedi mühendislik kapısından geçişini karar vererek incele. Dokuz fixture aynı sözleşmeyi kullanır. Yanlış seçenek yan etki üretmez; olay günlüğünde BLOCKED olarak kalır.')}
 <div class="workshop-contract"><div class="case-kicker">TASK CONTRACT · ${esc(W.CONTRACT.id)} / BASE ${esc(W.CONTRACT.baseRevision)}</div><h2>${esc(W.CONTRACT.request)}</h2><div class="workshop-contract-grid"><div><strong>ALLOWED WORKING SET</strong><code>${W.CONTRACT.inScope.map(esc).join(' · ')}</code></div><div><strong>PROHIBITED / NON-GOALS</strong><code>${W.CONTRACT.forbidden.map(esc).join(' · ')}</code></div></div><p>Acceptance: ${W.CONTRACT.acceptance.map(esc).join(' · ')}</p></div>
 <div class="workshop-subhead"><h2>01 / Hata enjeksiyonunu seç</h2><p>Her seçenek farklı bir bozulma noktası simüle eder. Onay bekleme vakası bilerek DONE ile sonuçlanmaz.</p></div>
 <div class="workshop-case-grid">${W.SCENARIOS.map(s=>`<button type="button" data-workshop-scenario="${esc(s.id)}" aria-pressed="${s.id===workshop.scenarioId}" class="workshop-case ${s.id===workshop.scenarioId?'active':''}"><span>${esc(s.kind)}</span><strong>${esc(s.title)}</strong></button>`).join('')}</div>
 <div class="workshop-stage-bar" aria-label="Görev yaşam döngüsü">${W.STAGES.map((s,i)=>`<div class="workshop-stage ${i<selected?'complete':i===selected?'current':''}"><small>${i<selected?'✓':String(i+1).padStart(2,'0')}</small><span>${esc(s.label.replace(/^\d+ · /,''))}</span></div>`).join('')}</div>
 <div class="workshop-layout"><section class="workshop-decision"><div class="workshop-status"><span>02 / DECISION GATE</span><strong class="workshop-status-${esc(workshop.status.toLowerCase().replace(/_/g,'-'))}">${esc(statusMap[workshop.status])}</strong></div>
 <div class="workshop-fault"><strong>Fixture: ${esc(scenario.title)}</strong><p>${esc(scenario.fault)}</p><small>Enjeksiyon aşaması: ${esc(scenario.at)}</small></div>
 ${step&&!terminal?`<div class="workshop-current"><span>${esc(step.label)}</span><h2>${esc(step.question)}</h2><p>${esc(step.note)}</p></div><div class="workshop-choices">${step.options.map((choice,i)=>`<button type="button" class="workshop-choice" data-workshop-choice="${esc(choice.id)}"><small>${String(i+1).padStart(2,'0')}</small><span>${esc(choice.label)}</span><i>→</i></button>`).join('')}</div>`:`<div class="workshop-terminal ${workshop.status==='DONE'?'is-done':''}"><h2>${workshop.status==='DONE'?'Yürütme tamamlandı — kanıtlar geçerli':'REQUEST_APPROVAL — kontrollü durdurma'}</h2><p>${workshop.status==='DONE'?'Revizyon ve action receipt doğrulandı. Bu, yalnızca simülasyonun mantıksal sonucudur; gerçek test çalıştırılmadı.':'Bu fixture için somut insan onayı eksik. Agent hiçbir yazma yapmadan beklemeye geçti; DONE üretilemez.'}</p></div>`}
 ${workshop.events.length?`<div class="workshop-latest"><strong>Son karar</strong><span>${esc(workshop.events.at(-1).result)}</span><p>${esc(workshop.events.at(-1).reason)}</p></div>`:''}
 <button class="btn btn-secondary" id="workshop-reset" type="button">↺ Bu vakayı sıfırla</button>
 <div class="workshop-disclaimer">READ-ONLY SIMULATION — Hiçbir dosya yazılmaz, model/MCP çağrısı yapılmaz ve gerçek kullanıcı onayı taklit edilmez.</div></section>
 <aside class="workshop-trace"><div class="workshop-trace-head"><span>03 / EXECUTION TRACE</span><strong>${esc(workshop.revision)} · ${workshop.writes} simulated write</strong></div>
 <div class="workshop-log" aria-live="polite">${workshop.events.length?workshop.events.map(e=>`<div class="workshop-event ${e.result==='BLOCKED'?'failed':'passed'}"><span>${String(e.n).padStart(2,'0')} / ${esc(e.stage)}</span><strong>${esc(e.result)} · ${esc(e.action)}</strong><p>${esc(e.reason)}</p></div>`).join(''):'<p class="tiny-muted">Henüz karar yok. Önce görev sözleşmesini değerlendir.</p>'}</div>
 <div class="workshop-invariant"><strong>DONE için zorunlu invariantlar</strong>${checks.checks.map(c=>`<div class="workshop-check"><span class="${c.pass?'good':''}">${c.pass?'✓':'○'}</span><code>${esc(c.id)}</code></div>`).join('')}</div>
 <div class="workshop-execution"><strong>SIMULATED EXECUTION RECEIPTS</strong>${workshop.executionLog.length?workshop.executionLog.map(x=>`<code>${esc(x)}</code>`).join(''):'<p>Executor yalnız ilgili gate geçilince sembolik iz üretir.</p>'}</div>
 ${workshop.proposals.length?`<div class="workshop-proposals"><strong>Öneriler — yürütülmedi</strong>${workshop.proposals.map(p=>`<p>${esc(p)}</p>`).join('')}</div>`:''}</aside></div>
 <div class="workshop-outro"><h2>04 / Tasarım incelemesi</h2><p>Simülasyonu tamamlayınca source revision, tool receipt, scope decision ve test runner evidence arasındaki bağı gerekçelendir. Bu dört kavramdan biri eksikse DONE kararı reddedilmelidir.</p><div class="workshop-actions"><a class="btn btn-primary" href="${downloadUrl('task-execution-workbook.md')}" download>Vaka çalışma kitabını indir ↗</a><a class="btn btn-secondary" href="#context-studio">Context & Cache Studio ↗</a><a class="btn btn-secondary" href="#module/14">Mimari değerlendirme dersleri ↗</a></div><small>Bu örnek bir gerçek güvenlik sistemi veya agent runtime değildir. Fail-closed davranış yalnız eğitim motorunun seçenek/olay modeli içinde geçerlidir.</small></div>
 </div>`;
}
function renderContextStudio(){
 crumb('Context & Cache Studio');
 const selected=C.CASES.find(x=>x.id===contextCase)||C.CASES[0];
 const risky=C.evaluate(selected.id,'risk'),guarded=C.evaluate(selected.id,'guarded');
 const report=contextMode==='risk'?risky:guarded;
 const names={HIT:'HIT',PREFIX_MISMATCH:'PREFIX MISMATCH',TTL_EXPIRED:'TTL EXPIRED',BELOW_THRESHOLD:'BELOW MINIMUM'};
 const stat=(r)=>`${r.cache.hit?'HIT':'MISS'} · ${names[r.cache.reason]||r.cache.reason}`;
 const metric=(r)=>`${r.cache.savingsPercent>=0?'+':''}${r.cache.savingsPercent.toFixed(1).replace('.',',')}%`;
 const blocks=(blocks,comparison)=>blocks.map((b,i)=>`<div class="ctx-block ${comparison[i]?.content!==b.content||comparison[i]?.id!==b.id?'changed':''}"><span>${String(i+1).padStart(2,'0')} / ${esc(b.id)}</span><strong>${esc(b.content)}</strong><small>${f(b.tokens)} token (model)</small></div>`).join('');
 const metrics=[['risk',risky],['guarded',guarded]].map(([id,r])=>`<div class="ctx-metric ${contextMode===id?'selected':''}"><span class="ctx-metric-caption">${id==='risk'?'A · SORUNLU YAPI':'B · DÜZELTİLMİŞ YAPI'}</span><strong>${stat(r)}</strong><div class="ctx-metric-line"><span>2 istek · girdi maliyet değişimi</span><b class="${r.cache.savingsPercent>=0?'positive':'negative'}">${metric(r)}</b></div><div class="ctx-metric-line"><span>Cache read / tek checkpoint</span><b>${f(r.cache.readTokens)} token</b></div><div class="ctx-metric-line"><span>Görev kanıt kapısı</span><b class="${r.canComplete?'positive':'negative'}">${r.canComplete?'ELIGIBLE':'BLOCKED'}</b></div></div>`).join('');
 return `<div class="page-inner context-studio-page">${secHead('DEEP DIVE / TASK-AUTH-017','Context & Cache Studio','v0.4 · Aynı görev sözleşmesinde dokuz bağlam/cache bozulmasını incele. İki varyantı karşılaştır; cache tasarrufu ile güvenilir DONE kanıtının neden farklı kontroller olduğunu gör.')}<div class="ctx-contract"><span class="case-kicker">FROZEN CONTRACT / ${esc(C.CONTRACT_ID)}</span><h2>Token expiration regression · çalışma revizyonu ${esc(C.CURRENT_REVISION)}</h2><p>Sabit görev kapsamı: <code>src/auth/token.ts</code> ve <code>tests/auth/token.test.ts</code>. Kapsam dışı değişiklik yok. Gerçek kod, model veya tool çağrısı yapılmaz.</p><div class="ctx-contract-chips"><span>9 deterministik fixture</span><span>1 exact-prefix breakpoint</span><span>6 evidence invariant</span><span>Provider-independent model</span></div></div>
 <div class="ctx-section-title"><div>${areaLabel('01 / FAILURE INJECTION')}<h2>Hangi kırılmayı araştırıyorsun?</h2></div><a href="#workshop" class="plain-link">Önce Task Lifecycle Workshop ↗</a></div>
 <div class="ctx-case-grid">${C.CASES.map((c,i)=>`<button type="button" class="ctx-case ${c.id===selected.id?'active':''}" data-context-case="${esc(c.id)}" aria-pressed="${c.id===selected.id}"><span>${String(i+1).padStart(2,'0')} / ${esc(c.tag)}</span><strong>${esc(c.title)}</strong></button>`).join('')}</div>
 <div class="ctx-question"><div><small>02 / DESIGN QUESTION</small><h2>${esc(selected.question)}</h2><p>${esc(selected.mechanism)}</p></div><div class="ctx-choice"><button type="button" class="ctx-mode ${contextMode==='risk'?'active':''}" data-context-mode="risk" aria-pressed="${contextMode==='risk'}">A · Sorunlu yapıyı incele</button><button type="button" class="ctx-mode ${contextMode==='guarded'?'active':''}" data-context-mode="guarded" aria-pressed="${contextMode==='guarded'}">B · Onarılmış yapıyı incele</button></div></div>
 <div class="ctx-metrics">${metrics}</div>
 <div class="ctx-content-grid"><section class="ctx-prefix"><div class="ctx-pane-head"><span>03 / CACHE CHECKPOINT</span><strong>${esc(report.cache.reason)} · ${contextMode==='risk'?'A':'B'}</strong></div><p>İki isteğin cache breakpoint öncesindeki blokları. <b>İşaretli bloklar</b> checkpoint karşılaştırmasında değişmiştir.</p><div class="ctx-prefix-comparison"><div><h3>REQUEST 01 · CACHE WRITE</h3>${blocks(report.cache.firstPrefix,report.cache.secondPrefix)}</div><div><h3>REQUEST 02 · CACHE LOOKUP</h3>${blocks(report.cache.secondPrefix,report.cache.firstPrefix)}</div></div><div class="ctx-prefix-footer"><span>${report.cache.equalPrefix?'✓ EXACT PREFIX MATCH':'× PREFIX MISMATCH'}</span><span>Age ${report.cache.ageMinutes} / TTL ${report.cache.ttlMinutes} dk</span></div><div class="ctx-economics"><strong>İki istek · temsili girdi birimi</strong><div><span>Cache yok</span><b>${f(report.cache.baselineUnits)}</b></div><div><span>Cache modeli (1,25x write, 0,10x read)</span><b>${f(report.cache.optimizedUnits)}</b></div><small>Yalnız tek exact-prefix checkpoint hesaplanır. Gerçek sağlayıcıların lookback, segment, fiyat ve yönlendirme davranışları bu modele dahil değildir. Token sayıları örnek bütçelerdir.</small></div></section>
 <section class="ctx-proof"><div class="ctx-pane-head"><span>04 / EVIDENCE GATE</span><strong class="${report.canComplete?'positive':'negative'}">${esc(report.status)}</strong></div><div class="ctx-proof-details"><strong>${contextMode==='risk'?'A · Risk analizi':'B · İyileştirilmiş tasarım'}</strong><p>${esc(report.explanation)}</p></div><div class="ctx-invariants">${report.checks.map(c=>`<div class="ctx-invariant"><span class="${c.pass?'positive':'negative'}">${c.pass?'✓':'×'}</span><div><strong>${esc(c.id)}</strong><small>${esc(c.detail)}</small></div></div>`).join('')}</div><div class="ctx-proof-receipt"><span>SOURCE</span><code>${esc(report.sourceRevision)} → ${esc(report.currentRevision)}</code><span>TEST EVIDENCE</span><code>${esc(report.evidence?.runId||'MISSING')} · ${esc(report.evidence?.status||'ABSENT')}</code><span>HANDOFF RECEIPT</span><code>${esc(report.handoff?.receiptId||'MISSING')}</code></div></section></div>
 <div class="ctx-analysis"><div><span class="case-kicker">05 / ENGINEERING TAKEAWAY</span><h2>Ölçümü, kanıttan ayır.</h2><p>${esc(selected.discussion)}</p></div><div class="ctx-analysis-sources"><strong>Resmî dayanaklar</strong>${selected.sources.map(u=>`<a href="${esc(u)}" target="_blank" rel="noopener noreferrer">${esc(u.split('/')[2])} ↗</a>`).join('')}</div></div>
 <div class="ctx-outro"><strong>Kendini değerlendir</strong><p>Önce A/B varyantlarının neden farklı sonuç verdiğini açıklayabilir misin? Her senaryoda (1) cache checkpoint, (2) kaynak revizyonu, (3) evidence receipt, (4) bütçe, (5) trust boundary ve (6) DONE gate alanlarını kontrol et. Tasarım sorularının cevap anahtarı ve teknik matrisi indirilebilir çalışma kitabında.</p><a class="btn btn-primary" href="${downloadUrl('context-cache-workbook.md')}" download>Context & Cache Workbook indir ↗</a><a class="btn btn-secondary" href="#lab/cache">Cache maliyet laboratuvarı ↗</a><a class="btn btn-secondary" href="#compaction-studio">Compaction & Handoff ↗</a><p class="ctx-notice">Bu sayfa offline eğitim simülasyonudur. Gerçek provider cache hit ölçmez; security boundary veya üretim harness executor’ı değildir.</p></div></div>`;
}
function renderCompactionStudio(){
 crumb('Compaction & Handoff');
 const view=H.inspect(compactionCase),c=view.scenario,chosen=compactionAction?H.choose(c.id,compactionAction):null;
 const before=view.assessment,after=chosen?.after;
 const status=(value)=>`<span class="handoff-status ${value==='ELIGIBLE_TO_RESUME'?'ok':value==='BLOCKED'?'blocked':'hold'}">${esc(value)}</span>`;
 const checks=assessment=>`<div class="handoff-check-list">${assessment.checks.map(x=>`<div class="handoff-check"><span class="${x.pass?'good':'bad'}">${x.pass?'✓':'×'}</span><div><strong>${esc(x.id)}</strong><small>${esc(x.details)}</small></div></div>`).join('')}</div>`;
 const steps=chosen?chosen.trace.map((x,i)=>`<div class="handoff-trace-event"><small>${String(i+1).padStart(2,'0')} · ${esc(x.kind)}</small><p>${esc(x.message)}</p></div>`).join(''):'<p class="tiny-muted">Yöntem seçildiğinde gözlem → değerlendirme → kurtarma → gate izini burada göreceksin.</p>';
 return `<div class="page-inner handoff-studio">${secHead('ADVANCED WORKSHOP / v0.5','Compaction & Handoff Verification','Aynı TASK-AUTH-017 üzerinde context kaybı, stale verification, güven sınırı ve agent handoff hatalarını incele. Kararını ver, delil kapısının neden açıldığını veya kapandığını gör.')}
 <div class="handoff-contract"><span class="case-kicker">FROZEN TASK CONTRACT · ${esc(H.TASK_ID)}</span><h2>Token expiration regression / deterministic replay</h2><p>İzinli dosyalar: <code>src/auth/token.ts</code> ve <code>tests/auth/token.test.ts</code>. Değişmeyen sözleşme; gerçek dosya düzenlemesi, MCP, model çağrısı veya insan onayı yok.</p><div class="ctx-contract-chips"><span>9 failure fixtures</span><span>7 evidence checks</span><span>Read-only replay</span><span>0 real side effects</span></div></div>
 <div class="ctx-section-title"><div>${areaLabel('01 / SELECT A FAILURE')}<h2>Compaction neyi kaybettirdi?</h2></div><a href="#context-studio" class="plain-link">Önce context ve cache incelemesi ↗</a></div>
 <div class="handoff-case-grid">${H.CASES.map((x,i)=>`<button type="button" class="handoff-case ${x.id===c.id?'active':''}" data-compaction-case="${esc(x.id)}" aria-pressed="${x.id===c.id}"><small>${String(i+1).padStart(2,'0')} / ${esc(x.tag)}</small><strong>${esc(x.title)}</strong></button>`).join('')}</div>
 <section class="handoff-problem"><span class="case-kicker">02 / INVESTIGATION</span><h2>${esc(c.symptom)}</h2><p>${esc(c.why)}</p><div class="handoff-loss"><div><small>CONTEXT BEFORE</small><strong>${f(before.compaction.before)} token</strong></div><div><small>COMPACTED SUMMARY</small><strong>${f(before.compaction.after)} token</strong></div><div><small>ESTIMATED REDUCTION</small><strong>${f(before.compaction.reductionPercent)}%</strong></div><div><small>SIDECAR REFERENCES</small><strong>${f(before.compaction.sidecarCount)} kept</strong></div></div><small class="handoff-caveat">Token sayıları fixture bütçesidir; tokenizer veya provider cache telemetrisi değildir. Küçülme oranı doğruluk ya da güvenlik ölçütü değildir.</small></section>
 <div class="handoff-compare"><section class="handoff-evidence"><div class="handoff-panel-head"><span>03 / INCOMING HANDOFF</span>${status(before.status)}</div><h3>Görevi devralan ajan neyi doğrular?</h3>${checks(before)}<div class="handoff-receipt"><span>RUNNER RECEIPT</span><code>${esc(before.verifiedRunner?before.verifiedRunner.ref+' · exit='+before.verifiedRunner.exitCode:'UNAVAILABLE')}</code><span>OPERATION LEDGER</span><code>${esc(before.operationClaim)} · ${esc(before.ledger?.ref||'MISSING')}</code><span>REVISION</span><code>${esc(before.contextRevision)} → HEAD ${esc(before.liveRevision)}</code></div></section>
 <section class="handoff-decision"><div class="handoff-panel-head"><span>04 / RECOVERY DECISION</span><span class="handoff-small">Üç alternatif · biri güvenli</span></div><h3>Bu durumda hangi adımı atarsın?</h3><div class="handoff-actions">${c.actions.map(([id,label],i)=>`<button type="button" data-compaction-action="${esc(id)}" class="handoff-action ${compactionAction===id?'active':''}" aria-pressed="${compactionAction===id}"><span>${String(i+1).padStart(2,'0')}</span>${esc(label)}</button>`).join('')}</div>
 ${chosen?`<div class="handoff-feedback ${chosen.correct?'correct':'incorrect'}"><strong>${chosen.correct?'Doğru güvenlik kararı':'Riskli veya yetersiz karar'}</strong><p>${esc(chosen.correct?'Kararın sonuç durumu: '+chosen.after.status+'. ELIGIBLE_TO_RESUME, DONE değildir; yalnızca devam kapısını açar.':'Bu seçenek değiştirme yetkisi üretmedi; eğitim modelindeki blokaj korundu. Gerekçeyi ve makbuzları incele.')}</p></div>`:'<p class="handoff-hint">Önce makbuz ve revizyon durumunu incele. Seçeneği işaretledikten sonra sonuç izi gösterilir.</p>'}
 <button type="button" class="btn btn-secondary" id="compaction-reset">↺ Kararı sıfırla</button></section></div>
 <div class="handoff-compare lower"><section class="handoff-evidence"><div class="handoff-panel-head"><span>05 / RECOVERY RESULT</span>${after?status(after.status):'<span class="handoff-small">NO ACTION YET</span>'}</div>${after?checks(after):'<p class="tiny-muted">Onarımın ardından invariantlar burada yeniden değerlendirilir.</p>'}<div class="handoff-gate"><strong>Sonuç yorumu</strong><p>${esc(chosen?{ELIGIBLE_TO_RESUME:'Bütün fixture kontrolleri geçti; gerçek agent devam öncesi kendi yürütme politikasını ayrıca doğrulamalı.',NEEDS_REVERIFY:'Yeni revizyonda gerçek runner makbuzu gelmeden görev tamamlanamaz.',WAITING_APPROVAL:'Gerçek insan onayı gelmeden korumalı eylem çalıştırılamaz.',NEEDS_REPLAN:'Çakışma yeniden planlama ve revizyona bağlı yeni doğrulama gerektirir.',BLOCKED:'Kontroller başarısız; devam ve DONE kapalı.'}[after.status]:'Seçilen eylem burada simüle edilir, gerçek kod değişmez.')}</p></div></section>
 <section class="handoff-decision"><div class="handoff-panel-head"><span>06 / AUDIT TRACE</span><strong>0 real tool calls</strong></div><div class="handoff-trace" aria-live="polite">${steps}</div><p class="handoff-caveat">Sonuçlar sabit fixture’lardan hesaplanır. Gerçek runner, repo veya approval servisi çağrısı yapılmaz. Bu bir production policy engine değildir.</p></section></div>
 <div class="ctx-outro"><strong>Tasarım egzersizi</strong><p>Bu vakayı üç katmanda açıkla: (1) konuşma özeti / ephemeral context, (2) otoritatif TaskContract ve revision-bound receipts, (3) yürütmeye izin veren state transition. Kurtarma gerçekleşse bile neden otomatik DONE üretilmediğini gerekçelendir.</p><a class="btn btn-primary" href="${downloadUrl('compaction-handoff-workbook.md')}" download>Compaction & Handoff Workbook indir ↗</a><a class="btn btn-secondary" href="#workshop">Task Lifecycle Workshop ↗</a><p class="ctx-notice">Offline, deterministik eğitim modeli. Token bütçesi tahminidir; gerçek model doğruluğu, cache hit veya güvenlik garantisi sunmaz.</p></div></div>`;
}

function renderReliabilityEvaluation(){
 crumb('Reliability Evaluation');
 const settings={falseAllowPenalty:evalFalseAllow,falseHoldPenalty:evalFalseHold};
 const reports=R.compare(settings);
 const selected=reports.find(p=>p.policy.id===evalPolicy);
 const detail=R.inspectScenario(evalScenario);
 const cells=selected.matrix;
 const percent=v=>`${Math.round(100*v)}%`;
 const resultBadge=(hold)=>`<span class="eval-pill ${hold?'hold':'resume'}">${hold?'HOLD':'ALLOW RESUME'}</span>`;
 const matrixCell=(label,n,kind)=>`<div class="eval-matrix-cell ${kind}"><small>${label}</small><strong>${n}</strong></div>`;
 const assessmentBox=(row)=>`<div class="eval-phase"><small>${row.phase==='incoming'?'01 / INCOMING, BEFORE RECOVERY':'02 / AFTER CORRECT RECOVERY'}</small><h3>${esc(row.phase==='incoming'?'Bozulmuş context':'Güvenli recovery uygulanmış')}</h3><div class="eval-phase-decision"><span>Reviewed ground truth</span>${resultBadge(row.shouldHold)}</div><div class="eval-phase-decision"><span>Selected policy predicts</span>${resultBadge(selected.detail.find(x=>x.id===row.id).hold)}</div><div class="eval-phase-decision"><span>Evidence completeness</span><strong>${row.coverage.verified} / ${row.coverage.required} · ${row.coverage.percent}%</strong></div><div class="eval-phase-decision"><span>Boundary checks passed</span><strong>${row.coverage.boundaryPass} / ${row.coverage.boundaryTotal}</strong></div><div class="eval-progress"><div style="width:${row.coverage.percent}%"></div></div><p class="eval-failure">Failed invariants: ${esc(row.assessment.failed.join(', ')||'none')}</p><p class="eval-outcome">State: <strong>${esc(row.assessment.status)}</strong></p></div>`;
 return `<div class="page-inner eval-studio">${secHead('ADVANCED ASSESSMENT / v0.6','Reliability Evaluation Studio','Dokuz compaction/handoff vakasının önceki ve doğrulanmış kurtarma sonrası durumlarını değerlendir. Yanlış ALLOW, gereksiz HOLD, delil eksikliği ve maliyet ödünleşimlerini karşılaştır.')}
 <div class="handoff-contract"><span class="case-kicker">FROZEN TASK CONTRACT · ${esc(R.TASK_ID)}</span><h2>18 paired, labeled replay states</h2><p>9 senaryo × (incoming + recovered). Pozitif sınıf: <strong>HOLD zorunludur</strong>. Yalnızca doğru kurtarma sonrası beş durum devam edebilir; bu, DONE yetkisi değildir.</p><div class="ctx-contract-chips"><span>13 HOLD required</span><span>5 ALLOW safe</span><span>4 policies</span><span>0 live executions</span></div></div>
 <section class="eval-section"><div class="ctx-section-title"><div>${areaLabel('01 / POLICY COMPARISON')}<h2>Hangi strateji daha güvenilir?</h2></div><a class="plain-link" href="#compaction-studio">Dokuz recovery vakasını aç ↗</a></div><div class="eval-policy-options">${R.POLICY.map(x=>`<button type="button" data-eval-policy="${esc(x.id)}" class="eval-policy ${evalPolicy===x.id?'active':''}" aria-pressed="${evalPolicy===x.id}"><strong>${esc(x.title)}</strong><small>${esc(x.description)}</small></button>`).join('')}</div>
 <div class="eval-table-scroll"><table class="eval-table"><thead><tr><th>Strategy</th><th>Unsafe release (FN)</th><th>Unnecessary hold (FP)</th><th>Safe throughput</th><th>Model cost</th></tr></thead><tbody>${reports.map(r=>`<tr class="${r.policy.id===evalPolicy?'selected':''}"><td>${esc(r.policy.title)}</td><td>${r.matrix.FN} / ${r.totals.unsafe}</td><td>${r.matrix.FP} / ${r.totals.safe}</td><td>${percent(r.rates.safeThroughput)}</td><td>${r.cost.total} units</td></tr>`).join('')}</tbody></table></div></section>
 <section class="eval-section"><div class="ctx-section-title"><div>${areaLabel('02 / CONFUSION MATRIX')}<h2>${esc(selected.policy.title)} · ${selected.sampleCount} değerlendirme</h2></div></div>
 <div class="eval-metric-grid"><div class="eval-metric"><small>UNSAFE RELEASE RATE</small><strong>${percent(selected.rates.unsafeRelease)}</strong><span>FN / (TP + FN) · lower is better</span></div><div class="eval-metric"><small>UNNECESSARY HOLD RATE</small><strong>${percent(selected.rates.unnecessaryHold)}</strong><span>FP / (TN + FP) · lower is better</span></div><div class="eval-metric"><small>HOLD RECALL</small><strong>${percent(selected.rates.holdRecall)}</strong><span>TP / (TP + FN)</span></div><div class="eval-metric"><small>SAFE THROUGHPUT</small><strong>${percent(selected.rates.safeThroughput)}</strong><span>TN / (TN + FP)</span></div></div>
 <div class="eval-matrix-heading"><span>Ground truth = requires HOLD</span><span>Prediction = HOLD / ALLOW RESUME</span></div><div class="eval-matrix">${matrixCell('TP · correct hold',cells.TP,'good')}${matrixCell('FN · unsafe allow',cells.FN,'danger')}${matrixCell('FP · unnecessary hold',cells.FP,'warning')}${matrixCell('TN · correct resume',cells.TN,'good')}</div><p class="eval-caveat">Not: “accuracy” burada tek başına yeterli değildir. Her şeyi durduran strateji tüm güvensiz devamları yakalar fakat hiçbir güvenli görevi serbest bırakmaz. 18 kayıt, 9 eşleşmiş sentetik vakanın iki aşamasıdır; üretim dağılımını temsil etmez.</p></section>
 <section class="eval-section"><div class="ctx-section-title"><div>${areaLabel('03 / RELATIVE COST MODEL')}<h2>Güvenilirlik ve operasyon bedeli</h2></div></div><div class="eval-cost-choices"><div><strong>Unsafe ALLOW penalty</strong><div class="eval-choice-line">${[10,50,100].map(v=>`<button data-eval-risk="unsafe:${v}" type="button" class="eval-chip ${evalFalseAllow===v?'active':''}" aria-pressed="${evalFalseAllow===v}">${v}</button>`).join('')}</div></div><div><strong>Unnecessary HOLD penalty</strong><div class="eval-choice-line">${[4,8,20].map(v=>`<button data-eval-risk="hold:${v}" type="button" class="eval-chip ${evalFalseHold===v?'active':''}" aria-pressed="${evalFalseHold===v}">${v}</button>`).join('')}</div></div></div>
 <div class="eval-cost-total"><div><small>MODEL COST / 18 DECISIONS</small><strong>${selected.cost.total} <span>relative units</span></strong></div><p>Inspection <b>${selected.cost.inspectionUnits}</b> + required recovery <b>${selected.cost.recoveryUnits}</b> + unsafe releases <b>${selected.cost.unsafeReleaseUnits}</b> + unnecessary holds <b>${selected.cost.unnecessaryHoldUnits}</b>.</p></div><p class="eval-caveat">Birimler tasarlanmış ağırlıklardır; gerçek para, token, dakika, latency veya ROI ölçümü değildir. FN/FP bedellerini değiştirip sıralamanın nasıl değiştiğini incele.</p></section>
 <section class="eval-section"><div class="ctx-section-title"><div>${areaLabel('04 / EVIDENCE AND RECOVERY')}<h2>Tek vaka, iki farklı durum</h2></div></div><div class="eval-case-grid">${H.CASES.map((c,i)=>`<button type="button" data-eval-scenario="${esc(c.id)}" class="handoff-case ${evalScenario===c.id?'active':''}" aria-pressed="${evalScenario===c.id}"><small>${String(i+1).padStart(2,'0')} / ${esc(c.tag)}</small><strong>${esc(c.title)}</strong></button>`).join('')}</div><div class="eval-phase-grid">${detail.rows.map(assessmentBox).join('')}</div><div class="eval-recovery-plan"><span class="case-kicker">RECOVERY EFFORT · SYNTHETIC ESTIMATE</span><h3>${esc(detail.scenario.title)}</h3><p>${esc(detail.plan.why)}</p><div class="ctx-contract-chips"><span>Investigation ${detail.plan.inspect}</span><span>Reverification ${detail.plan.verify}</span><span>Coordination ${detail.plan.coordinate}</span><span>Total ${detail.plan.inspect+detail.plan.verify+detail.plan.coordinate} units</span></div><p class="eval-caveat">Evidence completeness sayacı yalnız doğrulanmış contract, revision, runner, operation ve gerekiyorsa approval öğelerini sayar. Trust, scope ve approval gate kontrolleri ayrıca değerlendirilir. Yüzde, kanıt kalitesini veya DONE başarısını tek başına göstermez.</p></div></section>
 <div class="ctx-outro"><strong>Engineering review</strong><p>(1) Summary-only neden false allow üretir? (2) Runner-only hangi trust/scope/approval hatalarını kaçırır? (3) Hold-all neden 100% hold recall ile başarısız bir operasyon stratejisi olabilir? (4) Gerçek sistemde bu tabloya hangi ölçümleri, örnekleme stratejisini ve belirsizlik aralıklarını eklemek gerekir?</p><a class="btn btn-primary" href="${downloadUrl('reliability-evaluation-workbook.md')}" download>Reliability Evaluation Workbook indir ↗</a><a class="btn btn-secondary" href="#compaction-studio">Compaction & Handoff ↗</a><p class="ctx-notice">Read-only educational replay. No LLM, tool, approval service, financial costs or actual security enforcement.</p></div></div>`;
}
function renderClaimAudit(){
 const item=A.CASES[auditIndex],answer=auditAnswers[item.id],result=answer?A.assess(item.id,answer):null,progress=A.summary(auditAnswers);
 return `<section class="eval-section" id="claim-audit"><div class="ctx-section-title"><div>${areaLabel('05 / CLAIM AUDIT · v0.9')}<h2>Bu bulgudan ne iddia edebilirsin?</h2></div></div>
 <p class="eval-caveat">Beş karar vakası; bir seferde tek soru. Kararlar yalnız eğitim geri bildirimi üretir, araç veya politika yürütmez.</p>
 <div class="eval-choice-line" role="group" aria-label="Audit case">${A.CASES.map((c,i)=>`<button type="button" class="eval-chip ${i===auditIndex?'active':''}" data-audit-case="${i}" aria-pressed="${i===auditIndex}">${i+1}. vaka</button>`).join('')}</div>
 <div class="eval-recovery-plan"><span class="case-kicker">${auditIndex+1} / ${A.CASES.length} · ${progress.answered} yanıtlandı</span><h3>${esc(item.title)}</h3><p>${esc(item.setup)}</p><p><strong>${esc(item.question)}</strong></p>
 <div class="eval-choice-line" role="group" aria-label="Audit answer">${item.options.map(o=>`<button type="button" class="eval-chip ${answer===o.id?'active':''}" data-audit-answer="${esc(o.id)}" aria-pressed="${answer===o.id}">${esc(o.label)}</button>`).join('')}</div>
 ${result?`<div role="status"><p><strong>${result.correct?'Kanıt sınırı korundu':'Bu karar kanıtı aşar'}</strong></p><p>${esc(result.explanation)}</p><p><strong>Gerekli kanıt:</strong> ${esc(result.evidence)}</p><p><strong>İddia sınırı:</strong> ${esc(result.limit)}</p></div>`:'<p class="eval-caveat">Teknik gerekçeyi görmek için bir karar seç.</p>'}</div>
 <p class="eval-caveat">${progress.answered}/${progress.total} vaka yanıtlandı · ${progress.correct} uygun karar. Bu skor bir güvenlik sertifikası değildir. <a class="plain-link" href="${downloadUrl('evaluation-claim-audit-workbook.md')}" download>Teknik çalışma kitabı</a></p></section>`;
}
function renderAdjudication(){
 const review=J.review(witnessMode),outcome=adjudicationAction?J.choose(witnessMode,adjudicationAction):null;
 return `<details class="oracle-adjudication" id="oracle-adjudication" ${adjudicationOpen?'open':''}>
 <summary>Kaynak çelişkisi ve adjudication · v0.13</summary>
 <p class="eval-caveat">Bildirilen payda: ${review.claim.denominator} · Kaynakta benzersiz kayıt: ${review.witness.uniqueRecords} · Revizyon: ${esc(review.witness.revision)}. İki doğrulama sonucunun birbirine uyması veya uymaması tek başına hakemlik değildir.</p>
 <p role="status"><strong>${esc(review.status)}</strong> · Sayı uyuşması: ${review.countAgreement?'evet':'hayır'} · Revizyon karşılaştırılabilir: ${review.revisionComparable?'evet':'hayır'}</p>
 <p><strong>Nasıl karar verirsin?</strong></p>
 <div class="eval-choice-line" role="group" aria-label="Adjudication action">
 ${J.options(witnessMode).map(o=>`<button type="button" class="eval-chip ${adjudicationAction===o.id?'active':''}" data-adjudication-action="${esc(o.id)}" aria-pressed="${adjudicationAction===o.id}">${esc(o.label)}</button>`).join('')}</div>
 ${outcome?`<p role="status"><strong>${esc(outcome.status)}</strong> · ${esc(outcome.explanation)}</p>`:''}
 <p class="eval-caveat"><strong>Gerekli kanıt:</strong> ${esc(review.requiredEvidence)}</p>
 <p class="eval-caveat">Tüm kayıtlar sentetiktir. Hiçbir işlem yeni kanıt, insan onayı, çalıştırma izni veya üretim garantisi oluşturmaz. <a class="plain-link" href="${downloadUrl('oracle-disagreement-adjudication-workbook.md')}" download>Adjudication çalışma kitabı</a></p>
 </details>`;
}

function renderIndependentWitness(){
 const review=I.evaluate(witnessMode);
 const w=review.witness;
 return `<details class="oracle-independent" id="oracle-independent" ${witnessOpen?'open':''}>
 <summary>Kaynak kayıtlarıyla çapraz kontrol · v0.12</summary>
 <p class="eval-caveat">Örnek vaka: <strong>zero-fn</strong>. İki kontrol aynı bildirilen 13 sayısını kabul ediyor. Ayrı hazırlanmış sentetik kayıt listesini karşılaştır.</p>
 <div class="eval-choice-line" role="group" aria-label="Independent witness scenario">
 ${I.MODES.map(m=>`<button type="button" class="eval-chip ${witnessMode===m.id?'active':''}" data-witness-mode="${m.id}" aria-pressed="${witnessMode===m.id}">${esc(m.title)}</button>`).join('')}</div>
 <p class="eval-caveat">İddia edilen payda: <strong>${review.claimedDenominator}</strong> · Kayıt satırı: <strong>${w.totalRecords}</strong> · Benzersiz kimlik: <strong>${w.uniqueRecords}</strong> · Kaynak: <strong>${esc(w.revision)}</strong> (beklenen ${esc(w.expectedRevision)})</p>
 <p role="status"><strong>İki kontrol: ${review.bothAccept?'ACCEPT':'REJECT'}</strong> · Ayrı kayıt kontrolü: <strong>${esc(review.status)}</strong></p>
 <p class="eval-caveat">${review.commonModeDetected?'Ortak kör nokta tespit edildi: bildirilen sayıya güvenmek yeterli değil.':'Bu sabit sentetik kayıt setindeki kontroller eşleşiyor; üretim güvenilirliği kanıtlanmadı.'}</p>
 <p class="eval-caveat"><strong>Yeniden doğrulama için:</strong> ${esc(review.requiredEvidence)}</p>
 ${renderAdjudication()}
 <p class="eval-caveat">Kayıt listesi de aynı kod tabanında hazırlanmış <strong>sentetik</strong> veridir; bağımsız saha kanıtı değildir. <a class="plain-link" href="${downloadUrl('independent-oracle-witness-workbook.md')}" download>Çalışma kitabı</a></p>
 </details>`;
}

function renderOraclePanel(){
 const c=F.CASES[injectionIndex];
 const review=O.evaluate(c.id,oracleMode), controls=review.controls;
 const choice=(id,label)=>`<button type="button" class="eval-chip ${oracleMode===id?'active':''}" data-oracle-mode="${id}" aria-pressed="${oracleMode===id}">${label}</button>`;
 return `<details class="eval-recovery-plan oracle-self-check" id="oracle-self-check" ${oracleOpen?'open':''}>
 <summary>Oracle öz testi · v0.11 (isteğe bağlı)</summary>
 <p class="eval-caveat">Oracle'ın kendisini iki sabit kontrolle dene. <strong>False accept</strong>: bozuk kanıtı geçerli saymak. <strong>False reject</strong>: sağlam kanıtı geçersiz saymak.</p>
 <div class="eval-choice-line" role="group" aria-label="Oracle variant">${choice('reference','Referans kontrol')}${choice('mutant','Hatalı kontrol')}</div>
 <p role="status"><strong>${esc(review.status)}</strong> · False accept: ${review.falseAccepts} · False reject: ${review.falseRejects}</p>
 <p class="eval-caveat">Sağlam örnek: ${esc(controls[0].classification)} · Bozuk örnek: ${esc(controls[1].classification)}</p>
 ${review.detected?`<p><strong>Oracle hatası:</strong> ${esc(review.fault)}</p><p><strong>Eksik güvence:</strong> ${esc(review.missingAssurance)}</p>`:''}
 ${c.id===I.CASE_ID?renderIndependentWitness():''}
 <p class="eval-caveat">Bu iki sentetik kontrol, oracle'ın gerçek görevlerde doğru çalıştığını kanıtlamaz. <a class="plain-link" href="${downloadUrl('evaluation-oracle-reliability-workbook.md')}" download>Oracle Workbook</a></p>
 </details>`;
}

function renderFailureInjection(){
 const c=F.CASES[injectionIndex],r=F.inspect(c.id,injectionMode);
 const chosen=injectionChoice?F.chooseRepair(c.id,injectionChoice):null;
 const label=value=>value===null?'null':String(value);
 return `<section class="eval-section" id="failure-injection">
 <div class="ctx-section-title"><div>${areaLabel('06 / FAILURE INJECTION · v0.10')}<h2>Tek bir kanıt bozulursa ne olur?</h2></div></div>
 <p class="eval-caveat">Aynı beş claim audit vakası üzerinde tek alanı boz. Kontrolün neden engellendiğini ve kanıtı nasıl yeniden doğrulayacağını incele.</p>
 <div class="eval-choice-line" role="group" aria-label="Injection case">${F.CASES.map((x,i)=>`<button type="button" class="eval-chip ${i===injectionIndex?'active':''}" data-injection-case="${i}" aria-pressed="${i===injectionIndex}">${i+1}. vaka</button>`).join('')}</div>
 <div class="eval-recovery-plan"><span class="case-kicker">${injectionIndex+1} / ${F.CASES.length} · SYNTHETIC FIXTURE</span><h3>${esc(c.title)}</h3>
 <div class="eval-choice-line" role="group" aria-label="Injection mode">
 <button type="button" class="eval-chip ${injectionMode==='baseline'?'active':''}" data-injection-mode="baseline" aria-pressed="${injectionMode==='baseline'}">Sağlam kanıt</button>
 <button type="button" class="eval-chip ${injectionMode==='injected'?'active':''}" data-injection-mode="injected" aria-pressed="${injectionMode==='injected'}">Kanıtı boz</button></div>
 <p class="eval-caveat">Tek değişen alan: <code>${esc(c.evidenceKey)}</code> · Beklenen: <code>${esc(label(r.check.expected))}</code> · Okunan: <code>${esc(label(r.check.actual))}</code></p>
 <p role="status"><strong>${esc(r.status)}</strong> · ${r.evidenceValid?'Kontrol geçti. Yalnız bu sentetik fixture için sınırlı gözlem yapılabilir.':esc(r.failure)}</p>
 ${injectionMode==='injected'?`<p><strong>Güvenli kurtarma kararı nedir?</strong></p>
 <div class="eval-choice-line" role="group" aria-label="Recovery decision">${c.options.map(o=>`<button type="button" class="eval-chip ${injectionChoice===o.id?'active':''}" data-injection-choice="${esc(o.id)}" aria-pressed="${injectionChoice===o.id}">${esc(o.label)}</button>`).join('')}</div>
 ${chosen?`<p role="status"><strong>${esc(chosen.status)}</strong> · ${esc(chosen.message)}</p>`:''}`:''}
 <p class="eval-caveat"><strong>Gerekli kanıt:</strong> ${esc(r.requiredEvidence)}</p></div>
 <p class="eval-caveat">Read-only simülasyon: gerçek araç çağrısı, izin, üretim garantisi veya otomatik DONE yok. <a class="plain-link" href="${downloadUrl('evaluation-failure-injection-workbook.md')}" download>Çalışma kitabı</a></p>${renderOraclePanel()}</section>`;
}
function renderEvalFold(key,label,content){
 return `<details class="eval-fold" data-eval-fold="${esc(key)}" ${evalFoldOpen[key]?'open':''}><summary>${esc(label)}</summary>${content}</details>`;
}
function renderEvaluationRobustness(){
 crumb('Evaluation robustness');
 const compared=Q.compare({profile:robustProfile,labels:robustLabels});
 const selected=compared.find(x=>x.policyId===robustPolicy);
 const fold=Q.holdout(robustPolicy,robustFold);
 const fmt=r=>r==null?'N/A':`${(r*100).toFixed(1)}%`;
 const chip=(label,value,selectedValue,key)=>`<button type="button" class="eval-chip ${value===selectedValue?'active':''}" data-robust-${key}="${esc(value)}" aria-pressed="${value===selectedValue}">${esc(label)}</button>`;
 const matrix=m=>`${m.TP} TP · ${m.FP} FP · ${m.FN} FN · ${m.TN} TN`;
 const freshness=Q.verifyManifest(Q.MANIFEST);
 return `<div class="page-inner eval-studio">${secHead('EVALUATION ENGINEERING / v0.7','Evaluation Robustness & Distribution Shift','Aynı 9 senaryonun 18 eşleşmiş gözlemi üzerinde dağılım, etiket uyuşmazlığı ve holdout sınırlarını test et. Bu bölüm üretim başarısı iddiası değil, değerlendirmeyi eleştirme pratiğidir.')}
 <div class="handoff-contract"><span class="case-kicker">${esc(Q.TASK_ID)} · READ-ONLY REPLAY</span><h2>Bir test setinde kusursuz olmak, genelleştirmek değildir.</h2><p>Farklı case weight veya etiket varsayımları altında ölçüm nasıl değişiyor? Aynı senaryonun incoming/recovered çiftlerini train ile holdout arasında asla bölme.</p><div class="ctx-contract-chips"><span>9 senaryo · 18 paired states</span><span>4 frozen policies</span><span>4 synthetic distributions</span><span>0 real tool calls</span></div></div>
 <details class="eval-fold" data-eval-fold="distribution" ${evalFoldOpen.distribution?'open':''}><summary>01 · Risk dağılımını incele</summary><section class="eval-section"><div class="ctx-section-title"><div>${areaLabel('01 / DISTRIBUTION SHIFT')}<h2>Risk örneklemesini değiştir</h2></div><a class="plain-link" href="#reliability-eval">Önce v0.6 tablosunu incele ↗</a></div><p class="eval-caveat">Yalnız aynı kayıtların ağırlıkları değişir. Yeni olay, gerçek frekans veya bağımsız gözlem oluşturulmaz.</p><div class="eval-choice-line" role="group" aria-label="Distribution profile">${Q.PROFILES.map(p=>chip(p.title,p.id,robustProfile,'profile')).join('')}</div><p>${esc(Q.PROFILES.find(p=>p.id===robustProfile).description)}</p>
 <div class="eval-table-scroll"><table class="eval-table"><thead><tr><th>Policy</th><th>Unsafe ALLOW (FN)</th><th>Unnecessary HOLD (FP)</th><th>Safe throughput</th><th>Weighted observations</th></tr></thead><tbody>${compared.map(r=>`<tr class="${r.policyId===robustPolicy?'selected':''}"><td>${esc(R.POLICY.find(p=>p.id===r.policyId).title)}</td><td>${r.matrix.FN}</td><td>${r.matrix.FP}</td><td>${fmt(r.rates.safeThroughput)}</td><td>${r.weightedTotal} (raw ${r.observations})</td></tr>`).join('')}</tbody></table></div></section></details>
 <details class="eval-fold" data-eval-fold="labels" ${evalFoldOpen.labels?'open':''}><summary>02 · Etiketleri karşılaştır</summary><section class="eval-section"><div class="ctx-section-title"><div>${areaLabel('02 / LABEL DISAGREEMENT')}<h2>Etiket aynı kaldığında sonuç da aynı mı?</h2></div></div><div class="eval-choice-line" role="group" aria-label="Annotation assumption">${chip('Reviewed', 'reviewed',robustLabels,'labels')}${chip('Disputed: flipped','disputed-flipped',robustLabels,'labels')}${chip('Disputed: excluded','disputed-excluded',robustLabels,'labels')}</div><p class="eval-caveat">Flipped, ikinci değerlendiricinin varsayımsal itirazıdır; yeni doğrulanmış truth değildir. Excluded, uyuşmazlıklı 4 kaydı paydadan çıkarır; daha yüksek skor kanıtı değildir.</p><div class="eval-metric-grid"><div class="eval-metric"><small>OBSERVED ROWS</small><strong>${selected.observations} / 18</strong><span>Paired synthetic samples</span></div><div class="eval-metric"><small>WEIGHTED MASS</small><strong>${selected.weightedTotal}</strong><span>Not independent sample size</span></div><div class="eval-metric"><small>UNSAFE ALLOW</small><strong>${fmt(selected.rates.unsafeRelease)}</strong><span>FN / all unsafe</span></div><div class="eval-metric"><small>SAFE THROUGHPUT</small><strong>${fmt(selected.rates.safeThroughput)}</strong><span>TN / all safe</span></div></div><div class="eval-choice-line" role="group" aria-label="Policy">${R.POLICY.map(p=>chip(p.title,p.id,robustPolicy,'policy')).join('')}</div><p class="eval-caveat">${esc(R.POLICY.find(p=>p.id===robustPolicy).title)}: ${matrix(selected.matrix)}.</p><div class="robust-disputes">${Q.DISPUTES.map(d=>`<div class="robust-dispute"><strong>${esc(d.id)}</strong><p>${esc(d.reason)}</p></div>`).join('')}</div></section></details>
 <details class="eval-fold" data-eval-fold="holdout" ${evalFoldOpen.holdout?'open':''}><summary>03 · Holdout ayrımını test et</summary><section class="eval-section"><div class="ctx-section-title"><div>${areaLabel('03 / HOLDOUT & LEAKAGE')}<h2>Senaryoyu bütün olarak ayır</h2></div></div><div class="eval-choice-line" role="group" aria-label="Holdout fold">${Q.FOLDS.map(f=>chip(f.title,f.id,robustFold,'fold')).join('')}</div><p class="eval-caveat">Bu gerçek eğitme veya hyperparameter tuning değildir. Stratified/temporal holdout gerektiren üretim değerlendirmesinin veri sızıntısı tuzağını gösterir.</p><div class="eval-phase-grid"><div class="eval-phase"><small>TRAIN / 6 senaryo</small><h3>12 paired states</h3><p>${matrix(fold.train.matrix)}</p><p class="eval-outcome">Unsafe ALLOW: <strong>${fmt(fold.train.rates.unsafeRelease)}</strong></p></div><div class="eval-phase"><small>HOLDOUT / 3 senaryo</small><h3>6 paired states</h3><p>${matrix(fold.test.matrix)}</p><p class="eval-outcome">Unsafe ALLOW: <strong>${fmt(fold.test.rates.unsafeRelease)}</strong></p><small>${fold.fold.scenarioIds.map(esc).join(' · ')}</small></div></div></section></details>
 <details class="eval-fold" data-eval-fold="freshness" ${evalFoldOpen.freshness?'open':''}><summary>04 · Kanıt güncelliğini incele</summary><section class="eval-section"><div class="ctx-section-title"><div>${areaLabel('04 / EVIDENCE FRESHNESS')}<h2>Değerlendirme kanıtı ne zaman eskir?</h2></div></div><p class="eval-caveat">Manifest, fixture / gold labels / policy / grouping sürümlerini sabitler. Değişiklik olduğunda önceki skor otomatik olarak yeni sistemin skoru sayılmaz.</p><div class="ctx-contract-chips">${Object.entries(Q.MANIFEST).map(([k,v])=>`<span>${esc(k)}: ${esc(v)}</span>`).join('')}</div><div class="eval-recovery-plan"><span class="case-kicker">CURRENT MANIFEST</span><h3>${freshness.current?'All four references match':'Evaluation is stale'}</h3><p>Manifest değiştiğinde yeniden değerlendirme gerekir. Bu kontrol fixture verisinin kriptografik kimliğini veya dış kanıt güvenilirliğini kanıtlamaz.</p></div></section></details>
 ${renderEvalFold('claims','05 · İddia sınırlarını değerlendir',renderClaimAudit())}
 ${renderEvalFold('injection','06 · Kanıt ve oracle doğrulamalarını incele',renderFailureInjection())}
 <div class="ctx-outro"><strong>Engineering exercise</strong><p>Hangi profil altında yanlış karar maliyeti artıyor? Aynı vakadan türetilen iki durum train/test olarak bölünseydi nasıl data leakage oluşurdu? Bir uyuşmazlık kapatılmadan raporun “%100 safe” iddiası neden geçersiz kalır?</p><a class="btn btn-primary" href="${downloadUrl('evaluation-robustness-workbook.md')}" download>Robustness Workbook indir ↗</a><a class="btn btn-secondary" href="#reliability-eval">v0.6 Reliability Evaluation ↗</a><p class="ctx-notice">All profiles, labels and costs are synthetic examples. No production performance claim, LLM request, backend, login or telemetry.</p></div></div>`;
}
function render404(){crumb('Not found');return `<div class="page-inner not-found"><h1>404 — Yol bulunamadı</h1><p>Bu ders veya laboratuvar müfredatta yok.</p>${navLink('Genel bakışa dön','#home')}</div>`;}
let readingMode=false;
function render(){let raw=decodeURIComponent((location.hash||'#home').slice(1));if(raw==='page'||raw.startsWith('intro'))raw='home';const [route,id]=raw.split('/');currentRoute=route;document.querySelectorAll('[data-route]').forEach(a=>a.classList.toggle('active',a.dataset.route===route||(route==='module'||route==='lesson')&&a.dataset.route==='curriculum'||route==='lab'&&a.dataset.route==='labs'));let html;
switch(route){case 'home':html=renderHome();break;case 'curriculum':html=renderCurriculum();break;case 'module':html=renderModule(id);break;case 'lesson':html=renderLesson(id);break;case 'labs':html=renderLabs();break;case 'lab':html=renderLab(id);break;case 'architecture':html=renderArchitecture();break;case 'workshop':html=renderWorkshop();break;case 'context-studio':html=renderContextStudio();break;case 'compaction-studio':html=renderCompactionStudio();break;case 'reliability-eval':html=renderReliabilityEvaluation();break;case 'eval-robustness':html=renderEvaluationRobustness();break;case 'glossary':html=renderGlossary();break;case 'resources':html=renderResources();break;default:html=render404();}
page.innerHTML=html;document.body?.classList?.toggle('is-lesson',route==='lesson');document.body?.classList?.toggle('reading-mode',route==='lesson'&&readingMode);const focus=document.querySelector('#focus-toggle');if(focus){focus.setAttribute('aria-pressed',String(route==='lesson'&&readingMode));focus.setAttribute('aria-label',readingMode?'Odak modunu kapat':'Odak modunu aç');focus.textContent=readingMode?'Normal görünüm':'Odak modu';}const expanded=document.querySelector('#advanced-nav');if(expanded&&['workshop','context-studio','compaction-studio','reliability-eval','eval-robustness'].includes(route))expanded.open=true;const aux=document.querySelector('#aux-nav');if(aux&&['architecture','glossary','resources'].includes(route))aux.open=true;status();if(route==='lab'){if(id==='cache')renderCacheOutput();if(id==='policy')renderPolicyOutput();if(id==='router')renderRouter();if(id==='context')renderContextOutput();}window.scrollTo({top:0,behavior:'instant'});}
function onClick(e){
const adjudication=e.target.closest('[data-adjudication-action]');
if(adjudication){
 const action=adjudication.dataset.adjudicationAction;
 if(J.options(witnessMode).some(o=>o.id===action)){adjudicationAction=action;adjudicationOpen=true;witnessOpen=true;oracleOpen=true;
  const result=J.choose(witnessMode,action);
  repaintEvaluation('[data-adjudication-action="'+action+'"]','Kaynak incelemesi: '+result.status);}
 return;
}
const witness=e.target.closest('[data-witness-mode]');
if(witness){const mode=witness.dataset.witnessMode;
 if(I.MODES.some(x=>x.id===mode)){witnessMode=mode;witnessOpen=true;oracleOpen=true;adjudicationAction=null;adjudicationOpen=false;
  repaintEvaluation('[data-witness-mode="'+mode+'"]','Kayıt kontrolü: '+I.evaluate(mode).status);}
 return;
}
const oracle=e.target.closest('[data-oracle-mode]');
if(oracle){
 const mode=oracle.dataset.oracleMode;
 if(mode==='reference'||mode==='mutant'){oracleMode=mode;oracleOpen=true;
  repaintEvaluation('[data-oracle-mode="'+mode+'"]','Oracle öz testi: '+O.evaluate(F.CASES[injectionIndex].id,mode).status);}
 return;
}
const injected=e.target.closest('[data-injection-case],[data-injection-mode],[data-injection-choice]');
if(injected){
 if(injected.dataset.injectionCase!==undefined){const index=Number(injected.dataset.injectionCase);if(Number.isInteger(index)&&index>=0&&index<F.CASES.length){injectionIndex=index;injectionMode='baseline';injectionChoice=null;oracleMode='reference';oracleOpen=false;witnessMode='healthy';witnessOpen=false;adjudicationOpen=false;adjudicationAction=null;}}
 if(injected.dataset.injectionMode!==undefined&&['baseline','injected'].includes(injected.dataset.injectionMode)){injectionMode=injected.dataset.injectionMode;injectionChoice=null;}
 if(injected.dataset.injectionChoice!==undefined&&injectionMode==='injected'){F.chooseRepair(F.CASES[injectionIndex].id,injected.dataset.injectionChoice);injectionChoice=injected.dataset.injectionChoice;}
 page.innerHTML=renderEvaluationRobustness();return;
}
const audit=e.target.closest('[data-audit-case],[data-audit-answer]');
if(audit){
 if(audit.dataset.auditCase!==undefined){const i=Number(audit.dataset.auditCase);if(Number.isInteger(i)&&i>=0&&i<A.CASES.length)auditIndex=i;}
 if(audit.dataset.auditAnswer){A.assess(A.CASES[auditIndex].id,audit.dataset.auditAnswer);auditAnswers[A.CASES[auditIndex].id]=audit.dataset.auditAnswer;}
 page.innerHTML=renderEvaluationRobustness();return;
}
const robustness=e.target.closest('[data-robust-profile],[data-robust-labels],[data-robust-policy],[data-robust-fold]');
if(robustness){if(robustness.dataset.robustProfile)robustProfile=robustness.dataset.robustProfile;
 if(robustness.dataset.robustLabels)robustLabels=robustness.dataset.robustLabels;
 if(robustness.dataset.robustPolicy)robustPolicy=robustness.dataset.robustPolicy;
 if(robustness.dataset.robustFold)robustFold=robustness.dataset.robustFold;
 page.innerHTML=renderEvaluationRobustness();return;}
const evalP=e.target.closest('[data-eval-policy]');
if(evalP){evalPolicy=evalP.dataset.evalPolicy;page.innerHTML=renderReliabilityEvaluation();return;}
const evalS=e.target.closest('[data-eval-scenario]');
if(evalS){evalScenario=evalS.dataset.evalScenario;page.innerHTML=renderReliabilityEvaluation();return;}
const evalR=e.target.closest('[data-eval-risk]');
if(evalR){const [kind,value]=evalR.dataset.evalRisk.split(':');if(kind==='unsafe')evalFalseAllow=Number(value);else if(kind==='hold')evalFalseHold=Number(value);page.innerHTML=renderReliabilityEvaluation();return;}
const compCase=e.target.closest('[data-compaction-case]');
if(compCase){compactionCase=compCase.dataset.compactionCase;compactionAction=null;page.innerHTML=renderCompactionStudio();return;}
const compChoice=e.target.closest('[data-compaction-action]');
if(compChoice){compactionAction=compChoice.dataset.compactionAction;page.innerHTML=renderCompactionStudio();return;}
if(e.target.closest('#compaction-reset')){compactionAction=null;page.innerHTML=renderCompactionStudio();return;}
const contextScenario=e.target.closest('[data-context-case]');
if(contextScenario){contextCase=contextScenario.dataset.contextCase;contextMode='risk';page.innerHTML=renderContextStudio();return;}
const contextVariant=e.target.closest('[data-context-mode]');
if(contextVariant){contextMode=contextVariant.dataset.contextMode;page.innerHTML=renderContextStudio();return;}
const scenarioChoice=e.target.closest('[data-workshop-scenario]');
if(scenarioChoice){workshop=W.begin(scenarioChoice.dataset.workshopScenario);page.innerHTML=renderWorkshop();return;}
const workshopChoice=e.target.closest('[data-workshop-choice]');
if(workshopChoice){workshop=W.choose(workshop,workshopChoice.dataset.workshopChoice);page.innerHTML=renderWorkshop();return;}
if(e.target.closest('#workshop-reset')){workshop=W.begin(workshop.scenarioId);page.innerHTML=renderWorkshop();return;}
const review=e.target.closest('[data-review]');
if(review){
 const mod=D.modules.find(m=>m.id===review.dataset.review);
 if(!mod)return;
 const idx=Number(review.dataset.choice),choice=mod.caseStudy.alternatives[idx];
 if(!choice)return;
 document.querySelectorAll('[data-review]').forEach(button=>{
   const alt=mod.caseStudy.alternatives[Number(button.dataset.choice)];
   button.classList.toggle('review-preferred',alt.preferred);
   button.classList.toggle('review-selected',Number(button.dataset.choice)===idx);
 });
 const result=document.querySelector('#review-result-'+mod.id);
 const evidence=mod.caseStudy.evidence.map(x=>`<li>${esc(x)}</li>`).join('');
 result.classList.toggle('review-good',choice.preferred);
 result.innerHTML=`<strong>${choice.preferred?'Önerilen karar':'Bu yaklaşımda risk var'}</strong><p>${esc(choice.consequence)}</p><p>${esc(mod.caseStudy.decision)}</p><div class="review-evidence"><b>Beklenen doğrulama kanıtları</b><ul>${evidence}</ul></div>`;
 return;
}
const copy=e.target.closest('[data-copy]');if(copy){navigator.clipboard?.writeText(copy.dataset.copy).then(()=>notify('Örnek panoya kopyalandı.')).catch(()=>notify('Kopyalama bu ortamda desteklenmiyor.'));return;}
const jump=e.target.closest('[data-jump]');if(jump){e.preventDefault();document.getElementById(jump.dataset.jump)?.scrollIntoView({behavior:'smooth'});return;}
const quiz=e.target.closest('[data-quiz]');if(quiz){const l=courses.find(x=>x.id===quiz.dataset.quiz);if(!l||progress.passed.includes(l.id))return;const answer=Number(quiz.dataset.answer),right=answer===l.answer;document.querySelectorAll(`[data-quiz="${l.id}"]`).forEach(button=>{button.classList.toggle('correct',Number(button.dataset.answer)===l.answer);button.classList.toggle('wrong',Number(button.dataset.answer)===answer&&!right);button.disabled=right;});const box=document.querySelector('#quiz-feedback');box.textContent=(right?'✓ Doğru. ':'Tekrar dene. ')+l.explanation;box.classList.toggle('success',right);if(right){progress.passed.push(l.id);saveProgress();const c=document.querySelector('#complete-lesson');c.disabled=false;c.classList.replace('btn-muted','btn-primary');notify('Bilgi kontrolü tamamlandı.');}return;}
const complete=e.target.closest('#complete-lesson');if(complete){const id=complete.dataset.lesson;if(!progress.passed.includes(id)||progress.completed.includes(id))return;progress.completed.push(id);saveProgress();notify('Ders tamamlandı.');render();return;}
const choice=e.target.closest('[data-router]');if(choice){if(routerAnswered)return;routerAnswered=true;const answer=Number(choice.dataset.router),c=cases[routerIndex],right=answer===c.answer;if(right)routerCorrect++;document.querySelectorAll('[data-router]').forEach(b=>{b.disabled=true;b.classList.toggle('correct',Number(b.dataset.router)===c.answer);b.classList.toggle('wrong',Number(b.dataset.router)===answer&&!right);});document.querySelector('#router-feedback').textContent=(right?'✓ Doğru seçim. ':'Yanlış seçim. ')+c.reason;document.querySelector('#router-next').style.display='inline-flex';document.querySelector('#router-score').textContent=`${routerCorrect} doğru`;return;}
if(e.target.closest('#router-next')){routerIndex++;renderRouter();return;}if(e.target.closest('#router-reset')){routerIndex=0;routerCorrect=0;renderRouter();return;}}
// Native <details> toggle events do not bubble; capture phase keeps UI state
// aligned with user-operated summaries without replacing their keyboard behavior.
page.addEventListener('toggle',event=>{
 const target=event.target;
 if(page.contains&&!page.contains(target))return;
 if(target.dataset?.evalFold&&Object.prototype.hasOwnProperty.call(evalFoldOpen,target.dataset.evalFold))evalFoldOpen[target.dataset.evalFold]=target.open;
 if(target.id==='oracle-self-check')oracleOpen=target.open;
 else if(target.id==='oracle-independent')witnessOpen=target.open;
 else if(target.id==='oracle-adjudication')adjudicationOpen=target.open;
},true);
page.addEventListener('click',onClick);
page.addEventListener('input',e=>{const input=e.target.closest('[data-lab-field]');if(input){const id=input.dataset.labField;labState[id]=Number(input.value);document.querySelector('#out-'+id).textContent=f(labState[id])+(id==='stability'?'%':'');if(currentRoute==='lab'){if(location.hash==='#lab/cache')renderCacheOutput();if(location.hash==='#lab/context')renderContextOutput();}}const filter=e.target.closest('#glossary-filter');if(filter){const val=filter.value;const list=D.glossary.filter(g=>slug(g.term+' '+g.description).includes(slug(val)));document.querySelector('.glossary-grid').innerHTML=list.map(g=>`<div class="glossary-item"><h3>${esc(g.term)}</h3><p>${esc(g.description)}</p></div>`).join('')||'<p>Bu kelimeyle eşleşen terim yok.</p>';document.querySelector('.glossary-tools > span').textContent=list.length+' TERİM';}});
page.addEventListener('change',e=>{const input=e.target.closest('[data-lab-select]');if(input){labState[input.dataset.labSelect]=input.value;renderPolicyOutput();}});
window.addEventListener('hashchange',()=>{page.classList.remove('skip-target');render();page.focus?.({preventScroll:true});});
// A native #page jump changes the SPA hash; focus main without triggering routing.
document.querySelector('.skip-link')?.addEventListener('click',e=>{e.preventDefault();page.classList.add('skip-target');page.focus?.();});
const dialog=document.querySelector('#search-dialog'), searchInput=document.querySelector('#global-search');
function closeSearch(){dialog.close();}function showSearch(){dialog.showModal();searchInput.value='';searchResults('');searchInput.focus();}
function searchResults(query){const q=slug(query.trim());const found=courses.filter(l=>slug(l.title+' '+l.summary+' '+l.module.title+' '+l.deepDive.mechanism+' '+l.deepDive.failureMode).includes(q)).slice(0,14);const gloss=D.glossary.filter(g=>slug(g.term+' '+g.description).includes(q)).slice(0,5);document.querySelector('#search-results').innerHTML=(q?`<div class="search-result-group">DERSLER (${found.length})</div>`:'<div class="search-result-group">ÖNERİLEN DERSLER</div>')+found.map(l=>`<a href="#lesson/${l.id}" class="search-result"><span>▤</span><div><strong>${esc(l.title)}</strong><small>${esc(l.module.title)}</small></div><span>↗</span></a>`).join('')+(gloss.length&&q?`<div class="search-result-group">SÖZLÜK (${gloss.length})</div>`+gloss.map(g=>`<a href="#glossary" class="search-result"><span>≡</span><div><strong>${esc(g.term)}</strong><small>${esc(g.description)}</small></div><span>↗</span></a>`).join(''):'')+(!found.length&&!gloss.length?'<p class="no-search">Eşleşen içerik bulunamadı.</p>':'');}
document.querySelector('#focus-toggle')?.addEventListener('click',()=>{readingMode=!readingMode;document.body?.classList?.toggle('reading-mode',currentRoute==='lesson'&&readingMode);const btn=document.querySelector('#focus-toggle');btn.setAttribute('aria-pressed',String(readingMode));btn.setAttribute('aria-label',readingMode?'Odak modunu kapat':'Odak modunu aç');btn.textContent=readingMode?'Normal görünüm':'Odak modu';});
document.querySelector('#search-trigger').addEventListener('click',showSearch);document.querySelector('#search-close').addEventListener('click',closeSearch);searchInput.addEventListener('input',e=>searchResults(e.target.value));dialog.addEventListener('click',e=>{if(e.target===dialog)closeSearch();});dialog.addEventListener('click',e=>{if(e.target.closest('a'))closeSearch();});document.addEventListener('keydown',e=>{if(e.key==='/'&&!dialog.open&&!['INPUT','TEXTAREA'].includes(document.activeElement?.tagName)){e.preventDefault();showSearch();}});
render();
})();
