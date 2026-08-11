const $ = (s)=>document.querySelector(s); const $$=(s)=>[...document.querySelectorAll(s)];
const GRAPH='https://graph.microsoft.com/v1.0';
const state={data:null,account:null,msal:null,raw:null,objectiveMode:'annual'};
let deferredPrompt=null;
const graphScopes=['User.Read','Mail.Read','Mail.ReadWrite','Mail.Send','Calendars.Read','Calendars.ReadWrite','Chat.Read','Team.ReadBasic.All','Channel.ReadBasic.All','ChannelMessage.Read.All'];

function settings(){return {clientId:localStorage.getItem('lifeos_ms_client_id')||'',tenantId:localStorage.getItem('lifeos_ms_tenant_id')||'organizations'}}
function initMsal(){const c=settings();if(!c.clientId)return;state.msal=new msal.PublicClientApplication({auth:{clientId:c.clientId,authority:`https://login.microsoftonline.com/${c.tenantId}`,redirectUri:location.origin},cache:{cacheLocation:'localStorage'}});const accounts=state.msal.getAllAccounts();if(accounts.length){state.account=accounts[0];$('#connectBtn').textContent=state.account.username}}
async function connect(){if(!state.msal){openSettings();return}const r=await state.msal.loginPopup({scopes:graphScopes});state.account=r.account;$('#connectBtn').textContent=r.account.username}
async function accessToken(){if(!state.account)await connect();try{return (await state.msal.acquireTokenSilent({account:state.account,scopes:graphScopes})).accessToken}catch{return (await state.msal.acquireTokenPopup({account:state.account,scopes:graphScopes})).accessToken}}
async function graph(path,opts={}){const token=await accessToken();const r=await fetch(path.startsWith('http')?path:GRAPH+path,{...opts,headers:{Authorization:`Bearer ${token}`,'Content-Type':'application/json',...(opts.headers||{})}});if(!r.ok)throw new Error(`Graph ${r.status}: ${await r.text()}`);if(r.status===204)return null;return r.json()}
async function getAll(path,maxPages=8){let out=[],next=path,p=0;while(next&&p++<maxPages){const j=await graph(next);out.push(...(j.value||[]));next=j['@odata.nextLink']||null}return out}
function dminus(n){const d=new Date();d.setDate(d.getDate()-n);return d.toISOString()}
function dplus(n){const d=new Date();d.setDate(d.getDate()+n);return d.toISOString()}
function stripHtml(s=''){return s.replace(/<[^>]+>/g,' ').replace(/\s+/g,' ').trim()}

