import { readFileSync,readdirSync,statSync } from 'node:fs';
import { join } from 'node:path';

const required=['index.html','app.js','styles.css','manifest.webmanifest','sw.js','netlify.toml','data/current.json','data/status.json','data/financial.json'];
for(const file of required)readFileSync(file,'utf8');

const current=JSON.parse(readFileSync('data/current.json','utf8'));
const status=JSON.parse(readFileSync('data/status.json','utf8'));
for(const key of ['critical_outcomes','decisions','my_actions','source_health']){
  const value=current[key];
  if(Array.isArray(value)?!value.length:!value||!Object.keys(value).length)throw new Error(`data/current.json ${key} must not be empty`);
}
if(!status.status||!status.generated_at||!status.period)throw new Error('data/status.json missing publication metadata');

const index=readFileSync('index.html','utf8');
for(const id of ['syncStatus','reloadBtn','publishStatus','protocol','financeMetrics','applyDates','resetDates']){
  if(!index.includes(`id="${id}"`))throw new Error(`Missing UI element ${id}`);
}
for(const token of ['data-view="protocol"','últimos 30 días','Los cinco pasos','FI Personal','No enviar automáticamente']){
  if(!index.includes(token))throw new Error(`Missing LifeOS protocol content: ${token}`);
}

const app=readFileSync('app.js','utf8');
for(const token of ["getJson('current.json')","getJson('status.json')","getJson('financial.json')","Promise.allSettled","qa('.tab')","applyCustomDates"]){
  if(!app.includes(token))throw new Error(`Missing static dashboard behavior: ${token}`);
}
for(const forbidden of ['graph.microsoft.com','OPENAI_API_KEY','READ_AI_API_KEY','/api/refresh','/api/analyze']){
  if(app.includes(forbidden))throw new Error(`Direct integration leaked into PWA: ${forbidden}`);
}

const sw=readFileSync('sw.js','utf8');
if(!sw.includes("ceo-lifeos-v6")||!sw.includes('/data/current.json')||!sw.includes('skipWaiting'))throw new Error('Service worker does not refresh the updated app shell');

const toml=readFileSync('netlify.toml','utf8');
if(toml.includes('functions =')||toml.includes('/api/*'))throw new Error('Netlify must remain a static viewer');

function walk(dir){
  for(const name of readdirSync(dir)){
    const path=join(dir,name);
    if(statSync(path).isDirectory())walk(path);
    else if(path.endsWith('.json'))JSON.parse(readFileSync(path,'utf8'));
  }
}
walk('data');
console.log(`CEO LifeOS validation OK | outcomes=${current.critical_outcomes.length} decisions=${current.decisions.length} actions=${current.my_actions.length} | protocol=30d`);
