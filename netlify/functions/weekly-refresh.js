const { getStore } = require('@netlify/blobs');
exports.handler = async () => {
  const source=process.env.LIFEOS_SOURCE_URL;
  if(!source) return {statusCode:200,body:'LIFEOS_SOURCE_URL no configurada; se conserva la versión actual.'};
  const headers={};
  if(process.env.LIFEOS_SOURCE_TOKEN) headers.authorization=`Bearer ${process.env.LIFEOS_SOURCE_TOKEN}`;
  const res=await fetch(source,{headers});
  if(!res.ok) throw new Error(`Fuente respondió ${res.status}`);
  const data=await res.json();
  data.meta=data.meta||{};data.meta.generatedAt=new Date().toISOString();
  await getStore('ceo-lifeos').setJSON('current',data);
  return {statusCode:200,body:'LifeOS actualizado'};
};
