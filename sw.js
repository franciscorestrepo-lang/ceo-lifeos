const CACHE='ceo-lifeos-v4';
const SHELL=['/','/index.html','/styles.css','/app.js','/bootstrap.js','/refresh-v2.js','/manifest.webmanifest','/icon-192.svg','/icon-512.svg'];
self.addEventListener('install',e=>{self.skipWaiting();e.waitUntil(caches.open(CACHE).then(c=>c.addAll(SHELL)))});
self.addEventListener('activate',e=>e.waitUntil((async()=>{for(const k of await caches.keys())if(k!==CACHE)await caches.delete(k);await self.clients.claim()})()));
self.addEventListener('fetch',e=>{
  if(e.request.method!=='GET')return;
  const u=new URL(e.request.url);
  if(u.pathname==='/data/current.json'||u.pathname==='/app.js'||u.pathname==='/bootstrap.js'||u.pathname==='/refresh-v2.js'||u.pathname==='/index.html'||u.pathname==='/'){
    e.respondWith(fetch(e.request,{cache:'no-store'}).then(r=>{const x=r.clone();caches.open(CACHE).then(c=>c.put(e.request,x));return r}).catch(()=>caches.match(e.request)));
    return;
  }
  e.respondWith(caches.match(e.request).then(c=>c||fetch(e.request).then(r=>{const x=r.clone();caches.open(CACHE).then(cc=>cc.put(e.request,x));return r})));
});
