// 3B arazi verisini uygulamanın kendi çözücüleriyle denetler (WebGL gerektirmez). Kullanım: node harita.js
// Veri tools/3b/uret.py ile üretilir; bu betik üretilen dosyaların uygulamayla ve parkurla tutarlı olduğunu sınar.
const boot=require('./boot.js');const fs=require('fs'),path=require('path');
const dir=process.env.K63DIR||path.join(__dirname,'..');
(async()=>{
  const {w,errors}=await boot();const K=w.K63,m3=K.map3d,C=K.C;
  let nf=0;const ok=(n,c,d)=>{if(!c)nf++;console.log((c?'OK   ':'FAIL ')+n+(d!==undefined?'  ['+d+']':''))};
  const kb=f=>(fs.statSync(path.join(dir,f)).size/1024).toFixed(0)+' KB';
  // arazi
  const b=fs.readFileSync(path.join(dir,'terrain.bin'));
  const T=m3.parseTerrain(b.buffer.slice(b.byteOffset,b.byteOffset+b.byteLength));
  ok('terrain.bin çözüldü',T.w>300&&T.h>250&&T.w*T.h<65536*4,T.w+' x '+T.h+' örnek, '+kb('terrain.bin'));
  ok('Örnek aralığı 20-35 m',T.W/(T.w-1)>20&&T.W/(T.w-1)<35&&T.H/(T.h-1)>20&&T.H/(T.h-1)<35,(T.W/(T.w-1)).toFixed(1)+' m doğu-batı, '+(T.H/(T.h-1)).toFixed(1)+' m kuzey-güney');
  const pay=Math.min((Math.min(...C.lon)-T.lon0)*T.kx,(T.lon1-Math.max(...C.lon))*T.kx,(Math.min(...C.lat)-T.lat0)*T.ky,(T.lat1-Math.max(...C.lat))*T.ky);
  ok('Parkur arazi kutusunun içinde, kenar payı en az 500 m',pay>=500,Math.round(pay)+' m');
  let s=0,mx=0;for(let i=0;i<K.N;i++){const d=Math.abs(m3.heightAt(T,C.lat[i],C.lon[i])-C.ele[i]);s+=d;if(d>mx)mx=d;}
  ok('Parkurda arazi rakımı = resmî GPX rakımı (ortalama fark < 3 m, en büyük < 20 m)',s/K.N<3&&mx<20,'ortalama '+(s/K.N).toFixed(2)+' m, en büyük '+mx.toFixed(1)+' m');
  // kuzey-güney yönü ters olsaydı: aynı karşılaştırma ters çevrilmiş enlemle kötü çıkmalı
  let sf=0;for(let i=0;i<K.N;i++)sf+=Math.abs(m3.heightAt(T,T.lat0+T.lat1-C.lat[i],C.lon[i])-C.ele[i]);
  ok('Yön denetimi: enlem ters çevrilince fark büyüyor',sf/K.N>20,'ters ortalama '+(sf/K.N).toFixed(1)+' m');
  // görüntü: JPEG boyutu (SOF0/SOF2 başlığı)
  const j=fs.readFileSync(path.join(dir,'terrain.jpg'));let wj=0,hj=0;
  for(let i=2;i<j.length-9;){if(j[i]!==0xFF)break;const mk=j[i+1],len=j.readUInt16BE(i+2);if(mk===0xC0||mk===0xC2){hj=j.readUInt16BE(i+5);wj=j.readUInt16BE(i+7);break;}i+=2+len;}
  ok('terrain.jpg 2\'nin kuvveti ve en çok 4096 px',wj===hj&&[512,1024,2048,4096].includes(wj),wj+' x '+hj+', '+kb('terrain.jpg'));
  // yollar
  const tj=JSON.parse(fs.readFileSync(path.join(dir,'trails.json'),'utf8')),tr=m3.decodeTrails(tj);
  const np=tr.reduce((a,x)=>a+x.p.length/2,0),bad=tr.filter(x=>x.p.length<4||x.p.some(v=>v<0||v>1)||(x.t!==0&&x.t!==1)).length;
  ok('trails.json çözüldü, tüm noktalar kutunun içinde',tr.length>1000&&bad===0,tr.filter(x=>x.t===0).length+' patika, '+tr.filter(x=>x.t===1).length+' yol, '+np+' nokta, '+kb('trails.json'));
  ok('trails.json ODbL notu taşıyor',/ODbL/.test(tj.lisans)&&/OpenStreetMap contributors/.test(tj.lisans));
  // OSM kapsamı: parkurun 15 m yakınında yol olan kısmı (ekran üstündeki ince çizgilerin parkuru ne kadar izlediği)
  const seg=[];tr.forEach(x=>{for(let i=2;i<x.p.length;i+=2)seg.push([x.p[i-2]*T.W,x.p[i-1]*T.H,x.p[i]*T.W,x.p[i+1]*T.H]);});
  const cell=100,grid=new Map();seg.forEach(q=>{for(let gx=Math.floor(Math.min(q[0],q[2])/cell)-1;gx<=Math.floor(Math.max(q[0],q[2])/cell)+1;gx++)for(let gy=Math.floor(Math.min(q[1],q[3])/cell)-1;gy<=Math.floor(Math.max(q[1],q[3])/cell)+1;gy++){const k=gx+','+gy;if(!grid.has(k))grid.set(k,[]);grid.get(k).push(q);}});
  let near=0;for(let i=0;i<K.N;i++){const px=(C.lon[i]-T.lon0)*T.kx,py=(C.lat[i]-T.lat0)*T.ky;let d=1e9;(grid.get(Math.floor(px/cell)+','+Math.floor(py/cell))||[]).forEach(q=>{const dx=q[2]-q[0],dy=q[3]-q[1],L=dx*dx+dy*dy,t=L?Math.max(0,Math.min(1,((px-q[0])*dx+(py-q[1])*dy)/L)):0;d=Math.min(d,Math.hypot(px-q[0]-t*dx,py-q[1]-t*dy));});if(d<=15)near++;}
  ok('OSM yolları parkurun en az %90\'ını izliyor (15 m)',near/K.N>=0.9,'%'+(near/K.N*100).toFixed(1));
  // çevrimdışı önbellek listesi
  const sw=fs.readFileSync(path.join(dir,'sw.js'),'utf8'),as=((sw.match(/ASSETS = \[([^\]]*)\]/)||[])[1]||'').match(/'\.\/[^']*'/g).map(x=>x.slice(3,-1));
  ok('sw.js: 3B dosyaları önbellek listesinde, sayı = EXPECTED',['map3d.js','terrain.bin','terrain.jpg','trails.json'].every(f=>as.includes(f))&&as.length===K.EXPECTED&&as.filter(Boolean).every(f=>fs.existsSync(path.join(dir,f))),as.length+' / '+K.EXPECTED);
  ok('sw.js sürümü = uygulama sürümü',sw.includes("'k63-"+K.BUILD+"'"),K.BUILD);
  const tot=['map3d.js','terrain.bin','terrain.jpg','trails.json'].reduce((a,f)=>a+fs.statSync(path.join(dir,f)).size,0);
  ok('3B toplam boyutu 1,5 MB\'ın altında',tot<1.5e6,(tot/1024).toFixed(0)+' KB');
  console.log('errors',errors.length,errors.join('\n'));console.log(nf?nf+' FAIL':'HEPSİ OK');
  process.exit(nf||errors.length?1:0);
})();