async function fetchThreadForMessage(m){if(!m.conversationId)return [];try{return await getAll(`/me/messages?$filter=conversationId eq '${m.conversationId}'&$select=id,subject,body,bodyPreview,receivedDateTime,sentDateTime,from,toRecipients,ccRecipients,webLink,flag,importance,isRead&$top=50`,2)}catch{return []}}
async function fetchMicrosoft(){
 const since=dminus(30),future=dplus(30);const base='$select=id,subject,bodyPreview,receivedDateTime,sentDateTime,isRead,flag,importance,from,toRecipients,ccRecipients,webLink,conversationId';
 const health={mail:'ok',flagged:'ok',calendar:'ok',teams:'ok'};let inbox=[],sent=[],flagged=[],events=[],chats=[],chatMessages=[];
 try{inbox=await getAll(`/me/mailFolders/inbox/messages?${base}&$filter=receivedDateTime ge ${since}&$orderby=receivedDateTime desc&$top=100`,6);sent=await getAll(`/me/mailFolders/sentitems/messages?${base}&$filter=sentDateTime ge ${since}&$orderby=sentDateTime desc&$top=100`,6)}catch(e){health.mail=e.message}
 try{flagged=await getAll(`/me/messages?${base}&$filter=flag/flagStatus eq 'flagged'&$orderby=receivedDateTime desc&$top=100`,4)}catch(e){health.flagged=e.message}
 const threadSeeds=[...flagged,...inbox.filter(x=>x.importance==='high'||!x.isRead)].slice(0,20);const threadMap={};for(const m of threadSeeds){const t=await fetchThreadForMessage(m);if(t.length)threadMap[m.conversationId]=t.map(x=>({...x,bodyText:stripHtml(x.body?.content||x.bodyPreview||'')}))}
 try{events=await getAll(`/me/calendarView?startDateTime=${encodeURIComponent(since)}&endDateTime=${encodeURIComponent(future)}&$select=id,subject,start,end,location,bodyPreview,attendees,organizer,webLink,isCancelled,showAs&$orderby=start/dateTime&$top=100`,8)}catch(e){health.calendar=e.message}
 try{chats=await getAll('/me/chats?$expand=members&$top=50',3);for(const c of chats.slice(0,30)){try{const msgs=await getAll(`/chats/${encodeURIComponent(c.id)}/messages?$top=50`,2);for(const m of msgs){if(new Date(m.createdDateTime)>=new Date(since))chatMessages.push({chatId:c.id,topic:c.topic,createdDateTime:m.createdDateTime,from:m.from?.user?.displayName||'',body:stripHtml(m.body?.content||''),webUrl:m.webUrl||''})}}catch{}}}catch(e){health.teams=e.message}
 return {inbox,sent,flagged,threads:threadMap,events,chats,chatMessages,health};
}
async function fetchRead(){const r=await fetch(`/api/read-ai?since=${encodeURIComponent(dminus(30))}`);if(!r.ok)throw new Error(await r.text());return r.json()}
async function loadCurrent(){try{const r=await fetch(`/data/current.json?t=${Date.now()}`,{cache:'no-store'});state.data=await r.json();render()}catch(e){console.error(e)}}
async function refresh(){
 const b=$('#refreshBtn');b.disabled=true;b.textContent='Actualizando…';
 const ms=settings();
 if(!ms.clientId){
  setSync('Cargando la última revisión publicada por ChatGPT…');
  await loadCurrent();
  setSync(`LifeOS sincronizado · ${new Date().toLocaleString('es-CO')}`);
  b.disabled=false;b.textContent='Actualizar';
  return;
 }
 setSync('Sincronizando Outlook, Calendar y Teams…');
 const sourceHealth={};let microsoft=null,read=null;
 try{microsoft=await fetchMicrosoft();Object.assign(sourceHealth,microsoft.health)}catch(e){sourceHealth.microsoft=e.message}
 setSync('Analizando reuniones de Read AI…');try{read=await fetchRead();sourceHealth.read='ok'}catch(e){sourceHealth.read=e.message;read={meetings:[]}}
 setSync('Generando análisis ejecutivo…');
 try{
  const previous=state.data;const r=await fetch('/api/analyze',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({now:new Date().toISOString(),microsoft,read,previous})});if(!r.ok)throw new Error(await r.text());const analysis=await r.json();analysis.source_health={...(analysis.source_health||{}),...sourceHealth};state.data=analysis;localStorage.setItem('lifeos_last_analysis',JSON.stringify(analysis));render();setSync('Guardando histórico…');
  const save=await fetch('/api/github-save',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({data:analysis,reason:'manual'})});if(!save.ok)console.warn('GitHub save skipped/failed',await save.text());setSync(`Actualizado ${new Date().toLocaleString('es-CO')}`)
 }catch(e){
  console.error(e);
  await loadCurrent();
  setSync('No fue posible ejecutar el análisis directo. Se cargó la última revisión publicada.');
 }finally{b.disabled=false;b.textContent='Actualizar'}
}
function setSync(x){$('#syncStatus').textContent=x}
function esc(s=''){return String(s).replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]))}
function badge(v='P2'){return `<span class="badge ${String(v).toLowerCase()}">${esc(v)}</span>`}
function statusBadge(v='AT_RISK'){return `<span class="badge ${String(v).toLowerCase()}">${esc(v)}</span>`}
function item(title,meta='',right='',cls=''){return `<article class="item ${cls}"><div class="item-row"><div><div class="item-title">${esc(title)}</div><div class="item-meta">${esc(meta)}</div></div>${right}</div></article>`}
function metric(label,val){return `<div class="metric"><strong>${esc(val)}</strong><span>${esc(label)}</span></div>`}
function selected(kind){return $$(`input[data-kind="${kind}"]:checked`).map(x=>Number(x.dataset.index))}
function selectable(kind,i,title,meta,p){return `<article class="item"><label class="check"><input type="checkbox" data-kind="${kind}" data-index="${i}"/><div style="flex:1"><div class="item-row"><div><div class="item-title">${esc(title)}</div><div class="item-meta">${esc(meta)}</div></div>${badge(p)}</div></div></label></article>`}
function render(){const d=state.data;if(!d)return;$('#weekLabel').textContent=d.meta?.period||'Semana';$('#lifeosStatus').textContent=d.meta?.status||d.capacity?.status||'AT RISK';$('#lifeosScore').textContent=d.meta?.score??'—';$('#executiveSummary').textContent=d.meta?.executive_summary||'Panorama actualizado.';
 const hm=[['Resultados',d.critical_outcomes?.length||0],['Decisiones',d.decisions?.length||0],['Mis acciones',d.my_actions?.length||0],['Delegadas',d.delegated_actions?.length||0]];$('#headlineMetrics').innerHTML=hm.map(x=>metric(x[0],x[1])).join('');
 const monthly=d.monthly||[];const mp=monthly.length?Math.round(monthly.reduce((a,x)=>a+(x.progress??0),0)/monthly.length):0;$('#monthHeadline').textContent=`${monthly.length} objetivos mensuales`;$('#monthSummary').textContent=monthly.length?`${monthly.filter(x=>x.status==='OFF_TRACK').length} fuera de trayectoria; ${monthly.filter(x=>x.status==='AT_RISK').length} en riesgo.`:'Define objetivos mensuales para comparar ejecución.';$('#monthProgress').style.width=`${Math.min(100,mp)}%`;$('#monthKpis').innerHTML=[['Progreso',`${mp}%`],['Off track',monthly.filter(x=>x.status==='OFF_TRACK').length]].map(x=>metric(x[0],x[1])).join('');
 $('#criticalOutcomes').innerHTML=(d.critical_outcomes||[]).map(x=>item(x.title,`${x.company} · ${x.metric||x.expected_result||''}`,badge(x.priority))).join('')||item('Sin resultados críticos','Ejecuta Actualizar');
 $('#companyCards').innerHTML=(d.companies||[]).map(c=>`<article class="company-card"><div class="item-row"><div><div class="eyebrow">${esc(c.name)}</div><h4>${esc(c.weekly_result||c.main_objective||'')}</h4></div>${statusBadge(c.status)}</div><p class="item-meta">${esc(c.main_risk||'')}</p><div class="tiny-progress"><span style="width:${Math.min(100,c.progress||0)}%"></span></div></article>`).join('');
 const nd=(d.decisions||[])[0];$('#nextDecision').innerHTML=nd?item(nd.decision,`${nd.company} · ${nd.deadline||''} · ${nd.recommendation||''}`,badge(nd.priority)):item('Sin decisión crítica','');
 const c=d.capacity||{};$('#capacityCard').innerHTML=item(`Estado: ${c.status||'—'}`,`Reuniones ${c.meeting_hours||0}h · CEO ${c.proposed_ceo_hours||0}h · Buffer ${c.buffer_hours||0}h`);
 renderObjectives();$('#myActions').innerHTML=(d.my_actions||[]).map(x=>item(x.action,`${x.company} · ${x.deadline||''} · ${x.estimated_minutes||0} min`,badge(x.priority))).join('');$('#decisions').innerHTML=(d.decisions||[]).map(x=>item(x.decision,`${x.company} · ${x.deadline||''} · ${x.recommendation||''}`,badge(x.priority))).join('');
 $('#calendarProposals').innerHTML=(d.calendar_proposals||[]).map((x,i)=>selectable('cal',i,x.title,`${x.company} · ${x.start} → ${x.end} · ${x.objective||''}`,x.priority)).join('');
 $('#delegatedActions').innerHTML=(d.delegated_actions||[]).map(x=>item(x.activity,`${x.company} → ${x.responsible||'RESPONSABLE POR DEFINIR'} · ${x.deadline||''} · DoD: ${x.definition_of_done||''}`,badge(x.priority))).join('');
 $('#emailProposals').innerHTML=(d.email_proposals||[]).map((x,i)=>selectable('mail',i,x.subject,`${x.company} · Para: ${(x.to||[]).join(', ')} · ${x.objective||''}`,x.priority)).join('');
 $('#risks').innerHTML=(d.risks||[]).map(x=>item(x.risk,`${x.company} · ${x.probability}/${x.impact} · ${x.mitigation||''}`,badge(x.priority),x.impact==='HIGH'||x.impact==='CRITICAL'?'heat-high':x.impact==='MEDIUM'?'heat-medium':'heat-low')).join('');
 $('#flagged').innerHTML=(d.flagged||[]).map(x=>item(x.subject,`${x.classification||''} · ${x.recommendation||''}`,statusBadge(x.classification||'FOLLOW_UP'))).join('');renderSourceHealth();renderAlerts();
}
function renderObjectives(){const list=state.data?.[state.objectiveMode]||[];$('#objectivesList').innerHTML=list.map(o=>`<article class="item"><div class="item-row"><div><div class="item-title">${esc(o.title||o.expected_result||'')}</div><div class="item-meta">${esc(o.company||'')} · ${esc(o.metric||'')} · ${esc(o.current??'')} / ${esc(o.target??'')}</div></div>${statusBadge(o.status||'AT_RISK')}</div><div class="objective-progress"><div class="tiny-progress"><span style="width:${Math.min(100,o.progress||0)}%"></span></div><strong>${Math.round(o.progress||0)}%</strong></div></article>`).join('')||item('Sin objetivos definidos','Agrega objetivos anuales/mensuales al histórico o permite que LifeOS los infiera para revisión.');}
function renderSourceHealth(){const h=state.data?.source_health||{};const label=v=>String(v).toUpperCase()==='OK'?'OK':String(v).toUpperCase()==='SNAPSHOT'?'SNAPSHOT':'PARTIAL';const cls=v=>['OK','SNAPSHOT'].includes(String(v).toUpperCase())?'ok':'warn';$('#sourceStrip').innerHTML=Object.entries(h).map(([k,v])=>`<span class="source-pill ${cls(v)}">${esc(k)} · ${label(v)}</span>`).join('')||'<span class="source-pill warn">Fuentes · sin sincronizar</span>';$('#sourceHealth').innerHTML=Object.entries(h).map(([k,v])=>item(k,label(v))).join('')}
function renderAlerts(){const d=state.data||{};const alerts=[];for(const r of (d.risks||[]).filter(x=>['P0','P1'].includes(x.priority)).slice(0,3))alerts.push(`<span class="alert-chip ${r.priority==='P0'?'red':'amber'}">${esc(r.company)} · ${esc(r.risk)}</span>`);for(const f of (d.flagged||[]).filter(x=>x.classification==='CEO_DECISION').slice(0,2))alerts.push(`<span class="alert-chip red">Flagged · ${esc(f.subject)}</span>`);$('#quickAlerts').innerHTML=alerts.join('')}
async function createCalendar(){const ids=selected('cal');if(!ids.length)return alert('Selecciona al menos un bloque.');for(const i of ids){const x=state.data.calendar_proposals[i];const conflicts=await getAll(`/me/calendarView?startDateTime=${encodeURIComponent(x.start)}&endDateTime=${encodeURIComponent(x.end)}&$top=10`,1);if(conflicts.length){alert(`Conflicto detectado para ${x.title}. No se creó.`);continue}await graph('/me/events',{method:'POST',body:JSON.stringify({subject:x.title,body:{contentType:'HTML',content:`<b>Resultado esperado:</b> ${esc(x.objective||'')}<br><br>${esc(x.description||'')}`},start:{dateTime:x.start,timeZone:'America/Bogota'},end:{dateTime:x.end,timeZone:'America/Bogota'},showAs:'busy'})})}alert('Proceso de calendario terminado.')}
async function emailAction(send){const ids=selected('mail');if(!ids.length)return alert('Selecciona al menos un correo.');if(send&&!confirm(`¿Enviar ahora ${ids.length} correo(s) desde Outlook?`))return;for(const i of ids){const x=state.data.email_proposals[i];if(!(x.to||[]).length){alert(`Sin destinatario: ${x.subject}`);continue}const msg={subject:x.subject,body:{contentType:'HTML',content:esc(x.body||'').replace(/\n/g,'<br>')},toRecipients:x.to.map(a=>({emailAddress:{address:a}})),ccRecipients:(x.cc||[]).map(a=>({emailAddress:{address:a}}))};if(send)await graph('/me/sendMail',{method:'POST',body:JSON.stringify({message:msg,saveToSentItems:true})});else await graph('/me/messages',{method:'POST',body:JSON.stringify(msg)})}alert(send?'Correos enviados desde Outlook.':'Borradores creados en Outlook.')}
function doSearch(){const q=$('#globalSearch').value.trim().toLowerCase();if(!q)return;const d=state.data||{};const groups=['annual','monthly','weekly','decisions','my_actions','delegated_actions','risks','flagged','email_proposals','calendar_proposals'];const hits=[];for(const g of groups)for(const x of (d[g]||[])){const txt=JSON.stringify(x).toLowerCase();if(txt.includes(q))hits.push({g,x})}$('#searchResults').innerHTML=hits.slice(0,30).map(h=>item(h.x.title||h.x.subject||h.x.decision||h.x.action||h.x.activity||h.x.risk||h.g,h.g)).join('')||item('Sin resultados',q)}
function openSettings(){const s=settings();$('#clientIdInput').value=s.clientId;$('#tenantIdInput').value=s.tenantId;$('#settingsDialog').showModal()}
function wire(){
 $$('.tab').forEach(b=>b.onclick=()=>{$$('.tab').forEach(x=>x.classList.remove('active'));$$('.view').forEach(x=>x.classList.remove('active'));b.classList.add('active');$('#'+b.dataset.view).classList.add('active')});
 $$('.segment').forEach(b=>b.onclick=()=>{$$('.segment').forEach(x=>x.classList.remove('active'));b.classList.add('active');state.objectiveMode=b.dataset.objective;renderObjectives()});
 $('#connectBtn').onclick=connect;$('#connectBtn').ondblclick=openSettings;$('#refreshBtn').onclick=refresh;$('#createCalendarBtn').onclick=createCalendar;$('#draftEmailsBtn').onclick=()=>emailAction(false);$('#sendEmailsBtn').onclick=()=>emailAction(true);$('#searchBtn').onclick=doSearch;$('#globalSearch').onkeydown=e=>{if(e.key==='Enter')doSearch()};
 $('#saveSettingsBtn').onclick=()=>{localStorage.setItem('lifeos_ms_client_id',$('#clientIdInput').value.trim());localStorage.setItem('lifeos_ms_tenant_id',$('#tenantIdInput').value.trim()||'organizations');location.reload()};
 window.addEventListener('beforeinstallprompt',e=>{e.preventDefault();deferredPrompt=e;$('#installBtn').classList.remove('hidden')});$('#installBtn').onclick=async()=>{await deferredPrompt?.prompt();deferredPrompt=null;$('#installBtn').classList.add('hidden')};
}
wire();initMsal();if('serviceWorker' in navigator)navigator.serviceWorker.register('/sw.js');loadCurrent();
