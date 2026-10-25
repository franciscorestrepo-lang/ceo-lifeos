import assert from 'node:assert/strict';
import { readFileSync,readdirSync,statSync,existsSync } from 'node:fs';
import { join } from 'node:path';
import { Script } from 'node:vm';

const read=f=>readFileSync(f,'utf8');
for(const f of ['index.html','app.js','styles.css','manifest.webmanifest','sw.js','netlify.toml','data/current.json','data/status.json'])read(f);
const d=JSON.parse(read('data/current.json')),s=JSON.parse(read('data/status.json'));
const schema=JSON.parse(read('data/schema.json'));
for(const key of schema.required)assert.ok(Object.hasOwn(d,key),'Missing current key: '+key);
for(const [key,definition] of Object.entries(schema.properties)){
 if(definition.type==='array')assert.ok(Array.isArray(d[key]),'Expected array: '+key);
 if(definition.type==='object')assert.ok(d[key]&&typeof d[key]==='object'&&!Array.isArray(d[key]),'Expected object: '+key);
 if(definition.maxItems)assert.ok(d[key].length<=definition.maxItems,'Too many items: '+key);
}
for(const k of ['critical_outcomes','decisions','my_actions'])assert.ok(d[k].length,'Empty '+k);
assert.equal(d.meta.scope,'OPERATIONS');assert.equal(s.scope,'OPERATIONS');
assert.equal(d.meta.data_revision,s.data_revision);assert.ok(d.meta.data_revision);
assert.equal(d.meta.period,s.period);assert.equal(d.meta.planning_period,s.planning_period);
assert.equal(d.meta.generated_at,s.generated_at);
assert.deepEqual(JSON.parse(read('data/weekly/'+d.meta.period+'.json')),d);
assert.equal(d.meta.period,'2026-W43');assert.equal(d.meta.planning_period,'2026-W44');

const restricted=/(financ|cartera|factur|tarifa|\bcaja\b|liquid|rentabil|margen|cr[eé]dito|desembolso|\bpag[oa]s?\b|\bbanco\b|\bCOP\b|\bUSD\b|\$|economics|econ[oó]mic|finagro|budget|income|expense|consumption|transfer|forecast|markup|tributari|bonific|incentiv|salario|sueldo|honorario|presupuesto|recaudo)/i;
export function assertOperational(value,path='data'){
 if(typeof value==='string')assert.ok(!restricted.test(value),'Restricted content at '+path);
 else if(Array.isArray(value))value.forEach((v,i)=>assertOperational(v,path+'['+i+']'));
 else if(value&&typeof value==='object')for(const [k,v] of Object.entries(value)){assert.ok(!restricted.test(k),'Restricted key at '+path+'.'+k);assertOperational(v,path+'.'+k)}
}
function walk(dir){for(const name of readdirSync(dir)){const path=join(dir,name);if(statSync(path).isDirectory())walk(path);else if(path.endsWith('.json')&&name!=='schema.json')assertOperational(JSON.parse(read(path)),path)}}
walk('data');assert.equal(existsSync('data/financial.json'),false);
const html=read('index.html'),app=read('app.js'),old=read('fixed.html');
for(const id of ['syncStatus','reloadBtn','publishStatus','protocol','critical','actions','sourceHealth','coverageNotice'])assert.ok(html.includes('id="'+id+'"'),'Missing UI '+id);
for(const word of ['data-view="protocol"','últimos 30 días','Los cinco pasos','No enviar automáticamente'])assert.ok(html.includes(word),'Missing protocol '+word);
for(const value of ['data-view="finance"','Financial Control','financeMetrics','FI Personal'])assert.ok(!html.includes(value),'Removed section reappeared');
for(const value of ['financial.json','renderFinance','applyCustomDates','raw.githubusercontent.com','graph.microsoft.com','OPENAI_API_KEY','READ_AI_API_KEY'])assert.ok(!app.includes(value),'Disallowed frontend dependency '+value);
assert.ok(!/finance|financial|financiera/i.test(old),'Legacy page retains removed content');
assert.ok(app.includes("getJson('current.json')")&&app.includes("getJson('status.json')"));
new Script(app,{filename:'app.js'});
const sw=read('sw.js');assert.ok(sw.includes('ceo-lifeos-v7-operations')&&sw.includes('skipWaiting')&&sw.includes("startsWith('/data/')"));
const config=read('netlify.toml');assert.ok(config.includes('command = "npm run build"'));assert.ok(!config.includes('functions ='));
console.log('CEO LifeOS operational validation OK | '+d.meta.period+' -> '+d.meta.planning_period+' | operational public summary with private detail');
