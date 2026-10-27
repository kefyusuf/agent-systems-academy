import { readFileSync } from 'node:fs';
import { strict as assert } from 'node:assert';
const data = JSON.parse(readFileSync(new URL('../content/curriculum.json', import.meta.url), 'utf8'));
const js = readFileSync(new URL('../public/curriculum.js', import.meta.url), 'utf8');
assert.ok(js.includes('window.AGENT_CURRICULUM = '+JSON.stringify(data)+';'), 'Content bundle is out of sync: npm run sync:content');
assert.equal(data.modules.length,14,'Scope freeze: 14 modules');
assert.equal(data.labs.length,4,'Scope freeze: 4 original labs');
assert.equal(data.glossary.length,55,'Scope freeze: 55 terms');
const moduleIds=new Set(), lessonIds=new Set();
for(const mod of data.modules){
  assert.ok(mod.id && mod.title && mod.lessons.length>=2);
  assert.ok(!moduleIds.has(mod.id),`Duplicate module: ${mod.id}`);moduleIds.add(mod.id);
  assert.ok(mod.caseStudy?.scenario?.length>=100,`Missing case study: ${mod.id}`);
  assert.equal(mod.caseStudy.alternatives?.length,3,`Case decisions: ${mod.id}`);
  assert.equal(mod.caseStudy.alternatives.filter(a=>a.preferred).length,1,`Case must have one preferred answer: ${mod.id}`);
  assert.ok(mod.caseStudy.evidence?.length>=3,`Missing evidence: ${mod.id}`);
  for(const lesson of mod.lessons){
    assert.ok(!lessonIds.has(lesson.id),`Duplicate lesson: ${lesson.id}`);lessonIds.add(lesson.id);
    for(const field of ['title','summary','concept','engineering','example','assignment','question','explanation']) assert.ok(lesson[field]?.length>10,`Missing ${field}: ${lesson.id}`);
    for(const field of ['mechanism','failureMode','tradeoff','verification']) assert.ok(lesson.deepDive?.[field]?.length >= 90,`Missing detailed ${field}: ${lesson.id}`);
    assert.ok(Array.isArray(lesson.deepDive.sourceIds) && lesson.deepDive.sourceIds.length>0,`Missing citations: ${lesson.id}`);
    assert.equal(lesson.options.length,3,`Bad quiz choices: ${lesson.id}`);
    assert.ok(Number.isInteger(lesson.answer)&&lesson.answer>=0&&lesson.answer<3,`Bad answer: ${lesson.id}`);
  }
}
assert.equal(lessonIds.size,42,'Scope freeze: 42 lessons');
const sourceIds = new Set(data.sources.map(s=>s.id));
assert.equal(sourceIds.size,data.sources.length,'Duplicate source IDs');
for(const src of data.sources) assert.ok(src.id && src.url.startsWith('https://'),`Source needs ID and https URL: ${src.title}`);
for(const mod of data.modules){
  for(const sourceId of mod.caseStudy.sourceIds) assert.ok(sourceIds.has(sourceId),`Bad source ${sourceId} in ${mod.id}`);
  for(const lesson of mod.lessons) for(const sourceId of lesson.deepDive.sourceIds) assert.ok(sourceIds.has(sourceId),`Bad source ${sourceId} in ${lesson.id}`);
}
for(const lab of data.labs) {
  assert.ok(['cache','policy','router','context'].includes(lab.id));
  assert.ok(lab.depth?.hypothesis?.length>=90,`Missing lab hypothesis: ${lab.id}`);
  assert.equal(lab.depth.procedure?.length,3,`Lab protocol must have three steps: ${lab.id}`);
  assert.ok(lab.depth.caution?.length>=90,`Missing lab limitations: ${lab.id}`);
  for(const sid of lab.depth.sourceIds) assert.ok(sourceIds.has(sid),`Unknown lab source: ${sid}`);
}
const preferredPositions = new Set(data.modules.map(m=>m.caseStudy.alternatives.findIndex(a=>a.preferred)));
assert.equal(preferredPositions.size,3,'Case study preferred positions must vary');
const worksheet=readFileSync(new URL('../public/downloads/harness-design-worksheet.md',import.meta.url),'utf8');
for(const id of ['E01','E02','E03','E04','E05','E06','E07','E08']) assert.ok(worksheet.includes(id),`Missing review fixture ${id}`);
const standalone=readFileSync(new URL('../standalone.html',import.meta.url),'utf8');
assert.ok(standalone.includes('window.AGENT_CURRICULUM = '+JSON.stringify(data)+';'),'Standalone content stale: npm run build:offline');
assert.ok(standalone.includes('function caseStudyMarkup(m)'),'Standalone UI not updated');
const workshopCore=readFileSync(new URL('../public/workshop-core.js',import.meta.url),'utf8');
const workshopGuide=readFileSync(new URL('../docs/TRACE-WORKSHOP.md',import.meta.url),'utf8');
const workbook=readFileSync(new URL('../public/downloads/task-execution-workbook.md',import.meta.url),'utf8');
const app=readFileSync(new URL('../public/app.js',import.meta.url),'utf8');
const preview=readFileSync(new URL('../preview.html',import.meta.url),'utf8');
const astro=readFileSync(new URL('../src/pages/index.astro',import.meta.url),'utf8');
for (const name of ['workshop-core.js']) {
  assert.ok(standalone.includes('root.WorkshopEngine='),'Workshop offline engine missing');
  assert.ok(preview.includes(name) && astro.includes(name),'Workshop source script missing from preview or Astro');
}
assert.ok(app.includes('function renderWorkshop()') && app.includes("case 'workshop'"),'Workshop UI route missing');
for (const id of ['baseline','injection','scope','approval','timeout','unknown-outcome','race','stale','red-regression']) {
  assert.ok(workshopCore.includes(`id:'${id}'`),`Workshop fixture missing: ${id}`);
  assert.ok(workshopGuide.includes(`\`${id}\``),`Guide missing fixture: ${id}`);
}
for(const part of ['TaskContract','Context','Tool Gateway','Policy','Execution','Evidence','DONE'])assert.ok(workbook.includes(part),`Workbook missing stage: ${part}`);

