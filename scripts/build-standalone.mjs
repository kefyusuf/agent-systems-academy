import { readFileSync, writeFileSync } from 'node:fs';
const root=new URL('../',import.meta.url);
const read=name=>readFileSync(new URL(name,root),'utf8');
const inline=text=>text.replace(/<\/script/gi,'<\\/script');
let html=read('preview.html');
html=html.replace('<link rel="icon" href="./public/favicon.svg" type="image/svg+xml" />',
 `<link rel="icon" href="data:image/svg+xml;base64,${Buffer.from(read('public/favicon.svg')).toString('base64')}" type="image/svg+xml" />`);
html=html.replace('<link rel="stylesheet" href="./public/styles.css" />',`<style>\n${read('public/styles.css')}\n</style>`);
const scripts=[];
for(const name of ['curriculum','labs-core','workshop-core','context-studio-core','compaction-core','reliability-core','robustness-core','app']){
 const target=`<script src="./public/${name}.js" defer></script>`;
 if(!html.includes(target))throw new Error(`Missing script placeholder: ${name}`);
 html=html.replace(target,'');
 scripts.push(`<script>\n${inline(read(`public/${name}.js`))}\n</script>`);
}
// Inline scripts do not honor `defer`. Place them AFTER #page, not in <head>,
// so the app can mount even when the HTML file is opened directly via file://.
if(!html.includes('</body>'))throw new Error('Missing closing body');
html=html.replace('</body>',`${scripts.join('\n')}\n</body>`);
html=html.replace('<!-- Static portable preview. Source is src/pages/index.astro. -->',
 '<!-- Single-file, zero-install preview (Markdown worksheet downloads require the full ZIP). -->');
writeFileSync(new URL('standalone.html',root),html);
console.log(`Built local standalone HTML: ${Buffer.byteLength(html).toLocaleString()} bytes`);
