import { readFileSync, writeFileSync } from 'node:fs';
const data = JSON.parse(readFileSync(new URL('../content/curriculum.json', import.meta.url), 'utf8'));
const output = '/* Generated from content/curriculum.json. Run npm run sync:content after edits. */\nwindow.AGENT_CURRICULUM = ' + JSON.stringify(data) + ';\n';
writeFileSync(new URL('../public/curriculum.js', import.meta.url), output);
console.log(`Synchronized ${data.modules.length} modules to public/curriculum.js`);
