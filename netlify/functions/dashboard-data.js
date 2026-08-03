const { getStore } = require('@netlify/blobs');
const fs = require('fs');
const path = require('path');
exports.handler = async () => {
  try {
    const store = getStore('ceo-lifeos');
    const saved = await store.get('current', { type: 'json' });
    if (saved) return json(200, saved);
  } catch (e) {}
  const fallback = JSON.parse(fs.readFileSync(path.join(process.cwd(),'data','current.json'),'utf8'));
  return json(200, fallback);
};
function json(statusCode, body){return {statusCode,headers:{'content-type':'application/json','cache-control':'no-store'},body:JSON.stringify(body)}}
