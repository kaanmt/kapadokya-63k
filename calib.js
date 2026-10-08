(function () {
  'use strict';
  var K = window.K63;
  if (!K || !K.plan) return;
  var P = K.plan, $ = K.$, f = K.f, START_H = K.C.startHour;
  var KEY = 'k63calib-v3'; // v3: senaryolar değişti (iyi/ana/kötü); eski kayıt (v2) kullanılmaz, GPX'i yeniden yükle

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
  // Tahmin modeli sabitleri (4 Ekim koşusundan kalibre edildi; kullanıcı onayladı)
  var FC_WUP = 0.88, FC_WDN = -0.24;
  var SMOOTH_SEC = 9;      // konum yumuşatma penceresi (saniye, zaman bazlı)
  var DEFAULT_SLOW = 1.12; // 20 km'den kısa koşuda ölçülemeyen yavaşlama için varsayım: 30 km'lik bir koşunun ikinci yarısı %12 yavaş
  var REF_KM = 30;         // varsayılan yavaşlamanın tanımlı olduğu referans koşu uzunluğu
  var SHAPES = [1, 1.5, 2]; // yorulma şekli üsleri: iyi gün (doğrusal), ana tahmin (dışbükey, hızlanan), kötü gün (daha dışbükey)
  // Konumları zaman penceresinde ortalar (GPS titreşimi mesafeyi şişirir). sec <= 0: yumuşatma yok.
  function smoothPts(pts, sec) {
    if (!(sec > 0)) return pts;
    var n = pts.length, half = sec * 500, out = new Array(n), lo = 0, hi = 0, sLat = 0, sLon = 0;
    for (var i = 0; i < n; i++) {
      var t = pts[i].t;
      while (hi < n && pts[hi].t <= t + half) { sLat += pts[hi].lat; sLon += pts[hi].lon; hi++; }
      while (lo < hi && pts[lo].t < t - half) { sLat -= pts[lo].lat; sLon -= pts[lo].lon; lo++; }
      var c = hi - lo;
      out[i] = c > 0 ? { lat: sLat / c, lon: sLon / c, ele: pts[i].ele, t: t } : pts[i];
    }
    return out;
  }
  function analyze(pts0, w, opts) {
    opts = opts || {};
    var sec = opts.smoothSec === undefined ? SMOOTH_SEC : opts.smoothSec;
    var pts = smoothPts(pts0, sec);
    var n = pts.length, cum = [0];
    for (var i = 1; i < n; i++) cum.push(cum[i - 1] + hav(pts[i - 1], pts[i]));
    var D = cum[n - 1];
    if (D < 1000) throw new Error('Koşu 1 km\'den kısa');
    // hareket süresi (yarılara göre)
    var mov = 0, movH = [0, 0], elapsed = (pts[n - 1].t - pts[0].t) / 1000, mvc = [0];
    for (i = 1; i < n; i++) {
      var dt = (pts[i].t - pts[i - 1].t) / 1000, dd = cum[i] - cum[i - 1];
      if (dt > 0 && dd / dt >= STOP_SPEED) { mov += dt; movH[(cum[i - 1] + cum[i]) / 2 < D / 2 ? 0 : 1] += dt; }
      mvc.push(mov);
    }
    // rakım: 25 m'de yeniden örnekle, 3'lü ortalama (parkur verisiyle aynı yöntem)
    var STEP = 25, rs = [], tm = [], j = 0;
    for (var d = 0; d <= D; d += STEP) {
      while (j < n - 2 && cum[j + 1] < d) j++;
      var d0 = cum[j], d1 = cum[j + 1], u = d1 > d0 ? Math.min(1, Math.max(0, (d - d0) / (d1 - d0))) : 0;
      rs.push(pts[j].ele + (pts[j + 1].ele - pts[j].ele) * u);
      tm.push(mvc[j] + (mvc[j + 1] - mvc[j]) * u);
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
      slow: (p2 / p1 - 1) * 100, flatPace: mov / km, start: pts[0].t, wUp: w.wUp, wDn: w.wDn, points: n, smoothSec: sec, fc: forecast(sm, tm, mov, upT, km) };
  }

  /* ---------- Veriden tahmin: tek bir antrenman GPX'inden Kapadokya'da nerede ne zaman ---------- */
  // sm: 25 m'de yeniden örneklenmiş, yumuşatılmış rakım; tm: aynı noktalarda birikimli hareket saniyesi.
  // Model: efor (sabit 0,88 / -0,24 ağırlık) başına hareket temposu x yorulma çarpanı. Yorulma ikinci/ilk yarı tempo oranından ölçülür
  // ve üç şekille (iyi gün doğrusal x, ana tahmin x^1,5, kötü gün x^2) mutlak mesafeyle yarışa uzatılır.
  function bandFor(km) { return km >= 25 ? 0.02 : km >= 20 ? 0.04 : km >= 15 ? 0.06 : km >= 10 ? 0.09 : 0.14; }
  function gate(km, movH, climb, steepKm) {
    var lv = function (v, a, b) { return v >= a ? 2 : v >= b ? 1 : 0; };
    var lvls = [lv(km, 20, 10), lv(movH, 2, 1), lv(climb, 15, 8), steepKm >= 2 ? 2 : 1], level = Math.min.apply(null, lvls), reasons = [];
    if (lvls[0] < 2) reasons.push('mesafe ' + f(km, 1) + ' km (' + (lvls[0] ? 'yeterli için en az 20 km' : 'tahmin için en az 10 km') + ')');
    if (lvls[1] < 2) reasons.push('hareket süresi ' + f(movH, 1) + ' sa (' + (lvls[1] ? 'yeterli için en az 2 sa' : 'tahmin için en az 1 sa') + ')');
    if (lvls[2] < 2) reasons.push('tırmanış ' + f(climb, 0) + ' m/km (' + (lvls[2] ? 'yeterli için en az 15 m/km' : 'tahmin için en az 8 m/km') + ')');
    if (lvls[3] < 2) reasons.push('%8 üstü eğim ' + f(steepKm, 1) + ' km (yeterli için en az 2 km)');
    return { level: level === 2 ? 'ok' : level === 1 ? 'weak' : 'bad', reasons: reasons };
  }
  function forecast(sm, tm, movSec, upT, km) {
    var n = sm.length - 1, eff = new Array(n), dt = new Array(n), k, steepKm = 0;
    for (k = 1; k <= n; k++) {
      var dz = sm[k] - sm[k - 1];
      eff[k - 1] = Math.max(0.002, 0.025 + Math.max(dz, 0) * FC_WUP / 100 + Math.max(-dz, 0) * FC_WDN / 100);
      dt[k - 1] = tm[k] - tm[k - 1];
    }
    for (k = 0; k < n; k++) {
      var a = Math.max(0, k - 2), b = Math.min(n - 1, k + 2), g = 0;
      for (var q = a; q <= b; q++) g += (sm[q + 1] - sm[q]) / 25 * 100;
      if (g / (b - a + 1) >= 8) steepKm += 0.025;
    }
    var movH = movSec / 3600, climb = upT / km, gt = gate(km, movH, climb, steepKm);
    var out = { level: gt.level, reasons: gt.reasons, km: km, movH: movH, climb: climb, steepKm: steepKm, ok: gt.level !== 'bad' };
    if (!out.ok || n < 8) { out.ok = false; if (n < 8 && gt.level !== 'bad') { out.level = 'bad'; out.reasons.push('koşu çok kısa'); } return out; }
    var band = bandFor(km); if (gt.level === 'weak') band = Math.max(band, 0.09);
    // yarılar arası efor başına tempo oranı
    var h = Math.floor(n / 2), t1 = 0, e1 = 0, t2 = 0, e2 = 0;
    for (k = 0; k < n; k++) { if (k < h) { t1 += dt[k]; e1 += eff[k]; } else { t2 += dt[k]; e2 += eff[k]; } }
    var measured = km >= 20 && t1 > 0 && t2 > 0, r = measured ? (t2 / e2) / (t1 / e1) : DEFAULT_SLOW;
    // Ölçülen yavaşlama çok düşükse (<%5) tahmin güvenilmez: aralığı geniş tut
    out.lowSlow = measured && r < 1.05; if (out.lowSlow) band = Math.max(band, 0.09);
    out.measured = measured; out.slow = (r - 1) * 100; out.band = band;
    // Yorulma mutlak mesafeye bağlı. Ölçülen: koşunun kendi uzunluğu referans; ölçülemeyen: 30 km'lik referans koşu
    var runKm = measured ? n * 0.025 : REF_KM, x = new Array(n); for (k = 0; k < n; k++) x[k] = (k + 1) * 0.025 / runKm;
    var shapes = {}, names = ['good', 'mid', 'bad'];
    var tot = 0; for (k = 0; k < n; k++) tot += dt[k];
    SHAPES.forEach(function (pw, si) {
      // k katsayısı: 1 + kk x^pw çarpanıyla yarı tempo oranı r'yi verecek şekilde (ikili arama)
      var kk = 0;
      if (!measured) {
        var p1 = pw + 1, m1 = Math.pow(0.5, p1) / (p1 * 0.5), m2 = (1 - Math.pow(0.5, p1)) / (p1 * 0.5);
        kk = Math.max(0, (r - 1) / (m2 - r * m1));
      } else if (r > 1.0001) {
        var lo = 0, hi = 20;
        for (var it = 0; it < 70; it++) {
          var mid = (lo + hi) / 2, s1 = 0, s2 = 0, w1 = 0, w2 = 0;
          for (var j = 0; j < n; j++) { var m = 1 + mid * Math.pow(x[j], pw); if (j < h) { s1 += eff[j] * m; w1 += eff[j]; } else { s2 += eff[j] * m; w2 += eff[j]; } }
          if ((s2 / w2) / (s1 / w1) < r) lo = mid; else hi = mid;
        }
        kk = lo;
      }
      var den = 0; for (var j2 = 0; j2 < n; j2++) den += eff[j2] * (1 + kk * Math.pow(x[j2], pw));
      var base = tot / den, cumv = [], c2 = 0, idxs = K.cps.map(function (c) { return c.idx; }), ci = 0;
      for (var i2 = 1; i2 < K.N && ci < idxs.length; i2++) {
        var e = (K.dist[i2] - K.dist[i2 - 1]) / 1000 + (K.gain[i2] - K.gain[i2 - 1]) * FC_WUP / 100 + (K.loss[i2] - K.loss[i2 - 1]) * FC_WDN / 100;
        e = Math.max(0.002, e);
        c2 += base * e * (1 + kk * Math.pow(K.dist[i2] / 1000 / runKm, pw)) / 60;
        while (ci < idxs.length && idxs[ci] === i2) { cumv.push(c2); ci++; }
      }
      shapes[names[si]] = cumv; if (si === 1) out.basePace = base;
    });
    out.good = shapes.good; out.mid = shapes.mid; out.bad = shapes.bad;
    return out;
  }

  /* ---------- arayüz ---------- */
  function esc(t) { return String(t).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function ms(sec) { var t = Math.round(sec), m = Math.floor(t / 60), s = t % 60; return m + ':' + (s < 10 ? '0' : '') + s; }
  function hms(sec) { var t = Math.round(sec), hh = Math.floor(t / 3600), m = Math.floor(t % 3600 / 60), s = t % 60; return hh + ':' + (m < 10 ? '0' : '') + m + ':' + (s < 10 ? '0' : '') + s; }
  function load() { try { var r = K.store(KEY); return r ? JSON.parse(r) : null; } catch (e) { return null; } }
  function save(r) { K.store(KEY, JSON.stringify(r)); }
  // Plan sekmesindeki "Veri" görünümü için: kayıtlı koşunun tahmini (yeterliyse), yoksa null
  // 'none': kayıtlı koşu yok; 'bad': koşu tahmin için yetersiz; 'ok': tahmin hazır
  function status() { var r = load(); return !r || !r.fc ? 'none' : r.fc.ok ? 'ok' : 'bad'; }
  function current() { var r = load(); return r && r.fc && r.fc.ok ? { r: r, fc: r.fc } : null; }

  function render() {
    var el = P.calibEl(); if (!el) return;
    el.textContent = '';
    var det = document.createElement('details'); det.className = 'manual';
    var last = load();
    det.innerHTML = '<summary><b>Antrenmandan tahmin (GPX)</b>' + (last ? ' <span class="sub2">son: ' + f(last.km, 1) + ' km, düz-eş. ' + ms(last.pace) + ' /km</span>' : '') + '</summary>';
    var body = document.createElement('div');
    var hd = document.createElement('div'); hd.className = 'stp-head'; hd.innerHTML = '<b>GPX yükle</b>';
    body.appendChild(hd);
    K.infoBtn(hd, 'Bir antrenman koşusunun GPX kaydını yükle (Garmin Connect web sitesinde aktiviteyi aç, sağ üstteki dişli > "GPX\'e aktar"; Strava\'da "Orijinali dışa aktar"). Uygulama koşunun temposunu ve yavaşlamasını ölçer, Kapadokya parkurunda her noktaya ne zaman varabileceğini üç senaryoyla (iyi gün, ana tahmin, kötü gün) hesaplar. En iyisi en az 20 km, 2 saat ve tırmanışlı, mümkünse 40 km üstü bir koşu.');
    var lab = document.createElement('label'); lab.className = 'filelabel'; lab.innerHTML = 'GPX dosyası seç<input type="file" id="calFile" accept=".gpx,application/gpx+xml,application/xml,text/xml">';
    body.appendChild(lab);
    body.insertAdjacentHTML('beforeend', '<p class="note" id="calMsg"></p><div id="calOut"></div>');
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
          if (P.rerender) P.rerender();
        } catch (e) { msg.textContent = 'Okunamadı: ' + e.message; msg.className = 'note bad'; }
      };
      rd.onerror = function () { msg.textContent = 'Dosya okunamadı'; msg.className = 'note bad'; };
      rd.readAsText(file);
    });
  }
  function refresh() { var last = load(); if (last && $('calOut')) paintResult(last); }
  function paintResult(r) {
    var out = $('calOut'); if (!out) return;
    var fc = r.fc, html = '';
    if (!fc) html += '<p class="note bad">Bu kayıtta tahmin yok; GPX\'i yeniden yükle.</p>';
    else if (!fc.ok) html += '<p class="note bad">Bu koşu tahmin için yetersiz: ' + esc(fc.reasons.join('; ')) + '. Daha uzun (en az 10 km, 1 saat) ve tırmanışlı bir koşu yükle.</p>';
    else {
      html += '<p class="note ok">Tahmin hazır. Plan tablosunda "Veri" düğmesine dokun.</p>';
      html += '<p class="note">' + (fc.measured
        ? 'Yorulma ölçüldü: ikinci yarı ilk yarıdan efor başına %' + f(fc.slow, 1) + ' yavaş.'
        : '<span class="flag">Varsayım:</span> koşu 20 km\'den kısa, yavaşlama ölçülemedi; %' + f(fc.slow, 0) + ' varsayıldı.') +
        ' Rakım (parkur 1026-1471 m), hava ve arazi tahminde yok.</p>';
    }
    var rows = [
      ['Dosya', r.file || '-'],
      ['Mesafe (konum yumuşatma ' + (r.smoothSec || 0) + ' sn)', f(r.km, 2) + ' km'],
      ['Toplam süre / hareket süresi', hms(r.elapsed) + ' / ' + hms(r.moving)],
      ['Tırmanış / iniş (yumuşatılmış)', f(r.up, 0) + ' m / ' + f(r.down, 0) + ' m'],
      ['Efor (plan ağırlıklarıyla: tırmanış ' + f(r.wUp, 2) + ', iniş ' + f(r.wDn, 2) + ')', f(r.effort, 1) + ' km-efor'],
      ['Ortalama tempo (hareket)', ms(r.flatPace) + ' /km'],
      ['Düz-eşdeğer tempo (tüm koşu)', ms(r.pace) + ' /km'],
      ['İlk yarı / ikinci yarı (düz-eşdeğer)', ms(r.pace1) + ' / ' + ms(r.pace2) + ' /km'],
      ['Koşu içindeki yavaşlama (plan ağırlıklarıyla)', (r.slow >= 0 ? '+' : '−') + f(Math.abs(r.slow), 0) + ' %']
    ];
    var tr = rows.map(function (x) { return '<tr><td>' + esc(x[0]) + '</td><td class="r"><b>' + esc(x[1]) + '</b></td></tr>'; }).join('');
    html += '<details class="manual"><summary><b>Koşunun ölçümleri</b></summary><div class="tablewrap"><table class="plantable"><tbody>' + tr + '</tbody></table></div>' +
      '<p class="note">Durma: hız saniyede ' + f(STOP_SPEED, 1) + ' metrenin altındaki anlar hareket süresine katılmaz.</p></details>';
    out.innerHTML = html;
  }

  K.calib = { parseGpx: parseGpx, analyze: analyze, smoothPts: smoothPts, forecast: forecast, render: render, refresh: refresh, current: current, status: status, FC: { wUp: FC_WUP, wDn: FC_WDN, smoothSec: SMOOTH_SEC } };
  render();
  if (P.rerender && load()) P.rerender();   // plan.js bu dosyadan önce yüklenir; kayıtlı veri varsa Plan görünümünü yenile
})();