// v0.4: studio model, UI and workbook remain aligned with the portable build.
const studioCore=readFileSync(new URL('../public/context-studio-core.js',import.meta.url),'utf8');
const studioGuide=readFileSync(new URL('../docs/CONTEXT-CACHE-STUDIO.md',import.meta.url),'utf8');
const studioWorkbook=readFileSync(new URL('../public/downloads/context-cache-workbook.md',import.meta.url),'utf8');
for(const id of ['prefix-churn','tool-order','dynamic-prefix','stale-retrieval','lost-evidence','handoff','untrusted-elevation','budget','ttl-expired']){
  assert.ok(studioCore.includes(`id:'${id}'`),`Studio scenario missing: ${id}`);
  assert.ok(studioGuide.includes(`\`${id}\``)||studioGuide.includes(id),`Studio guide missing ${id}`);
  assert.ok(studioWorkbook.includes(`\`${id}\``),`Studio workbook missing ${id}`);
}
for(const id of ['REVISION_FRESH','EVIDENCE_BOUND','SOURCE_TRUST','SCOPE_POLICY','HANDOFF_INTEGRITY','CONTEXT_BUDGET']) {
  assert.ok(studioCore.includes(id)&&studioGuide.includes(id),`Studio invariant not documented: ${id}`);
}
for(const file of ['preview.html','src/pages/index.astro']){
  const html=readFileSync(new URL('../'+file,import.meta.url),'utf8');
  assert.ok(html.includes('context-studio-core.js')&&html.includes('#context-studio'),`Context Studio not linked in ${file}`);
}
assert.ok(standalone.includes('root.ContextStudioEngine='),'Standalone Context Studio model missing');
assert.ok(standalone.includes('function renderContextStudio()'),'Standalone Context Studio UI missing');
assert.ok(app.includes("case 'context-studio'"),'Context Studio route missing');

console.log(`Validated ${data.modules.length} modules / ${lessonIds.size} lessons / ${data.glossary.length} terms / ${data.labs.length} labs.`);

// v0.5 contract and UI: one advanced workshop, no new core lab.
const handoffCore=readFileSync(new URL('../public/compaction-core.js',import.meta.url),'utf8');
const handoffGuide=readFileSync(new URL('../docs/COMPACTION-HANDOFF.md',import.meta.url),'utf8');
const handoffWorkbook=readFileSync(new URL('../public/downloads/compaction-handoff-workbook.md',import.meta.url),'utf8');
for(const id of ['summary-evidence','revision-after-compaction','untrusted-relabel','approval-handoff','unknown-write','scope-proposal','handoff-contract','concurrent-change','misleading-green']){
 assert.ok(handoffCore.includes(`id:'${id}'`),`v0.5 case missing: ${id}`);
 assert.ok(handoffGuide.includes(`\`${id}\``),`v0.5 case not documented: ${id}`);
}
for(const id of ['CONTRACT_BINDING','REVISION_FRESH','RUNNER_RECEIPT','OPERATION_RECONCILED','TRUST_PROVENANCE','SCOPE_LOCK','APPROVAL_AUTHORITY']){
 assert.ok(handoffCore.includes(id)&&handoffGuide.includes(id),`v0.5 invariant undocumented: ${id}`);
}
for(const id of ['E01','E02','E03','E04','E05','E06','E07','E08','E09'])assert.ok(handoffWorkbook.includes(id),`v0.5 exercise missing: ${id}`);
assert.ok(app.includes('function renderCompactionStudio()')&&app.includes("case 'compaction-studio'"),'v0.5 route missing');
for(const file of ['preview.html','src/pages/index.astro']){
 const html=readFileSync(new URL('../'+file,import.meta.url),'utf8');
 assert.ok(html.includes('compaction-core.js')&&html.includes('#compaction-studio'),`v0.5 script or nav absent: ${file}`);
}
assert.ok(standalone.includes('root.CompactionEngine='),'v0.5 offline core missing');
assert.ok(standalone.includes('function renderCompactionStudio()'),'v0.5 offline route missing');
console.log('Validated v0.5 compaction & handoff route, 9 cases / 7 invariants / 9 workbook exercises.');

