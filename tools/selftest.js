// Uygulamayı yükler, Test sekmesindeki "Kendini sına"yı çalıştırır. Kullanım: node selftest.js
const boot=require('./boot.js');
(async()=>{
  const {w,errors}=await boot();
  console.log('Sürüm (BUILD):',w.K63.BUILD,'| yükleme hatası:',errors.length);errors.forEach(e=>console.log(e));
  const res=w.K63.tools.runSelfTest();
  console.log('Kendini sına:',res.filter(r=>r.ok).length+'/'+res.length);
  res.filter(r=>!r.ok).forEach(r=>console.log('FAIL',r.name,r.detail));
  process.exit(errors.length||res.some(r=>!r.ok)?1:0);
})();
