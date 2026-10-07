(function(){
'use strict';

var state={current:null,status:null,financial:null,range:'30',custom:null,visibleTransactions:60};

function q(s){return document.querySelector(s)}
function qa(s){return Array.prototype.slice.call(document.querySelectorAll(s))}
function esc(v){return String(v==null?'':v).replace(/[&<>"']/g,function(m){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]})}
function money(v){return new Intl.NumberFormat('es-CO',{style:'currency',currency:'COP',maximumFractionDigits:0}).format(Number(v)||0)}
function fmt(v){if(!v)return '—';try{return new Date(v).toLocaleString('es-CO',{dateStyle:'medium',timeStyle:'short'})}catch(e){return v}}
function metric(label,value){return '<div class="metric"><strong>'+esc(value)+'</strong><span>'+esc(label)+'</span></div>'}
function row(title,meta,right,cls){return '<article class="row '+(cls||'')+'"><div><div class="row-title">'+esc(title)+'</div><div class="row-meta">'+esc(meta||'')+'</div></div>'+(right?'<div class="row-right">'+right+'</div>':'')+'</article>'}
function badge(v){var x=String(v||'').toUpperCase();return '<span class="badge '+x.toLowerCase().replace(/[^a-z0-9]+/g,'-')+'">'+esc(x)+'</span>'}

async function getJson(name){
  var r=await fetch('/data/'+name+'?v='+Date.now(),{cache:'no-store',credentials:'same-origin'});
  if(!r.ok)throw new Error('HTTP '+r.status+' al cargar '+name);
  return await r.json();
}

function renderHome(){
  var d=state.current||{};
  var meta=d.meta||{};
  q('#lifeStatus').textContent=meta.status||d.overall_status||'AT_RISK';
  q('#score').textContent=meta.score==null?'—':meta.score;
  q('#summary').textContent=meta.executive_summary||d.executive_summary||'Revisión ejecutiva disponible.';
  var crit=d.critical_outcomes||[];
  var dec=d.decisions||[];
  var act=d.my_actions||[];
  var del=d.delegated_actions||d.delegations||[];
  q('#headline').innerHTML=[
    metric('Resultados',crit.length),
    metric('Decisiones',dec.length),
    metric('Mis acciones',act.length),
    metric('Delegadas',del.length)
  ].join('');
  q('#critical').innerHTML=crit.length?crit.map(function(x){return row(x.title||x.expected_result,(x.company||'')+' · '+(x.metric||x.dod||''),badge(x.priority||'P2'))}).join(''):row('Sin resultados críticos','');
  q('#decisions').innerHTML=dec.length?dec.map(function(x){return row(x.title||x.decision,(x.company||'')+' · '+(x.metric||x.dod||''),badge(x.priority||'P2'))}).join(''):row('Sin decisiones','');
}

function renderFocus(){
  var d=state.current||{};
  var a=d.my_actions||[];
  var del=d.delegated_actions||d.delegations||[];
  var rad=d.pending_radar||[];
  q('#actions').innerHTML=a.length?a.map(function(x){return row(x.title||x.action,(x.company||'')+' · '+(x.date||'')+' · '+(x.metric||''),badge(x.priority||'P2'))}).join(''):row('Sin acciones','');
  q('#delegations').innerHTML=del.length?del.map(function(x){return row(x.task||x.title,(x.company||'')+' · '+(x.owner||'')+' · '+(x.date||'')+' · '+(x.dod||''))}).join(''):row('Sin delegaciones','');
  q('#radar').innerHTML=rad.length?rad.map(function(x){return row(x.title,(x.company||'')+' · '+(x.metric||''),badge(x.trend||x.priority||'WATCH'))}).join(''):row('Sin radar','');
}

function renderSources(){
  var d=state.current||{};
  var sh=d.source_health||{};
  q('#sourceHealth').innerHTML=Object.keys(sh).length?Object.keys(sh).map(function(k){
    var v=sh[k],st=typeof v==='string'?v:(v.status||'—'),notes=typeof v==='object'?(v.notes||v.note||''):'';
    return row(k.replace(/_/g,' '),notes,badge(st));
  }).join(''):row('Sin información de fuentes','');
  var s=state.status||{};
  q('#publishStatus').innerHTML=[
    row('Última revisión',fmt((d.meta||{}).generated_at)),
    row('Estado publicación',s.status||s.publish_status||'Disponible'),
    row('Commit',(s.commit_sha||'—'))
  ].join('');
}

function iso(d){return d.toISOString().slice(0,10)}
function financeBounds(){
  var tx=(state.financial&&state.financial.transactions)||[];
  if(!tx.length)return [null,null];
  var dates=tx.map(function(x){return x.date}).filter(Boolean).sort();
  var end=state.custom?state.custom[1]:((state.financial.meta||{}).history_end||dates[dates.length-1]);
  var start;
  if(state.custom)start=state.custom[0];
  else if(state.range==='all')start=dates[0];
  else{
    var d=new Date(end+'T12:00:00');
    d.setDate(d.getDate()-Number(state.range)+1);
    start=iso(d);
  }
  return [start,end];
}
function aggregate(rows,key){
  var o={};
  rows.forEach(function(x){var k=key(x);o[k]=(o[k]||0)+(Number(x.amount)||0)});
  return Object.keys(o).map(function(k){return {k:k,v:o[k]}})
}
function draw(canvas,rows){
  if(!canvas)return;
  var dpr=window.devicePixelRatio||1,w=canvas.clientWidth||500,h=250;
  canvas.width=w*dpr;canvas.height=h*dpr;
  var c=canvas.getContext('2d');c.setTransform(dpr,0,0,dpr,0,0);c.clearRect(0,0,w,h);
  if(!rows.length){c.fillStyle='#8fa4bf';c.font='13px system-ui';c.fillText('Sin datos para este período',18,34);return}
  var max=Math.max.apply(null,rows.map(function(x){return x.v}))||1;
  var left=28,bottom=36,usable=w-left-14,gap=Math.max(2,Math.min(8,usable/(rows.length*5))),bw=Math.max(3,(usable-gap*(rows.length-1))/rows.length);
  rows.forEach(function(x,i){
    var bh=(h-bottom-28)*x.v/max,xp=left+i*(bw+gap),yp=h-bottom-bh;
    c.fillStyle='#62a8ff';c.fillRect(xp,yp,bw,bh);
    if(rows.length<=12||i%Math.ceil(rows.length/10)===0){
      c.fillStyle='#8fa4bf';c.font='10px system-ui';c.textAlign='center';c.fillText(String(x.k).slice(0,10),xp+bw/2,h-18);
    }
  });
}
function txKind(x){
  var method=String(x.method||'').toLowerCase();
  var type=String(x.type||x.transaction_type||'').toLowerCase();
  var direction=String(x.direction||'').toLowerCase();
  var category=String(x.category||'').toLowerCase();
  var merchant=String(x.merchant||x.description||'').toLowerCase();
  if(/inflow|income|ingreso/.test(direction)||/ingreso|income/.test(type+' '+method))return 'income';
  if(/pago de obligaci[oó]n|debt payment|credit card payment/.test(category)||/pago.*(tarjeta|cr[eé]dito)|payment.*(card|credit)/.test(merchant))return 'obligation';
  if(/transfer/.test(type+' '+method+' '+category)||/bre-b/.test(type+' '+method))return 'transfer';
  if(x.is_consumption===true)return 'expense';
  if(x.is_consumption===false)return 'unclassified';
  if(/compra|purchase|d[eé]bito|cr[eé]dito|debit|credit/.test(type+' '+method))return 'expense';
  return 'unclassified';
}
function txScope(x){
  var s=String(x.scope||x.classification||'').toLowerCase();
  if(/personal/.test(s))return 'personal';
  if(/corpor|empresa|allup|teky|sports crowd/.test(s))return 'corporate';
  return 'confirm';
}
function fillCategoryFilter(rows){
  var sel=q('#financeCategory'); if(!sel)return;
  var prev=sel.value;
  var cats=Array.from(new Set(rows.map(function(x){return x.category||'Sin categoría'}))).sort(function(a,b){return a.localeCompare(b,'es')});
  sel.innerHTML='<option value="all">Todas las categorías</option>'+cats.map(function(x){return '<option value="'+esc(x)+'">'+esc(x)+'</option>'}).join('');
  if(cats.indexOf(prev)>=0)sel.value=prev;
}
function renderFinance(){
  var f=state.financial;
  if(!f){q('#financeCoverage').textContent='Sin datos financieros';return}
  var all=f.transactions||[];
  if(!all.length){q('#financeCoverage').textContent='Sin movimientos';return}
  fillCategoryFilter(all);
  var b=financeBounds(),start=b[0],end=b[1];
  if(!start||!end){q('#financeCoverage').textContent='Sin movimientos';return}
  var scope=q('#financeScope').value,kind=q('#financeKind').value,category=q('#financeCategory').value;
  var inRange=all.filter(function(x){return x.date>=start&&x.date<=end});
  var rows=inRange.filter(function(x){
    var s=txScope(x),k=txKind(x);
    return (scope==='all'||scope===s)&&(kind==='all'||kind===k)&&(category==='all'||(x.category||'Sin categoría')===category);
  });
  var expenses=rows.filter(function(x){return txKind(x)==='expense'});
  var transfers=rows.filter(function(x){return txKind(x)==='transfer'});
  var income=rows.filter(function(x){return txKind(x)==='income'});
  var obligations=rows.filter(function(x){return txKind(x)==='obligation'});
  var unknown=rows.filter(function(x){return txKind(x)==='unclassified'});
  var sum=function(list){return list.reduce(function(a,x){return a+(Number(x.amount)||0)},0)};
  var days=Math.max(1,Math.round((new Date(end+'T12:00:00')-new Date(start+'T12:00:00'))/86400000)+1);
  var m=f.meta||{},coverageStart=m.history_start||start,coverageEnd=m.history_end||end;
  q('#financeCoverage').textContent='Datos: '+coverageStart+' → '+coverageEnd+' · Filtro: '+start+' → '+end;
  q('#financeMetrics').innerHTML=[
    metric('Gastos identificados',money(sum(expenses))),
    metric('Transferencias',money(sum(transfers))),
    metric('Ingresos',money(sum(income))),
    metric('Pagos de obligaciones',money(sum(obligations))),
    metric('Por clasificar',money(sum(unknown))),
    metric('Movimientos filtrados',rows.length)
  ].join('');
  var quality=m.data_quality==='PARTIAL_HISTORY'||(m.coverage_days&&m.coverage_days<30);
  q('#financeCompare').textContent=(quality?'Histórico parcial; no se comparan periodos incompletos. ':'')+
    (unknown.length?unknown.length+' movimiento(s) requieren clasificación. ':'')+
    'Rango real disponible: '+coverageStart+' a '+coverageEnd+'.';
  var daily=aggregate(expenses,function(x){return x.date}).sort(function(a,b){return a.k.localeCompare(b.k)});
  var cats=aggregate(expenses,function(x){return x.category||'Sin categoría'}).sort(function(a,b){return b.v-a.v});
  requestAnimationFrame(function(){draw(q('#trendChart'),daily);draw(q('#categoryChart'),cats)});
  var alerts=f.alerts||[];
  q('#financeAlerts').innerHTML=alerts.length?alerts.map(function(x){return row(x.title,x.recommendation||'',badge(x.severity||'INFO'),x.severity==='HIGH'?'danger':'')}).join(''):row('Sin alertas','');
  var ordered=rows.slice().sort(function(a,b){return b.date.localeCompare(a.date)});
  var limit=state.visibleTransactions||60;
  q('#transactions').innerHTML=ordered.length?ordered.slice(0,limit).map(function(x){
    var label={expense:'Gasto',transfer:'Transferencia',income:'Ingreso',obligation:'Obligación',unclassified:'Por clasificar'}[txKind(x)];
    return row(x.merchant||'Movimiento',x.date+' · '+(x.category||'Sin categoría')+' · '+(x.method||'')+' · '+label+' · '+(x.scope||'Por confirmar'),'<strong>'+money(x.amount)+'</strong>');
  }).join(''):'<article class="row"><div class="row-title">Sin movimientos para estos filtros</div></article>';
  q('#transactionCount').textContent='Mostrando '+Math.min(ordered.length,limit)+' de '+ordered.length+' movimientos';
  q('#loadMoreTransactions').hidden=ordered.length<=limit;
  q('#startDate').value=start;q('#endDate').value=end;
}

function renderAll(){renderHome();renderFocus();renderSources();renderFinance()}

async function load(){
  q('#syncStatus').textContent='Actualizando datos...';
  var res=await Promise.allSettled([getJson('current.json'),getJson('status.json'),getJson('financial.json')]);
  if(res[0].status==='fulfilled')state.current=res[0].value;
  if(res[1].status==='fulfilled')state.status=res[1].value;
  if(res[2].status==='fulfilled')state.financial=res[2].value;
  renderAll();
  var errors=res.map(function(x,i){return x.status==='rejected'?['revisión','estado de publicación','finanzas'][i]+': '+x.reason.message:null}).filter(Boolean);
  q('#syncDot').className='dot '+(errors.length?'error':'ok');
  q('#syncStatus').textContent=errors.length?'Carga parcial · '+errors.join(' · '):'Actualizado · '+fmt((state.current.meta||{}).generated_at);
}

qa('.tab').forEach(function(b){b.addEventListener('click',function(){
  qa('.tab').forEach(function(x){x.classList.remove('active')});
  qa('.view').forEach(function(x){x.classList.remove('active')});
  b.classList.add('active');q('#'+b.getAttribute('data-view')).classList.add('active');
  if(b.getAttribute('data-view')==='finance')setTimeout(renderFinance,20);
})});
qa('.seg').forEach(function(b){b.addEventListener('click',function(){
  state.range=b.getAttribute('data-range');state.custom=null;state.visibleTransactions=60;
  qa('.seg').forEach(function(x){x.classList.toggle('active',x===b)});
  renderFinance();
})});
function applyCustomDates(){
  var a=q('#startDate').value,b=q('#endDate').value;
  if(!a||!b){q('#financeCompare').textContent='Selecciona fecha inicial y fecha final.';return}
  if(a>b){q('#financeCompare').textContent='La fecha inicial no puede ser posterior a la final.';return}
  state.custom=[a,b];state.visibleTransactions=60;
  state.range='custom';
  qa('.seg').forEach(function(x){x.classList.remove('active')});
  renderFinance();
  q('#financeCompare').textContent='Rango personalizado aplicado: '+a+' → '+b+'. '+(((state.financial||{}).transactions||[]).filter(function(x){return x.scope==='Personal'&&x.date>=a&&x.date<=b}).length)+' movimientos encontrados.';
}
q('#applyDates').addEventListener('click',applyCustomDates);
q('#startDate').addEventListener('keydown',function(e){if(e.key==='Enter')applyCustomDates()});
q('#endDate').addEventListener('keydown',function(e){if(e.key==='Enter')applyCustomDates()});
q('#resetDates').addEventListener('click',function(){
  state.custom=null;state.range='30';state.visibleTransactions=60;
  qa('.seg').forEach(function(x){x.classList.toggle('active',x.getAttribute('data-range')==='30')});
  renderFinance();
});
q('#reloadBtn').addEventListener('click',load);
['#financeScope','#financeKind','#financeCategory'].forEach(function(s){q(s).addEventListener('change',function(){state.visibleTransactions=60;renderFinance()})});
q('#loadMoreTransactions').addEventListener('click',function(){state.visibleTransactions=(state.visibleTransactions||60)+60;renderFinance()});
window.addEventListener('resize',function(){if(q('#finance').classList.contains('active'))renderFinance()});
load();
})();