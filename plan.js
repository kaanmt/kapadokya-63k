(function () {
  'use strict';
  var K = window.K63;
  if (!K) return;
  var $ = K.$, f = K.f, cps = K.cps, C = K.C;
  var START_H = C.startHour;

  /* ---------- tabs ---------- */
  var tabs = ['profile', 'plan', 'nutrition', 'race', 'test'];
  function showTab(name) {
    if (tabs.indexOf(name) < 0) name = 'profile';
    tabs.forEach(function (t) { $('tab-' + t).hidden = (t !== name); });
    Array.prototype.forEach.call(document.querySelectorAll('#nav button'), function (b) {
      if (b.getAttribute('data-tab') === name) b.setAttribute('aria-current', 'page'); else b.removeAttribute('aria-current');
    });
    K.store('k63tab', name);
    window.scrollTo(0, 0);
    if (name === 'profile') K.drawChart();
    if (name === 'plan') { renderAll(); if (K.calib) K.calib.render(); }
    if (K.race) K.race.onTab(name);
    if (K.nutrition) K.nutrition.onTab(name);
  }
  Array.prototype.forEach.call(document.querySelectorAll('#nav button'), function (b) {
    b.addEventListener('click', function () { showTab(b.getAttribute('data-tab')); });
  });

  /* ---------- steep stretches (|grade| >= 15 %, at least 75 m) ---------- */
  var steep = [];
  (function () {
    var cur = null;
    function close() {
      if (cur && K.dist[cur.b] - K.dist[cur.a] >= 75) steep.push(cur);
      cur = null;
    }
    for (var i = 0; i < K.N; i++) {
      var g = K.grade[i];
      if (Math.abs(g) >= 15) {
        var up = g > 0;
        if (cur && cur.up === up && i - cur.b <= 2) { cur.b = i; if (Math.abs(g) > Math.abs(cur.max)) cur.max = g; }
        else { close(); cur = { a: i, b: i, up: up, max: g }; }
      }
    }
    close();
  })();

  /* ---------- sectors ---------- */
  var LEVELS = [{ id: 'az', name: 'Az' }, { id: 'orta', name: 'Orta' }, { id: 'cok', name: 'Çok' }];
  var sectorCache = {};
  function buildSectors(level) {
    if (sectorCache[level]) return sectorCache[level];
    var ends = C.sec[level], prev = 0, out = [];
    ends.forEach(function (b) {
      var a = prev, L = K.dist[b] - K.dist[a];
      var ci = 0;
      while (ci < cps.length - 1 && cps[ci].idx < b) ci++;
      var mx = -Infinity, mn = Infinity, st = 0, stMax = 0;
      for (var i = a; i <= b; i++) { if (K.grade[i] > mx) mx = K.grade[i]; if (K.grade[i] < mn) mn = K.grade[i]; }
      steep.forEach(function (s) { var mid = (s.a + s.b) / 2; if (mid >= a && mid < b + (b === K.N - 1 ? 1 : 0)) { st++; if (Math.abs(s.max) > stMax) stMax = Math.abs(s.max); } });
      var avg = L > 0 ? (K.ele[b] - K.ele[a]) / L * 100 : 0;
      out.push({
        a: a, b: b, ci: ci, km: L / 1000, kmFrom: K.dist[a] / 1000, kmTo: K.dist[b] / 1000,
        up: K.gain[b] - K.gain[a], down: K.loss[b] - K.loss[a], avg: avg,
        maxUp: Math.max(0, mx), maxDn: Math.min(0, mn), steep: st, steepMax: stMax,
        type: avg >= 3 ? 'C' : avg <= -3 ? 'D' : 'F',
        last: false
      });
      prev = b;
    });
    out.forEach(function (s, i) { s.last = (i === out.length - 1) || out[i + 1].ci !== s.ci; });
    sectorCache[level] = out;
    return out;
  }
  var TYPE = { C: 'Çıkış', D: 'İniş', F: 'Düz' };
  var NSTOP = cps.length - 1;

  /* ---------- state ---------- */
  function clone(o) { return JSON.parse(JSON.stringify(o)); }
  var DEF = {
    sel: 'A', level: 'orta', wUp: 1, wDn: 0, whatCp: 1, whatDelta: 15,
    sc: {
      A: { mode: 'target', target: 600, p0: 0, fat: 40, stops: [2, 4, 3, 4, 2] },
      B: { mode: 'target', target: 660, p0: 0, fat: 50, stops: [3, 6, 5, 6, 3] },
      C: { mode: 'target', target: 720, p0: 0, fat: 70, stops: [5, 10, 8, 10, 5] }
    }
  };
  var LABEL = { A: 'Hedef gün', B: 'Gerçekçi gün', C: 'Kötü gün' };
  var st = clone(DEF);
  (function load() {
    try {
      var raw = K.store('k63plan-v2') || K.store('k63plan-v1');
      if (!raw) return;
      var o = JSON.parse(raw);
      if (!o || !o.sc) return;
      ['A', 'B', 'C'].forEach(function (k) {
        var s = o.sc[k];
        if (s && typeof s.target === 'number' && typeof s.fat === 'number' && Array.isArray(s.stops) && s.stops.length === NSTOP) {
          st.sc[k] = { mode: s.mode === 'pace' ? 'pace' : 'target', target: s.target, p0: typeof s.p0 === 'number' ? s.p0 : 0, fat: s.fat, stops: s.stops };
        }
      });
      if (['A', 'B', 'C'].indexOf(o.sel) >= 0) st.sel = o.sel;
      if (['az', 'orta', 'cok'].indexOf(o.level) >= 0) st.level = o.level;
      if (typeof o.wUp === 'number') st.wUp = o.wUp;
      if (typeof o.wDn === 'number') st.wDn = o.wDn;
      if (typeof o.whatCp === 'number') st.whatCp = Math.max(0, Math.min(NSTOP - 1, o.whatCp));
      if (typeof o.whatDelta === 'number') st.whatDelta = o.whatDelta;
    } catch (e) {}
  })();
  function save() { K.store('k63plan-v2', JSON.stringify(st)); }
  // Tablo görünümü: 'plan' (A/B/C dağıtımı) veya 'data' (antrenman GPX'inden tahmin); seçim hatırlanır
  var view = K.store('k63planview') === 'data' ? 'data' : 'plan';
  function setView(v) { view = v; K.store('k63planview', v); }

  /* ---------- model ---------- */
  // Each sector gets an "effort" = km + climb/100 x wUp + descent/100 x wDn.
  // Moving time is distributed over sectors by effort, with a slowdown that grows along the race.
  // This is a distribution rule, not a forecast.
  function sum(a, b) { return a + b; }
  function cur() { return { level: st.level, wUp: st.wUp, wDn: st.wDn }; }
  function efforts(o) {
    var secs = buildSectors(o.level);
    return secs.map(function (x) { return Math.max(0.05, x.km + x.up * o.wUp / 100 + x.down * o.wDn / 100); });
  }
  function shape(s, o) {
    var eff = efforts(o || cur()), E = eff.reduce(sum, 0), cum = 0, w = [];
    eff.forEach(function (e) { var mid = (cum + e / 2) / E; w.push(e * (1 + s.fat / 100 * mid)); cum += e; });
    return { eff: eff, E: E, w: w, W: w.reduce(sum, 0) };
  }
  function p0FromTarget(s) { // sec per km-effort at the start that reproduces the target
    var sh = shape(s, cur()), M = s.target - s.stops.reduce(sum, 0);
    return sh.W > 0 && M > 0 ? M * 60 / sh.W : 360;
  }
  // o: { level, wUp, wDn } verilmezse kullanıcının Plan ayarları kullanılır
  function compute(s, o) {
    o = o || cur();
    var secs = buildSectors(o.level), sh = shape(s, o);
    var stopsTot = s.stops.reduce(sum, 0), el = 0, rows = [], cpRows = [];
    var M, valid = true;
    if (s.mode === 'pace') M = sh.W * ((s.p0 > 0 ? s.p0 : 0) / 60); else M = s.target - stopsTot;
    valid = M > 0;
    var cpMv = 0;
    secs.forEach(function (x, i) {
      var t = valid ? (s.mode === 'pace' ? sh.w[i] * s.p0 / 60 : M * sh.w[i] / sh.W) : 0;
      el += t; cpMv += t;
      var row = { sec: x, eff: sh.eff[i], t: t, arr: el };
      rows.push(row);
      if (x.last) {
        var stop = x.ci < NSTOP ? s.stops[x.ci] : 0;
        row.dep = el + stop; row.stop = stop;
        cpRows.push({ arr: el, dep: el + stop, stop: stop, mv: cpMv, buf: cps[x.ci].cut * 60 - el });
        el += stop; cpMv = 0;
      }
    });
    var finish = cpRows.length ? cpRows[cpRows.length - 1].arr : 0;
    return { rows: rows, cp: cpRows, M: M, valid: valid, finish: finish, E: sh.E, sh: sh };
  }

  /* ---------- formatting ---------- */
  function hm(min) {
    var t = Math.round(min), sign = t < 0 ? '-' : '';
    t = Math.abs(t);
    var h = Math.floor(t / 60), m = t % 60;
    return sign + h + ':' + (m < 10 ? '0' : '') + m;
  }
  function ms(sec) { var t = Math.round(sec), m = Math.floor(t / 60), s = t % 60; return m + ':' + (s < 10 ? '0' : '') + s; }
  function dur(min) { return min >= 60 ? hm(min) : Math.round(min) + ' dk'; }
  function clock(min) { return K.hhmm(START_H + min / 60); }
  function status(buf) {
    if (buf < 0) return { cls: 'bad', icon: '✕', text: 'Kesim aşılıyor' };
    if (buf < 20) return { cls: 'bad', icon: '✕', text: 'Tehlike' };
    if (buf < 60) return { cls: 'warn', icon: '!', text: 'Dikkat' };
    return { cls: 'ok', icon: '✓', text: 'Güvende' };
  }
  function esc(t) { return String(t).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function pct(v) { return '%' + f(Math.abs(v), 0); }
  function sgn(v, d) { return (v >= 0 ? '+' : '−') + f(Math.abs(v), d); }

  /* ---------- UI blocks ---------- */
  function h(tag, cls, html) { var e = document.createElement(tag); if (cls) e.className = cls; if (html !== undefined) e.innerHTML = html; return e; }
  function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }
  function stepper(label, hint, getText, onStep, steps, fmtStep) {
    var wrap = h('div', 'stp');
    var head = h('div', 'stp-head', '<b>' + esc(label) + '</b>');
    wrap.appendChild(head);
    if (hint) K.infoBtn(head, esc(hint));
    var row = h('div', 'stp-row');
    var val = h('span', 'stp-val', esc(getText()));
    function mk(d) {
      var lab = fmtStep ? fmtStep(d) : (d > 0 ? '+' : '−') + Math.abs(d);
      var b = h('button', 'btn step', lab); b.type = 'button';
      b.setAttribute('aria-label', label + ' ' + (d > 0 ? 'artır' : 'azalt'));
      b.addEventListener('click', function () { onStep(d); val.textContent = getText(); });
      return b;
    }
    steps.filter(function (d) { return d < 0; }).forEach(function (d) { row.appendChild(mk(d)); });
    row.appendChild(val);
    steps.filter(function (d) { return d > 0; }).forEach(function (d) { row.appendChild(mk(d)); });
    wrap.appendChild(row);
    return wrap;
  }
  function chipRow(items, isOn, onPick) {
    var box = h('div', 'chips');
    items.forEach(function (it) {
      var b = h('button', 'chip', esc(it.label)); b.type = 'button';
      b.setAttribute('aria-pressed', String(isOn(it)));
      b.addEventListener('click', function () { onPick(it); });
      box.appendChild(b);
    });
    return box;
  }

  /* ---------- build plan tab ---------- */
  var root = $('tab-plan');
  var elCalib, elSeg, elEditor, elSummary, elResults, elCompare, elWhat, elGarmin, elAdv;
  (function build() {
    var tt = h('h2', 'tabtitle', 'Plan'); root.appendChild(tt);
    K.infoBtn(tt, 'Başlangıç değerleri örnektir, kendi değerlerinle değiştir. Antrenman GPX\'i yüklersen sonuç tablosundaki "Veri" düğmesi, plan yerine verinden hesaplanan varış saatlerini gösterir.');
    root.appendChild(h('p', 'note', 'Plan bir tahmin değildir: girdiğin hedefi veya temponu parkura dağıtır. Gerçek süreler hava, yorgunluk ve mide durumuna göre farklı olur.'));
    elSeg = h('div', 'seg'); root.appendChild(elSeg);
    root.appendChild(h('p', 'settingsline'));
    elEditor = h('section', 'card'); root.appendChild(elEditor);
    elCalib = h('section', 'card calib'); root.appendChild(elCalib);
    elSummary = h('section', 'card'); root.appendChild(elSummary);
    elResults = h('section', 'card'); root.appendChild(elResults);
    elCompare = h('section', 'card'); root.appendChild(elCompare);
    elWhat = h('section', 'card'); root.appendChild(elWhat);
    elGarmin = h('section', 'card'); root.appendChild(elGarmin);
    elAdv = h('section', 'card'); root.appendChild(elAdv);
  })();

  function renderSeg() {
    elSeg.textContent = '';
    ['A', 'B', 'C'].forEach(function (k) {
      var r = compute(st.sc[k]);
      var tm = r.valid ? hm(r.finish) : '--';
      var b = h('button', 'segbtn', '<b>' + k + '</b><span>' + esc(LABEL[k]) + '</span><span class="segt">' + tm + '</span>');
      b.type = 'button';
      b.setAttribute('aria-pressed', String(st.sel === k));
      b.addEventListener('click', function () { st.sel = k; save(); renderAll(); });
      elSeg.appendChild(b);
    });
  }

  function renderEditor() {
    var s = st.sc[st.sel];
    elEditor.textContent = '';
    elEditor.appendChild(h('h2', '', st.sel + ': ' + LABEL[st.sel]));
    // mode switch
    elEditor.appendChild(chipRow([{ id: 'target', label: 'Hedef süre gir' }, { id: 'pace', label: 'Düz tempo gir' }],
      function (it) { return s.mode === it.id; },
      function (it) {
        if (it.id === s.mode) return;
        if (it.id === 'pace') { s.p0 = Math.round(p0FromTarget(s)); s.mode = 'pace'; }
        else { var r = compute(s); s.target = clamp(Math.round(r.finish), 240, 750); s.mode = 'target'; }
        save(); renderAll();
      }));
    if (s.mode === 'target') {
      elEditor.appendChild(stepper('Hedef bitiş süresi', '', function () { return hm(s.target); },
        function (d) { s.target = clamp(s.target + d, 240, 750); save(); renderDerived(); }, [-5, -1, 1, 5]));
    } else {
      elEditor.appendChild(stepper('Düz-eşdeğer tempo (yarışın başında)', 'Taze başladığında düz yolda 1 km kaç dakika. Tırmanış ve iniş efora çevrilir.',
        function () { return ms(s.p0) + ' /km'; },
        function (d) { s.p0 = clamp(s.p0 + d, 180, 720); save(); renderDerived(); }, [-10, -5, 5, 10],
        function (d) { return (d > 0 ? '+' : '−') + Math.abs(d) + ' sn'; }));
    }
    elEditor.appendChild(stepper('Yavaşlama', 'Yarışın sonunda başlangıca göre yüzde kaç yavaşlarsın', function () { return '%' + s.fat; },
      function (d) { s.fat = clamp(s.fat + d, 0, 150); save(); renderDerived(); }, [-5, -1, 1, 5]));
    var stops = h('div', 'stp');
    var stopHead = h('div', 'stp-head', '<b>Durma süreleri</b>'); stops.appendChild(stopHead); K.infoBtn(stopHead, 'Her noktada kaç dakika kalırsın.');
    var stopTot = h('p', 'settingsline');
    cps.slice(0, NSTOP).forEach(function (c, i) {
      var row = h('div', 'stop-row');
      row.appendChild(h('span', 'stop-name', esc(c.name)));
      var bm = h('button', 'btn step', '−'); bm.type = 'button'; bm.setAttribute('aria-label', c.name + ' durma süresini azalt');
      var bp = h('button', 'btn step', '+'); bp.type = 'button'; bp.setAttribute('aria-label', c.name + ' durma süresini artır');
      var val = h('span', 'stp-val small', s.stops[i] + ' dk');
      bm.addEventListener('click', function () { s.stops[i] = clamp(s.stops[i] - 1, 0, 45); val.textContent = s.stops[i] + ' dk'; save(); renderDerived(); });
      bp.addEventListener('click', function () { s.stops[i] = clamp(s.stops[i] + 1, 0, 45); val.textContent = s.stops[i] + ' dk'; save(); renderDerived(); });
      row.appendChild(bm); row.appendChild(val); row.appendChild(bp);
      stops.appendChild(row);
    });
    stops.appendChild(stopTot);
    elEditor.appendChild(stops);
    paintSettings();
  }

  // Sonucu etkileyen ayarlar her zaman görünür; varsayılandan farklıysa işaretlenir.
  function settingsInfo(key) {
    var s = st.sc[key], d = DEF.sc[key];
    var tot = s.stops.reduce(sum, 0), dtot = d.stops.reduce(sum, 0);
    var adv = [];
    if (Math.abs(st.wUp - DEF.wUp) > 1e-9) adv.push('tırmanış ağırlığı ' + f(st.wUp, 2) + ' (varsayılan ' + f(DEF.wUp, 2) + ')');
    if (Math.abs(st.wDn - DEF.wDn) > 1e-9) adv.push('iniş ağırlığı ' + f(st.wDn, 2) + ' (varsayılan ' + f(DEF.wDn, 2) + ')');
    if (st.level !== DEF.level) adv.push('ayrıntı ' + st.level + ' (varsayılan ' + DEF.level + ')');
    return { stops: tot, defStops: dtot, stopsChanged: tot !== dtot, adv: adv };
  }
  function paintSettings() {
    var i = settingsInfo(st.sel);
    var els = document.querySelectorAll('#tab-plan .settingsline');
    Array.prototype.forEach.call(els, function (e) {
      e.innerHTML = 'Durma toplamı: <b>' + i.stops + ' dk</b>' + (i.stopsChanged ? ' <span class="flag">varsayılandan farklı (' + i.defStops + ' dk)</span>' : ' (varsayılan)') +
        '<br>Gelişmiş ayarlar: ' + (i.adv.length ? '<span class="flag">' + esc(i.adv.join(', ')) + '</span>' : 'varsayılan');
    });
  }

  /* ---------- Veri: antrenman GPX'inden tahmin (calib.js) ---------- */
  // Seçili planın durmalarıyla, her nokta için iyi / ana / kötü gün varışı (dakika, yarış başından). iyi ve kötü uç tempo belirsizliğini (band) içerir;
  // hareket süreleri (mov) çıplaktır. Kesim payı ana varışa göre; badBuf yalnızca kötü gün uyarısı için.
  function dataFor(s) {
    var cur = K.calib && K.calib.current && K.calib.current(); if (!cur) return null;
    var r = compute(s); if (!r.valid) return null;
    var fc = cur.fc, n = cps.length, out = { fc: fc, r: r, cp: [], stopTot: s.stops.reduce(sum, 0) }, sb = 0;
    for (var ci = 0; ci < n; ci++) {
      var good = fc.good[ci] * (1 - fc.band) + sb, mid = fc.mid[ci] + sb, bad = fc.bad[ci] * (1 + fc.band) + sb, cut = cps[ci].cut * 60;
      out.cp.push({ good: good, mid: mid, bad: bad, buf: cut - mid, badBuf: cut - bad });
      if (ci < s.stops.length) sb += s.stops[ci];
    }
    out.mov = { good: fc.good[n - 1], mid: fc.mid[n - 1], bad: fc.bad[n - 1] };
    return out;
  }
  function dataLabel(M, mv) {
    if (M < mv.good) return { name: 'iddialı', text: 'iyi günden ' + dur(mv.good - M) + ' hızlı' };
    if (M < mv.mid) return { name: 'iyimser', text: 'ana tahminden ' + dur(mv.mid - M) + ' hızlı' };
    if (M <= mv.bad) return { name: 'gerçekçi', text: 'ana tahminden ' + dur(M - mv.mid) + ' yavaş, kötü günden ' + dur(mv.bad - M) + ' hızlı' };
    return { name: 'çok temkinli', text: 'kötü günden ' + dur(M - mv.bad) + ' yavaş' };
  }

  function renderSummary() {
    var s = st.sc[st.sel], r = compute(s);
    elSummary.textContent = '';
    var sumHead = h('h2', '', 'Özet'); elSummary.appendChild(sumHead);
    K.infoBtn(sumHead, 'Düz-eşdeğer tempo: tırmanış ve inişi düz yola çevirdikten sonra 1 km efor için gereken süre. Kendi antrenmandaki rahat ultra temponla karşılaştırıp gerçekçi mi diye bak.');
    if (!r.valid) { elSummary.appendChild(h('p', 'warnbox', 'Durma süreleri hedef süreden uzun. Hedef süreyi artır veya durma sürelerini azalt.')); return; }
    var sh = r.sh, pFirst = r.rows[0].t / sh.eff[0], pLast = r.rows[r.rows.length - 1].t / sh.eff[sh.eff.length - 1];
    var avgP = r.M / sh.E;
    var lines = [
      ['Bitiş', hm(r.finish) + ' (saat ' + clock(r.finish) + ')'],
      ['Hareket süresi (durmasız)', hm(r.M)],
      ['Toplam efor', f(sh.E, 1) + ' km-efor'],
      ['Ortalama düz-eşdeğer tempo', ms(avgP * 60) + ' /km'],
      ['İlk sektörde, son sektörde', ms(pFirst * 60) + ' ve ' + ms(pLast * 60) + ' /km']
    ];
    var dl = h('dl', 'sumlist');
    lines.forEach(function (l) { dl.appendChild(h('dt', '', esc(l[0]))); dl.appendChild(h('dd', '', esc(l[1]))); });
    elSummary.appendChild(dl);
    var dd = dataFor(s);
    if (dd) {
      var lb = dataLabel(r.M, dd.mov);
      var box = h('div', 'databox'); elSummary.appendChild(box);
      var dh = h('div', 'stp-head', '<b>Veriye göre</b>'); box.appendChild(dh);
      K.infoBtn(dh, 'Antrenman GPX\'inden hesaplanan hareket süresiyle bu planın hareket süresi karşılaştırılır. iddialı: iyi günden hızlı; iyimser: iyi gün ile ana tahmin arası; gerçekçi: ana tahmin ile kötü gün arası; çok temkinli: kötü günden yavaş. Veriye denk hedef süre = ana tahmin + bu planın durmaları. Tahmin tek bir koşuya dayanır.');
      box.appendChild(h('div', 'rline', '<b>İyi / ana / kötü gün:</b> ' + hm(dd.mov.good) + ' / ' + hm(dd.mov.mid) + ' / ' + hm(dd.mov.bad) + ' <span class="sub2">(hareket süresi)</span>'));
      box.appendChild(h('div', 'rline', '<b>Bu plan:</b> ' + hm(r.M) + ' hareket, <b>' + lb.name + '</b> <span class="sub2">(' + esc(lb.text) + ')</span>'));
      box.appendChild(h('div', 'rline', '<b>Veriye denk hedef süre:</b> ' + hm(dd.mov.mid + dd.stopTot) + ' <span class="sub2">(ana tahmin + ' + dd.stopTot + ' dk durma)</span>'));
    }
  }

  function renderResults() {
    var s = st.sc[st.sel], r = compute(s), dd = dataFor(s);
    var stat = K.calib && K.calib.status ? K.calib.status() : 'none';
    elResults.textContent = '';
    var dataMode = view === 'data' && !!dd;   // kayıtlı veri yoksa plan görünümü gösterilir (kayıtlı seçim silinmez)
    var rh = h('h2', '', (dataMode ? 'Veri: ' : 'Plan: ') + st.sel);
    elResults.appendChild(rh);
    K.infoBtn(rh, dataMode
      ? 'Varış saati ana tahmindir; altındaki aralık iyi gün (doğrusal yorulma) ile kötü gün (daha hızlı artan yorulma) arasıdır, tempo belirsizliği dahil. Kesim payı = kesim saati - gösterilen varış (ana tahmin). Durmalar seçili plandan (' + st.sel + ').'
      : 'Parkuru kaç çıkış, iniş ve düz sektöre böleyim: Az, Orta, Çok. Noktalara dokunup sektörleri aç. Kesim payı: noktaya varış saatinin kesim saatinden ne kadar önce olduğu. Eşikler: 60 dk ve üstü güvende, 20-59 dk dikkat, 20 dk altı tehlike. Sektör süreleri ve tempoları tahmin değil, planın dağıtımıdır; dakika yuvarlandığı için toplamlar 1 dk oynayabilir.');
    var sw = chipRow([{ id: 'plan', label: 'Plan' }, { id: 'data', label: dd ? 'Veri' : (stat === 'bad' ? 'Veri (koşu yetersiz)' : 'Veri (GPX yükle)') }],
      function (it) { return (dataMode ? 'data' : 'plan') === it.id; },
      function (it) { if (it.id === 'data' && !dd) return; setView(it.id); renderResults(); });
    if (!dd) sw.children[1].disabled = true;
    elResults.appendChild(sw);
    if (!r.valid) { elResults.appendChild(h('p', 'warnbox', 'Önce planı düzelt.')); return; }
    if (dataMode) { renderDataRows(s, dd); return; }
    elResults.appendChild(chipRow(LEVELS.map(function (l) { return { id: l.id, label: l.name + ' ' + C.sec[l.id].length }; }),
      function (it) { return st.level === it.id; },
      function (it) { st.level = it.id; save(); renderAll(); }));
    segsByCp().forEach(function (grp) {
      var ci = grp.ci, cp = r.cp[ci], sx = status(cp.buf);
      var d = h('details', 'cpsec');
      var sum = h('summary', 'cphead',
        '<div class="cpl"><b>' + esc(cps[ci].name) + '</b><div class="sub2">' + f(cps[ci].km, 1) + ' km, kesim ' + hm(cps[ci].cut * 60) + ', ' + grp.secs.length + ' sektör</div></div>' +
        '<div class="cpm r"><b>' + hm(cp.arr) + '</b><div class="sub2">saat ' + clock(cp.arr) + '</div></div>' +
        '<div class="cpr r"><span class="pay ' + sx.cls + '">' + sx.icon + ' ' + (cp.buf < 0 ? '' : f(cp.buf, 0) + ' dk') + '</span><div class="sub2 ' + sx.cls + '">' + sx.text + '</div></div>');
      d.appendChild(sum);
      var rowsHtml = '';
      grp.secs.forEach(function (i) {
        var x = r.rows[i], se = x.sec;
        var pace = x.t * 60 / se.km, ep = x.t * 60 / x.eff;
        var grd = se.type === 'D' ? 'maks. iniş ' + pct(se.maxDn) : 'maks. çıkış ' + pct(se.maxUp);
        var extra = se.steep ? '<div class="sub2 steepnote">dik kısım: ' + se.steep + ' yer (en dik ' + pct(se.steepMax) + ')</div>' : '';
        rowsHtml += '<tr><td><span class="stype t' + se.type + '">' + TYPE[se.type] + '</span> <b>' + f(se.kmFrom, 1) + '-' + f(se.kmTo, 1) + ' km</b>' +
          '<div class="sub2">' + f(se.km, 1) + ' km, +' + f(se.up, 0) + ' m, −' + f(se.down, 0) + ' m</div>' +
          '<div class="sub2">ort. ' + sgn(se.avg, 1).replace('+', '+%').replace('−', '−%') + ', ' + grd + '</div>' + extra + '</td>' +
          '<td class="r"><b>' + dur(x.t) + '</b><div class="sub2">saat ' + clock(x.arr) + '</div></td>' +
          '<td class="r"><b>' + ms(pace) + '</b> <span class="sub2">/km</span><div class="sub2">düz-eş. ' + ms(ep) + ' /km</div></td></tr>';
      });
      d.appendChild(h('div', 'tablewrap', '<table class="plantable sectable"><thead><tr><th>Sektör</th><th class="r">Süre</th><th class="r">Tempo</th></tr></thead><tbody>' + rowsHtml + '</tbody></table>'));
      if (ci < NSTOP && cp.stop) d.appendChild(h('p', 'sub2', esc(cps[ci].name) + ' noktasında ' + cp.stop + ' dk durma planlı.'));
      elResults.appendChild(d);
    });
    var worst = 0;
    r.cp.forEach(function (x, i) { if (x.buf < r.cp[worst].buf) worst = i; });
    var w = r.cp[worst], sw2 = status(w.buf);
    elResults.appendChild(h('p', 'note', 'En dar nokta: ' + esc(cps[worst].name) + ', kesim payı ' + f(w.buf, 0) + ' dk (' + sw2.text.toLowerCase() + ').'));
  }
  // Veri görünümü: aynı nokta listesi, varışlar antrenman GPX'inden (ana tahmin, altında iyi-kötü aralığı). Sektör ayrıntısı yalnızca Plan görünümünde.
  function renderDataRows(s, dd) {
    var fc = dd.fc;
    if (fc.level === 'weak') elResults.appendChild(h('p', 'warnbox', 'Koşu zayıf: ' + esc(fc.reasons.join('; ')) + '. Tahmin aralığı geniş tutuldu (en az ±%9).'));
    if (fc.lowSlow) elResults.appendChild(h('p', 'warnbox', 'Ölçülen yavaşlama çok düşük (%' + f(fc.slow, 1) + '). Yarışta çok daha uzun süre koşacağın için daha fazla yavaşlayabilirsin; aralık geniş tutuldu (en az ±%9).'));
    var worst = 0, risky = null;
    dd.cp.forEach(function (c, ci) {
      var sx = status(c.buf);
      var d = h('div', 'cpsec cpstatic');
      d.appendChild(h('div', 'cphead',
        '<div class="cpl"><b>' + esc(cps[ci].name) + '</b><div class="sub2">' + f(cps[ci].km, 1) + ' km, kesim ' + hm(cps[ci].cut * 60) + '</div></div>' +
        '<div class="cpm r"><b>' + clock(c.mid) + '</b><div class="sub2">' + clock(c.good) + ' - ' + clock(c.bad) + '</div></div>' +
        '<div class="cpr r"><span class="pay ' + sx.cls + '">' + sx.icon + ' ' + (c.buf < 0 ? '' : f(c.buf, 0) + ' dk') + '</span><div class="sub2 ' + sx.cls + '">' + sx.text + '</div></div>'));
      elResults.appendChild(d);
      if (c.buf < dd.cp[worst].buf) worst = ci;
      if (c.badBuf < 20 && (!risky || c.badBuf < risky.c.badBuf)) risky = { c: c, ci: ci };
    });
    elResults.appendChild(h('p', 'note', 'En dar nokta: ' + esc(cps[worst].name) + ', kesim payı ' + f(dd.cp[worst].buf, 0) + ' dk (' + status(dd.cp[worst].buf).text.toLowerCase() + ').'));
    if (risky) elResults.appendChild(h('p', 'warnbox', 'Kötü günde ' + esc(cps[risky.ci].name) + (risky.c.badBuf < 0 ? ' noktasında kesim saati aşılabilir.' : ' noktasında kesim payı ' + Math.round(risky.c.badBuf) + ' dk\'ya düşebilir.')));
    elResults.appendChild(h('p', 'note', 'Durmalar ' + st.sel + ' planından (' + dd.stopTot + ' dk). Rakım (parkur 1026-1471 m), hava ve arazi tahminde yok.' + (fc.km < 40 ? ' Antrenman ' + f(fc.km, 0) + ' km: aralık geniş; 40 km üstü bir koşu daraltır.' : '')));
  }
  function segsByCp() {
    var secs = buildSectors(st.level), groups = [];
    secs.forEach(function (x, i) {
      var g = groups[groups.length - 1];
      if (!g || g.ci !== x.ci) { g = { ci: x.ci, secs: [] }; groups.push(g); }
      g.secs.push(i);
    });
    return groups;
  }

  /* ----- comparison table + time/distance chart ----- */
  var svgNS = 'http://www.w3.org/2000/svg';
  function sv(name, attrs, parent) { var e = document.createElementNS(svgNS, name); for (var k in attrs) e.setAttribute(k, attrs[k]); if (parent) parent.appendChild(e); return e; }
  function renderCompare() {
    elCompare.textContent = '';
    var cmpHead = h('h2', '', 'A, B ve C yan yana'); elCompare.appendChild(cmpHead);
    K.infoBtn(cmpHead, 'Saatler varış saati, altında kesim payı. Grafikte yatay eksen km, dikey eksen yarışın kaçıncı saati; bir çizgi kırmızı çizginin altında kaldığı sürece kesim içindesin.');
    var res = { A: compute(st.sc.A), B: compute(st.sc.B), C: compute(st.sc.C) };
    var anyInvalid = ['A', 'B', 'C'].some(function (k) { return !res[k].valid; });
    if (anyInvalid) { elCompare.appendChild(h('p', 'warnbox', 'Bir senaryoda durma süreleri hedef süreden uzun. Önce onu düzelt.')); return; }
    var rows = '';
    cps.forEach(function (g, i) {
      rows += '<tr><td><b>' + esc(g.name) + '</b><div class="sub2">kesim ' + hm(g.cut * 60) + '</div></td>';
      ['A', 'B', 'C'].forEach(function (k) {
        var x = res[k].cp[i], sx = status(x.buf);
        rows += '<td class="r"><b>' + clock(x.arr) + '</b><div class="sub2 ' + sx.cls + '">' + sx.icon + ' ' + (x.buf < 0 ? 'aşıyor' : f(x.buf, 0) + ' dk') + '</div></td>';
      });
      rows += '</tr>';
    });
    elCompare.appendChild(h('div', 'tablewrap', '<table class="plantable"><thead><tr><th>Nokta</th><th class="r">A</th><th class="r">B</th><th class="r">C</th></tr></thead><tbody>' + rows + '</tbody></table>'));

    var box = h('div', 'chart tchart'); elCompare.appendChild(box);
    var W = Math.max(280, Math.round(box.clientWidth || 340)), H = 240, pl = 40, pr = 16, pt = 16, pb = 26;
    var pw = W - pl - pr, ph = H - pt - pb, YM = 13;
    function X(km) { return pl + km / (K.TOTAL / 1000) * pw; }
    function Y(min) { return pt + (1 - min / 60 / YM) * ph; }
    var svg = sv('svg', { viewBox: '0 0 ' + W + ' ' + H, width: W, height: H }, box);
    for (var hh = 0; hh <= YM; hh += 2) {
      sv('line', { x1: pl, x2: W - pr, y1: Y(hh * 60), y2: Y(hh * 60), class: 'g-grid' }, svg);
      var tl = sv('text', { x: pl - 6, y: Y(hh * 60) + 4, 'text-anchor': 'end', class: 'g-axis' }, svg); tl.textContent = hh + ' sa';
    }
    for (var km = 0; km <= 60; km += 10) {
      var tx = sv('text', { x: X(km), y: H - 8, 'text-anchor': km === 0 ? 'start' : 'middle', class: 'g-axis' }, svg); tx.textContent = km;
    }
    cps.forEach(function (g) { sv('line', { x1: X(g.km), x2: X(g.km), y1: pt, y2: pt + ph, class: 'g-cp' }, svg); });
    var cd = 'M' + X(0) + ' ' + Y(0);
    cps.forEach(function (g) { cd += ' L' + X(g.km).toFixed(1) + ' ' + Y(g.cut * 60).toFixed(1); });
    sv('path', { d: cd, class: 't-cut' }, svg);
    var lc = sv('text', { x: X(2), y: Y(cps[0].cut * 60) - 34, class: 'g-cplabel t-cutlabel' }, svg); lc.textContent = 'Kesim çizgisi';
    ['A', 'B', 'C'].forEach(function (k) {
      var r = res[k], d = 'M' + X(0) + ' ' + Y(0);
      r.rows.forEach(function (x) {
        d += ' L' + X(x.sec.kmTo).toFixed(1) + ' ' + Y(x.arr).toFixed(1);
        if (x.sec.last && x.stop > 0) d += ' L' + X(x.sec.kmTo).toFixed(1) + ' ' + Y(x.dep).toFixed(1);
      });
      sv('path', { d: d, class: 't-line t-' + k }, svg);
      var last = r.rows[r.rows.length - 1];
      var lab = sv('text', { x: X(last.sec.kmTo) + 4, y: Y(last.arr) + 4, class: 't-lab t-l' + k }, svg); lab.textContent = k;
    });
    elCompare.appendChild(h('div', 'legend', '<span><i class="sw sA"></i>A</span><span><i class="sw sB"></i>B</span><span><i class="sw sC"></i>C</span><span><i class="sw sCut"></i>Kesim</span>'));
  }

  /* ----- what-if ----- */
  function renderWhat() {
    elWhat.textContent = '';
    elWhat.appendChild(h('h2', '', 'Ya şöyle olursa? (' + st.sel + ' planı)'));
    var s = st.sc[st.sel], r = compute(s);
    elWhat.appendChild(chipRow(cps.slice(0, NSTOP).map(function (c, i) { return { id: i, label: c.name }; }),
      function (it) { return st.whatCp === it.id; }, function (it) { st.whatCp = it.id; save(); renderWhat(); }));
    var out = h('p', 'whatout');
    elWhat.appendChild(stepper(cps[st.whatCp].name + ' noktasına fark', 'Artı geç, eksi erken demek',
      function () { return (st.whatDelta > 0 ? '+' : st.whatDelta < 0 ? '−' : '') + Math.abs(st.whatDelta) + ' dk'; },
      function (d) { st.whatDelta = clamp(st.whatDelta + d, -60, 180); save(); calc(); }, [-5, -1, 1, 5]));
    elWhat.appendChild(out);
    function calc() {
      if (!r.valid) { out.textContent = 'Önce planı düzelt.'; return; }
      var d = st.whatDelta, worst = null;
      for (var i = st.whatCp; i < cps.length; i++) {
        var buf = r.cp[i].buf - d;
        if (!worst || buf < worst.buf) worst = { buf: buf, i: i };
      }
      var fin = r.finish + d, sw = status(worst.buf);
      out.innerHTML = 'Plandaki bölüm sürelerini korursan bitiş <b>' + clock(fin) + '</b> (' + hm(fin) + '). ' +
        'En dar nokta ' + esc(cps[worst.i].name) + ': ' + (worst.buf < 0 ? 'kesim aşılıyor' : 'kesim payı ' + f(worst.buf, 0) + ' dk') +
        ' <span class="pay ' + sw.cls + '">' + sw.icon + ' ' + sw.text + '</span>. Bu bir tahmin değil, planın kayması.';
    }
    calc();
  }

  /* ----- garmin pacepro helper ----- */
  function renderGarmin() {
    elGarmin.textContent = '';
    var gHead = h('h2', '', 'Garmin saat için'); elGarmin.appendChild(gHead);
    K.infoBtn(gHead, 'PacePro planına hareket süresini gir (bitiş süresinden durma süreleri çıkarılmış hâli); noktalardaki duraklamaları PacePro bilmez. Kurs dosyası ve saat kurulum adımları Garmin rehberinde.');
    var rows = '';
    ['A', 'B', 'C'].forEach(function (k) {
      var r = compute(st.sc[k]);
      rows += '<tr><td><b>' + k + '</b> <span class="sub2">' + esc(LABEL[k]) + '</span></td>' +
        '<td class="r">' + (r.valid ? hm(r.finish) : '--') + '</td><td class="r"><b>' + (r.valid ? hm(r.M) : '--') + '</b></td></tr>';
    });
    elGarmin.appendChild(h('div', 'tablewrap', '<table class="plantable"><thead><tr><th>Plan</th><th class="r">Bitiş</th><th class="r">PacePro süresi</th></tr></thead><tbody>' + rows + '</tbody></table>'));
  }

  /* ----- advanced ----- */
  function stepFmt(d) { return (d > 0 ? '+' : '−') + f(Math.abs(d), 2); }
  function renderAdv() {
    elAdv.textContent = '';
    var advHead = h('h2', '', 'Gelişmiş'); elAdv.appendChild(advHead);
    K.infoBtn(advHead, 'Hedef süre modunda bu ayarlar bitiş saatini değiştirmez, süreyi sektörlere dağıtımını değiştirir. Düz tempo modunda ise bitiş saatini de değiştirir.');
    var total = compute(st.sc[st.sel]).E;
    elAdv.appendChild(stepper('Tırmanış: 100 m kaç km düz sayılsın', 'Varsayılan 1,00: ITRA tarzı km-efor kuralı (100 m tırmanış = 1 km). Eğim yüzdesi g ise yavaşlama çarpanı yaklaşık 1 + 10 x g (%10 eğimde 2 kat, %20 eğimde 3 kat).',
      function () { return f(st.wUp, 2) + ' km'; },
      function (d) { st.wUp = clamp(Math.round((st.wUp + d) * 100) / 100, 0.25, 2.5); save(); renderDerived(); renderAdvInfo(); }, [-0.25, 0.25], stepFmt));
    elAdv.appendChild(chipRow([0.5, 0.75, 0.88, 1, 1.5].map(function (v) { return { v: v, label: f(v, 2) }; }),
      function (it) { return Math.abs(st.wUp - it.v) < 0.001; },
      function (it) { st.wUp = it.v; save(); renderDerived(); renderAdv(); }));
    elAdv.appendChild(stepper('İniş: 100 m kaç km düz sayılsın', 'Kapalı: ITRA formülü gibi inişi saymaz. 0,25 (400 m iniş = 1 km) ve 0,50 (200 m iniş = 1 km) bazı kaynaklarda kullanılan varyantlar. Negatif değer inişi düzden hızlı sayar: 4 Ekim koşusundan kalibre edilen −0,24, 100 m inişin 0,24 km kazandırdığı anlamına gelir (en az −0,50).',
      function () { return f(st.wDn, 2) + ' km'; },
      function (d) { st.wDn = clamp(Math.round((st.wDn + d) * 100) / 100, -0.5, 1); save(); renderDerived(); renderAdvInfo(); }, [-0.05, 0.05], stepFmt));
    elAdv.appendChild(chipRow([{ v: -0.24, label: '−0,24 (kalibre)' }, { v: 0, label: 'Kapalı' }, { v: 0.25, label: '0,25' }, { v: 0.5, label: '0,50' }],
      function (it) { return Math.abs(st.wDn - it.v) < 0.001; },
      function (it) { st.wDn = it.v; save(); renderDerived(); renderAdv(); }));
    var info = h('p', 'advinfo'); info.id = 'advInfo'; elAdv.appendChild(info);
    var b = h('button', 'btn wide', 'Varsayılan değerlere dön'); b.type = 'button';
    b.addEventListener('click', function () {
      if (!b.getAttribute('data-ask')) { b.setAttribute('data-ask', '1'); b.textContent = 'Emin misin? Tekrar dokun'; setTimeout(function () { b.removeAttribute('data-ask'); b.textContent = 'Varsayılan değerlere dön'; }, 4000); return; }
      st = clone(DEF); save(); renderAll();
    });
    elAdv.appendChild(b);
    renderAdvInfo();
  }
  function renderAdvInfo() {
    var e = $('advInfo'); if (!e) return;
    var E = compute(st.sc[st.sel]).E;
    e.textContent = 'Parkurun toplam eforu: ' + f(E, 1) + ' km-efor (' + f(K.TOTAL / 1000, 1) + ' km mesafe, 2030 m tırmanış). ' + descentEffect();
  }
  // İniş ağırlığının canlı etkisi: şimdiki değerle, "öteki" değerle (şimdi kapalıysa -0,24, değilse kapalı) seçili planın bitişi / noktaları
  function descentEffect() {
    var s = st.sc[st.sel], other = Math.abs(st.wDn) < 1e-9 ? -0.24 : 0;
    var a = compute(s), b = compute(s, { level: st.level, wUp: st.wUp, wDn: other });
    if (!a.valid || !b.valid) return '';
    var shift = 0; a.cp.forEach(function (c, i) { shift = Math.max(shift, Math.abs(c.arr - b.cp[i].arr)); });
    if (s.mode === 'pace') return st.sel + ' planı, düz tempo: iniş ' + f(st.wDn, 2) + ' ile bitiş ' + clock(a.finish) + '; iniş ' + f(other, 2) + ' olsa ' + clock(b.finish) + '.';
    return st.sel + ' planı, hedef süre: bitiş sabit ' + clock(a.finish) + '; iniş ' + f(other, 2) + ' olsa noktaların varışı en çok ' + Math.round(shift) + ' dk kayar.';
  }

  function renderDerived() { renderSeg(); renderSummary(); renderResults(); renderCompare(); renderWhat(); renderGarmin(); paintSettings(); if (K.calib && K.calib.refresh) K.calib.refresh(); }
  function renderAll() { renderSeg(); renderEditor(); renderSummary(); renderResults(); renderCompare(); renderWhat(); renderGarmin(); renderAdv(); paintSettings(); if (K.calib && K.calib.refresh) K.calib.refresh(); }

  var rt = null;
  window.addEventListener('resize', function () { clearTimeout(rt); rt = setTimeout(function () { if (!$('tab-plan').hidden) renderCompare(); }, 150); });

  window.K63.showTab = showTab;
  window.K63.plan = { compute: compute, buildSectors: buildSectors, state: function () { return st; }, steep: steep, cps: cps, defaults: clone(DEF), settingsInfo: settingsInfo,
    rerender: function () { renderDerived(); }, dataFor: dataFor, dataLabel: dataLabel, calibEl: function () { return elCalib; } };
  var last = K.store('k63tab');
  showTab(tabs.indexOf(last) >= 0 ? last : 'profile');
})();
