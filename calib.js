(function () {
  'use strict';
  var K = window.K63;
  if (!K || !K.plan) return;
  var P = K.plan, $ = K.$, f = K.f;
  var KEY = 'k63calib-v1';

  /* ---------- GPX okuma ve hesap (saf fonksiyonlar; kendini sınama da kullanır) ---------- */
  function hav(a, b) {
    var R = 6371000, p1 = a.lat * Math.PI / 180, p2 = b.lat * Math.PI / 180, dp = p2 - p1, dl = (b.lon - a.lon) * Math.PI / 180;
    var x = Math.sin(dp / 2) * Math.sin(dp / 2) + Math.cos(p1) * Math.cos(p2) * Math.sin(dl / 2) * Math.sin(dl / 2);
    return 2 * R * Math.asin(Math.sqrt(x));
  }
  function childText(el, name) { var c = el.getElementsByTagName(name)[0]; return c ? c.textContent : null; }
  function parseGpx(text) {
    var doc = new DOMParser().parseFromString(text, 'application/xml');
    if (doc.getElementsByTagName('parsererror').length) throw new Error('GPX dosyası okunamadı');
    var nodes = doc.getElementsByTagName('trkpt');
    if (!nodes.length) throw new Error('Dosyada iz noktası (trkpt) yok; bir aktivite kaydı GPX\'i seç');
    var pts = [];
    for (var i = 0; i < nodes.length; i++) {
      var n = nodes[i], lat = parseFloat(n.getAttribute('lat')), lon = parseFloat(n.getAttribute('lon'));
      var e = childText(n, 'ele'), t = childText(n, 'time');
      if (isNaN(lat) || isNaN(lon)) continue;
      pts.push({ lat: lat, lon: lon, ele: e === null ? null : parseFloat(e), t: t === null ? NaN : Date.parse(t) });
    }
    if (pts.length < 10) throw new Error('Çok az nokta var');
    if (pts.filter(function (p) { return !isNaN(p.t); }).length < pts.length * 0.9) throw new Error('Bu GPX\'te zaman bilgisi yok (rota/parkur dosyası olabilir); koşunun aktivite kaydını indir');
    if (pts.filter(function (p) { return p.ele !== null && !isNaN(p.ele); }).length < pts.length * 0.9) throw new Error('Bu GPX\'te rakım bilgisi yok');
    return pts;
  }
  // w = { wUp, wDn } plan ağırlıkları; STOP_SPEED altındaki hız durma sayılır
  var STOP_SPEED = 0.3; // m/s
  function analyze(pts, w) {
    var n = pts.length, cum = [0];
    for (var i = 1; i < n; i++) cum.push(cum[i - 1] + hav(pts[i - 1], pts[i]));
    var D = cum[n - 1];
    if (D < 1000) throw new Error('Koşu 1 km\'den kısa');
    // hareket süresi (yarılara göre)
    var mov = 0, movH = [0, 0], elapsed = (pts[n - 1].t - pts[0].t) / 1000;
    for (i = 1; i < n; i++) {
      var dt = (pts[i].t - pts[i - 1].t) / 1000, dd = cum[i] - cum[i - 1];
      if (!(dt > 0)) continue;
      if (dd / dt >= STOP_SPEED) { mov += dt; movH[(cum[i - 1] + cum[i]) / 2 < D / 2 ? 0 : 1] += dt; }
    }
    // rakım: 25 m'de yeniden örnekle, 3'lü ortalama (parkur verisiyle aynı yöntem)
    var STEP = 25, rs = [], j = 0;
    for (var d = 0; d <= D; d += STEP) {
      while (j < n - 2 && cum[j + 1] < d) j++;
      var d0 = cum[j], d1 = cum[j + 1], u = d1 > d0 ? Math.min(1, Math.max(0, (d - d0) / (d1 - d0))) : 0;
      rs.push(pts[j].ele + (pts[j + 1].ele - pts[j].ele) * u);
    }
    var sm = rs.map(function (_, k) { var a = Math.max(0, k - 1), b = Math.min(rs.length - 1, k + 1), s = 0; for (var q = a; q <= b; q++) s += rs[q]; return s / (b - a + 1); });
    var up = [0, 0], dn = [0, 0];
    for (var k = 1; k < sm.length; k++) {
      var dz = sm[k] - sm[k - 1], h = (k - 0.5) * STEP < D / 2 ? 0 : 1;
      if (dz > 0) up[h] += dz; else dn[h] -= dz;
    }
    function eff(km, u, dw) { return km + u * w.wUp / 100 + dw * w.wDn / 100; }
    var km = D / 1000, upT = up[0] + up[1], dnT = dn[0] + dn[1];
    var E = eff(km, upT, dnT), E1 = eff(km / 2, up[0], dn[0]), E2 = eff(km / 2, up[1], dn[1]);
    var pace = mov / E, p1 = movH[0] / E1, p2 = movH[1] / E2;   // saniye / km-efor
    return { km: km, elapsed: elapsed, moving: mov, up: upT, down: dnT, effort: E, pace: pace, pace1: p1, pace2: p2,
      slow: (p2 / p1 - 1) * 100, flatPace: mov / km, start: pts[0].t, wUp: w.wUp, wDn: w.wDn, points: n };
  }

  /* ---------- arayüz ---------- */
  function esc(t) { return String(t).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function ms(sec) { var t = Math.round(sec), m = Math.floor(t / 60), s = t % 60; return m + ':' + (s < 10 ? '0' : '') + s; }
  function hms(sec) { var t = Math.round(sec), hh = Math.floor(t / 3600), m = Math.floor(t % 3600 / 60), s = t % 60; return hh + ':' + (m < 10 ? '0' : '') + m + ':' + (s < 10 ? '0' : '') + s; }
  function hm(min) { var t = Math.round(min), hh = Math.floor(t / 60), m = t % 60; return hh + ':' + (m < 10 ? '0' : '') + m; }
  function load() { try { var r = K.store(KEY); return r ? JSON.parse(r) : null; } catch (e) { return null; } }
  function save(r) { K.store(KEY, JSON.stringify(r)); }

  function render() {
    var el = P.calibEl(); if (!el) return;
    el.textContent = '';
    var det = document.createElement('details'); det.className = 'manual';
    var last = load();
    det.innerHTML = '<summary><b>Antrenmandan kalibrasyon (GPX)</b>' + (last ? ' <span class="sub2">son: ' + f(last.km, 1) + ' km, düz-eş. ' + ms(last.pace) + ' /km</span>' : '') + '</summary>';
    var body = document.createElement('div');
    body.innerHTML = '<p class="note">Bir koşunun GPX kaydını yükle (Garmin Connect web sitesinde aktiviteyi aç, sağ üstteki dişli > "GPX\'e aktar"). Uygulama o koşunun düz-eşdeğer temposunu hesaplar; istersen A/B/C\'ye başlangıç temposu olarak uygularsın. Antrenman temposu yarış temposu değildir: değeri sen seçersin, uygulama sadece ölçer.</p>' +
      '<label class="filelabel">GPX dosyası seç<input type="file" id="calFile" accept=".gpx,application/gpx+xml,application/xml,text/xml"></label>' +
      '<p class="note" id="calMsg"></p><div id="calOut"></div>';
    det.appendChild(body); el.appendChild(det);
    if (last) { det.open = false; paintResult(last); }
    $('calFile').addEventListener('change', function () {
      var file = this.files && this.files[0]; if (!file) return;
      var msg = $('calMsg'); msg.textContent = 'Okunuyor...'; msg.className = 'note';
      var rd = new FileReader();
      rd.onload = function () {
        try {
          var st = P.state(), r = analyze(parseGpx(String(rd.result || '')), { wUp: st.wUp, wDn: st.wDn });
          r.file = file.name; r.at = new Date().toISOString(); save(r);
          msg.textContent = 'Okundu: ' + file.name; msg.className = 'note ok'; paintResult(r); det.open = true;
        } catch (e) { msg.textContent = 'Okunamadı: ' + e.message; msg.className = 'note bad'; }
      };
      rd.onerror = function () { msg.textContent = 'Dosya okunamadı'; msg.className = 'note bad'; };
      rd.readAsText(file);
    });
  }
  function paintResult(r) {
    var out = $('calOut'); if (!out) return;
    var rows = [
      ['Dosya', r.file || '-'],
      ['Mesafe', f(r.km, 2) + ' km'],
      ['Toplam süre / hareket süresi', hms(r.elapsed) + ' / ' + hms(r.moving)],
      ['Tırmanış / iniş (yumuşatılmış)', f(r.up, 0) + ' m / ' + f(r.down, 0) + ' m'],
      ['Efor (plan ağırlıklarıyla: tırmanış ' + f(r.wUp, 2) + ', iniş ' + f(r.wDn, 2) + ')', f(r.effort, 1) + ' km-efor'],
      ['Ortalama tempo (hareket)', ms(r.flatPace) + ' /km'],
      ['Düz-eşdeğer tempo (tüm koşu)', ms(r.pace) + ' /km'],
      ['İlk yarı / ikinci yarı (düz-eşdeğer)', ms(r.pace1) + ' / ' + ms(r.pace2) + ' /km'],
      ['Koşu içindeki yavaşlama', (r.slow >= 0 ? '+' : '−') + f(Math.abs(r.slow), 0) + ' %']
    ];
    var tr = rows.map(function (x) { return '<tr><td>' + esc(x[0]) + '</td><td class="r"><b>' + esc(x[1]) + '</b></td></tr>'; }).join('');
    var html = '<div class="tablewrap"><table class="plantable"><tbody>' + tr + '</tbody></table></div>';
    html += '<p class="note">Durma: hız saniyede ' + f(STOP_SPEED, 1) + ' metrenin altındaki anlar hareket süresine katılmaz. Yavaşlama yalnızca bu koşuya ait; yarıştaki "Yavaşlama" ayarı yarış uzunluğu için ayrıca düşünülmeli.</p>';
    html += '<div class="stp-head"><b>Başlangıç temposu olarak uygula</b><span class="note">Önerilen değer: ilk yarının düz-eşdeğer temposu ' + ms(r.pace1) + ' /km (yarışın başı taze). İstersen tüm koşunun değeri: ' + ms(r.pace) + ' /km</span></div>';
    var st = P.state();
    ['A', 'B', 'C'].forEach(function (k) {
      var s = st.sc[k];
      var trial = { mode: 'pace', target: s.target, p0: Math.round(r.pace1), fat: s.fat, stops: s.stops };
      var res = P.compute(trial);
      html += '<div class="catrow"><div class="fl"><b>' + k + '</b><div class="sub2">yavaşlama %' + s.fat + ' ile bitiş ' + (res.valid ? hm(res.finish) : '--') + ' (şu an ' + (P.compute(s).valid ? hm(P.compute(s).finish) : '--') + ')</div></div><button type="button" class="btn small" data-k="' + k + '">' + k + '\'ya uygula</button></div>';
    });
    out.innerHTML = html;
    Array.prototype.forEach.call(out.querySelectorAll('button[data-k]'), function (b) {
      b.addEventListener('click', function () {
        if (!b.getAttribute('data-ask')) { b.setAttribute('data-ask', '1'); b.textContent = 'Emin misin? Tekrar dokun'; setTimeout(function () { if (b.isConnected) { b.removeAttribute('data-ask'); b.textContent = b.getAttribute('data-k') + '\'ya uygula'; } }, 4000); return; }
        P.applyPace(b.getAttribute('data-k'), r.pace1); render();
        var m = $('calMsg'); if (m) { m.textContent = b.getAttribute('data-k') + ' planı düz tempo moduna alındı, başlangıç temposu ' + ms(r.pace1) + ' /km. Plan sekmesinde istediğin gibi değiştirebilirsin.'; m.className = 'note ok'; }
      });
    });
  }

  K.calib = { parseGpx: parseGpx, analyze: analyze, render: render };
  render();
})();
