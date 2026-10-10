const boot=require('./boot.js');const fs=require('fs'),path=require('path');
(async()=>{
  const {w}=await boot();const K=w.K63;const out={};
  const B={mode:'target',target:660,fat:50,stops:[3,6,5,6,3]};
  for(const [nm,f] of [['27Eyl',path.join(__dirname,'veri','kosu-27eylul.gpx')],['4Ekim',path.join(__dirname,'veri','kosu-4ekim.gpx')]]){
    const r=K.calib.analyze(K.calib.parseGpx(fs.readFileSync(f,'utf8')),{wUp:1,wDn:0});
    out[nm]={fc:{good:r.fc.good,mid:r.fc.mid,bad:r.fc.bad,band:r.fc.band},lv:{}};
    for(const lv of ['az','orta','cok']){const d=K.plan.dataResult(B,lv,r.fc);
      out[nm].lv[lv]={secs:d.rows.map(x=>[x.sec.a,x.sec.b]),t:d.rows.map(x=>x.t),arr:d.rows.map(x=>x.arr),eff:d.rows.map(x=>x.eff),cp:d.cp.map(c=>[c.arr,c.good,c.bad,c.buf,c.badBuf]),M:d.M,E:d.E,finish:d.finish};}
  }
  fs.mkdirSync(path.join(__dirname,'out'),{recursive:true});fs.writeFileSync(path.join(__dirname,'out','tahmin-js.json'),JSON.stringify(out));console.log('out/tahmin-js.json yazıldı');process.exit(0);
})();
