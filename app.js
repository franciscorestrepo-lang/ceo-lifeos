(function(){
'use strict';
var state={current:null,status:null,build:null};
function q(s){return document.querySelector(s)}
function qa(s){return Array.prototype.slice.call(document.querySelectorAll(s))}
function esc(v){return String(v==null?'':v).replace(/[&<>"']/g,function(m){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]})}
function fmt(v){return v?new Date(v).toLocaleString('es-CO',{dateStyle:'medium',timeStyle:'short',timeZone:'America/Bogota'}):'No disponible'}
var labels={PARTIAL:'Cobertura parcial',OK:'Consultada',P0:'Prioridad inmediata',P1:'Prioridad alta',P2:'Seguimiento',IMPROVED:'Avance',UNCHANGED:'Sin cambio',NEW:'Nuevo',WATCH:'En seguimiento',EXISTING:'Bloque existente',PROPOSED:'Por programar',DRAFT_READY:'Borrador preparado'};
function badge(v){return '<span class="badge '+esc(String(v||'WATCH').toLowerCase().replace(/[^a-z0-9]+/g,'-'))+'">'+esc(labels[v]||v||'En seguimiento')+'</span>'}
function row(title,meta,right){return '<article class="row"><div><div class="row-title">'+esc(title)+'</div><div class="row-meta">'+esc(meta||'')+'</div></div>'+(right?'<div class="row-right">'+right+'</div>':'')+'</article>'}
function metric(label,value){return '<div class="metric"><strong>'+esc(value)+'</strong><span>'+esc(label)+'</span></div>'}
async function getJson(name){var r=await fetch('/data/'+name+'?v='+Date.now(),{cache:'no-store',credentials:'same-origin'});if(!r.ok)throw new Error('HTTP '+r.status+' al cargar '+name);return r.json()}
function render(){
 var d=state.current,m=d.meta,s=state.status;
 q('#lifeStatus').textContent='Seguimiento operativo';
 q('#period').textContent=m.period.replace('2026-','');
 q('#planningPeriod').textContent='Plan '+m.planning_period.replace('2026-','');
 q('#periodLabel').textContent='Ventana: '+m.window_start+' a '+m.window_end+' · Hora de Bogotá';
 q('#summary').textContent=d.executive_summary;
 q('#coverageNotice').textContent=d.coverage_note;
 var privateUrl=new URL(d.private_report_url);if(privateUrl.origin==='https://aliansapconsultingsas-my.sharepoint.com')q('#privateReportLink').setAttribute('href',privateUrl.href);
 q('#headline').innerHTML=[metric('Ámbitos',d.critical_outcomes.length),metric('Decisiones',d.decisions.length),metric('Acciones CEO',d.my_actions.length),metric('Delegaciones',d.delegated_actions.length)].join('');
 q('#critical').innerHTML=d.critical_outcomes.map(function(x){return row(x.title,x.company+' · '+x.metric,badge(x.trend))}).join('');
 q('#decisions').innerHTML=d.decisions.map(function(x){return row(x.title,x.company+' · '+x.metric,badge(x.priority))}).join('');
 q('#actions').innerHTML=d.my_actions.map(function(x){return row(x.title,[x.company,x.date,x.metric].join(' · '),badge(x.event_status))}).join('');
 q('#delegations').innerHTML=d.delegated_actions.length?d.delegated_actions.map(function(x){return row(x.task,[x.company,x.owner,x.date,x.dod].join(' · '),badge(x.status))}).join(''):row('Responsables y delegaciones','Consultar la revisión privada para ver el detalle.');
 q('#radar').innerHTML=d.pending_radar.map(function(x){return row(x.title,x.company+' · '+x.metric,badge(x.priority||'WATCH'))}).join('');
 q('#sourceHealth').innerHTML=Object.keys(d.source_health).map(function(k){var v=d.source_health[k];return row(v.label||k,v.notes,badge(v.status))}).join('');
 q('#publishStatus').innerHTML=[
 row('Corte de la revisión',fmt(m.generated_at)),
 row('Periodo',m.period+' → '+m.planning_period),
 row('Revisión de datos',m.data_revision),
 row('Estado de cobertura',s.coverage_status==='PARTIAL'?'Parcial; límites detallados en Fuentes':'Consultada'),
 row('Versión publicada',state.build&&state.build.commit_sha?state.build.commit_sha:'Identificador de build no disponible'),
 row('Despliegue',state.build&&state.build.deploy_id?state.build.deploy_id:'Identificador de despliegue no disponible')
 ].join('');
}
async function load(){
 q('#reloadBtn').disabled=true;q('#syncStatus').textContent='Actualizando revisión...';
 try{
  var values=await Promise.all([getJson('current.json'),getJson('status.json')]);
  var d=values[0],s=values[1];
  if(!d.meta||d.meta.scope!=='OPERATIONS'||d.meta.data_revision!==s.data_revision||d.meta.period!==s.period||d.meta.planning_period!==s.planning_period)throw new Error('Los archivos de revisión no corresponden a la misma versión');
  ['critical_outcomes','decisions','my_actions','delegated_actions','pending_radar'].forEach(function(k){if(!Array.isArray(d[k]))throw new Error('Formato no válido: '+k)});
  state.current=d;state.status=s;
  try{var r=await fetch('/build-info.json?v='+Date.now(),{cache:'no-store',credentials:'same-origin'});state.build=r.ok?await r.json():null}catch(e){state.build=null}
  render();
  q('#syncDot').className='dot '+(s.coverage_status==='PARTIAL'?'partial':'ok');
  q('#syncStatus').textContent='Actualizado · '+fmt(d.meta.generated_at)+(s.coverage_status==='PARTIAL'?' · cobertura parcial':'');
 }catch(e){
  q('#syncDot').className='dot error';q('#syncStatus').textContent='No se pudo actualizar · '+e.message;
  if(!state.current){q('#lifeStatus').textContent='Revisión no disponible';q('#summary').textContent='Revisa tu conexión y pulsa Actualizar. No se presenta un corte antiguo como vigente.'}
 }finally{q('#reloadBtn').disabled=false}
}
qa('.tab').forEach(function(b){b.addEventListener('click',function(){
 qa('.tab').forEach(function(x){x.classList.remove('active');x.removeAttribute('aria-current')});
 qa('.view').forEach(function(x){x.classList.remove('active')});
 b.classList.add('active');b.setAttribute('aria-current','page');q('#'+b.getAttribute('data-view')).classList.add('active');
})});
q('#reloadBtn').addEventListener('click',load);
if('serviceWorker' in navigator){navigator.serviceWorker.register('/sw.js',{updateViaCache:'none'}).catch(function(){})}
load();
})();
