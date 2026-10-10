const boot=require('./boot.js');const path=require('path');const fs=require('fs');
const GPX=path.join(__dirname,'veri','kosu-27eylul.gpx');
(async()=>{
  const {w,errors}=await boot();const K=w.K63,doc=w.document;
  const T=(id)=>doc.getElementById(id).textContent.replace(/\s+/g,' ');
  let nf=0;const ok=(n,c,d)=>{if(!c)nf++;console.log((c?'OK   ':'FAIL ')+n+(d!==undefined?'  ['+d+']':''))};
  const hs=()=>Array.from(doc.querySelectorAll('#tab-plan h2')).map(h=>h.textContent);
  ok('Başlık: sürüm 0.20, "test sürümü" yok',/sürüm 0\.20/.test(doc.querySelector('header').textContent)&&!/test sürümü/.test(doc.body.textContent.replace(/TEST ORTAMI[^.]*\./,'')),doc.querySelector('header .sub').textContent);
  // Profil ⓘ
  ok('Profil: "Start 07:00" notu ⓘ arkasında',!/Start 07:00\. Kesim saati/.test(T('tab-profile'))&&!!doc.querySelector('#tab-profile h2 .tipbtn'));
  // 2B | 3B anahtarı (jsdom'da WebGL ve fetch yok: 3B açıklayıcı mesaj gösterir, 2B çalışır)
  const pv=()=>Array.from(doc.querySelectorAll('#profView .chip')),vis=id=>!doc.getElementById(id).hidden;
  ok('3B: anahtar "2B | 3B", açılışta 2B',pv().map(c=>c.textContent+':'+c.getAttribute('aria-pressed')).join(' ')==='2B:true 3B:false'&&vis('chart')&&!vis('map3d'));
  pv()[1].click();
  ok('3B seçilince grafik gizlenir, harita kutusu ve kendi açıklaması gelir',!vis('chart')&&vis('map3d')&&!vis('legend2')&&vis('legend3')&&pv()[1].getAttribute('aria-pressed')==='true'&&w.localStorage.getItem('k63profview')==='3');
  ok('3B: kuzey oku düğmesi ve yatay özet satırı var',!!doc.querySelector('#map3d #m3north #m3needle')&&/^0,0 km · /.test(T('profHud'))&&K.profFull()===false,T('profHud'));
  ok('3B açılamazsa mesaj: 2B çalışmaya devam eder',/2B görünüm çalışmaya devam eder/.test(T('m3msg')),T('m3msg'));
  ok('3B: atıf görünür, lisans metinleri ⓘ\'de',/OpenStreetMap contributors/.test(doc.querySelector('.m3-attr').textContent)&&!/WorldDEM-30/.test(T('tab-profile'))&&!!doc.querySelector('#legend3 .tipbtn'));
  doc.querySelector('#legend3 .tipbtn').click();
  ok('3B ⓘ: Copernicus, Sentinel ve ODbL metinleri',/Copernicus WorldDEM-30 © DLR/.test(T('tab-profile'))&&/modified Copernicus Sentinel data 2026/.test(T('tab-profile'))&&/ODbL/.test(T('tab-profile')));
  doc.querySelector('#legend3 .tipbtn').click();
  const geri=doc.getElementById('fwd');geri.click();
  ok('3B seçiliyken İleri 500 m: km satırı değişir, anahtar bozulmaz',doc.getElementById('rKm').textContent==='0,5'&&pv()[1].getAttribute('aria-pressed')==='true'&&pv()[0].getAttribute('aria-pressed')==='false');
  pv()[0].click();
  ok('2B\'ye dönünce grafik çizili, seçim kaydedildi',vis('chart')&&!vis('map3d')&&!!doc.querySelector('#chart svg path.g-area')&&w.localStorage.getItem('k63profview')==='2');
  K.setIdx(0);
  K.showTab('plan');
  let t=T('tab-plan');
  ok('fb1: "Plan bir tahmin değildir" yok',!/tahmin değildir/.test(t));
  const kids=Array.from(doc.getElementById('tab-plan').children).map(e=>e.className);
  ok('fb2/fb8: anahtar A/B/C\'nin hemen altında',kids[1]==='seg'&&kids[2]==='viewsw'||kids.indexOf('viewsw')===kids.indexOf('seg')+1,kids.slice(0,4).join(','));
  const vchip=()=>Array.from(doc.querySelectorAll('#tab-plan .viewsw .chip'));
  ok('Veri pasif, "Veri (GPX yükle)"',vchip()[1].disabled&&/GPX yükle/.test(vchip()[1].textContent));
  ok('Özet: Plan A',hs().some(x=>x.startsWith('Özet: Plan A')),hs().join(' / '));
  ok('A/B/C kartı Veri sütunsuz',hs().some(x=>x.startsWith('A, B ve C yan yana')));
  // eski kayıt (v0.16, şekil katsayısı yok)
  const r=K.calib.analyze(K.calib.parseGpx(fs.readFileSync(GPX,'utf8')),{wUp:1,wDn:0});r.file='27eylul.gpx';r.at=new Date().toISOString();
  const old=JSON.parse(JSON.stringify(r));delete old.fc.shp;delete old.fc.runKm;
  w.localStorage.setItem('k63calib-v3',JSON.stringify(old));K.plan.rerender();K.calib.render();
  ok('Eski kayıt: Veri pasif ve "yeniden yükle" mesajı',vchip()[1].disabled&&/yeniden yükle/.test(T('tab-plan')),K.calib.status());
  // yeni kayıt
  w.localStorage.setItem('k63calib-v3',JSON.stringify(r));K.plan.rerender();K.calib.render();
  t=T('tab-plan');
  ok('GPX sonrası Veri aktif',!vchip()[1].disabled);
  ok('Plan modunda Özet\'te tek satır "Veriye göre: iddialı"',/Veriye göre: iddialı/.test(t)&&doc.querySelectorAll('#tab-plan .datalabel').length===1);
  ok('"Veriye denk hedef süre" yok',!/Veriye denk/.test(t));
  ok('fb3: başlık "A, B, C ve Veri yan yana"',hs().some(x=>x.startsWith('A, B, C ve Veri yan yana')));
  const cmpT=doc.querySelector('#tab-plan table.cmp4');
  ok('fb3: tabloda Veri sütunu',!!cmpT&&cmpT.querySelectorAll('thead th').length===5,cmpT&&Array.from(cmpT.querySelectorAll('thead th')).map(x=>x.textContent).join('|'));
  ok('fb3: grafikte Veri çizgisi ve bant',!!doc.querySelector('#tab-plan path.t-V')&&!!doc.querySelector('#tab-plan path.t-band'));
  ok('Garmin: Veri satırı',/Veri A durmaları/.test(T('tab-plan').replace(/\s+/g,' ')));
  // Veri moduna geç
  vchip()[1].click();t=T('tab-plan');
  ok('Özet: Veri (A durmaları)',hs().some(x=>x.startsWith('Özet: Veri (A durmaları)')),hs().join(' / '));
  const sel=K.plan.selected();ok('selected() = data',sel.kind==='data',sel.label);
  const fin=sel.r.finish, M=sel.r.M;
  ok('Veri bitiş = ana hareket + A durmaları (15 dk)',Math.abs(fin-(M+15))<1e-9,(M/60).toFixed(3)+' sa + 15 dk');
  const dd=Array.from(doc.querySelectorAll('#tab-plan dl.sumlist dt')).map(x=>x.textContent);
  ok('Veri Özet satırları',dd.join('|')==='Bitiş (ana tahmin)|İyi gün - kötü gün|Hareket süresi (durmasız)|Toplam efor|Ortalama düz-eşdeğer tempo',dd.join('|'));
  ok('Veri modunda "Veriye göre" satırı yok',doc.querySelectorAll('#tab-plan .datalabel').length===0);
  const heads=Array.from(doc.querySelectorAll('#tab-plan details.cpsec .cpm')).map(e=>e.querySelector('b').textContent+' '+e.querySelector('.sub2').textContent);
  console.log('  CP başlıkları:',heads.join(' | '));
  ok('fb4: büyük sayı start=0 (sa:dk), gri aralık start=0 (sa:dk - sa:dk)',heads.length===6&&heads.every(x=>/^\d+:\d\d \d+:\d\d - \d+:\d\d$/.test(x)),heads[0]);
  ok('fb8: Veri satırları sektörlerle açılır',doc.querySelectorAll('#tab-plan details.cpsec table.sectable tbody tr').length===K.plan.buildSectors(K.plan.state().level).length);
  const finCp=sel.r.cp[5];
  const hm=m=>{const t=Math.round(m);return Math.floor(t/60)+':'+String(t%60).padStart(2,'0')};
  ok('Finiş satırı: '+hm(finCp.arr)+' ('+hm(finCp.good)+' - '+hm(finCp.bad)+')',heads[5]===hm(finCp.arr)+' '+hm(finCp.good)+' - '+hm(finCp.bad),heads[5]);
  ok('Ya şöyle olursa Veri\'yi izler',hs().some(x=>/Ya şöyle olursa\? \(Veri, A durmaları\)/.test(x)));
  // Gelişmiş ⓘ notu
  const adv=Array.from(doc.querySelectorAll('#tab-plan h2')).find(h=>h.textContent.startsWith('Gelişmiş'));adv.querySelector('.tipbtn').click();
  ok('Gelişmiş ⓘ: Veri sürelerini etkilemez',/Veri'nin sürelerini etkilemez/.test(T('tab-plan')));
  // Beslenme
  K.showTab('nutrition');t=T('tab-nutrition');
  ok('Beslenme: A/B/C düğmesi yok',!Array.from(doc.querySelectorAll('#tab-nutrition .chip')).some(c=>/^[ABC]\s/.test(c.textContent)));
  ok('Beslenme: "Veri (A durmaları): bitiş '+hm(fin)+'"',new RegExp('Veri \\(A durmaları\\): bitiş '+hm(fin)).test(t));
  ok('Beslenme: uygulama planı başlığı (Veri, ...)',/Uygulama planı \(Veri, /.test(t));
  const bk=K.nutrition.breakdown();ok('Beslenme hesabı Veri hareket süresiyle',Math.abs(bk.M-M)<1e-9,bk.M.toFixed(2));
  ok('fb5: tıbbi uyarı görünür, açıklama ⓘ\'de',/Genel bilgidir, tıbbi tavsiye değildir\./.test(t)&&!/Cevapladığın bilgilere göre/.test(t)&&!/Bilmiyorsan "Bilmiyorum"/.test(t)&&!/Potasyum ve magnezyum için hedef/.test(t));
  ok('fb5: sağlık sorusunun örneği görünür',/Örnek: tansiyon ilacı/.test(t));
  ok('fb5: Beslenme ⓘ sayısı',doc.querySelectorAll('#tab-nutrition .tipbtn').length>=9,doc.querySelectorAll('#tab-nutrition .tipbtn').length);
  // Yarış
  K.showTab('race');t=T('tab-race');
  ok('Yarış: plan seçme düğmesi yok',!Array.from(doc.querySelectorAll('#tab-race .chip')).some(c=>/^[ABC]\s/.test(c.textContent)));
  ok('Yarış: "Neye göre?" Veri (A durmaları)',/Neye göre\?.*Veri \(A durmaları\): bitiş/.test(t));
  ok('fb5: Yarış açıklamaları ⓘ\'de',!/Koşarken süreyi, mesafeyi/.test(t)&&!/Ekranı saatlerce açık tutmak/.test(t));
  Array.from(doc.querySelectorAll('#tab-race button')).find(b=>b.textContent==='Yarışı başlat').click();
  const race=JSON.parse(w.localStorage.getItem('k63race-v1'));
  ok('Yarış Veri ile kaydedildi',race.kind==='data'&&race.label==='Veri (A durmaları)'&&Math.abs(race.snap.finish-fin)<1e-9,race.label);
  ok('Yarış sektörleri tahminden',race.snap.secs.length===K.plan.buildSectors(K.plan.state().level).length&&Math.abs(race.snap.secs[race.snap.secs.length-1].t1-fin)<1e-9);
  let nh=0;race.nut.rows.forEach(x=>nh+=x.hours);ok('Yarış beslenmesi Veri\'den (bölümler = hareket)',Math.abs(nh*60-M)<1e-6,(nh*60).toFixed(2));
  t=T('tab-race');ok('Yarış ekranı "Veriye göre"',/Veriye göre/.test(t)&&!/Plana göre/.test(t));
  // sıfırla, Plan'a dön
  w.localStorage.removeItem('k63race-v1');
  K.showTab('plan');vchip()[0].click();
  K.showTab('nutrition');ok('Plan\'a dönünce Beslenme "Plan A"',/Plan A: bitiş 10:00/.test(T('tab-nutrition')));
  // Test sekmesi ⓘ
  ok('Test sekmesi notları ⓘ\'de',!/Uygulamanın hesaplarını, bağımsız/.test(T('tab-test'))&&!!doc.querySelector('#selftest h2 .tipbtn'));
  const res=K.tools.runSelfTest();ok('Kendini sına (veri yüklü) '+res.filter(x=>x.ok).length+'/'+res.length,res.every(x=>x.ok),res.filter(x=>!x.ok).map(x=>x.name+': '+x.detail).join('; '));
  console.log('errors',errors.length,errors.join('\n'));console.log(nf?nf+' FAIL':'HEPSİ OK');
  process.exit(0);
})();