// v0.6: scoring view only; no change in curriculum and no real runtime.
const reliabilityCore=readFileSync(new URL('../public/reliability-core.js',import.meta.url),'utf8');
const reliabilityGuide=readFileSync(new URL('../docs/RELIABILITY-EVALUATION.md',import.meta.url),'utf8');
const reliabilityWorkbook=readFileSync(new URL('../public/downloads/reliability-evaluation-workbook.md',import.meta.url),'utf8');
for(const id of ['summary-evidence','revision-after-compaction','untrusted-relabel','approval-handoff','unknown-write','scope-proposal','handoff-contract','concurrent-change','misleading-green']) {
 assert.ok(reliabilityCore.includes(`'${id}'`),`v0.6 annotation missing: ${id}`);
 assert.ok(reliabilityGuide.includes('`'+id+'`'),`v0.6 ground-truth guide missing: ${id}`);
 assert.ok(reliabilityWorkbook.includes('`'+id+'`'),`v0.6 workbook case missing: ${id}`);
}
for (const id of ['TP','FP','FN','TN','evidence','inspectionUnits','recoveryUnits'])assert.ok(reliabilityCore.includes(id),`v0.6 core metric missing: ${id}`);
for (const html of [preview,astro,standalone]){
 assert.ok(html.includes('reliability-core.js')||html.includes('root.ReliabilityEngine='),'v0.6 core not wired into page');
 assert.ok(html.includes('reliability-eval'),'v0.6 reliability link missing');
}
assert.ok(app.includes('renderReliabilityEvaluation')&&standalone.includes('function renderReliabilityEvaluation()'),'v0.6 UI route missing');
for(const phrase of ['positive = must HOLD','13 HOLD / 5 ALLOW','not 18 statistically independent']) assert.ok(reliabilityGuide.includes(phrase),`v0.6 limitation missing: ${phrase}`);
console.log('Validated v0.6 reliability scoring: 9 paired cases / 18 labeled decisions / 4 policies / cost and provenance limits.');

// v0.7: same evaluation, sensitivity-only extensions, and portable Pages publishing.
const robustnessCore=readFileSync(new URL('../public/robustness-core.js',import.meta.url),'utf8');
const robustnessGuide=readFileSync(new URL('../docs/EVALUATION-ROBUSTNESS.md',import.meta.url),'utf8');
const robustnessWorkbook=readFileSync(new URL('../public/downloads/evaluation-robustness-workbook.md',import.meta.url),'utf8');
for(const key of ['revision-pressure','boundary-pressure','recovery-pressure','disputed-flipped','disputed-excluded']) {
 assert.ok(robustnessCore.includes(key),`v0.7 robustness variant missing: ${key}`);
 assert.ok(robustnessGuide.includes(key),`v0.7 variant undocumented: ${key}`);
}
for (const key of ['E01','E02','E03','E04'])assert.ok(robustnessWorkbook.includes(key),`v0.7 workbook missing exercise ${key}`);
assert.ok(app.includes('renderEvaluationRobustness')&&standalone.includes('root.RobustnessEngine='),'v0.7 UI or offline engine missing');
for(const html of [preview,astro])assert.ok(html.includes('#eval-robustness')&&html.includes('robustness-core.js'),'v0.7 route/core source missing');
const pagesScript=readFileSync(new URL('../scripts/build-pages.mjs',import.meta.url),'utf8');
const pagesWorkflow=readFileSync(new URL('../.github/workflows/pages.yml',import.meta.url),'utf8');
assert.ok(pagesScript.includes('standalone.html')&&pagesScript.includes('public/downloads'),'Pages artifact must match portable edition');
assert.ok(pagesWorkflow.includes('actions/upload-pages-artifact')&&pagesWorkflow.includes('actions/deploy-pages'),'Missing Pages deploy steps');
console.log('Validated v0.7 robustness: 4 distributions / 4 reviewed-label disputes / 3 grouped holdout folds and dependency-free Pages edition.');
