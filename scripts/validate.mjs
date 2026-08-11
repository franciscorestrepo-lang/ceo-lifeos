import { readFileSync,readdirSync,statSync } from 'node:fs';
import { join } from 'node:path';
const required=['index.html','app.js','styles.css','manifest.webmanifest','sw.js','netlify.toml','data/current.json','data/status.json'];
for(const f of required)readFileSync(f,'utf8');
const current=JSON.parse(readFileSync('data/current.json','utf8'));
const status=JSON.parse(readFileSync('data/status.json','utf8'));
for(const key of ['critical_outcomes','decisions','my_actions','source_health']){const v=current[key];if(Array.isArray(v)?!v.length:!v||!Object.keys(v).length)throw new Error(`data/current.json ${key} must not be empty`)}
if(!status.status||!status.generated_at||!status.period)throw new Error('data/status.json missing publication metadata');
const index=readFileSync('index.html','utf8');
for(const id of ['refreshBtn','checkBtn','approveCalendarBtn','approveEmailsBtn','publishStatus'])if(!index.includes(`id="${id}"`))throw new Error(`Missing UI control ${id}`);
if(index.includes('Microsoft 365')||index.includes('msal-browser')||index.includes('/api/'))throw new Error('PWA must not require direct source integrations');
const app=readFileSync('app.js','utf8');
for(const token of ['raw.githubusercontent.com/franciscorestrepo-lang/ceo-lifeos/main','REFRESH_COMMAND','https://chatgpt.com/','data/current.json','data/status.json','startPolling','APROBAR CALENDARIO','APROBAR CORREOS'])if(!app.includes(token))throw new Error(`Missing ChatGPT/GitHub refresh wiring: ${token}`);
for(const forbidden of ['graph.microsoft.com','OPENAI_API_KEY','READ_AI_API_KEY','/api/refresh','/api/analyze'])if(app.includes(forbidden))throw new Error(`Direct integration leaked into PWA: ${forbidden}`);
const sw=readFileSync('sw.js','utf8');if(!sw.includes("ceo-lifeos-v5")||!sw.includes('raw.githubusercontent.com')||!sw.includes('skipWaiting'))throw new Error('Service worker is not configured for live GitHub data');
const toml=readFileSync('netlify.toml','utf8');if(toml.includes('functions =')||toml.includes('/api/*'))throw new Error('Netlify must remain a static viewer');
function walk(d){for(const x of readdirSync(d)){const p=join(d,x);if(statSync(p).isDirectory())walk(p);else if(p.endsWith('.json'))JSON.parse(readFileSync(p,'utf8'))}}walk('data');
console.log(`CEO LifeOS v5 validation OK | outcomes=${current.critical_outcomes.length} decisions=${current.decisions.length} actions=${current.my_actions.length} | status=${status.status}`);
