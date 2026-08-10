const D = window.LIFEOS_DATA;
const $ = s => document.querySelector(s);
const $$ = s => [...document.querySelectorAll(s)];
const state = {calendar:new Set(), emails:new Set(), approvedCalendar:new Set(), approvedEmails:new Set()};
const esc = s => String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));

function render(){
  $('#weekLabel').textContent=D.meta.week; $('#weekStatus').textContent=D.meta.status; $('#loadScore').textContent=D.meta.loadScore; $('#loadHint').textContent=D.meta.loadHint;
  $('#decisionCount').textContent=D.decisions.length; $('#decisionBadge').textContent=`${D.decisions.length} activas`; $('#focusHours').textContent=(D.calendar.reduce((a,x)=>a+x.minutes,0)/60).toFixed(1)+' h'; $('#emailCount').textContent=D.emails.length;
  $('#outcomes').innerHTML=D.outcomes.map((x,i)=>`<div class="outcome"><span class="n">0${i+1} · ${esc(x.company)}</span><strong>${esc(x.title)}</strong></div>`).join('');
  $('#companyGrid').innerHTML=D.companies.map(x=>`<article class="company"><div class="section-head"><div><span class="eyebrow">${esc(x.role)}</span><h3>${esc(x.name)}</h3></div><span class="pill">${esc(x.state)}</span></div>${x.metrics.map(m=>`<div class="metric"><span>${esc(m[0])}</span><strong>${esc(m[1])}</strong></div>`).join('')}<p class="muted" style="margin:14px 0 0">${esc(x.focus)}</p></article>`).join('');
  $('#decisions').innerHTML=D.decisions.map(x=>rowCard(x,x.recommendation)).join('');
  $('#risks').innerHTML=D.risks.map(x=>rowCard(x,x.mitigation)).join('');
  $('#calendarActions').innerHTML=D.calendar.map(calendarRow).join('');
  $('#emailActions').innerHTML=D.emails.map(emailRow).join('');
  bindRows(); updateApproval();
}
function rowCard(x,desc){return `<div class="row-card"><div class="row-title"><span class="priority ${x.priority.toLowerCase()}">${x.priority}</span><div><strong>${esc(x.title)}</strong><div class="row-meta"><span>${esc(x.company)}</span>${x.deadline?`<span>${esc(x.deadline)}</span>`:''}</div></div></div><p class="muted" style="margin:8px 0 0">${esc(desc)}</p></div>`}
function calendarRow(x){return `<div class="action-item"><input class="check cal-check" type="checkbox" data-id="${x.id}" ${state.calendar.has(x.id)?'checked':''}><div class="action-main"><strong>${x.id} · ${esc(x.title)}</strong><small>${esc(x.company)} · ${x.date} · ${x.start}–${x.end} · ${x.minutes} min</small></div><div class="action-buttons"><button class="ghost small detail-cal" data-id="${x.id}">Ver</button><button class="ghost small ics-cal" data-id="${x.id}">.ics</button></div></div>`}
function emailRow(x){return `<div class="action-item"><input class="check email-check" type="checkbox" data-id="${x.id}" ${state.emails.has(x.id)?'checked':''}><div class="action-main"><strong>${x.id} · ${esc(x.subject)}</strong><small>${esc(x.company)} · Para: ${esc(x.to)}</small></div><div class="action-buttons"><button class="ghost small detail-mail" data-id="${x.id}">Ver</button><button class="ghost small open-mail" data-id="${x.id}">Abrir borrador</button></div></div>`}
function bindRows(){
  $$('.cal-check').forEach(e=>e.onchange=()=>{toggleSet(state.calendar,e.dataset.id,e.checked);updateApproval()});
  $$('.email-check').forEach(e=>e.onchange=()=>{toggleSet(state.emails,e.dataset.id,e.checked);updateApproval()});
  $$('.detail-cal').forEach(b=>b.onclick=()=>showCalendar(b.dataset.id)); $$('.ics-cal').forEach(b=>b.onclick=()=>downloadICS(b.dataset.id));
  $$('.detail-mail').forEach(b=>b.onclick=()=>showEmail(b.dataset.id)); $$('.open-mail').forEach(b=>b.onclick=()=>openMail(b.dataset.id));
}
function toggleSet(set,id,on){on?set.add(id):set.delete(id)}
function updateApproval(){
  $('#selectedCalendarCount').textContent=state.calendar.size; $('#selectedEmailCount').textContent=state.emails.size;
  const mins=D.calendar.filter(x=>state.calendar.has(x.id)).reduce((a,x)=>a+x.minutes,0); $('#selectedMinutes').textContent=mins+' min';
}
function showCalendar(id){const x=D.calendar.find(y=>y.id===id);$('#dialogType').textContent='CALENDARIO';$('#dialogTitle').textContent=x.title;$('#dialogBody').innerHTML=`<dl class="detail-grid"><dt>Compañía</dt><dd>${esc(x.company)}</dd><dt>Fecha</dt><dd>${x.date}</dd><dt>Hora</dt><dd>${x.start}–${x.end}</dd><dt>Objetivo</dt><dd>${esc(x.objective)}</dd><dt>Checklist</dt><dd>${x.checklist.map(i=>'• '+esc(i)).join('<br>')}</dd></dl>`;$('#detailDialog').showModal()}
function showEmail(id){const x=D.emails.find(y=>y.id===id);$('#dialogType').textContent='CORREO';$('#dialogTitle').textContent=x.subject;$('#dialogBody').innerHTML=`<dl class="detail-grid"><dt>Para</dt><dd>${esc(x.to)}</dd><dt>CC</dt><dd>${esc(x.cc||'—')}</dd><dt>Objetivo</dt><dd>${esc(x.objective)}</dd></dl><h3 style="margin-top:18px">Borrador</h3><div class="email-body">${esc(x.body)}</div>`;$('#detailDialog').showModal()}
function fmtICSDate(date,time){return date.replaceAll('-','')+'T'+time.replace(':','')+'00'}
function icsFor(x){const desc=`Objetivo: ${x.objective}\n\nChecklist:\n- ${x.checklist.join('\n- ')}`.replace(/\n/g,'\\n').replace(/,/g,'\\,');return `BEGIN:VCALENDAR\r\nVERSION:2.0\r\nPRODID:-//CEO LifeOS//ES\r\nBEGIN:VEVENT\r\nUID:${x.id}-${x.date}@ceo-lifeos\r\nDTSTAMP:${new Date().toISOString().replace(/[-:]/g,'').replace(/\.\d{3}/,'')}\r\nDTSTART;TZID=America/Bogota:${fmtICSDate(x.date,x.start)}\r\nDTEND;TZID=America/Bogota:${fmtICSDate(x.date,x.end)}\r\nSUMMARY:[${x.company}] ${x.title}\r\nDESCRIPTION:${desc}\r\nEND:VEVENT\r\nEND:VCALENDAR`}
function downloadICS(id){const x=D.calendar.find(y=>y.id===id);const blob=new Blob([icsFor(x)],{type:'text/calendar;charset=utf-8'});const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=`${x.id}-${x.title.replace(/[^a-z0-9]+/gi,'-').toLowerCase()}.ics`;a.click();URL.revokeObjectURL(a.href);log(`Calendario ${x.id}: archivo .ics generado.`,'ok')}
function openMail(id){const x=D.emails.find(y=>y.id===id);const q=new URLSearchParams({subject:x.subject,body:x.body});if(x.cc)q.set('cc',x.cc);window.location.href=`mailto:${x.to}?${q.toString()}`;log(`Correo ${x.id}: borrador abierto en el cliente de correo.`,'ok')}
function log(msg,type=''){const el=document.createElement('div');el.className=`log ${type}`;el.textContent=`${new Date().toLocaleTimeString('es-CO',{hour:'2-digit',minute:'2-digit'})} · ${msg}`;$('#executionLog').prepend(el)}
async function approve(type){const ids=type==='calendar'?[...state.calendar]:type==='emails'?[...state.emails]:[...state.calendar,...state.emails];if(!ids.length){log('No hay elementos seleccionados.','bad');return}
  const webhook=localStorage.getItem('lifeos_webhook_url'); if(webhook){try{const payload={type:'lifeos_approval',approved_at:new Date().toISOString(),calendar:D.calendar.filter(x=>state.calendar.has(x.id)),emails:D.emails.filter(x=>state.emails.has(x.id))};const headers={'Content-Type':'application/json'};const token=localStorage.getItem('lifeos_webhook_token');if(token)headers.Authorization=`Bearer ${token}`;const r=await fetch(webhook,{method:'POST',headers,body:JSON.stringify(payload)});if(!r.ok)throw new Error(`HTTP ${r.status}`);log(`Webhook ejecutado para ${ids.length} elemento(s).`,'ok');$('#approvalState').textContent='Aprobado y enviado al webhook';return}catch(e){log(`Webhook falló: ${e.message}. Se mantiene modo local.`,'bad')}}
  if(type==='calendar'||type==='all'){D.calendar.filter(x=>state.calendar.has(x.id)).forEach(x=>downloadICS(x.id))}
  if(type==='emails'||type==='all'){const mails=D.emails.filter(x=>state.emails.has(x.id));if(mails.length===1)openMail(mails[0].id);else if(mails.length>1)log(`Aprobados ${mails.length} correos. Ábrelos uno a uno con “Abrir borrador” para evitar ventanas bloqueadas.`,'ok')}
  $('#approvalState').textContent='Aprobado en modo local';
}
$('#approveCalendarBtn').onclick=()=>approve('calendar');$('#approveEmailsBtn').onclick=()=>approve('emails');$('#approveAllBtn').onclick=()=>approve('all');
$('#selectAllCalendar').onclick=()=>{D.calendar.forEach(x=>state.calendar.add(x.id));render()};$('#clearCalendar').onclick=()=>{state.calendar.clear();render()};$('#selectAllEmail').onclick=()=>{D.emails.forEach(x=>state.emails.add(x.id));render()};$('#clearEmail').onclick=()=>{state.emails.clear();render()};$('#resetApprovalBtn').onclick=()=>{state.calendar.clear();state.emails.clear();$('#approvalState').textContent='Sin cambios ejecutados';render()};
$('#closeDialog').onclick=()=>$('#detailDialog').close();$('#focusModeBtn').onclick=()=>document.body.classList.toggle('focus-mode');$('#refreshBtn').onclick=()=>location.reload();
$('#settingsBtn').onclick=()=>{$('#webhookUrl').value=localStorage.getItem('lifeos_webhook_url')||'';$('#webhookToken').value=localStorage.getItem('lifeos_webhook_token')||'';$('#settingsDialog').showModal()};$('#closeSettings').onclick=()=>$('#settingsDialog').close();$('#saveSettings').onclick=()=>{localStorage.setItem('lifeos_webhook_url',$('#webhookUrl').value.trim());localStorage.setItem('lifeos_webhook_token',$('#webhookToken').value.trim());$('#executionModeText').textContent=$('#webhookUrl').value.trim()?'Webhook activo: los aprobados se enviarán a tu automatización.':'Local: calendario genera archivos .ics y correo abre borradores con mailto.';$('#settingsDialog').close();log('Configuración de integración guardada.','ok')};$('#testWebhook').onclick=async()=>{const u=$('#webhookUrl').value.trim();if(!u)return log('Configura una URL primero.','bad');try{const r=await fetch(u,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({type:'lifeos_test',at:new Date().toISOString()})});log(r.ok?'Webhook respondió correctamente.':`Webhook respondió HTTP ${r.status}.`,r.ok?'ok':'bad')}catch(e){log(`No fue posible conectar: ${e.message}`,'bad')}};
if(localStorage.getItem('lifeos_webhook_url'))$('#executionModeText').textContent='Webhook activo: los aprobados se enviarán a tu automatización.';
if('serviceWorker' in navigator)navigator.serviceWorker.register('sw.js').catch(()=>{});
render();
