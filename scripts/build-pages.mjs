/* GitHub Pages deployment artifact, intentionally dependency-free.
 * The Astro source stays in the repo. The published page is the tested portable
 * build of the same browser app, because the remote npm build was not verified.
 */
import { cpSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
const root=new URL('../',import.meta.url);
const out=new URL('../_site/',import.meta.url);
rmSync(out,{recursive:true,force:true});
mkdirSync(out,{recursive:true});
const html=readFileSync(new URL('standalone.html',root),'utf8');
if(!html.includes('root.RobustnessEngine=')||!html.includes('renderEvaluationRobustness()'))throw new Error('Stale v0.7 portable source');
writeFileSync(new URL('index.html',out),html);
mkdirSync(new URL('public/',out),{recursive:true});
cpSync(new URL('public/downloads/',root),new URL('public/downloads/',out),{recursive:true});
writeFileSync(new URL('.nojekyll',out),'');
console.log('Built _site/ (offline single-page Pages edition + downloadable worksheets)');
