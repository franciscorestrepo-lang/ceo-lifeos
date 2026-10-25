import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';
import {assertOperational} from './validate.mjs';

const read=f=>readFileSync(f,'utf8'),html=read('index.html');
function element(id){
 const values=new Set(),attributes=new Map(),events={};
 return {id,events,attributes,textContent:'',innerHTML:'',disabled:false,
 classList:{add:x=>values.add(x),remove:x=>values.delete(x),contains:x=>values.has(x)},
 getAttribute:k=>attributes.get(k),setAttribute:(k,v)=>attributes.set(k,v),removeAttribute:k=>attributes.delete(k),
 addEventListener:(name,handler)=>events[name]=handler};
}
const els=new Map([...html.matchAll(/id="([^"]+)"/g)].map(m=>[m[1],element(m[1])]));
const tabs=['home','focus','sources','protocol'].map(id=>{const b=element('tab-'+id);b.setAttribute('data-view',id);return b});
const views=['home','focus','sources','protocol'].map(id=>els.get(id));
let mismatch=false;const requests=[];
const document={querySelector:s=>els.get(s.slice(1))||null,querySelectorAll:s=>s==='.tab'?tabs:s==='.view'?views:[]};
const fetch=async url=>{requests.push(url);const path=url.split('?')[0].slice(1);let data=path==='build-info.json'?{commit_sha:'test-build-sha',deploy_id:'test-deploy'}:JSON.parse(read(path));if(mismatch&&path==='data/status.json')data.data_revision='different';return{ok:true,status:200,json:async()=>data}};
runInNewContext(read('app.js'),{document,fetch,navigator:{},Date,console,URL});
await new Promise(r=>setImmediate(r));
assert.match(els.get('syncStatus').textContent,/Actualizado/);
assert.match(els.get('period').textContent,/W43/);
assert.match(els.get('planningPeriod').textContent,/W44/);
assert.equal((els.get('critical').innerHTML.match(/class="row-title"/g)||[]).length,3);
assert.equal((els.get('actions').innerHTML.match(/class="row-title"/g)||[]).length,1);
assert.match(els.get('privateReportLink').getAttribute('href'),/^https:\/\/aliansapconsultingsas-my\.sharepoint\.com\//);
assert.ok(requests.every(x=>/^\/(data\/(current|status)\.json|build-info\.json)\?/.test(x)));
for(const b of tabs){b.events.click();assert.ok(els.get(b.getAttribute('data-view')).classList.contains('active'))}
mismatch=true;await els.get('reloadBtn').events.click();assert.match(els.get('syncStatus').textContent,/no corresponden/);
assert.throws(()=>assertOperational({financial_control:{transactions:[{amount:1}]}}));
assert.throws(()=>assertOperational({note:'Cartera y pago USD 123'}));
console.log('UI smoke OK | four views render, no removed requests, mismatched snapshots rejected, restricted data rejected');
