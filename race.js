(function () {
  'use strict';
  var K = window.K63;
  if (!K || !K.plan) return;
  var P = K.plan, $ = K.$, f = K.f, C = K.C, cps = K.cps;
  var root = $('tab-race');
  var KEY = 'k63race-v1';
  var NCP = cps.length;

  /* ---------- state ---------- */
  var race = null;   // persisted race state, or null
  var setup = { sc: P.state().sel, manual: false, startMin: Math.round(C.startHour * 60), sound: true, wake: false };
  var onRaceTab = false;
  var toastTimer = null, undoInfo = null;
  var actx = null, wakeLock = null, wakeState = 'off', locMsg = null;

  function load() { try { var r = K.store(KEY); race = r ? JSON.parse(r) : null; } catch (e) { race = null; } }
  function save() {
    try { if (race) localStorage.setItem(KEY, JSON.stringify(race)); else localStorage.removeItem(KEY); } catch (e) {}
  }
  load();
  function active() { return !!race && !race.ended; }

  /* ---------- formatting ---------- */
  function pad(n) { return (n < 10 ? '0' : '') + n; }
  function hms(sec) {
    var neg = sec < 0, t = Math.floor(Math.abs(sec));
    var h = Math.floor(t / 3600), m = Math.floor(t % 3600 / 60), s = t % 60;
    return (neg ? '-' : '') + h + ':' + pad(m) + ':' + pad(s);
  }
  function hm(min) { var t = Math.round(Math.abs(min)), h = Math.floor(t / 60), m = t % 60; return (min < 0 ? '-' : '') + h + ':' + pad(m); }
  function ms(sec) { var t = Math.round(sec), m = Math.floor(t / 60), s = t % 60; return m + ':' + pad(s); }
  function clockOf(ts) { var d = new Date(ts); return pad(d.getHours()) + ':' + pad(d.getMinutes()); }
  function esc(t) { return String(t).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function pct(v) { return '%' + f(Math.abs(v), 0); }
  function hh(el, cls, html) { var e = document.createElement(el); if (cls) e.className = cls; if (html !== undefined) e.innerHTML = html; return e; }
  function status(buf) {
    if (buf < 0) return { cls: 'bad', icon: '✕', text: 'Kesim aşılıyor' };
    if (buf < 20) return { cls: 'bad', icon: '✕', text: 'Tehlike' };
    if (buf < 60) return { cls: 'warn', icon: '!', text: 'Dikkat' };
    return { cls: 'ok', icon: '✓', text: 'Güvende' };
  }

  /* ---------- snapshot of the plan taken at the start ---------- */
  function snapshot(key) {
    var st = P.state(), s = st.sc[key], r = P.compute(s);
    if (!r.valid) return null;
    var out = { sc: key, level: st.level, finish: r.finish, cp: r.cp.map(function (c) { return { arr: c.arr, dep: c.dep, stop: c.stop }; }), secs: [] };
    var prevEnd = 0;
    r.rows.forEach(function (x) {
      var se = x.sec;
      out.secs.push({ a: se.a, b: se.b, ci: se.ci, type: se.type, kmFrom: se.kmFrom, kmTo: se.kmTo, km: se.km, up: se.up, down: se.down,
        maxUp: se.maxUp, maxDn: se.maxDn, steep: se.steep, steepMax: se.steepMax, t0: prevEnd, t1: x.arr, pace: x.t * 60 / se.km });
      prevEnd = x.sec.last ? x.dep : x.arr;
    });
    return out;
  }
  function planElapsedAt(idx) {
    var secs = race.snap.secs;
    if (idx <= secs[0].a) return 0;
    for (var i = 0; i < secs.length; i++) {
      var s = secs[i];
      if (idx >= s.a && idx <= s.b) return s.t0 + (s.b > s.a ? (idx - s.a) / (s.b - s.a) * (s.t1 - s.t0) : 0);
    }
    return race.snap.finish;
  }
  function sectorAt(idx) {
    var secs = race.snap.secs;
    for (var i = 0; i < secs.length; i++) if (idx >= secs[i].a && idx < secs[i].b) return secs[i];
    return secs[secs.length - 1];
  }

  /* ---------- derived values ---------- */
  function derive(now) {
    var logs = race.logs, last = logs.length ? logs[logs.length - 1] : null;
    var lastCi = last ? last.ci : -1, nextCi = lastCi + 1, done = nextCi >= NCP;
    var el = (now - race.startTs) / 60000;
    var lastTs = last ? last.ts : race.startTs;
    var fix = race.fix && race.fix.ts > lastTs && race.fix.off < 1500 ? race.fix : null;
    var idx = fix ? fix.idx : (lastCi >= 0 ? cps[lastCi].idx : 0);
    var delta = null, src = '';
    if (fix) { delta = (fix.ts - race.startTs) / 60000 - planElapsedAt(fix.idx); src = 'konuma göre'; }
    else if (last) { delta = (last.ts - race.startTs) / 60000 - race.snap.cp[lastCi].arr; src = 'son noktaya göre'; }
    var d = { el: el, lastCi: lastCi, nextCi: nextCi, done: done, idx: idx, fix: fix, delta: delta, src: src };
    if (!done) {
      var cut = cps[nextCi].cut * 60;
      var exp = race.snap.cp[nextCi].arr + (delta || 0);
      d.cutLeft = cut - el; d.buf = cut - exp; d.exp = exp;
      d.remKm = cps[nextCi].km - K.dist[idx] / 1000;
    }
    return d;
  }

  /* ---------- audio ---------- */
  function ensureAudio() {
    try {
      if (navigator.audioSession) navigator.audioSession.type = 'playback';
      var AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return;
      if (!actx) actx = new AC();
      if (actx.state === 'suspended') actx.resume();
    } catch (e) {}
  }
  function beep(n, freq) {
    if (!race || !race.sound || !actx) return;
    try {
      var t0 = actx.currentTime + 0.05;
      for (var i = 0; i < n; i++) {
        var o = actx.createOscillator(), g = actx.createGain(), at = t0 + i * 0.3;
        o.type = 'sine'; o.frequency.value = freq || 880;
        g.gain.setValueAtTime(0.0001, at);
        g.gain.exponentialRampToValueAtTime(0.6, at + 0.02);
        g.gain.exponentialRampToValueAtTime(0.0001, at + 0.22);
        o.connect(g); g.connect(actx.destination); o.start(at); o.stop(at + 0.25);
      }
    } catch (e) {}
  }

  /* ---------- wake lock ---------- */
  function acquireWake() {
    if (!('wakeLock' in navigator)) { wakeState = 'na'; return Promise.resolve(); }
    return navigator.wakeLock.request('screen').then(function (l) {
      wakeLock = l; wakeState = 'on'; paintWake();
      l.addEventListener('release', function () { wakeLock = null; if (active()) { wakeState = 'off'; paintWake(); } });
    }).catch(function () { wakeState = 'off'; paintWake(); });
  }
  function releaseWake() { try { if (wakeLock) wakeLock.release(); } catch (e) {} wakeLock = null; wakeState = 'off'; }
  document.addEventListener('visibilitychange', function () {
    if (document.visibilityState === 'visible' && active() && race.wake && wakeState !== 'on') acquireWake();
  });
  function paintWake() {
    var e = $('rWake'); if (!e) return;
    if (wakeState === 'on') { e.className = 'wakebar ok'; e.textContent = '✓ Ekran açık kalıyor'; e.disabled = true; }
    else if (wakeState === 'na') { e.className = 'wakebar warn'; e.textContent = '! Bu tarayıcıda ekran kilidi yok, kilit süresini uzat'; e.disabled = true; }
    else if (!race.wake) { e.className = 'wakebar'; e.textContent = 'Ekranı açık tutma kapalı'; e.disabled = true; }
    else { e.className = 'wakebar bad'; e.textContent = '✕ Ekran kapanabilir. Dokun, tekrar dene'; e.disabled = false; }
  }

  /* ---------- location ---------- */
  function nearest(lat, lon, a, b) {
    var cosLat = Math.cos(lat * Math.PI / 180), best = a, bd = Infinity;
    for (var i = a; i <= b; i++) {
      var dy = (C.lat[i] - lat) * 111320, dx = (C.lon[i] - lon) * 111320 * cosLat, d2 = dx * dx + dy * dy;
      if (d2 < bd) { bd = d2; best = i; }
    }
    return { idx: best, m: Math.sqrt(bd) };
  }
  // The course passes near itself in places. Look first around where the runner should be
  // (a little behind the last logged point up to the point after the next one); fall back to the whole course.
  function snap(lat, lon) {
    var lastCi = race.logs.length ? race.logs[race.logs.length - 1].ci : -1;
    var a = Math.max(0, (lastCi >= 0 ? cps[lastCi].idx : 0) - 80);
    var b = cps[Math.min(lastCi + 2, NCP - 1)].idx;
    var r = nearest(lat, lon, a, b);
    if (r.m > 150) { var g = nearest(lat, lon, 0, K.N - 1); if (g.m < r.m) r = g; }
    return r;
  }
  function locate() {
    if (!navigator.geolocation) { locMsg = { cls: 'bad', text: 'Bu tarayıcıda konum yok.' }; render(); return; }
    locMsg = { cls: 'warn', text: 'Konum alınıyor, bekle...' }; render();
    navigator.geolocation.getCurrentPosition(function (p) {
      var r = snap(p.coords.latitude, p.coords.longitude);
      race.fix = { idx: r.idx, ts: Date.now(), off: r.m, acc: Math.round(p.coords.accuracy || 0) };
      save(); locMsg = null; render();
    }, function (e) {
      locMsg = { cls: 'bad', text: e && e.code === 1 ? 'Konum izni verilmedi.' : e && e.code === 3 ? 'Konum zamanında alınamadı, açık alanda tekrar dene.' : 'Konum alınamadı.' };
      render();
    }, { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 });
  }

  /* ---------- actions ---------- */
  function startRace(startTs) {
    var snap = snapshot(setup.sc);
    if (!snap) { setup.err = 'Seçili planda durma süreleri hedef süreden uzun. Önce Plan sekmesinde düzelt.'; render(); return; }
    var nut = null; try { nut = K.nutrition && K.nutrition.raceSnapshot ? K.nutrition.raceSnapshot(setup.sc) : null; } catch (e) { nut = null; }
    race = { sc: setup.sc, startTs: startTs, sound: setup.sound, wake: setup.wake, snap: snap, nut: nut, logs: [], fix: null, ended: false };
    save(); setup.err = null; locMsg = null;
    ensureAudio();
    if (race.wake) acquireWake(); else wakeState = 'off';
    beep(1, 660);
    render(); syncBody();
  }
  function logCp() {
    var d = derive(Date.now());
    if (d.done || d.el < 0) return;
    ensureAudio();
    race.logs.push({ ci: d.nextCi, ts: Date.now() });
    var el = (Date.now() - race.startTs) / 60000, buf = cps[d.nextCi].cut * 60 - el, sx = status(buf);
    if (d.nextCi === NCP - 1) { race.ended = true; race.endTs = Date.now(); releaseWake(); beep(3, 880); }
    else beep(sx.cls === 'bad' ? 2 : 1, sx.cls === 'bad' ? 520 : 880);
    undoInfo = { name: cps[d.nextCi].name, el: el };
    save(); render(); syncBody(); showToast();
  }
  function undo() {
    if (!race || !race.logs.length) return;
    race.logs.pop(); race.ended = false; delete race.endTs; undoInfo = null;
    save(); hideToast(); render(); syncBody();
    if (race.wake && wakeState !== 'on') acquireWake();
  }
  function showToast() {
    hideToast();
    var t = $('rToast'); if (!t || !undoInfo) return;
    t.innerHTML = '<span><b>' + esc(undoInfo.name) + '</b> kaydedildi, ' + hms(undoInfo.el * 60) + '</span>';
    var b = hh('button', 'toastbtn', 'Geri al'); b.type = 'button'; b.addEventListener('click', undo);
    t.appendChild(b); t.hidden = false;
    toastTimer = setTimeout(hideToast, 6000);
  }
  function hideToast() { clearTimeout(toastTimer); var t = $('rToast'); if (t) { t.hidden = true; t.textContent = ''; } }
  function resetRace() { releaseWake(); race = null; save(); undoInfo = null; locMsg = null; render(); syncBody(); }
  function twoTap(btn, label, fn) {
    btn.addEventListener('click', function () {
      if (!btn.getAttribute('data-ask')) {
        btn.setAttribute('data-ask', '1'); btn.textContent = 'Emin misin? Tekrar dokun';
        setTimeout(function () { if (btn.isConnected) { btn.removeAttribute('data-ask'); btn.textContent = label; } }, 4000);
        return;
      }
      fn();
    });
  }

  /* ---------- body classes ---------- */
  function syncBody() {
    var racing = onRaceTab && active();
    document.body.classList.toggle('racing', racing);
    if (!racing) document.body.classList.remove('navopen');
  }

  /* ---------- views ---------- */
  function chipsFor(items, isOn, onPick) {
    var box = hh('div', 'chips');
    items.forEach(function (it) {
      var b = hh('button', 'chip', esc(it.label)); b.type = 'button'; b.setAttribute('aria-pressed', String(isOn(it)));
      b.addEventListener('click', function () { onPick(it); }); box.appendChild(b);
    });
    return box;
  }
  function stepRow(label, getText, steps, onStep) {
    var wrap = hh('div', 'stp'), row = hh('div', 'stp-row');
    wrap.appendChild(hh('div', 'stp-head', '<b>' + esc(label) + '</b>'));
    var val = hh('span', 'stp-val', esc(getText()));
    function mk(d) { var b = hh('button', 'btn step', (d > 0 ? '+' : '−') + Math.abs(d)); b.type = 'button'; b.addEventListener('click', function () { onStep(d); val.textContent = getText(); }); return b; }
    steps.filter(function (d) { return d < 0; }).forEach(function (d) { row.appendChild(mk(d)); });
    row.appendChild(val);
    steps.filter(function (d) { return d > 0; }).forEach(function (d) { row.appendChild(mk(d)); });
    wrap.appendChild(row); return wrap;
  }

  /* ---------- yarış öncesi kontrol listesi ---------- */
  var CHECK_KEY = 'k63check-v1';
  var CHECKS = [
    { group: 'Zorunlu ekipman (resmî CMT 2026 kuralları; eksiği diskalifiye sebebi)', items: [
      ['su', 'En az 1 litre su kapasitesi (tek kullanımlık olmayan suluk veya su torbası)'],
      ['numara', 'Yarış numarası (önde, görünür)'],
      ['telefon', 'Cep telefonu (yabancı hatsa dolaşım açık)'],
      ['powerbank', 'En az 6000 mAh powerbank ve kablo'],
      ['battaniye', 'Alüminyum acil durum battaniyesi'],
      ['bandaj', 'Elastik bandaj'],
      ['duduk', 'Düdük'],
      ['mont', 'Su geçirmez mont'],
      ['sapka', 'Şapka veya bandana'],
      ['lamba', 'Kafa lambası ve yedek pil'],
      ['bardak', 'Bardak veya matara (noktalarda plastik bardak yok)'],
      ['ayakkabi', 'Uygun ayakkabı'],
      ['cip', 'Zamanlama çipi']
    ] },
    { group: 'Tavsiye edilen', items: [
      ['yiyecek', 'Yanında yiyecek (jeller vb.)'],
      ['uzunkol', 'Uzun kollu üst'],
      ['eldiven', 'Eldiven'],
      ['baston', 'Baston kullanacaksan: bitişe kadar taşınmalı (ara noktada bırakmak 1 saat ceza)']
    ] },
    { group: 'Telefon ve uygulama', items: [
      ['sarj', 'Telefon tam şarjlı, powerbank dolu'],
      ['piltasarrufu', 'Telefonda pil tasarrufu kapalı'],
      ['chrome', 'Uygulama Chrome\'da ana ekrandan açılıyor (uçak modunda da)'],
      ['sinama', 'Test > Kendini sına: hepsi geçti'],
      ['yedek', 'Uygulamanın son yedeği alındı'],
      ['beslenme', 'Beslenme planı, ürünler ve noktalardaki yiyecekler seçili'],
      ['hava', 'Beslenme > Hava tahmininden sıcaklık güncellendi']
    ] },
    { group: 'Saat (Garmin)', items: [
      ['saatsarj', 'Saat tam şarjlı'],
      ['kurs', 'Kurs yüklü, Up Ahead\'de kontrol noktaları görünüyor'],
      ['climbpro', 'ClimbPro ekranı açık'],
      ['alarm', 'Beslenme için tekrarlayan zaman uyarısı kurulu'],
      ['pacepro', 'PacePro planı yüklü (kullanacaksan)']
    ] },
    { group: 'Yarış sabahı', items: [
      ['suluk', 'Suluklar dolu, tabletler hazır'],
      ['jeller', 'İlk bölümün jelleri yanında (Yarış > Start kartı)'],
      ['start', 'Start alanında en geç 06:30']
    ] }
  ];
  function loadChecks() { try { var r = K.store(CHECK_KEY); return r ? JSON.parse(r) : {}; } catch (e) { return {}; } }
  function saveChecks(c) { K.store(CHECK_KEY, JSON.stringify(c)); }
  function checklistCard() {
    var done = loadChecks(), total = 0, ok = 0;
    CHECKS.forEach(function (g) { g.items.forEach(function (it) { total++; if (done[it[0]]) ok++; }); });
    var det = hh('details', 'card checklist');
    var sum = hh('summary', '', '<b>Yarış öncesi kontrol listesi</b> <span class="sub2" id="ckCount">' + ok + ' / ' + total + ' hazır</span>');
    det.appendChild(sum);
    CHECKS.forEach(function (g) {
      det.appendChild(hh('div', 'stp-head', '<b>' + esc(g.group) + '</b>'));
      g.items.forEach(function (it) {
        var b = hh('button', 'ckrow' + (done[it[0]] ? ' on' : ''), '<span class="ckbox">' + (done[it[0]] ? '✓' : '') + '</span><span>' + esc(it[1]) + '</span>');
        b.type = 'button'; b.setAttribute('aria-pressed', String(!!done[it[0]]));
        b.addEventListener('click', function () {
          var c = loadChecks(); c[it[0]] = !c[it[0]]; if (!c[it[0]]) delete c[it[0]]; saveChecks(c);
          var on = !!c[it[0]]; b.className = 'ckrow' + (on ? ' on' : ''); b.setAttribute('aria-pressed', String(on)); b.querySelector('.ckbox').textContent = on ? '✓' : '';
          var n = 0; CHECKS.forEach(function (gg) { gg.items.forEach(function (x) { if (c[x[0]]) n++; }); });
          var ce = $('ckCount'); if (ce) ce.textContent = n + ' / ' + total + ' hazır';
        });
        det.appendChild(b);
      });
    });
    var rs = hh('button', 'btn wide', 'Listeyi sıfırla'); rs.type = 'button';
    twoTap(rs, 'Listeyi sıfırla', function () { saveChecks({}); render(); });
    det.appendChild(rs);
    det.appendChild(hh('p', 'note', 'Zorunlu ekipman listesi resmî CMT 2026 kurallar sayfasından. Kurallar yarış kitinde güncellenebilir; son hâlini oradan kontrol et.'));
    return det;
  }

  function viewSetup() {
    root.appendChild(hh('h2', 'tabtitle', 'Yarış: nokta yardımcısı'));
    root.appendChild(checklistCard());
    root.appendChild(hh('p', 'note', 'Koşarken süreyi, mesafeyi, tempoyu ve rotayı saatinden takip et. Uygulamayı kontrol noktasında aç: "vardım"a bas, kesim payını ve plana farkı gör, sonraki sektöre bak. Yarışı başlatınca plan ve beslenme planı o andaki hâliyle kaydedilir; sonradan değişiklik yapsan da bu yarış etkilenmez.'));
    var card = hh('section', 'card');
    card.appendChild(hh('h2', '', 'Hangi plan?'));
    var items = ['A', 'B', 'C'].map(function (k) {
      var r = P.compute(P.state().sc[k]); return { id: k, label: k + '  ' + (r.valid ? hm(r.finish) : '--') };
    });
    card.appendChild(chipsFor(items, function (it) { return setup.sc === it.id; }, function (it) { setup.sc = it.id; render(); }));
    var s = P.state().sc[setup.sc];
    card.appendChild(hh('p', 'note', 'Plandaki hedef bitiş ve kesim payları bu seçime göre hesaplanır.'));
    root.appendChild(card);

    var opt = hh('section', 'card');
    opt.appendChild(hh('h2', '', 'Ayarlar'));
    opt.appendChild(chipsFor([{ id: 1, label: 'Ses açık' }, { id: 0, label: 'Ses kapalı' }], function (it) { return setup.sound === !!it.id; }, function (it) { setup.sound = !!it.id; render(); }));
    opt.appendChild(chipsFor([{ id: 0, label: 'Ekran kendi kapansın' }, { id: 1, label: 'Ekran açık kalsın' }], function (it) { return setup.wake === !!it.id; }, function (it) { setup.wake = !!it.id; render(); }));
    opt.appendChild(hh('p', 'note', 'Ekranı saatlerce açık tutmak pili çok yorar; önerilen: kendi kapansın. Kapalıyken süre yine doğru işler, uygulamayı açınca güncel durumu görürsün. Açık tutarsan telefonun pil tasarrufu kapalı olmalı.'));
    root.appendChild(opt);

    if (setup.err) root.appendChild(hh('p', 'warnbox', esc(setup.err)));
    var go = hh('button', 'bigbtn static', 'Yarışı başlat'); go.type = 'button';
    go.addEventListener('click', function () { startRace(Date.now()); });
    root.appendChild(go);

    var man = hh('details', 'card manual');
    man.appendChild(hh('summary', '', '<b>Başlangıç saatini elle gir</b>'));
    man.appendChild(hh('p', 'note', 'Start vurulduktan sonra uygulamayı açtıysan veya erken hazırlanmak istiyorsan. Saat bugüne göre alınır.'));
    man.appendChild(stepRow('Başlangıç saati', function () { return pad(Math.floor(setup.startMin / 60)) + ':' + pad(setup.startMin % 60); }, [-5, -1, 1, 5],
      function (d) { setup.startMin = (setup.startMin + d + 1440) % 1440; }));
    var go2 = hh('button', 'btn wide', 'Bu saatle başlat'); go2.type = 'button';
    go2.addEventListener('click', function () {
      var d = new Date(); d.setHours(Math.floor(setup.startMin / 60), setup.startMin % 60, 0, 0); startRace(d.getTime());
    });
    man.appendChild(go2);
    root.appendChild(man);
  }

  function nextInfoHtml(d) {
    var snap = race.snap, sec = sectorAt(d.idx), out = '';
    var tLabel = { C: 'Çıkış', D: 'İniş', F: 'Düz' }[sec.type];
    out += '<div class="rline"><b>' + esc(cps[d.nextCi].name) + '</b> noktasına ' + f(Math.max(0, d.remKm), 1) + ' km' + (d.fix ? ' (konuma göre)' : (d.lastCi >= 0 ? ' (son noktadan)' : ' (startan)')) + '</div>';
    out += '<div class="rline">Sektör: <span class="stype t' + sec.type + '">' + tLabel + '</span> ' + f(sec.kmFrom, 1) + '-' + f(sec.kmTo, 1) + ' km, ' + f(sec.km, 1) + ' km, +' + f(sec.up, 0) + ' m, −' + f(sec.down, 0) + ' m</div>';
    out += '<div class="rline">Plan tempo ' + ms(sec.pace) + ' /km' + (sec.steep ? ', dik kısım var (en dik ' + pct(sec.steepMax) + ')' : '') + '</div>';
    var end = Math.min(K.N - 1, d.idx + 120);
    var up = K.gain[end] - K.gain[d.idx], dn = K.loss[end] - K.loss[d.idx], mx = 0;
    for (var i = d.idx; i <= end; i++) if (Math.abs(K.grade[i]) > Math.abs(mx)) mx = K.grade[i];
    out += '<div class="rline">Önümüzdeki 3 km: +' + f(up, 0) + ' m, −' + f(dn, 0) + ' m, en dik ' + (mx >= 0 ? 'çıkış ' : 'iniş ') + pct(mx) + '</div>';
    var ahead = P.steep.filter(function (s) { return s.a >= d.idx && s.a - d.idx <= 120; })[0];
    if (ahead) out += '<div class="rline steepnote">Dik ' + (ahead.up ? 'çıkış' : 'iniş') + ' ' + f((K.dist[ahead.a] - K.dist[d.idx]) / 1000, 1) + ' km sonra (en dik ' + pct(ahead.max) + ')</div>';
    return out;
  }

  // Noktada "burada al" listesi: yenecekler, su ve sonraki bölüm için jel/tablet
  function hereCard(d) {
    var n = race.nut; if (!n || d.done) return null;
    var row = n.rows[d.nextCi]; if (!row) return null;
    var title = d.lastCi >= 0 ? cps[d.lastCi].name + ': burada' : 'Start: yanına al';
    var c = hh('section', 'card herecard'); c.appendChild(hh('h2', '', esc(title)));
    var out = '';
    if (d.lastCi >= 0) {
      var meal = n.meals[d.lastCi] || [];
      out += '<div class="rline"><b>Ye:</b> ' + (meal.length ? esc(meal.map(function (m) { return m.n + ' ' + m.name.toLocaleLowerCase('tr-TR'); }).join(', ')) : 'planlı yiyecek yok') + '</div>';
    }
    var ex = row.extraMl > 0;
    out += '<div class="rline"><b>' + (d.lastCi >= 0 ? 'Doldur' : 'Suluklar') + ':</b> sonraki bölüm için ' + f(row.needL, 2) + ' L (' + f(row.hours, 1) + ' saat), taşıyabildiğin ' + f(n.capL, 2) + ' L' +
      (ex ? ' <span class="flag">+' + row.extraMl + ' mL eksik</span>' : '') + '</div>';
    var take = [];
    if (n.gel && row.gels) take.push(row.gels + ' jel');
    if (n.tab && row.tabs) take.push(row.tabs + ' tablet (her biri ' + n.tabVol + ' mL suya)');
    if (n.salt && row.salts) take.push(row.salts + ' tuz tableti');
    out += '<div class="rline"><b>Yanına al:</b> ' + (take.length ? esc(take.join(', ')) : 'ürün seçilmemiş (Beslenme sekmesi)') + '</div>';
    if (n.sched) {
      var sd = n.sched, rule = [];
      rule.push('flask başına ' + sd.flaskMin + ' dk');
      if (n.gel && sd.gelMin) rule.push('jel her ' + sd.gelMin + ' dk');
      if (n.salt && sd.saltMin) rule.push('tuz tableti her ' + sd.saltMin + ' dk');
      if (n.tab) rule.push(sd.dose === 1 ? 'her flaska 1 tablet' : sd.dose === 0.5 ? 'iki flasktan birine 1 tablet' : 'tablet yok');
      out += '<div class="rline"><b>Takvim:</b> ' + esc(rule.join(', ')) + '</div>';
    }
    out += '<div class="rline"><b>Sonraki:</b> ' + esc(cps[d.nextCi].name) + '</div>';
    c.innerHTML += out;
    return c;
  }

  function viewActive() {
    var d = derive(Date.now());
    var top = hh('div', 'rtop');
    top.appendChild(hh('div', 'rtime', '<span class="rlab">Geçen süre</span><b id="rElapsed">0:00:00</b><span class="rlab" id="rClock"></span>'));
    var menu = hh('button', 'btn small', 'Menü'); menu.type = 'button';
    menu.addEventListener('click', function () { document.body.classList.toggle('navopen'); });
    top.appendChild(menu);
    root.appendChild(top);

    if (race.wake) {
      var wk = hh('button', 'wakebar', ''); wk.type = 'button'; wk.id = 'rWake';
      wk.addEventListener('click', function () { acquireWake(); });
      root.appendChild(wk);
    } else {
      root.appendChild(hh('p', 'note', 'Ekran kendi kapanabilir. Süreyi saatinden takip et; süre burada da doğru işliyor.'));
    }

    if (d.done) { root.appendChild(hh('p', 'warnbox', 'Tüm noktalar kaydedildi.')); }
    else {
      var kp = hh('section', 'kpis');
      kp.appendChild(hh('div', 'kpi', '<span class="rlab">Plana göre</span><b id="rDelta">--</b><span class="rsub" id="rDeltaLbl"></span>'));
      kp.appendChild(hh('div', 'kpi', '<span class="rlab" id="rCutName">Sonraki kesim</span><b id="rCutLeft">--</b><span class="rsub" id="rCutAt"></span>'));
      kp.appendChild(hh('div', 'kpi wide', '<span class="rlab">Tahmini kesim payı</span><b id="rBuf">--</b><span class="rsub" id="rStatus"></span>'));
      root.appendChild(kp);

      var here = hereCard(d); if (here) root.appendChild(here);
      var info = hh('section', 'card'); info.id = 'rInfo'; info.innerHTML = nextInfoHtml(d); root.appendChild(info);
    }
    var loc = hh('section', 'card');
    var lb = hh('button', 'btn wide', 'Konumumu göster'); lb.type = 'button'; lb.addEventListener('click', locate);
    loc.appendChild(lb);
    if (locMsg) loc.appendChild(hh('p', 'locmsg ' + locMsg.cls, esc(locMsg.text)));
    else if (race.fix) {
      var fx = race.fix, ageMin = Math.max(0, Math.round((Date.now() - fx.ts) / 60000));
      var off = fx.off > 150;
      loc.appendChild(hh('p', 'locmsg ' + (off ? 'bad' : 'ok'),
        (off ? '✕ Rotadan ' + (fx.off >= 1000 ? f(fx.off / 1000, 1) + ' km' : Math.round(fx.off) + ' m') + ' uzaktasın' : '✓ Rotadasın (' + Math.round(fx.off) + ' m)') +
        '. Parkurda km ' + f(K.dist[fx.idx] / 1000, 1) + ', ' + (ageMin ? ageMin + ' dk önce' : 'şimdi') + ', GPS ±' + fx.acc + ' m.'));
    }
    root.appendChild(loc);

    // log list
    var lg = hh('section', 'card');
    lg.appendChild(hh('h2', '', 'Kayıtlar'));
    if (!race.logs.length) lg.appendChild(hh('p', 'note', 'Henüz nokta kaydı yok. Bir noktaya vardığında alttaki büyük butona dokun.'));
    else {
      var rows = '';
      race.logs.forEach(function (l) {
        var act = (l.ts - race.startTs) / 60000, plan = race.snap.cp[l.ci].arr, dl = act - plan;
        rows += '<tr><td><b>' + esc(cps[l.ci].name) + '</b><div class="sub2">saat ' + clockOf(l.ts) + '</div></td><td class="r"><b>' + hm(act) + '</b><div class="sub2">plan ' + hm(plan) + '</div></td>' +
          '<td class="r"><span class="pay ' + (dl > 1 ? 'warn' : dl < -1 ? 'ok' : '') + '">' + (dl > 0.5 ? '+' : dl < -0.5 ? '−' : '') + Math.round(Math.abs(dl)) + ' dk</span><div class="sub2">' + (dl > 0.5 ? 'geride' : dl < -0.5 ? 'önde' : 'plana uygun') + '</div></td></tr>';
      });
      lg.appendChild(hh('div', 'tablewrap', '<table class="plantable"><thead><tr><th>Nokta</th><th class="r">Süre</th><th class="r">Fark</th></tr></thead><tbody>' + rows + '</tbody></table>'));
    }
    root.appendChild(lg);

    var end = hh('button', 'btn wide', 'Yarışı sıfırla'); end.type = 'button';
    twoTap(end, 'Yarışı sıfırla', resetRace);
    root.appendChild(end);

    // big thumb button + toast
    var toast = hh('div', 'rtoast'); toast.id = 'rToast'; toast.hidden = true; root.appendChild(toast);
    if (!d.done) {
      var big = hh('button', 'bigbtn', ''); big.type = 'button'; big.id = 'rBig';
      big.addEventListener('click', logCp);
      root.appendChild(big);
    }
    paintWake(); tick();
    if (undoInfo) showToast();
  }

  function viewEnded() {
    root.appendChild(hh('h2', 'tabtitle', 'Yarış bitti'));
    var total = (race.endTs - race.startTs) / 60000, plan = race.snap.finish, dl = total - plan;
    root.appendChild(hh('section', 'card', '<div class="kpi wide"><span class="rlab">Toplam süre</span><b>' + hms((race.endTs - race.startTs) / 1000) + '</b><span class="rsub">Plan ' + hm(plan) + ' (' + race.sc + '), ' + (dl > 0.5 ? Math.round(dl) + ' dk fazla' : dl < -0.5 ? Math.round(-dl) + ' dk az' : 'plana uygun') + '</span></div>'));
    var rows = '';
    race.logs.forEach(function (l) {
      var act = (l.ts - race.startTs) / 60000, p = race.snap.cp[l.ci].arr, x = act - p, buf = cps[l.ci].cut * 60 - act;
      rows += '<tr><td><b>' + esc(cps[l.ci].name) + '</b><div class="sub2">saat ' + clockOf(l.ts) + '</div></td><td class="r"><b>' + hm(act) + '</b><div class="sub2">plan ' + hm(p) + '</div></td><td class="r"><b>' + (x > 0.5 ? '+' : x < -0.5 ? '−' : '') + Math.round(Math.abs(x)) + ' dk</b><div class="sub2">kesim payı ' + Math.round(buf) + ' dk</div></td></tr>';
    });
    root.appendChild(hh('section', 'card', '<h2>Noktalar</h2><div class="tablewrap"><table class="plantable"><thead><tr><th>Nokta</th><th class="r">Süre</th><th class="r">Plana göre</th></tr></thead><tbody>' + rows + '</tbody></table></div>'));
    var u = hh('button', 'btn wide', 'Son kaydı geri al'); u.type = 'button'; u.addEventListener('click', undo); root.appendChild(u);
    var nb = hh('button', 'btn wide', 'Yeni yarış kur'); nb.type = 'button'; twoTap(nb, 'Yeni yarış kur', resetRace); root.appendChild(nb);
  }

  function render() {
    root.textContent = '';
    if (!race) viewSetup(); else if (race.ended) viewEnded(); else viewActive();
  }

  /* ---------- per-second update ---------- */
  function setT(id, text, cls) { var e = $(id); if (!e) return; e.textContent = text; if (cls !== undefined) e.className = cls; }
  function tick() {
    if (!onRaceTab || !active()) return;
    var now = Date.now(), d = derive(now);
    var el = (now - race.startTs) / 1000;
    var pre = el < 0;
    setT('rElapsed', pre ? 'Başlangıca ' + hms(-el) : hms(el));
    setT('rClock', 'Saat ' + clockOf(now) + ', plan ' + race.sc);
    if (d.done) return;
    var big = $('rBig');
    if (big) { big.disabled = pre; big.textContent = pre ? 'Başlangıç bekleniyor' : 'CP\'ye vardım: ' + cps[d.nextCi].name; }
    // delta
    var dl = d.delta;
    if (dl === null) { setT('rDelta', '--'); setT('rDeltaLbl', 'ilk noktada belli olur'); }
    else {
      var r = Math.round(dl);
      setT('rDelta', (r > 0 ? '+' : r < 0 ? '−' : '') + Math.abs(r) + ' dk');
      setT('rDeltaLbl', (r > 0 ? 'geride' : r < 0 ? 'önde' : 'plana uygun') + ', ' + d.src);
    }
    setT('rCutName', cps[d.nextCi].name + ' kesimine kalan');
    var left = d.cutLeft * 60;
    setT('rCutLeft', left >= 0 ? hms(left) : 'Süre doldu');
    setT('rCutAt', 'kesim ' + hm(cps[d.nextCi].cut * 60) + ' (saat ' + clockOf(race.startTs + cps[d.nextCi].cut * 3600000) + ')');
    var sx = status(d.buf);
    setT('rBuf', (d.buf < 0 ? '−' : '') + Math.round(Math.abs(d.buf)) + ' dk');
    var st = $('rStatus'); if (st) { st.textContent = sx.icon + ' ' + sx.text; st.className = 'rsub ' + sx.cls; }
    var kb = $('rBuf'); if (kb) kb.className = sx.cls;
  }
  setInterval(tick, 1000);
  document.addEventListener('visibilitychange', function () { if (document.visibilityState === 'visible' && onRaceTab) { if (race && !race.ended) { render(); } } });

  /* ---------- tab hook ---------- */
  function onTab(name) {
    onRaceTab = (name === 'race');
    if (onRaceTab) render();
    syncBody();
  }

  K.race = { onTab: onTab, render: render, state: function () { return race; } };
  // finish initial sync: if a race is running, open the race tab
  if (active()) { K.showTab('race'); if (race.wake) acquireWake(); }
  else onTab(K.store('k63tab'));
})();
