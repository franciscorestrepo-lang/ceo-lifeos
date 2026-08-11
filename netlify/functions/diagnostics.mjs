import { fetchScheduledMicrosoft } from './lib/msgraph.mjs';
import { fetchReadMeetings } from './lib/readai.mjs';
import { sourceCounts,normalizeSourceHealth,missingSources } from './lib/refresh-core.mjs';

function env(name){return globalThis.Netlify?.env?.get(name)||''}
function has(name){return Boolean(env(name))}

export default async()=>{
  const config={
    microsoft_server:['MICROSOFT_TENANT_ID','MICROSOFT_CLIENT_ID','MICROSOFT_CLIENT_SECRET','MICROSOFT_USER_ID'].every(has),
    read:has('READ_AI_API_KEY'),
    ai:(env('AI_PROVIDER')||'openai').toLowerCase()==='anthropic'?has('ANTHROPIC_API_KEY'):has('OPENAI_API_KEY'),
    github:['GITHUB_TOKEN','GITHUB_OWNER','GITHUB_REPO'].every(has)
  };
  let microsoft={inbox:[],sent:[],flagged:[],events:[],chatMessages:[],health:{mail:'missing',flagged:'missing',calendar:'missing',teams:'missing'}};
  let read={meetings:[]};let readStatus='missing';const errors={};
  if(config.microsoft_server){try{microsoft=await fetchScheduledMicrosoft()}catch(e){errors.microsoft=e.message}}
  if(config.read){try{read=await fetchReadMeetings({since:new Date(Date.now()-7*864e5).toISOString()});readStatus='ok'}catch(e){readStatus=e.message;errors.read=e.message}}
  const source_health=normalizeSourceHealth(microsoft,readStatus);
  return Response.json({ok:Object.values(config).every(Boolean)&&missingSources(source_health).length===0,config,source_health,counts:sourceCounts(microsoft,read),missing_sources:missingSources(source_health),errors});
};
