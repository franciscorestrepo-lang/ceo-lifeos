const $ = (s) => document.querySelector(s);
let deferredPrompt;

async function loadData(){
  const fallback = await fetch('/data/current.json').then(r=>r.json());
  try{
    const res = await fetch('/.netlify/functions/dashboard-data',{cache:'no-store'});
    if(!res.ok) throw new Error('Function unavailable');
    return await res.json();
  }catch(e){ return fallback; }
}

function badge(priority){ return `<span class="priority ${priority}">${priority}</span>`; }
function render(data){
  $('#week-title').textContent = data.meta.week;
  $('#week-status').textContent = data.meta.status;
  $('#last-update').textContent = `Actualizado ${new Date(data.meta.generatedAt).toLocaleString('es-CO')}`;
  $('#capacity').textContent = `${data.meta.capacityUsed}%`;
  $('#capacity-bar').style.width = `${Math.min(data.meta.capacityUsed,100)}%`;
  $('#dispersion').textContent = data.meta.dispersion;
  $('#decision-count').textContent = data.decisions.filter(d=>d.status!=='Aprobada').length;
  $('#critical-risk-count').textContent = data.risks.filter(r=>r.impact==='Crítico').length;
  $('#critical-outcomes').innerHTML = data.criticalOutcomes.map(o=>`<article class="outcome-card"><div style="display:flex;justify-content:space-between;gap:8px"><span class="company-tag">${o.company}</span>${badge(o.priority)}</div><h3>${o.title}</h3><div class="outcome-meta"><span>${o.owner}</span><span>${o.due}</span></div></article>`).join('');
  $('#francisco-actions').innerHTML = data.franciscoActions.map(a=>`<div class="list-item">${badge(a.priority)}<div><b>${a.action}</b><small>${a.company} · ${a.done}</small></div><small>${a.due}<br>${a.duration}</small></div>`).join('');
  $('#calendar-preview').innerHTML = data.calendar.slice(0,5).map(c=>`<div class="list-item"><span class="company-tag">${c.date}</span><div><b>${c.title}</b><small>${c.time}</small></div></div>`).join('');
  $('#company-grid').innerHTML = data.companies.map(c=>`<article class="company-card"><div class="health-row"><div><span class="company-tag">${c.status}</span><h2>${c.name}</h2></div><div class="health">${c.health}</div></div><dl><dt>Foco</dt><dd>${c.focus}</dd><dt>Caja</dt><dd>${c.cash}</dd><dt>Riesgo</dt><dd>${c.risk}</dd></dl></article>`).join('');
  $('#decision-table').innerHTML = `<table><thead><tr><th>ID</th><th>Compañía</th><th>Decisión</th><th>Fecha</th><th>Impacto</th><th>Recomendación</th></tr></thead><tbody>${data.decisions.map(d=>`<tr><td>${d.id}</td><td>${d.company}</td><td>${d.decision}</td><td>${d.due}</td><td>${d.impact}</td><td>${d.recommendation}</td></tr>`).join('')}</tbody></table>`;
  $('#risk-grid').innerHTML = data.risks.map(r=>`<article class="risk-card ${r.impact==='Crítico'?'critical':''}"><span class="company-tag">${r.company}</span><h3>${r.risk}</h3><p>Probabilidad: <b>${r.probability}</b> · Impacto: <b>${r.impact}</b></p><p><b>Mitigación:</b> ${r.mitigation}</p></article>`).join('');
  $('#calendar-list').innerHTML = data.calendar.map(c=>`<div class="timeline-item"><div class="timeline-time">${c.date}<br><small>${c.time}</small></div><div><b>${c.title}</b><p class="muted">${c.id}</p></div><span class="pill">${c.status}</span></div>`).join('');
  const groups=[['Calendario',data.approval.calendar],['Correos',data.approval.emails],['Monday',data.approval.monday],['Decisiones',data.approval.decisions]];
  $('#approval-panel').innerHTML=groups.map(([name,ids])=>`<article class="approval-card"><h3>${name}</h3><strong>${ids.length}</strong><ul>${ids.map(id=>`<li>${id}</li>`).join('')}</ul></article>`).join('');
}

document.querySelectorAll('.nav-item').forEach(btn=>btn.addEventListener('click',()=>{document.querySelectorAll('.nav-item').forEach(b=>b.classList.remove('active'));document.querySelectorAll('.view').forEach(v=>v.classList.remove('active-view'));btn.classList.add('active');$('#'+btn.dataset.view).classList.add('active-view')}));
$('#refresh-btn').addEventListener('click',async()=>render(await loadData()));
$('#copy-command').addEventListener('click',async()=>{await navigator.clipboard.writeText($('#approval-command').textContent);$('#copy-command').textContent='Copiado';setTimeout(()=>$('#copy-command').textContent='Copiar comando',1400)});
window.addEventListener('beforeinstallprompt',e=>{e.preventDefault();deferredPrompt=e;$('#install-btn').hidden=false});
$('#install-btn').addEventListener('click',async()=>{if(!deferredPrompt)return;deferredPrompt.prompt();await deferredPrompt.userChoice;deferredPrompt=null;$('#install-btn').hidden=true});
if('serviceWorker' in navigator) navigator.serviceWorker.register('/sw.js');
loadData().then(render);
