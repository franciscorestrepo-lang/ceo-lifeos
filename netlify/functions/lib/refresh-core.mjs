const REQUIRED_SOURCES=['mail','flagged','calendar','teams','read'];
const REQUIRED_ARRAYS=['critical_outcomes','decisions','my_actions','delegated_actions','calendar_proposals','email_proposals','risks','flagged'];

export function sourceCounts(microsoft={},read={}){
  return {
    inbox:microsoft.inbox?.length||0,
    sent:microsoft.sent?.length||0,
    flagged:microsoft.flagged?.length||0,
    events:microsoft.events?.length||0,
    teams:microsoft.chatMessages?.length||0,
    read:read.meetings?.length||0
  };
}

export function normalizeSourceHealth(microsoft={},readStatus='ok'){
  return {
    mail:microsoft.health?.mail||'missing',
    flagged:microsoft.health?.flagged||'missing',
    calendar:microsoft.health?.calendar||'missing',
    teams:microsoft.health?.teams||'missing',
    read:readStatus||'missing'
  };
}

export function missingSources(health={}){
  return REQUIRED_SOURCES.filter(k=>String(health[k]||'').toLowerCase()!=='ok');
}

export function validateAnalysis(data){
  if(!data||typeof data!=='object')throw new Error('Analysis payload missing');
  if(!data.meta?.period)throw new Error('Analysis meta.period missing');
  for(const key of REQUIRED_ARRAYS){
    if(!Array.isArray(data[key]))throw new Error(`Analysis ${key} must be an array`);
  }
  for(const key of ['critical_outcomes','decisions','my_actions']){
    if(data[key].length===0)throw new Error(`Analysis ${key} is empty; refusing to replace the dashboard`);
  }
  if(!data.source_health||typeof data.source_health!=='object')throw new Error('Analysis source_health missing');
  return true;
}

export function validateCurrentSnapshot(data){
  try{return validateAnalysis(data)}catch{return false}
}

export {REQUIRED_SOURCES,REQUIRED_ARRAYS};
