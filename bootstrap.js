const nativeFetch=window.fetch.bind(window);
function validSnapshot(x){return Boolean(x?.meta?.period&&Array.isArray(x.critical_outcomes)&&x.critical_outcomes.length&&Array.isArray(x.decisions)&&x.decisions.length&&Array.isArray(x.my_actions)&&x.my_actions.length)}
window.fetch=async(input,init={})=>{
  const url=typeof input==='string'?input:input?.url||'';
  let path='';try{path=new URL(url,location.origin).pathname}catch{}
  const method=String(init?.method||'GET').toUpperCase();
  if(method==='GET'&&path==='/data/current.json'){
    try{
      const local=JSON.parse(localStorage.getItem('lifeos_last_analysis')||'null');
      if(validSnapshot(local))return new Response(JSON.stringify(local),{status:200,headers:{'Content-Type':'application/json','Cache-Control':'no-store','X-LifeOS-Source':'local-live-analysis'}});
      localStorage.removeItem('lifeos_last_analysis');
    }catch{localStorage.removeItem('lifeos_last_analysis')}
  }
  return nativeFetch(input,init);
};
