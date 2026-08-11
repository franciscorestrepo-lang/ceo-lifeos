import { fetchScheduledMicrosoft } from './lib/msgraph.mjs';
import { fetchReadMeetings } from './lib/readai.mjs';
import { analyzeExecutiveContext } from './lib/analyze-core.mjs';
import { saveLifeOS } from './lib/github.mjs';
import { sourceCounts,normalizeSourceHealth,missingSources,validateAnalysis } from './lib/refresh-core.mjs';

function env(name){return globalThis.Netlify?.env?.get(name)||''}
function missingConfig(names){return names.filter(n=>!env(n))}
function json(body,status=200){return Response.json(body,{status})}

export default async(req)=>{
  if(req.method!=='POST')return new Response('Method not allowed',{status:405});
  let body={};
  try{body=await req.json()}catch{return json({ok:false,stage:'request',error:'Invalid JSON body'},400)}

  const previous=body.previous||null;
  let microsoft=body.microsoft||null;
  const sourceErrors={};

  if(!microsoft){
    const missingMs=missingConfig(['MICROSOFT_TENANT_ID','MICROSOFT_CLIENT_ID','MICROSOFT_CLIENT_SECRET','MICROSOFT_USER_ID']);
    if(missingMs.length){
      sourceErrors.microsoft=`Missing Netlify variables: ${missingMs.join(', ')}`;
      microsoft={inbox:[],sent:[],flagged:[],events:[],chats:[],chatMessages:[],health:{mail:'missing',flagged:'missing',calendar:'missing',teams:'missing'}};
    }else{
      try{microsoft=await fetchScheduledMicrosoft()}catch(e){
        sourceErrors.microsoft=e.message;
        microsoft={inbox:[],sent:[],flagged:[],events:[],chats:[],chatMessages:[],health:{mail:e.message,flagged:e.message,calendar:e.message,teams:e.message}};
      }
    }
  }

  let read={meetings:[]};
  let readStatus='ok';
  const missingRead=missingConfig(['READ_AI_API_KEY']);
  if(missingRead.length){readStatus='missing';sourceErrors.read='Missing Netlify variable: READ_AI_API_KEY'}
  else{
    try{read=await fetchReadMeetings({since:new Date(Date.now()-30*864e5).toISOString()})}
    catch(e){readStatus=e.message;sourceErrors.read=e.message}
  }

  const sourceHealth=normalizeSourceHealth(microsoft,readStatus);
  const counts=sourceCounts(microsoft,read);
  const missing=missingSources(sourceHealth);
  if(missing.length){
    return json({ok:false,stage:'sources',error:'No se ejecutó el análisis porque no están conectadas todas las fuentes requeridas.',missing_sources:missing,source_health:sourceHealth,counts,source_errors:sourceErrors},424);
  }

  const provider=(env('AI_PROVIDER')||'openai').toLowerCase();
  const aiVars=provider==='anthropic'?['ANTHROPIC_API_KEY']:['OPENAI_API_KEY'];
  const missingAi=missingConfig(aiVars);
  if(missingAi.length)return json({ok:false,stage:'analysis',error:`Missing Netlify variable: ${missingAi.join(', ')}`,source_health:sourceHealth,counts},424);

  let analysis;
  try{
    analysis=await analyzeExecutiveContext({now:new Date().toISOString(),microsoft,read,previous,mode:'manual_refresh'});
    analysis.source_health=sourceHealth;
    validateAnalysis(analysis);
  }catch(e){
    return json({ok:false,stage:'analysis',error:e.message,source_health:sourceHealth,counts},500);
  }

  let persistence={ok:false,skipped:false,error:null,paths:[]};
  const missingGh=missingConfig(['GITHUB_TOKEN','GITHUB_OWNER','GITHUB_REPO']);
  if(missingGh.length){
    persistence={ok:false,skipped:true,error:`Missing Netlify variables: ${missingGh.join(', ')}`,paths:[]};
  }else{
    try{const saved=await saveLifeOS(analysis,{reason:'manual'});persistence={ok:true,skipped:false,error:null,paths:saved.paths||[]}}
    catch(e){persistence={ok:false,skipped:false,error:e.message,paths:[]}}
  }

  return json({ok:true,data:analysis,source_health:sourceHealth,counts,persistence});
};
