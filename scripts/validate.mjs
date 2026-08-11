import { readFileSync,readdirSync,statSync } from 'node:fs';
import { join } from 'node:path';
const required=['index.html','app.js','bootstrap.js','refresh-v2.js','styles.css','manifest.webmanifest','sw.js','netlify.toml','data/current.json','netlify/functions/refresh.mjs','netlify/functions/diagnostics.mjs','netlify/functions/lib/refresh-core.mjs'];
for(const f of required)readFileSync(f,'utf8');
const current=JSON.parse(readFileSync('data/current.json','utf8'));
for(const key of ['critical_outcomes','decisions','my_actions'])if(!Array.isArray(current[key])||!current[key].length)throw new Error(`data/current.json ${key} must not be empty`);
const index=readFileSync('index.html','utf8');
if(!index.includes('/bootstrap.js')||!index.includes('/refresh-v2.js'))throw new Error('Verified refresh scripts are not wired in index.html');
const refresh=readFileSync('refresh-v2.js','utf8');
if(!refresh.includes("fetch('/api/refresh'"))throw new Error('Refresh button is not wired to /api/refresh');
const sw=readFileSync('sw.js','utf8');
if(!sw.includes("skipWaiting")||!sw.includes("/refresh-v2.js"))throw new Error('Service worker does not invalidate the refresh shell');
function walk(d){for(const x of readdirSync(d)){const p=join(d,x);if(statSync(p).isDirectory())walk(p);else if(p.endsWith('.json'))JSON.parse(readFileSync(p,'utf8'))}}
walk('data');
console.log('CEO LifeOS validation OK');
