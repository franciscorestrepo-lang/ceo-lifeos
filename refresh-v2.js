const GRAPH='https://graph.microsoft.com/v1.0';
const scopes=['User.Read','Mail.Read','Mail.ReadWrite','Mail.Send','Calendars.Read','Calendars.ReadWrite','Chat.Read','Team.ReadBasic.All','Channel.ReadBasic.All','ChannelMessage.Read.All'];
const $=(s)=>document.querySelector(s);
const stripHtml=(s='')=>s.replace(/<[^>]+>/g,' ').replace(/\s+/g,' ').trim();
const minusDays=(n)=>{const d=new Date();d.setDate(d.getDate()-n);return d.toISOString()};
const plusDays=(n)=>{const d=new Date();d.setDate(d.getDate()+n);return d.toISOString()};
function setStatus(x){const el=$('#syncStatus');if(el)el.textContent=x}
function msSettings(){return{clientId:localStorage.getItem('lifeos_ms_client_id')||'',tenantId:localStorage.getItem('lifeos_ms_tenant_id')||'organizations'}}
async function loadPrevious(){try{return JSON.parse(localStorage.getItem('lifeos_last_analysis')||'null')||await (await fetch(`/data/current.json?previous=${Date.now()}`,{cache:'no-store'})).json()}catch{return null}}
async function microsoftInteractive(){
  const cfg=msSettings();if(!cfg.clientId)return null;
  const app=new msal.PublicClientApplication({auth:{clientId:cfg.clientId,authority:`https://login.microsoftonline.com/${cfg.tenantId}`,redirectUri:location.origin},cache:{cacheLocation:'localStorage'}});
  let account=app.getAllAccounts()[0]||null;
  if(!account)account=(await app.loginPopup({scopes})).account;
  let token;try{token=(await app.acquireTokenSilent({account,scopes})).accessToken}catch{token=(await app.acquireTokenPopup({account,scopes})).accessToken}
  async function graph(path){const r=await fetch(path.startsWith('http')?path:GRAPH+path,{headers:{Authorization:`Bearer ${token}`,'Content-Type':'application/json'}});if(!r.ok)throw new Error(`Graph ${r.status}: ${await r.text()}`);return r.status===204?null:r.json()}
  async function all(path,max=8){let out=[],next=path,p=0;while(next&&p++<max){const j=await graph(next);out.push(...(j.value||[]));next=j['@odata.nextLink']||null}return out}
  const since=minusDays(30),future=plusDays(30),base='$select=id,subject,body,bodyPreview,receivedDateTime,sentDateTime,isRead,flag,importance,from,toRecipients,ccRecipients,webLink,conversationId';
  const health={mail:'ok',flagged:'ok',calendar:'ok',teams:'ok'};let inbox=[],sent=[],flagged=[],events=[],chats=[],chatMessages=[],threads={};
  try{inbox=await all(`/me/mailFolders/inbox/messages?${base}&$filter=receivedDateTime ge ${since}&$orderby=receivedDateTime desc&$top=100`,6);sent=await all(`/me/mailFolders/sentitems/messages?${base}&$filter=sentDateTime ge ${since}&$orderby=sentDateTime desc&$top=100`,6)}catch(e){health.mail=e.message}
  try{flagged=await all(`/me/messages?${base}&$filter=flag/flagStatus eq 'flagged'&$orderby=receivedDateTime desc&$top=100`,4)}catch(e){health.flagged=e.message}
  for(const m of [...flagged,...inbox.filter(x=>x.importance==='high'||!x.isRead)].slice(0,20)){
    if(!m.conversationId)continue;try{const t=await all(`/me/messages?$filter=conversationId eq '${m.conversationId}'&$select=id,subject,body,bodyPreview,receivedDateTime,sentDateTime,from,toRecipients,ccRecipients,webLink,flag,importance,isRead&$top=50`,2);if(t.length)threads[m.conversationId]=t.map(x=>({...x,bodyText:stripHtml(x.body?.content||x.bodyPreview||'')}))}catch{}
  }
  try{events=await all(`/me/calendarView?startDateTime=${encodeURIComponent(since)}&endDateTime=${encodeURIComponent(future)}&$select=id,subject,start,end,location,bodyPreview,attendees,organizer,webLink,isCancelled,showAs&$orderby=start/dateTime&$top=100`,8)}catch(e){health.calendar=e.message}
  try{chats=await all('/me/chats?$expand=members&$top=50',3);for(const c of chats.slice(0,30)){try{const msgs=await all(`/chats/${encodeURIComponent(c.id)}/messages?$top=50`,2);for(const m of msgs){if(new Date(m.createdDateTime)>=new Date(since))chatMessages.push({chatId:c.id,topic:c.topic,createdDateTime:m.createdDateTime,from:m.from?.user?.displayName||'',body:stripHtml(m.body?.content||''),webUrl:m.webUrl||''})}}catch{}}}catch(e){health.teams=e.message}
  return{inbox,sent,flagged,threads,events,chats,chatMessages,health};
}
function diagnosticMessage(payload){
  const missing=(payload.missing_sources||[]).join(', ');const details=payload.source_errors?Object.values(payload.source_errors).join(' | '):'';
  return [payload.error,missing&&`Fuentes: ${missing}`,details].filter(Boolean).join(' — ');
}
async function refreshVerified(){
  const btn=$('#refreshBtn');if(!btn)return;
  btn.disabled=true;btn.textContent='Actualizando…';
  try{
    const previous=await loadPrevious();let microsoft=null;
    if(msSettings().clientId){setStatus('1/4 · Sincronizando Outlook, Calendar y Teams…');microsoft=await microsoftInteractive()}else setStatus('1/4 · Microsoft se validará desde servidor…');
    setStatus('2/4 · Sincronizando Read AI y validando fuentes…');
    const r=await fetch('/api/refresh',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({previous,microsoft})});
    let payload={};try{payload=await r.json()}catch{payload={error:await r.text()}}
    if(!r.ok||!payload.ok)throw new Error(diagnosticMessage(payload)||`Refresh ${r.status}`);
    setStatus('3/4 · Análisis ejecutivo validado…');
    localStorage.setItem('lifeos_last_analysis',JSON.stringify(payload.data));
    localStorage.setItem('lifeos_last_refresh_diagnostics',JSON.stringify({at:new Date().toISOString(),source_health:payload.source_health,counts:payload.counts,persistence:payload.persistence}));
    setStatus(`4/4 · Actualizado · ${new Date().toLocaleString('es-CO')}`);
    setTimeout(()=>location.reload(),250);
  }catch(e){
    console.error(e);setStatus(`Actualización falló · ${e.message}`);alert(`No se reemplazó el tablero.\n\n${e.message}\n\nEl último análisis válido se conserva.`);
  }finally{btn.disabled=false;btn.textContent='Actualizar'}
}
const btn=$('#refreshBtn');if(btn)btn.onclick=refreshVerified;
