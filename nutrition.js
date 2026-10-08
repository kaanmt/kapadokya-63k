(function () {
  'use strict';
  var K = window.K63;
  if (!K || !K.plan) return;
  var P = K.plan, $ = K.$, f = K.f, cps = K.cps;
  var root = $('tab-nutrition');
  var KEY = 'k63nut-v2';
  var NSTOP = cps.length - 1;
  var REF_SPEED = 7.8; // km-efor/saat, B planı civarı (tempo çarpanının referansı)
  // Tempo çarpanı için parkurun SABİT eforu (ITRA: mesafe + tırmanış/100). Plan sekmesindeki tırmanış/iniş
  // ağırlıkları yalnızca süreyi sektörlere dağıtır; fizyolojik hızı değiştirmemeli.
  var E_STD = K.TOTAL / 1000 + K.gain[K.N - 1] / 100;

  /* ---------- state ---------- */
  var DEF = { tempSrc: null, sc: '', kg: 75, sweat: 'normal', salty: 'unknown', temp: 15, maxGels: 2, gelId: '', drinkId: '', saltId: '', flaskN: 2, flaskMl: 500, health: false, custom: [], meal: {} };
  var st = JSON.parse(JSON.stringify(DEF));
  (function load() {
    try {
      var raw = K.store(KEY) || K.store('k63nut-v1'); if (!raw) return;
      var o = JSON.parse(raw);
      Object.keys(DEF).forEach(function (k) { if (o[k] !== undefined && typeof o[k] === typeof DEF[k]) st[k] = o[k]; });
      if (!Array.isArray(st.custom)) st.custom = [];
      if (!st.meal || typeof st.meal !== 'object') st.meal = {};
    } catch (e) {}
  })();
  function save() { K.store(KEY, JSON.stringify(st)); }

  /* ---------- helpers ---------- */
  function h(tag, cls, html) { var e = document.createElement(tag); if (cls) e.className = cls; if (html !== undefined) e.innerHTML = html; return e; }
  function esc(t) { return String(t).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }
  function hm(min) { var t = Math.round(Math.abs(min)), hh = Math.floor(t / 60), m = t % 60; return hh + ':' + (m < 10 ? '0' : '') + m; }
  function num(v, d) { return f(v, d === undefined ? 0 : d); }
  function stepper(label, hint, getText, onStep, steps) {
    var wrap = h('div', 'stp');
    var head = h('div', 'stp-head', '<b>' + esc(label) + '</b>'); wrap.appendChild(head);
    if (hint) K.infoBtn(head, esc(hint));
    var row = h('div', 'stp-row'), val = h('span', 'stp-val', esc(getText()));
    function mk(d) { var b = h('button', 'btn step', (d > 0 ? '+' : '−') + Math.abs(d)); b.type = 'button'; b.setAttribute('aria-label', label + (d > 0 ? ' artır' : ' azalt')); b.addEventListener('click', function () { onStep(d); val.textContent = getText(); update(); }); return b; }
    steps.filter(function (d) { return d < 0; }).forEach(function (d) { row.appendChild(mk(d)); });
    row.appendChild(val);
    steps.filter(function (d) { return d > 0; }).forEach(function (d) { row.appendChild(mk(d)); });
    wrap.appendChild(row); return wrap;
  }
  function chips(items, isOn, onPick) {
    var box = h('div', 'chips');
    items.forEach(function (it) { var b = h('button', 'chip', esc(it.label)); b.type = 'button'; b.setAttribute('aria-pressed', String(isOn(it))); b.addEventListener('click', function () { onPick(it); }); box.appendChild(b); });
    return box;
  }

  /* ---------- products and foods ---------- */
  function allProducts() { return (window.PRODUCTS || []).concat(st.custom); }
  function byId(id) { var a = allProducts(); for (var i = 0; i < a.length; i++) if (a[i].id === id) return a[i]; return null; }
  function ofType(types) { return allProducts().filter(function (p) { return types.indexOf(p.type) >= 0; }); }
  function food(id) { var a = window.FOODS || []; for (var i = 0; i < a.length; i++) if (a[i].id === id) return a[i]; return null; }
  function mealAt(ci) {
    var t = { carb: 0, na: 0, k: 0, mg: 0, kcal: 0, items: 0 }, m = st.meal[ci] || {};
    Object.keys(m).forEach(function (id) {
      var fd = food(id), n = m[id]; if (!fd || !n) return;
      t.carb += fd.carb * n; t.na += fd.na * n; t.k += fd.k * n; t.mg += fd.mg * n; t.kcal += fd.kcal * n; t.items += n;
    });
    return t;
  }

  // AB etiket kuralı: sodyum (mg) = tuz (g) x 1000 / 2,5
  function saltToNa(g) { return Math.round(g * 1000 / 2.5); }

  /* ---------- engine ---------- */
  // Süre ve bölümler Plan sekmesindeki seçimden (A / B / C ve Plan | Veri). key verilirse o planın kendisi (kendini sınama).
  function sel() {
    if (P.selected) return P.selected();
    var k = P.state().sel; return { kind: 'plan', key: k, label: 'Plan ' + k, short: k, r: P.compute(P.state().sc[k]) };
  }
  function scKey() { return P.state().sel; }
  // key: yoksa uygulama seçimi; 'A' / 'B' / 'C' o planın kendisi; nesne ise hazır sonuç (kendini sınama, Veri)
  function planResult(key) { return key && typeof key === 'object' ? key : key ? P.compute(P.state().sc[key]) : sel().r; }
  // Saf hesap: yalnızca verilen girdilere bağlı (kendini sınama da bunu kullanır).
  // p = { kg, sweat, salty, temp, health, M (hareket süresi, dk; yoksa referans hız) }
  // Terleme miktarı (Az/Normal/Çok) yalnızca sıvıyı belirler; terin tuzluluğu (salty) sodyum konsantrasyonunu belirler.
  var SALTY = { low: 600, unknown: 825, high: 1100 }; // mg/L; 825 = ortalama sporcu terinin sodyumu (Baker ve ark.)
  var SALTY_LABEL = { low: 'Az tuzlu', unknown: 'Bilmiyorum', high: 'Çok tuzlu' };
  function targetsFrom(p) {
    var sweatF = { low: 0.9, normal: 1, high: 1.2 }[p.sweat] || 1;
    var tempF = p.temp < 10 ? 0.9 : p.temp <= 20 ? 1 : p.temp <= 28 ? 1.2 : 1.4;
    var kgF = clamp(Math.sqrt(p.kg / 75), 0.85, 1.2);
    var speed = p.M > 0 ? E_STD / (p.M / 60) : REF_SPEED;
    var intF = clamp(speed / REF_SPEED, 0.85, 1.2);
    var cap = p.kg < 60 ? 600 : 750;
    var fluid = Math.min(cap, Math.round(500 * sweatF * tempF * kgF * intF / 10) * 10);
    var conc = SALTY[p.salty] || SALTY.unknown;
    var na = p.health ? null : Math.round(fluid / 1000 * conc / 10) * 10;
    var carb = Math.round(60 * clamp(intF, 0.9, 1.1) / 5) * 5;
    return { fluid: fluid, na: na, conc: conc, salty: SALTY[p.salty] ? p.salty : 'unknown', carb: carb, sweatF: sweatF, tempF: tempF, kgF: kgF, intF: intF, speed: speed, cap: cap };
  }
  function targets(key) {
    var r = planResult(key);
    return targetsFrom({ kg: st.kg, sweat: st.sweat, salty: st.salty, temp: st.temp, health: st.health, M: r.valid ? r.M : 0 });
  }
  // Uygulanabilir takvim: kesirli "saatte 1,3 jel" yerine aralıklar ve flask kuralları.
  // Su: her flask X dakikada bitsin. Elektrolit: her flaska 1 / iki flasktan birine 1 / hiç. Jel: her X dakikada 1.
  // Tuz tableti seçildiyse KULLANILIR (her 30-120 dakikada 1); diğerleri ona göre ayarlanır.
  var GEL_STEPS = [20, 25, 30, 35, 40, 45, 50, 55, 60, 70, 80, 90, 120];
  var SALT_STEPS = [30, 45, 60, 75, 90, 120];
  var DOSES = [1, 0.5, 0];
  function round5(x) { return Math.max(10, Math.round(x / 5) * 5); }
  function events(T, t0, t1) { return T ? Math.floor(t1 / T + 1e-9) - Math.floor(t0 / T + 1e-9) : 0; }
  function evaluate(gelId, drinkId, saltId, key) {
    var tg = targets(key), r = planResult(key);
    if (!r.valid) return { valid: false, tg: tg };
    var hours = r.finish / 60, gel = byId(gelId), tab = byId(drinkId), salt = byId(saltId || '');
    function v(p, k) { return p ? (p[k] || 0) : 0; }
    var capL = st.flaskN * st.flaskMl / 1000;
    // bölümlerin hareket süreleri (dakika) ve kümülatif saat
    var secs = [], prevDep = 0, cum = 0;
    r.cp.forEach(function (c, i) { var dur = (c.arr - prevDep); secs.push({ i: i, t0: cum, t1: cum + dur, dur: dur / 60 }); cum += dur; prevDep = c.dep; });
    var movH = cum / 60 || hours;
    // yiyecekler (saatlik ortalama, seçim için)
    var food = { carb: 0, na: 0, k: 0, mg: 0, kcal: 0 };
    for (var q = 0; q < NSTOP; q++) { var m = mealAt(q); food.carb += m.carb; food.na += m.na; food.k += m.k; food.mg += m.mg; food.kcal += m.kcal; }
    // su takvimi
    var flaskMin = round5(st.flaskMl / tg.fluid * 60), flasksH = 60 / flaskMin;
    var doses = tab ? DOSES : [0], salts = (salt && v(salt, 'na') > 0) ? SALT_STEPS : [null];
    var gels = (gel && v(gel, 'carb') > 0) ? GEL_STEPS.filter(function (T) { return 60 / T <= st.maxGels + 1e-9; }) : [null];
    if (gel && v(gel, 'carb') > 0 && !gels.length) gels = [GEL_STEPS[GEL_STEPS.length - 1]];
    function perH(p, T) { return (p && T) ? 60 / T : 0; }
    var best = null;
    doses.forEach(function (d) { salts.forEach(function (sT) { gels.forEach(function (gT) {
      var g = perH(gel, gT), sl = perH(salt, sT), td = flasksH * d;
      var carbH = food.carb / movH + g * v(gel, 'carb') + td * v(tab, 'carb') + sl * v(salt, 'carb');
      var naH = food.na / movH + g * v(gel, 'na') + td * v(tab, 'na') + sl * v(salt, 'na');
      var err = Math.abs(carbH - tg.carb) / tg.carb;
      if (tg.na != null && tg.na > 0) err += Math.abs(naH - tg.na) / tg.na;
      else if (sT || d) err += 0.5;               // sağlık işareti: sodyum ekleme
      err += 0.002 * (sT ? 60 / sT : 0);           // eşitlikte daha az hap
      if (!best || err < best.err - 1e-9) best = { err: err, d: d, sT: sT, gT: gT };
    }); }); });
    var sched = { flaskMin: flaskMin, dose: best.d, gelMin: best.gT, saltMin: best.sT, fluidEff: st.flaskMl * 60 / flaskMin };
    // bölüm sayıları takvimden
    var rows = secs.map(function (sc) {
      var needL = sc.dur * tg.fluid / 1000, flasks = needL * 1000 / st.flaskMl;
      return { name: cps[sc.i].name, hours: sc.dur, needL: needL, extraMl: Math.max(0, Math.round((needL - capL) * 1000 / 50) * 50),
        flasks: flasks, gels: events(best.gT, sc.t0, sc.t1), tabs: tab ? Math.round(flasks * best.d) : 0, salts: events(best.sT, sc.t0, sc.t1) };
    });
    var tot = { gels: 0, tabs: 0, salts: 0, pCarb: 0, pNa: 0, pK: 0, pMg: 0, pKcal: 0, fCarb: food.carb, fNa: food.na, fK: food.k, fMg: food.mg, fKcal: food.kcal };
    rows.forEach(function (x) {
      tot.gels += x.gels; tot.tabs += x.tabs; tot.salts += x.salts;
      ['carb', 'na', 'k', 'mg', 'kcal'].forEach(function (k) {
        var key2 = 'p' + k.charAt(0).toUpperCase() + k.slice(1);
        tot[key2] += x.gels * v(gel, k) + x.tabs * v(tab, k) + x.salts * v(salt, k);
      });
    });
    var carbH = (tot.pCarb + tot.fCarb) / movH, naH = (tot.pNa + tot.fNa) / movH;
    return { sched: sched, valid: true, tg: tg, hours: hours, movH: movH, gel: gel, tab: tab, salt: salt, tabVol: tab ? (tab.vol || 500) : 500, rows: rows, capL: capL, tot: tot, finish: r.finish,
      gelsH: tot.gels / movH, tabsH: tot.tabs / movH, saltsH: tot.salts / movH, carbH: carbH, naH: tg.na == null ? null : naH };
  }
  function mealList(ci) {
    var m = st.meal[ci] || {}, out = [];
    Object.keys(m).forEach(function (id) { var fd = food(id); if (fd && m[id]) out.push({ name: fd.name, portion: fd.portion, n: m[id] }); });
    return out;
  }
  // Yarış başlarken beslenme planının o anki hâli (yarış modu bunu kullanır; sonradan değişse de yarış etkilenmez).
  function raceSnapshot(key) {
    var e = evaluate(st.gelId, st.drinkId, st.saltId, key);
    if (!e.valid) return null;
    function nm(p) { return p ? (p.brand ? p.brand + ' ' : '') + p.name : ''; }
    var meals = []; for (var i = 0; i < NSTOP; i++) meals.push(mealList(i));
    return { sched: e.sched, flaskMl: st.flaskMl, gel: nm(e.gel), tab: nm(e.tab), salt: nm(e.salt), tabVol: e.tabVol, fluid: e.tg.fluid, capL: e.capL,
      rows: e.rows.map(function (r) { return { name: r.name, hours: r.hours, needL: r.needL, flasks: r.flasks, extraMl: r.extraMl, gels: r.gels, tabs: r.tabs, salts: r.salts }; }), meals: meals };
  }

  // Hesabın tüm girdilerini ve ara değerlerini döker; sonuçları elle doğrulamak için.
  function breakdown() {
    var s0 = sel(), key = s0.key, sc = P.state().sc[key], r = s0.r, tg = targets();
    var stops = sc.stops.reduce(function (a, b) { return a + b; }, 0);
    var raw = 500 * tg.sweatF * tg.tempF * tg.kgF * tg.intF;
    return { key: key, label: s0.label, kind: s0.kind, mode: sc.mode, valid: r.valid, finish: r.finish, stops: stops, M: r.M, E: E_STD, speed: tg.speed, intF: tg.intF, sweatF: tg.sweatF, tempF: tg.tempF, kgF: tg.kgF,
      raw: raw, fluid: tg.fluid, cap: tg.cap, capped: Math.round(raw / 10) * 10 > tg.cap, conc: tg.conc, salty: tg.salty, na: tg.na, carb: tg.carb, kg: st.kg, sweat: st.sweat, temp: st.temp };
  }
  /* ---------- yeterlilik: plan / hedef oranı ---------- */
  // %90'ın altı "yetersiz" (kırmızı), %125'in üstü "fazla" (sarı, yalnızca bilgi). Sıvı yalnızca bilgi olarak gösterilir.
  var LOW_PCT = 90, HIGH_PCT = 125;
  function pct(r) { return Math.round(r * 100); }
  function grade(p) { return p < LOW_PCT ? 'bad' : p > HIGH_PCT ? 'warn' : 'ok'; }
  function ratios(e, tg) { return { carb: e.carbH / tg.carb, na: (tg.na != null && tg.na > 0 && e.naH != null) ? e.naH / tg.na : null }; }
  function meets(e, tg) {
    var r = ratios(e, tg);
    return pct(r.carb) >= LOW_PCT && (r.na == null || pct(r.na) >= LOW_PCT);
  }
  function selKey() { return [st.gelId, st.drinkId, st.saltId].join('|'); }
  var candCache = { key: '', list: null };
  // Sodyumu bilinmeyen ürünler (0 sayılması öneriyi yanıltır) ile kafeinli / kafeini bilinmeyen ürünler otomatik öneriye girmez; elle seçilebilir.
  // Uygulama kafeini saymaz, sınırlamaz ve uyarmaz; yalnızca öneri kafein içeren ürün seçmez.
  function candidates() {
    var ck = JSON.stringify([st.kg, st.sweat, st.salty, st.temp, st.health, st.maxGels, st.flaskN, st.flaskMl, st.meal, st.custom, selSig(), P.state()]);
    if (candCache.key === ck && candCache.list) return candCache.list;
    function known(p) { return notRecommended(p) === false; }
    var gels = ofType(['gel']).filter(known), tabs = ofType(['tablet', 'powder']).filter(known), salts = ofType(['salt']).filter(known), tg = targets(), out = [];
    var gl = gels.length ? gels : [null], tl = tabs.length ? tabs : [null], sl = [null].concat(salts);
    gl.forEach(function (g) {
      tl.forEach(function (t) {
        sl.forEach(function (sa) {
          var e = evaluate(g ? g.id : '', t ? t.id : '', sa ? sa.id : '');
          if (!e.valid) return;
          var pen = Math.abs(e.carbH - tg.carb) / tg.carb;
          if (tg.na != null && tg.na > 0) pen += Math.abs(e.naH - tg.na) / tg.na;
          if (sa) pen += 0.03 * e.saltsH;
          out.push({ g: g, t: t, s: sa, e: e, pen: pen });
        });
      });
    });
    candCache = { key: ck, list: out };
    return out;
  }
  function selSig() { var s0 = sel(); return [s0.label, s0.r.valid, Math.round((s0.r.finish || 0) * 100), Math.round((s0.r.M || 0) * 100)].join('|'); }
  function notRecommended(p) { return !!(p.naUnknown || p.cafUnknown || (p.caf || 0) > 0); }
  function excludedCount() { return allProducts().filter(notRecommended).length; }
  // Hiçbir karma %90'a ulaşamıyorsa nedenleri
  function whyNot(all, tg, best) {
    var r = ratios(best.e, tg), out = [];
    if (pct(r.carb) < LOW_PCT) out.push('Karbonhidrat hedefin %' + pct(r.carb) + '\'inde kaldı: seçilebilir ürünlerle ve saatte en fazla ' + st.maxGels + ' jel sınırıyla ulaşılamıyor.' + (st.maxGels < 3 ? ' Jel sınırını artırmak ya da noktalarda yiyecek seçmek yardımcı olabilir.' : ' Noktalarda karbonhidratlı yiyecek seçmek yardımcı olabilir.'));
    if (r.na != null && pct(r.na) < LOW_PCT) out.push('Sodyum hedefin %' + pct(r.na) + '\'inde kaldı: sodyumu bilinen ürünlerle ulaşılamıyor. Tuz tableti ya da noktalarda tuzlu yiyecek (çorba, peynir, tuz) yardımcı olabilir.');
    var ex = excludedCount();
    if (ex) out.push('Sodyumu bilinmeyen veya kafein içeren ' + ex + ' ürün öneriye girmez.');
    return out;
  }
  function autoPick() {
    var tg = targets(), all = candidates(), best = null;
    if (!all.length) return null;
    var ok = all.filter(function (c) { return meets(c.e, tg); });
    if (ok.length) ok.forEach(function (c) { if (!best || c.pen < best.pen) best = c; });
    else {
      all.forEach(function (c) {
        var r = ratios(c.e, tg); c.minR = Math.min(r.carb, r.na == null ? Infinity : r.na);
        if (!best || c.minR > best.minR + 1e-9 || (Math.abs(c.minR - best.minR) <= 1e-9 && c.pen < best.pen)) best = c;
      });
    }
    var rr = ratios(best.e, tg);
    return { g: best.g, t: best.t, s: best.s, ok: ok.length > 0, reasons: ok.length ? [] : whyNot(all, tg, best), carbPct: pct(rr.carb), naPct: rr.na == null ? null : pct(rr.na) };
  }
  // Mevcut seçimi %90'a çıkaran en küçük değişiklik (önce en az slot değişir, sonra hedefe en yakın)
  function suggest() {
    var tg = targets(), all = candidates(), best = null;
    all.forEach(function (c) {
      if (!meets(c.e, tg)) return;
      var n = (c.g ? c.g.id : '') !== st.gelId ? 1 : 0; n += (c.t ? c.t.id : '') !== st.drinkId ? 1 : 0; n += (c.s ? c.s.id : '') !== st.saltId ? 1 : 0;
      if (!best || n < best.n || (n === best.n && c.pen < best.c.pen)) best = { n: n, c: c };
    });
    if (!best) return null;
    var c = best.c, rr = ratios(c.e, tg), ch = [];
    function nm(p) { return (p.brand ? p.brand + ' ' : '') + p.name; }
    if ((c.g ? c.g.id : '') !== st.gelId) ch.push(c.g ? 'jel: ' + nm(c.g) : 'jeli çıkar');
    if ((c.t ? c.t.id : '') !== st.drinkId) ch.push(c.t ? 'elektrolit: ' + nm(c.t) : 'elektroliti çıkar');
    if ((c.s ? c.s.id : '') !== st.saltId) ch.push(c.s ? 'tuz tableti: ' + nm(c.s) : 'tuz tabletini çıkar');
    return { g: c.g, t: c.t, s: c.s, changes: ch, carbPct: pct(rr.carb), naPct: rr.na == null ? null : pct(rr.na) };
  }
  var pickMsg = null;

  /* ---------- render ---------- */
  var elForms = null, elRes = null;
  function render() {
    root.textContent = '';
    var tt = h('h2', 'tabtitle', 'Beslenme'); root.appendChild(tt);
    K.infoBtn(tt, 'Cevapladığın bilgilere göre saatlik sıvı, sodyum ve karbonhidrat planı çıkarır, her değişiklikte kendini günceller. Yarış günü yeni bir şey deneme, antrenmanda test et.');
    root.appendChild(h('p', 'note', 'Genel bilgidir, tıbbi tavsiye değildir.'));
    elForms = h('div'); root.appendChild(elForms);
    elRes = h('div'); root.appendChild(elRes);
    formProfile(); formProducts(); formCarry(); formFoods();
    update();
  }
  function update() { if (!elRes) return; elRes.textContent = ''; resultCards(); }
  function card(parent, title, tip) {
    var c = h('section', 'card');
    if (title) { var hd = h('h2', '', esc(title)); c.appendChild(hd); if (tip) K.infoBtn(hd, esc(tip)); }
    parent.appendChild(c); return c;
  }

  /* ---------- hava tahmini (Open-Meteo, internet gerekir) ---------- */
  var RACE_DATE = '2026-10-17';
  function pad2(n) { return (n < 10 ? '0' : '') + n; }
  function parseWeather(j, startH, endH) {
    var t = j && j.hourly && j.hourly.time, v = j && j.hourly && j.hourly.temperature_2m;
    if (!t || !v || !t.length) throw new Error('veri yok');
    var sel = [];
    for (var i = 0; i < t.length; i++) {
      if (String(t[i]).slice(0, 10) !== RACE_DATE || v[i] == null) continue;
      var hh = parseInt(String(t[i]).slice(11, 13), 10);
      if (hh >= Math.floor(startH) && hh <= Math.ceil(endH)) sel.push(v[i]);
    }
    if (!sel.length) throw new Error('yarış günü henüz tahmin aralığında değil');
    var sum = 0, mn = Infinity, mx = -Infinity;
    sel.forEach(function (x) { sum += x; if (x < mn) mn = x; if (x > mx) mx = x; });
    return { avg: sum / sel.length, min: mn, max: mx, n: sel.length, from: pad2(Math.floor(startH)) + ':00', to: pad2(Math.min(23, Math.ceil(endH))) + ':00' };
  }
  function fetchWeather(msgEl, btn) {
    var r = planResult(), startH = K.C.startHour, endH = startH + (r.valid ? r.finish / 60 : 12);
    var url = 'https://api.open-meteo.com/v1/forecast?latitude=' + K.C.lat[0].toFixed(4) + '&longitude=' + K.C.lon[0].toFixed(4) +
      '&hourly=temperature_2m&timezone=Europe%2FIstanbul&forecast_days=16';
    msgEl.textContent = 'Tahmin alınıyor...'; btn.disabled = true;
    fetch(url).then(function (res) { if (!res.ok) throw new Error('HTTP ' + res.status); return res.json(); })
      .then(function (j) {
        var w = parseWeather(j, startH, endH);
        st.temp = Math.round(w.avg); w.at = new Date().toISOString(); st.tempSrc = w; save(); render();
      })
      .catch(function (e) {
        btn.disabled = false;
        msgEl.className = 'note bad';
        msgEl.textContent = 'Tahmin alınamadı (' + (e && e.message ? e.message : 'hata') + '). İnternet bağlantısını kontrol et. Tahmin en fazla 16 gün önceden verilir; yarış günü aralığa girince tekrar dene. Sıcaklık değişmedi.';
      });
  }

  function formProfile() {
    var c = card(elForms, 'Sen ve yarış', 'Süre ve bölümler Plan sekmesindeki seçimden gelir (A / B / C ve Plan | Veri); değiştirmek için Plan sekmesine git. Veri seçiliyse antrenman GPX\'inden ana tahmin kullanılır, durmalar seçili plandan.');
    // Sonucu etkileyen seçim ve plan ayarları her zaman görünür
    var s0 = sel(), pr = s0.r, si = P.settingsInfo ? P.settingsInfo(scKey()) : null;
    if (pr.valid && si) {
      c.appendChild(h('p', 'settingsline', '<b>' + esc(s0.label) + '</b>: bitiş <b>' + hm(pr.finish) + '</b>, durma toplamı <b>' + si.stops + ' dk</b>' +
        (si.stopsChanged ? ' <span class="flag">varsayılandan farklı (' + si.defStops + ' dk)</span>' : ' (varsayılan)') + ', hareket <b>' + hm(pr.M) + '</b>' +
        (s0.kind === 'plan' && si.adv.length ? '<br>Plan sekmesindeki <span class="flag">' + esc(si.adv.join(', ')) + '</span>; bunlar beslenme hedeflerini etkilemez' : '')));
    } else if (!pr.valid) c.appendChild(h('p', 'settingsline', '<b>' + esc(s0.label) + '</b>: durma süreleri hedef süreden uzun.'));
    c.appendChild(stepper('Vücut ağırlığı', '', function () { return st.kg + ' kg'; }, function (d) { st.kg = clamp(st.kg + d, 35, 160); save(); }, [-5, -1, 1, 5]));
    var swh = h('div', 'stp-head', '<b>Ne kadar terliyorsun?</b>'); c.appendChild(swh); K.infoBtn(swh, 'Sıvı hedefini belirler.');
    c.appendChild(chips([{ id: 'low', label: 'Az' }, { id: 'normal', label: 'Normal' }, { id: 'high', label: 'Çok' }], function (it) { return st.sweat === it.id; }, function (it) { st.sweat = it.id; save(); render(); }));
    var slh = h('div', 'stp-head', '<b>Terin ne kadar tuzlu?</b>'); c.appendChild(slh);
    K.infoBtn(slh, 'Sodyum hedefini belirler. Bilmiyorsan "Bilmiyorum" bırak: ortalama sporcunun ter sodyumu yaklaşık 825 mg/L, kişiden kişiye 420-1630 arası değişir (Baker ve ark., 506 sporcu). Az ve çok seçenekleri bu aralığın alt ve üst kısmını temsil eder.');
    c.appendChild(chips(['low', 'unknown', 'high'].map(function (k) { return { id: k, label: SALTY_LABEL[k] + ' (' + SALTY[k] + ' mg/L)' }; }), function (it) { return st.salty === it.id; }, function (it) { st.salty = it.id; save(); render(); }));
    c.appendChild(stepper('Yarış günü ortalama sıcaklık', 'Göreme\'de Ekim ayı yaklaşık 3-20 °C', function () { return st.temp + ' °C'; }, function (d) { st.temp = clamp(st.temp + d, -5, 45); st.tempSrc = null; save(); }, [-5, -1, 1, 5]));
    var wmsg = h('p', 'note', '');
    if (st.tempSrc) {
      var ts = st.tempSrc, at = new Date(ts.at);
      wmsg.innerHTML = 'Hava tahmininden: ortalama <b>' + num(ts.avg, 1) + ' °C</b> (en düşük ' + num(ts.min, 1) + ', en yüksek ' + num(ts.max, 1) + ', saat ' + esc(ts.from) + '-' + esc(ts.to) + ', ' + ts.n + ' saatlik değer). Alındı: ' +
        at.toLocaleDateString('tr-TR') + ' ' + at.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' }) + '. Kaynak: Open-Meteo. Elle değiştirirsen tahmin bırakılır.';
    } else wmsg.textContent = 'Sıcaklık elle girildi.';
    var wb = h('button', 'btn small', 'Hava tahmininden al (internet gerekir)'); wb.type = 'button';
    wb.addEventListener('click', function () { fetchWeather(wmsg, wb); });
    c.appendChild(wb); c.appendChild(wmsg);
    c.appendChild(h('div', 'stp-head', '<b>Tuz veya sıvıyı etkileyen bir sağlık durumun ya da ilacın var mı?</b><span class="note">Örnek: tansiyon ilacı, tuz kısıtlaması, böbrek durumu</span>'));
    c.appendChild(chips([{ id: 0, label: 'Yok' }, { id: 1, label: 'Var' }], function (it) { return st.health === !!it.id; }, function (it) { st.health = !!it.id; save(); render(); }));
    if (st.health) c.appendChild(h('p', 'warnbox', 'Bu durumda sodyum hedefi göstermiyorum. Tuz ve sıvı planını doktoruna danış.'));
  }

  function formProducts() {
    var c = card(elForms, 'Ürünler', 'Değerler satıcı ve üretici sayfalarından; her ürünün kaynağı ve kontrol tarihi var. Kendi ürünün yoksa aşağıdan ekle. "Karmayı öner", karbonhidrat ve sodyumu hedefin en az %' + LOW_PCT + '\'ına çıkaran karmayı arar; sodyumu bilinmeyen ve kafein içeren ürünleri seçmez (elle seçebilirsin); ulaşılamıyorsa nedenini yazar.');
    var area = h('div'); c.appendChild(area);

    function selectFor(label, types, key) {
      var wrap = h('div', 'stp'); wrap.appendChild(h('div', 'stp-head', '<b>' + esc(label) + '</b>'));
      var sel = h('select', 'sel'); sel.setAttribute('aria-label', label);
      var o0 = h('option', '', 'Seçilmedi'); o0.value = ''; sel.appendChild(o0);
      var list = ofType(types);
      function add(arr, groupName) {
        if (!arr.length) return; var g = h('optgroup'); g.label = groupName;
        arr.forEach(function (p) { var o = h('option', '', esc((p.brand ? p.brand + ' ' : '') + p.name)); o.value = p.id; if (st[key] === p.id) o.selected = true; g.appendChild(o); });
        sel.appendChild(g);
      }
      add(list.filter(function (p) { return !p.custom; }), 'Katalog'); add(list.filter(function (p) { return p.custom; }), 'Özel ürünlerim');
      sel.addEventListener('change', function () { st[key] = sel.value; save(); render(); });
      wrap.appendChild(sel);
      var p = byId(st[key]); if (p) wrap.appendChild(productInfo(p));
      return wrap;
    }
    function paintArea() {
      area.textContent = '';
      area.appendChild(selectFor('Jel', ['gel'], 'gelId'));
      area.appendChild(selectFor('Elektrolit tablet veya toz', ['tablet', 'powder'], 'drinkId'));
      area.appendChild(selectFor('Tuz tableti veya kapsülü (isteğe bağlı)', ['salt'], 'saltId'));
    }
    paintArea();
    var auto = h('button', 'btn wide', 'Hedefime en uygun karmayı öner'); auto.type = 'button';
    auto.addEventListener('click', function () {
      var b = autoPick(); if (!b) return;
      st.gelId = b.g ? b.g.id : ''; st.drinkId = b.t ? b.t.id : ''; st.saltId = b.s ? b.s.id : '';
      pickMsg = { key: selKey(), ok: b.ok, reasons: b.reasons, carb: b.carbPct, na: b.naPct }; save(); render();
    });
    c.appendChild(auto);
    if (pickMsg && pickMsg.key === selKey()) {
      var pm = pickMsg, txt = 'karbonhidrat hedefin %' + pm.carb + '\'i' + (pm.na == null ? '' : ', sodyum %' + pm.na + '\'i');
      if (pm.ok) c.appendChild(h('p', 'note ok', 'Öneri uygulandı: ' + txt + '.'));
      else c.appendChild(h('p', 'note bad', 'Hedefin %' + LOW_PCT + '\'ına ulaşan karma bulunamadı; en iyisi seçildi (' + txt + '). ' + pm.reasons.join(' ')));
    }
    customForm(c);
  }

  function productInfo(p) {
    var parts = [];
    if (p.carb != null) parts.push('karbonhidrat ' + num(p.carb, 1) + ' g');
    if (p.na != null) parts.push('sodyum ' + num(p.na) + ' mg');
    if (p.k != null) parts.push('potasyum ' + num(p.k) + ' mg');
    if (p.mg != null) parts.push('magnezyum ' + num(p.mg, 1) + ' mg');
    if (!p.custom) parts.push(p.cafUnknown ? 'kafein bilinmiyor' : 'kafein ' + num(p.caf || 0) + ' mg');
    if (p.kcal != null) parts.push(num(p.kcal) + ' kcal');
    var d = h('div', 'pinfo');
    d.innerHTML = '<div class="pvals">' + esc(parts.join(', ')) + ' (1 ' + esc(p.unit || 'porsiyon') + (p.vol ? ', ' + p.vol + ' mL suda' : '') + ')</div>' +
      (p.naNote ? '<div class="sub2' + (p.naUnknown ? ' flag' : '') + '">' + esc(p.naNote) + (p.naUnknown ? ' Bu ürün otomatik öneriye girmez.' : '') + '</div>' : '') + (p.note ? '<div class="sub2">' + esc(p.note) + '</div>' : '');
    if (p.src && p.src.length) {
      var links = p.src.map(function (s) { return '<a href="' + esc(s.url) + '" target="_blank" rel="noopener">' + esc(s.vendor) + '</a>'; }).join(', ');
      d.innerHTML += '<div class="sub2">Kaynak: ' + links + '. Kontrol: ' + esc(p.checked || '') + ', ' + esc(p.conf || '') + '. Etiketten kontrol et.</div>';
    } else if (p.custom) d.innerHTML += '<div class="sub2">Senin girdiğin değerler.</div>';
    return d;
  }

  function customForm(c) {
    var det = h('details', 'manual'); det.appendChild(h('summary', '', '<b>Özel ürün ekle</b>'));
    var inner = h('div', 'cust');
    inner.innerHTML =
      '<label>Ad<input id="cuName" type="text" placeholder="Marka ve ürün adı"></label>' +
      '<label>Tür<select id="cuType" class="sel"><option value="gel">Jel</option><option value="tablet">Efervesan tablet</option><option value="powder">Toz içecek</option><option value="salt">Tuz tableti veya kapsülü</option></select></label>' +
      '<label>Karbonhidrat (g)<input id="cuCarb" type="text" inputmode="decimal" placeholder="0"></label>' +
      '<label>Sodyum<input id="cuNa" type="text" inputmode="decimal" placeholder="0"></label>' +
      '<label>Sodyum birimi<select id="cuNaU" class="sel"><option value="mg">Sodyum mg</option><option value="salt">Tuz g (sodyuma çevrilir, tuz / 2,5)</option></select></label>' +
      '<label>Potasyum (mg, isteğe bağlı)<input id="cuK" type="text" inputmode="decimal"></label>' +
      '<label>Magnezyum (mg, isteğe bağlı)<input id="cuMg" type="text" inputmode="decimal"></label>' +
      '<label>Tablet/toz kaç mL suda çözülür (tuz tableti için boş bırak)<input id="cuVol" type="text" inputmode="decimal" placeholder="500"></label>';
    det.appendChild(inner);
    var msg = h('p', 'note', ''); det.appendChild(msg);
    var add = h('button', 'btn wide', 'Ürünü ekle'); add.type = 'button';
    add.addEventListener('click', function () {
      function v(id) { var t = ($(id).value || '').replace(',', '.').trim(); var n = parseFloat(t); return isNaN(n) ? null : n; }
      var name = ($('cuName').value || '').trim();
      if (!name) { msg.textContent = 'Önce ürün adını yaz.'; msg.className = 'note bad'; return; }
      var type = $('cuType').value, na = v('cuNa'); if (na !== null && $('cuNaU').value === 'salt') na = saltToNa(na);
      var p = { id: 'c' + Date.now(), custom: true, brand: '', name: name, type: type, unit: type === 'gel' ? 'saşe' : 'tablet',
        carb: v('cuCarb') || 0, na: na || 0, k: v('cuK'), mg: v('cuMg'), vol: (type === 'gel' || type === 'salt') ? null : (v('cuVol') || 500), kcal: null };
      st.custom.push(p); if (type === 'gel') st.gelId = p.id; else if (type === 'salt') st.saltId = p.id; else st.drinkId = p.id; save(); render();
    });
    det.appendChild(add);
    if (st.custom.length) {
      det.appendChild(h('div', 'stp-head', '<b>Özel ürünlerim</b>'));
      st.custom.forEach(function (p) {
        var row = h('div', 'stop-row'); row.appendChild(h('span', 'stop-name', esc(p.name)));
        var del = h('button', 'btn step', 'Sil'); del.type = 'button'; del.style.minWidth = '72px';
        del.addEventListener('click', function () { st.custom = st.custom.filter(function (x) { return x.id !== p.id; }); if (st.gelId === p.id) st.gelId = ''; if (st.drinkId === p.id) st.drinkId = ''; if (st.saltId === p.id) st.saltId = ''; save(); render(); });
        row.appendChild(del); det.appendChild(row);
      });
    }
    c.appendChild(det);
  }

  function formCarry() {
    var c = card(elForms, 'Taşıma ve mide');
    c.appendChild(stepper('Suluk sayısı', '', function () { return String(st.flaskN); }, function (d) { st.flaskN = clamp(st.flaskN + d, 1, 6); save(); }, [-1, 1]));
    c.appendChild(h('div', 'stp-head', '<b>Her suluk kaç mL?</b>'));
    c.appendChild(chips([250, 500, 600, 750].map(function (v) { return { v: v, label: v + ' mL' }; }), function (it) { return st.flaskMl === it.v; }, function (it) { st.flaskMl = it.v; save(); render(); }));
    c.appendChild(h('div', 'stp-head', '<b>Saatte en fazla kaç jel sorunsuz alırsın?</b>'));
    c.appendChild(chips([{ v: 1, label: '1' }, { v: 2, label: '2' }, { v: 3, label: '3' }], function (it) { return st.maxGels === it.v; }, function (it) { st.maxGels = it.v; save(); render(); }));
  }

  function formFoods() {
    var c = card(elForms, 'Noktalarda ne yiyeceksin?', 'Her noktada bulunanlardan yiyeceğin porsiyonları seç. Plan buna göre jel ve tableti otomatik ayarlar. Değerlerin kaynağı her satırda yazar; bir kısmı TürKomp ve üretici verisiyle doğrulandı, kalanlar tahmindir. Noktalardaki ürünler resmî 2026 kurallar sayfasındandır, değişebilir; yarış kitindeki son bilgiye bak.');
    window.AID_MENU.forEach(function (ids, ci) {
      var det = h('details', 'cpsec');
      var sumEl = h('div', 'sub2');
      var head = h('summary', 'cphead');
      head.innerHTML = '<div class="cpl"><b>' + esc(cps[ci].name) + '</b></div><div></div><div></div>';
      head.querySelector('.cpl').appendChild(sumEl);
      det.appendChild(head);
      var ai = window.AID_INFO && window.AID_INFO[ci];
      if (ai) det.appendChild(h('p', 'sub2 aidnote', '<b>Burada ayrıca:</b> ' + esc(ai.more) + ' ' + esc(ai.tip)));
      function paintSum() { var t = mealAt(ci); sumEl.textContent = t.items ? t.items + ' porsiyon: ' + num(t.carb) + ' g karbonhidrat, ' + num(t.na) + ' mg sodyum, ' + num(t.k) + ' mg potasyum' : 'Seçilen yok'; }
      paintSum();
      ids.forEach(function (id) {
        var fd = food(id); if (!fd) return;
        var row = h('div', 'foodrow');
        var cur = (st.meal[ci] && st.meal[ci][id]) || 0;
        var left = h('div', 'fl', '<b>' + esc(fd.name) + '</b><div class="sub2">' + esc(fd.portion) + ': ' + num(fd.carb, 1) + ' g karbonhidrat, ' + num(fd.na) + ' mg Na, ' + num(fd.k) + ' mg K, ' + num(fd.mg) + ' mg Mg, ' + num(fd.kcal) + ' kcal' + (fd.caf ? ', ' + fd.caf + ' mg kafein' : '') + '</div>' + (fd.ver ? '<div class="sub2">' + esc(fd.ver) + (fd.src && fd.src.length ? ' Kaynak: ' + fd.src.map(function (x) { return '<a href="' + esc(x.url) + '" target="_blank" rel="noopener">' + esc(x.label) + '</a>'; }).join(', ') : '') + '</div>' : ''));
        var ctr = h('div', 'cnt');
        var minus = h('button', 'btn step', '−'), val = h('span', 'cntv', String(cur)), plus = h('button', 'btn step', '+');
        minus.type = 'button'; plus.type = 'button'; minus.setAttribute('aria-label', fd.name + ' azalt'); plus.setAttribute('aria-label', fd.name + ' artır');
        function set(n) {
          n = clamp(n, 0, 6); st.meal[ci] = st.meal[ci] || {}; if (n) st.meal[ci][id] = n; else delete st.meal[ci][id];
          val.textContent = String(n); save(); paintSum(); update();
        }
        minus.addEventListener('click', function () { set(((st.meal[ci] && st.meal[ci][id]) || 0) - 1); });
        plus.addEventListener('click', function () { set(((st.meal[ci] && st.meal[ci][id]) || 0) + 1); });
        ctr.appendChild(minus); ctr.appendChild(val); ctr.appendChild(plus);
        row.appendChild(left); row.appendChild(ctr); det.appendChild(row);
      });
      c.appendChild(det);
    });
  }

  function breakdownEl() {
    var b = breakdown(), det = h('details', 'manual');
    det.appendChild(h('summary', '', '<b>Hesap dökümü (kontrol için)</b>'));
    if (!b.valid) { det.appendChild(h('p', 'warnbox', 'Seçili planda durma süreleri hedef süreden uzun.')); return det; }
    var swLabel = { low: 'Az', normal: 'Normal', high: 'Çok' }[b.sweat];
    var rows = [
      ['Seçim (Plan sekmesi)', b.label + (b.kind === 'data' ? ' (ana tahmin)' : b.mode === 'pace' ? ' (düz tempo modu)' : ' (hedef süre modu)')],
      ['Bitiş süresi', hm(b.finish) + ' (' + num(b.finish) + ' dk)'],
      ['Durma süreleri toplamı', num(b.stops) + ' dk'],
      ['Hareket süresi', hm(b.M) + ' (' + num(b.M) + ' dk)'],
      ['Parkurun eforu (mesafe + tırmanış/100, sabit)', num(b.E, 2) + ' km-efor'],
      ['Planın hızı', num(b.speed, 2) + ' km-efor/saat'],
      ['Tempo çarpanı (hız / 7,8, sınır 0,85-1,20)', num(b.intF, 3)],
      ['Terleme çarpanı (' + swLabel + ')', num(b.sweatF, 2)],
      ['Sıcaklık çarpanı (' + b.temp + ' °C)', num(b.tempF, 2)],
      ['Beden çarpanı (kök(' + b.kg + ' / 75), sınır 0,85-1,20)', num(b.kgF, 3)],
      ['Ham sıvı = 500 x terleme x sıcaklık x beden x tempo', num(b.raw, 1) + ' mL'],
      ['Sıvı (10\'a yuvarlanmış, üst sınır ' + b.cap + ')', b.fluid + ' mL/saat' + (b.capped ? ' (üst sınıra dayandı)' : '')],
      ['Terin tuzluluğu (' + SALTY_LABEL[b.salty] + ')', b.conc + ' mg/L'],
      ['Sodyum = sıvı x ' + b.conc + ' mg/L', b.na == null ? 'Hedef yok' : b.na + ' mg/saat'],
      ['Karbonhidrat = 60 x min(1,10, max(0,90, tempo)), 5\'e yuvarla', b.carb + ' g/saat']
    ];
    var tr = rows.map(function (r) { return '<tr><td>' + esc(r[0]) + '</td><td class="r"><b>' + esc(r[1]) + '</b></td></tr>'; }).join('');
    det.appendChild(h('div', 'tablewrap', '<table class="plantable"><tbody>' + tr + '</tbody></table>'));
    det.appendChild(h('p', 'note', 'Bu değerleri Plan sekmesindeki süreler ve Beslenme formundaki seçimlerle karşılaştır; uyuşmayan bir şey varsa hata vardır.'));
    return det;
  }

  function resultCards() {
    var e = evaluate(st.gelId, st.drinkId, st.saltId), tg = targets();
    var c = card(elRes, 'Saatlik hedefler', 'Sıvı = 500 mL x terleme ' + num(tg.sweatF, 2) + ' x sıcaklık ' + num(tg.tempF, 2) + ' x beden ' + num(tg.kgF, 2) + ' x tempo ' + num(tg.intF, 2) + ' (hızı ' + num(tg.speed, 1) + ' km-efor/saat), en çok ' + tg.cap + ' mL. Sodyum = sıvı x ' + tg.conc + ' mg/L (' + SALTY_LABEL[tg.salty].toLowerCase() + ' ter). Karbonhidrat = 60 g x tempo. Susadıkça iç, kilo alacak kadar içme.');
    var dl = h('dl', 'sumlist');
    function row(a, b) { dl.appendChild(h('dt', '', esc(a))); dl.appendChild(h('dd', '', esc(b))); }
    row('Sıvı', tg.fluid + ' mL/saat (her ' + st.flaskMl + ' mL flask yaklaşık ' + round5(st.flaskMl / tg.fluid * 60) + ' dk)');
    row('Sodyum (tüm kaynaklardan)', tg.na == null ? 'Hedef yok (sağlık durumu)' : tg.na + ' mg/saat');
    row('Karbonhidrat', tg.carb + ' g/saat');
    c.appendChild(dl);
    c.appendChild(breakdownEl());

    if (!e.valid) { var w = card(elRes, ''); w.appendChild(h('p', 'warnbox', 'Seçili planda durma süreleri hedef süreden uzun. Plan sekmesinde düzelt.')); return; }
    if (!e.gel && !e.tab && !e.salt) { var n = card(elRes, ''); n.appendChild(h('p', 'note', 'Plan için bir jel veya tablet seç ya da "karmayı öner"e dokun.')); }

    var s0 = sel(), sd = e.sched, items = '';
    var pc = card(elRes, 'Uygulama planı (' + s0.short + ', ' + hm(e.finish) + ')',
      'Süreler yarışın hareket süresine göre (' + hm(e.movH * 60) + '; noktalardaki duraklamalar hariç). Seçtiğin her ürün planda kullanılır; miktarlar hedefe en yakın uygulanabilir takvime göre seçilir. Saatin tekrarlayan zaman uyarısını jel aralığına kur' + (sd.saltMin && sd.gelMin && sd.saltMin !== sd.gelMin ? '; tuz tableti için ikinci bir uyarı kullan' : '') + '. Hedefin %' + LOW_PCT + '\'ından azı yetersiz sayılır (kırmızı); %' + HIGH_PCT + '\'in üstü fazla (sarı, yalnızca bilgi).');
    function dk(m) { return m >= 60 && m % 60 === 0 ? (m / 60) + ' saatte' : m + ' dakikada'; }
    function nm(p) { return esc((p.brand ? p.brand + ' ' : '') + p.name); }
    var bothMin = sd.flaskMin * st.flaskN;
    items += '<div class="rline"><b>Su:</b> her flask (' + st.flaskMl + ' mL) yaklaşık <b>' + sd.flaskMin + ' dakikada</b> bitsin' + (st.flaskN > 1 ? '; ' + st.flaskN + ' flask yaklaşık ' + hm(bothMin) + ' saatte' : '') + '</div>';
    if (e.tab) items += '<div class="rline"><b>Elektrolit:</b> ' + (sd.dose === 1 ? '<b>her flaska 1</b>' : sd.dose === 0.5 ? '<b>iki flasktan birine 1</b>' : '<b>kullanma</b> (hedef başka ürünlerle tutuyor)') + ' (' + nm(e.tab) + (e.tab.vol && e.tab.vol !== st.flaskMl ? '; üretici ' + e.tab.vol + ' mL öneriyor' : '') + ')</div>';
    if (e.gel) items += '<div class="rline"><b>Jel:</b> ' + (sd.gelMin ? '<b>her ' + dk(sd.gelMin) + ' 1</b>' : 'yok') + ' (' + nm(e.gel) + ')</div>';
    if (e.salt) items += '<div class="rline"><b>Tuz tableti:</b> <b>her ' + dk(sd.saltMin) + ' 1</b> (' + nm(e.salt) + ')</div>';
    pc.appendChild(h('div', '', items));
    var dl2 = h('dl', 'sumlist');
    function row2(a, b, cls) { dl2.appendChild(h('dt', '', esc(a))); dl2.appendChild(h('dd', cls || '', esc(b))); }
    var rt = ratios(e, tg), cp = pct(rt.carb), np = rt.na == null ? null : pct(rt.na);
    row2('Bu takvimle karbonhidrat', num(e.carbH) + ' g/saat, hedefin %' + cp + ' (hedef ' + tg.carb + ')', grade(cp));
    if (tg.na != null) row2('Bu takvimle sodyum', num(e.naH) + ' mg/saat, hedefin %' + np + ' (hedef ' + tg.na + ')', grade(np));
    row2('Bu takvimle sıvı', Math.round(sd.fluidEff) + ' mL/saat, hedefin %' + pct(sd.fluidEff / tg.fluid) + ' (hedef ' + tg.fluid + ')', 'ok');
    pc.appendChild(dl2);
    if (cp < LOW_PCT) pc.appendChild(h('p', 'note bad', 'Karbonhidrat yetersiz: hedefin %' + cp + '\'i, saatte ' + num(tg.carb - e.carbH) + ' g eksik.'));
    if (np != null && np < LOW_PCT) pc.appendChild(h('p', 'note bad', 'Sodyum yetersiz: hedefin %' + np + '\'i, saatte ' + num(tg.na - e.naH) + ' mg eksik.'));
    if (cp > HIGH_PCT) pc.appendChild(h('p', 'note flag', 'Karbonhidrat hedefin %' + cp + '\'i (fazla). Bilgi: mide toleransına dikkat et.'));
    if (np != null && np > HIGH_PCT) pc.appendChild(h('p', 'note flag', 'Sodyum hedefin %' + np + '\'i (fazla). Bilgi: miktarı azaltmayı düşünebilirsin.'));
    if (cp < LOW_PCT || (np != null && np < LOW_PCT)) {
      var sg = suggest();
      if (sg) {
        var line = h('p', 'note', '<b>Öneri:</b> ' + esc(sg.changes.join('; ')) + ' (karbonhidrat %' + sg.carbPct + (sg.naPct == null ? '' : ', sodyum %' + sg.naPct) + ').');
        pc.appendChild(line);
        var ab = h('button', 'btn small', 'Öneriyi uygula'); ab.type = 'button';
        ab.addEventListener('click', function () { st.gelId = sg.g ? sg.g.id : ''; st.drinkId = sg.t ? sg.t.id : ''; st.saltId = sg.s ? sg.s.id : ''; save(); render(); });
        pc.appendChild(ab);
      } else {
        var rs = whyNot(candidates(), tg, { e: e });
        pc.appendChild(h('p', 'note', '<b>Öneri:</b> ürün değiştirerek hedefin %' + LOW_PCT + '\'ına ulaşan bir karma yok. ' + esc(rs.join(' '))));
      }
    }

    var sc = card(elRes, 'Bölüm bölüm taşı', 'Jel ve tablet sayıları, önceki noktada yediklerin düşülerek hesaplanır.');
    var rows = '';
    e.rows.forEach(function (r) {
      var ex = r.extraMl > 0;
      rows += '<tr><td><b>' + esc(r.name) + '</b><div class="sub2">' + num(r.hours, 1) + ' saat</div></td><td class="r"><b>' + num(r.needL, 2) + ' L</b><div class="sub2">' + num(r.flasks, 1) + ' flask</div><div class="sub2 ' + (ex ? 'bad' : 'ok') + '">' + (ex ? '+' + r.extraMl + ' mL eksik' : 'yeter') + '</div></td><td class="r">' + (e.gel ? r.gels + ' jel' : '') + (e.tab ? '<div class="sub2">' + r.tabs + ' tablet</div>' : '') + (e.salt ? '<div class="sub2">' + r.salts + ' tuz tableti</div>' : '') + '</td></tr>';
    });
    sc.appendChild(h('div', 'tablewrap', '<table class="plantable"><thead><tr><th>Bölüm sonu</th><th class="r">Sıvı</th><th class="r">Taşı</th></tr></thead><tbody>' + rows + '</tbody></table>'));
    var short = e.rows.filter(function (r) { return r.extraMl > 0; });
    if (short.length) sc.appendChild(h('p', 'warnbox', 'Taşıma kapasiten (' + num(e.capL, 2) + ' L) bu bölümlerde yetmiyor: ' + short.map(function (r) { return r.name + ' (+' + r.extraMl + ' mL)'; }).join(', ') + '. Ek suluk taşıyabilir, o bölümde susadıkça içip miktarı kısabilir ya da ikmali buna göre planlayabilirsin.'));
    else sc.appendChild(h('p', 'note', 'Taşıma kapasiten tüm bölümler için yeterli.'));

    var t = e.tot;
    var tc = card(elRes, 'Yarış boyunca toplam', 'Potasyum ve magnezyum için hedef koymuyorum; burada sadece alınan miktar görünür. Yiyecek değerleri yaklaşıktır, jel ve tablet değerleri etiketlerden.');
    function trow(label, p, fd, d) { return '<tr><td>' + label + '</td><td class="r">' + num(p, d) + '</td><td class="r">' + num(fd, d) + '</td><td class="r"><b>' + num(p + fd, d) + '</b></td></tr>'; }
    var trs = trow('Karbonhidrat (g)', t.pCarb, t.fCarb) + (tg.na != null ? trow('Sodyum (mg)', t.pNa, t.fNa) : '') + trow('Potasyum (mg)', t.pK, t.fK) + trow('Magnezyum (mg)', t.pMg, t.fMg) + trow('Enerji (kcal)', t.pKcal, t.fKcal);
    tc.appendChild(h('div', 'tablewrap', '<table class="plantable"><thead><tr><th></th><th class="r">Jel ve tablet</th><th class="r">Yiyecek</th><th class="r">Toplam</th></tr></thead><tbody>' + trs + '</tbody></table>'));
  }

  function onTab(name) { if (name === 'nutrition') render(); }
  K.nutrition = { GEL_STEPS: GEL_STEPS, SALT_STEPS: SALT_STEPS, saltToNa: saltToNa, parseWeather: parseWeather, E_STD: E_STD, targetsFrom: targetsFrom, raceSnapshot: raceSnapshot, mealList: mealList, render: render, onTab: onTab, evaluate: evaluate, targets: targets, breakdown: breakdown, state: function () { return st; }, autoPick: autoPick, suggest: suggest, ratios: ratios, grade: grade, pct: pct, SALTY: SALTY, mealAt: mealAt };
  if (!$('tab-nutrition').hidden) render();
})();
