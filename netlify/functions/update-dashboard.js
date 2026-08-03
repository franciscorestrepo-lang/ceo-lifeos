const { getStore } = require('@netlify/blobs');
exports.handler = async (event) => {
  if(event.httpMethod!=='POST') return json(405,{error:'Método no permitido'});
  if(!process.env.LIFEOS_ADMIN_TOKEN) return json(500,{error:'Falta LIFEOS_ADMIN_TOKEN'});
  if(event.headers['x-admin-token']!==process.env.LIFEOS_ADMIN_TOKEN) return json(401,{error:'Token inválido'});
  try{
    const data=JSON.parse(event.body||'{}');
    if(!data.meta||!data.companies||!data.decisions) return json(400,{error:'JSON incompleto'});
    data.meta.generatedAt=new Date().toISOString();
    await getStore('ceo-lifeos').setJSON('current',data);
    return json(200,{ok:true,generatedAt:data.meta.generatedAt});
  }catch(e){return json(400,{error:e.message})}
};
function json(statusCode, body){return {statusCode,headers:{'content-type':'application/json'},body:JSON.stringify(body)}}
