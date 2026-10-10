// loads app by inlining scripts (file:// resource loading is simpler)
const {JSDOM,VirtualConsole}=require('jsdom');const fs=require('fs'),path=require('path');
const dir=process.env.K63DIR||path.join(__dirname,'..');
async function boot(storage){
  let html=fs.readFileSync(path.join(dir,'index.html'),'utf8');
  const scripts=[];html=html.replace(/<script src="([^"]+)"><\/script>/g,(m,s)=>{scripts.push(s);return ''});
  const errors=[];const vc=new VirtualConsole();vc.on('jsdomError',e=>errors.push('jsdomError: '+(e.detail&&e.detail.stack||e.message)));vc.on('error',e=>errors.push('console.error: '+e));
  const dom=new JSDOM(html,{url:'https://test--x.netlify.app/',runScripts:'outside-only',pretendToBeVisual:true,virtualConsole:vc});
  const w=dom.window;w.matchMedia=()=>({matches:false,addListener(){},removeListener(){}});w.scrollTo=()=>{};
  if(storage)for(const[k,v]of Object.entries(storage))w.localStorage.setItem(k,v);
  for(const s of scripts){try{w.eval(fs.readFileSync(path.join(dir,s),'utf8'));}catch(e){errors.push('eval '+s+': '+e.stack)}}
  return {w,errors};
}
module.exports=boot;
if(require.main===module){(async()=>{
  const {w,errors}=await boot();
  console.log('BUILD',w.K63.BUILD,'errors',errors.length);errors.forEach(e=>console.log(e));
  // run self test
  const t0=Date.now();const res=w.K63.tools.runSelfTest();console.log("selftest ms",Date.now()-t0);
  console.log(res.filter(r=>r.ok).length+'/'+res.length);
  res.filter(r=>!r.ok).forEach(r=>console.log('FAIL',r.name,r.detail));
  process.exit(0);})()}
