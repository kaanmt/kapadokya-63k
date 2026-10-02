(function () {
  'use strict';
  var K = window.K63;
  if (!K) return;
  var $ = K.$;

  /* ---------- Kendini sına ---------- */
  // Beklenen değerler uygulamadan BAĞIMSIZ bir hesapla (Python) doğrulandı; bkz. plan dosyası bölüm 21.6.
  var PLAN_DEFAULTS = { level: 'orta', wUp: 1, wDn: 0 };
  var PLAN_VECTORS = [
    { name: 'A varsayılan (10:00, %40, durmalar 2-4-3-4-2)', s: { mode: 'target', target: 600, fat: 40, stops: [2, 4, 3, 4, 2] }, arr: [91.34, 236.55, 330.53, 415.04, 494.53, 600] },
    { name: 'B varsayılan (11:00, %50, durmalar 3-6-5-6-3)', s: { mode: 'target', target: 660, fat: 50, stops: [3, 6, 5, 6, 3] }, arr: [96.32, 253.16, 357.26, 451.92, 541.55, 660] },
    { name: 'C varsayılan (12:00, %70, durmalar 5-10-8-10-5)', s: { mode: 'target', target: 720, fat: 70, stops: [5, 10, 8, 10, 5] }, arr: [97.14, 262.86, 378.12, 483.84, 586.1, 720] }
  ];
  var NUT_VECTORS = [
    { name: '85 kg, çok terleme, 15 °C, kafein az, hareket 585 dk', p: { kg: 85, sweat: 'high', temp: 15, caf: 'low', health: false, M: 585 }, exp: [700, 530, 65, 128] },
    { name: '75 kg, normal, 15 °C, kafein az, hareket 637 dk', p: { kg: 75, sweat: 'normal', temp: 15, caf: 'low', health: false, M: 637 }, exp: [500, 300, 60, 113] },
    { name: '55 kg, az, 30 °C, kafein normal, hareket 700 dk', p: { kg: 55, sweat: 'low', temp: 30, caf: 'normal', health: false, M: 700 }, exp: [490, 250, 55, 165] },
    { name: '100 kg, çok, 25 °C, kafeinsiz, hareket 525 dk (üst sınır)', p: { kg: 100, sweat: 'high', temp: 25, caf: 'none', health: false, M: 525 }, exp: [750, 560, 65, 0] }
  ];
  function near(a, b, tol) { return Math.abs(a - b) <= tol; }
  function runSelfTest() {
    var res = [];
    function check(name, ok, detail) { res.push({ name: name, ok: !!ok, detail: detail || '' }); }
    try {
      check('Parkur mesafesi 62,97 km', near(K.TOTAL / 1000, 62.97, 0.01), (K.TOTAL / 1000).toFixed(3) + ' km');
      check('Toplam tırmanış 2030 m', near(K.gain[K.N - 1], 2030, 1), K.gain[K.N - 1].toFixed(1) + ' m');
      var cpkm = [11.01, 26.99, 37.1, 45.81, 52.22, 62.97];
      check('Kontrol noktası kilometreleri', K.cps.every(function (c, i) { return near(c.km, cpkm[i], 0.011); }), K.cps.map(function (c) { return c.km; }).join(', '));
      if (K.plan) {
        PLAN_VECTORS.forEach(function (v) {
          var r = K.plan.compute(v.s, PLAN_DEFAULTS);
          var ok = r.valid && r.cp.length === v.arr.length && r.cp.every(function (c, i) { return near(c.arr, v.arr[i], 0.02); });
          check('Plan modeli: ' + v.name, ok, r.cp.map(function (c) { return c.arr.toFixed(2); }).join(', '));
        });
        var bad = K.plan.compute({ mode: 'pace', target: 600, p0: 0, fat: 40, stops: [2, 4, 3, 4, 2] }, PLAN_DEFAULTS);
        check('Düz tempo 0 iken plan geçersiz', !bad.valid, String(bad.valid));
      } else check('Plan modülü yüklü', false);
      if (K.nutrition) {
        check('Sabit parkur eforu 83,26 km-efor', near(K.nutrition.E_STD, 83.265, 0.02), K.nutrition.E_STD.toFixed(3));
        NUT_VECTORS.forEach(function (v) {
          var t = K.nutrition.targetsFrom(v.p), got = [t.fluid, t.na, t.carb, t.cafCap];
          check('Beslenme hedefi: ' + v.name, got.join('/') === v.exp.join('/'), 'beklenen ' + v.exp.join(' / ') + ', çıkan ' + got.join(' / '));
        });
        check('Tuz 0,9 g = sodyum 360 mg', K.nutrition.saltToNa(0.9) === 360, String(K.nutrition.saltToNa(0.9)));
        var w = K.nutrition.parseWeather({ hourly: { time: ['2026-10-17T06:00', '2026-10-17T07:00', '2026-10-17T08:00', '2026-10-17T09:00', '2026-10-18T07:00'], temperature_2m: [2, 4, 6, 8, 30] } }, 7, 9);
        check('Hava tahmini okuma (örnek veri)', near(w.avg, 6, 0.001) && w.n === 3, 'ortalama ' + w.avg + ', ' + w.n + ' saat');
      } else check('Beslenme modülü yüklü', false);
      var P = window.PRODUCTS || [], F = window.FOODS || [];
      var badP = P.filter(function (p) { return !(p.src && p.src.length && typeof p.carb === 'number' && typeof p.na === 'number' && typeof p.caf === 'number' && p.id && p.type); });
      check('Ürün kataloğu (en az 15 ürün, her birinde kaynak ve karbonhidrat/sodyum/kafein)', P.length >= 15 && !badP.length, P.length + ' ürün' + (badP.length ? ', eksik: ' + badP.map(function (p) { return p.id; }).join(', ') : ''));
      var ids = {}; var dup = P.filter(function (p) { if (ids[p.id]) return true; ids[p.id] = 1; return false; });
      check('Ürün kimlikleri tekil', !dup.length, dup.length ? dup.map(function (p) { return p.id; }).join(', ') : P.length + ' tekil');
      check('Yiyecek listesi (17 yiyecek)', F.length === 17, F.length + ' yiyecek');
      var ev1 = K.nutrition.evaluate('onthego-progel-mocha-150', '', '');
      if (ev1.valid) check('Üretici günlük sınırı: kafeinli jel en fazla 2', ev1.tot.gels <= 2, ev1.tot.gels + ' adet');
      var ev2 = K.nutrition.evaluate('', '', 'bigjoy-sodium-plus');
      if (ev2.valid) check('Üretici günlük sınırı: Sodium Plus en fazla 1', ev2.tot.salts <= 1, ev2.tot.salts + ' adet');
    } catch (e) { check('Beklenmeyen hata', false, e.message); }
    return res;
  }
  function paintSelf(res, cacheLine) {
    var all = res.slice();
    if (cacheLine) all.push({ name: cacheLine.text, ok: cacheLine.ok, detail: '' });
    var out = $('selfOut'), passed = all.filter(function (r) { return r.ok; }).length;
    var html = '<div class="' + (passed === all.length ? 'ok' : 'bad') + '"><b>' + passed + ' / ' + all.length + ' geçti</b> (sürüm ' + K.BUILD + ')</div>';
    all.forEach(function (r) { html += '<div class="' + (r.ok ? 'ok' : 'bad') + '">' + (r.ok ? '✓ ' : '✕ ') + r.name + (r.detail ? ' <span class="sub2">(' + r.detail.replace(/</g, '&lt;') + ')</span>' : '') + '</div>'; });
    out.innerHTML = html;
    K.lastSelfTest = { passed: passed, total: all.length, cacheOk: cacheLine ? cacheLine.ok : null, items: all };
  }
  var sb = $('selfBtn');
  if (sb) sb.addEventListener('click', function () {
    var res = runSelfTest();
    if (!('caches' in window)) { paintSelf(res, { ok: false, text: 'Önbellek bu tarayıcıda yok' }); return; }
    caches.keys().then(function (keys) {
      var want = 'k63-' + K.BUILD, has = keys.indexOf(want) >= 0;
      if (!has) return { ok: false, text: 'Önbellek sürümü uygulama sürümüyle aynı değil (beklenen ' + want + ', bulunan: ' + (keys.join(', ') || 'yok') + '). Sayfayı kapatıp aç.' };
      return caches.open(want).then(function (c) { return c.keys(); }).then(function (r) {
        return { ok: r.length >= K.EXPECTED, text: 'Önbellek ' + want + ': ' + r.length + ' / ' + K.EXPECTED + ' dosya' };
      });
    }).then(function (line) { paintSelf(res, line); }).catch(function () { paintSelf(res, { ok: false, text: 'Önbellek okunamadı' }); });
  });

  /* ---------- Yedekleme ---------- */
  function collect() {
    var data = {};
    try { for (var i = 0; i < localStorage.length; i++) { var k = localStorage.key(i); if (k && k.indexOf('k63') === 0) data[k] = localStorage.getItem(k); } } catch (e) {}
    return { app: 'kapadokya63k', build: K.BUILD, exported: new Date().toISOString(), data: data };
  }
  function msg(t, cls) { var m = $('bkMsg'); if (m) { m.textContent = t; m.className = 'note' + (cls ? ' ' + cls : ''); } }
  var bx = $('bkExport');
  if (bx) bx.addEventListener('click', function () {
    var txt = JSON.stringify(collect()), box = $('bkText'); box.value = txt;
    var n = Object.keys(collect().data).length;
    if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(txt).then(function () { msg('Yedek kopyalandı (' + n + ' kayıt). Güvenli bir yere yapıştır.', 'ok'); }, function () { box.select(); msg('Metni seçip kopyala (' + n + ' kayıt).'); });
    else { box.select(); msg('Metni seçip kopyala (' + n + ' kayıt).'); }
  });
  var bd = $('bkDownload');
  if (bd) bd.addEventListener('click', function () {
    try {
      var blob = new Blob([JSON.stringify(collect(), null, 1)], { type: 'application/json' });
      var a = document.createElement('a'), d = new Date();
      a.href = URL.createObjectURL(blob);
      a.download = 'kapadokya63k-yedek-' + d.getFullYear() + String(d.getMonth() + 1).padStart(2, '0') + String(d.getDate()).padStart(2, '0') + '.json';
      document.body.appendChild(a); a.click(); a.remove();
      setTimeout(function () { URL.revokeObjectURL(a.href); }, 2000);
      msg('Dosya indirildi.', 'ok');
    } catch (e) { msg('Dosya indirilemedi; "Yedeği göster ve kopyala"yı kullan.', 'bad'); }
  });
  var bf = $('bkFile');
  if (bf) bf.addEventListener('change', function () {
    var file = bf.files && bf.files[0]; if (!file) return;
    var rd = new FileReader();
    rd.onload = function () { $('bkText').value = String(rd.result || ''); msg('Dosya okundu. "Yedeği geri yükle"ye dokun.'); };
    rd.onerror = function () { msg('Dosya okunamadı.', 'bad'); };
    rd.readAsText(file);
  });
  var bi = $('bkImport');
  function restore(text) {
    var o = JSON.parse(text);
    if (!o || o.app !== 'kapadokya63k' || !o.data || typeof o.data !== 'object') throw new Error('Bu bir Kapadokya 63K yedeği değil');
    var keys = Object.keys(o.data).filter(function (k) { return k.indexOf('k63') === 0 && typeof o.data[k] === 'string'; });
    if (!keys.length) throw new Error('Yedekte kayıt yok');
    keys.forEach(function (k) { localStorage.setItem(k, o.data[k]); });
    return keys.length;
  }
  if (bi) bi.addEventListener('click', function () {
    if (!bi.getAttribute('data-ask')) {
      bi.setAttribute('data-ask', '1'); bi.textContent = 'Emin misin? Mevcut ayarların üzerine yazar. Tekrar dokun';
      setTimeout(function () { bi.removeAttribute('data-ask'); bi.textContent = 'Yedeği geri yükle'; }, 5000); return;
    }
    bi.removeAttribute('data-ask'); bi.textContent = 'Yedeği geri yükle';
    try { var n = restore($('bkText').value); msg(n + ' kayıt geri yüklendi. Sayfa yenileniyor...', 'ok'); setTimeout(function () { location.reload(); }, 800); }
    catch (e) { msg('Geri yüklenemedi: ' + e.message, 'bad'); }
  });

  K.tools = { runSelfTest: runSelfTest, collect: collect, restore: restore };
})();
