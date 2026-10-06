(function () {
  'use strict';
  var BUILD = '0.16-test-1';
  var C = window.COURSE;
  var N = C.n, STEP = C.step, TOTAL = C.total, K = C.k;
  var ele = C.ele;

  /* ---------- course arrays ---------- */
  var dist = new Array(N);
  for (var i = 0; i < N; i++) dist[i] = Math.min(i * STEP, TOTAL);
  dist[N - 1] = TOTAL;

  var grade = new Array(N);
  for (i = 0; i < N; i++) {
    var a = Math.max(0, i - 2), b = Math.min(N - 1, i + 2);
    var d = dist[b] - dist[a];
    grade[i] = d > 0 ? (ele[b] - ele[a]) / d * 100 : 0;
  }
  var gain = new Array(N), loss = new Array(N);
  gain[0] = 0; loss[0] = 0;
  for (i = 1; i < N; i++) {
    var dd = ele[i] - ele[i - 1];
    gain[i] = gain[i - 1] + (dd > 0 ? dd * K : 0);
    loss[i] = loss[i - 1] + (dd < 0 ? -dd * K : 0);
  }
  function idxAtKm(km) { return Math.max(0, Math.min(N - 1, Math.round(km * 1000 / STEP))); }
  var cps = C.cps.map(function (c) {
    return { id: c.id, name: c.name, km: c.km, cut: c.cut, idx: idxAtKm(c.km) };
  });

  /* ---------- formatting ---------- */
  function f(n, dec) {
    return n.toLocaleString('tr-TR', { minimumFractionDigits: dec, maximumFractionDigits: dec });
  }
  function signed(n, dec) {
    var s = f(Math.abs(n), dec);
    if (n > 0.05) return '+' + s;
    if (n < -0.05) return '-' + s;
    return f(0, dec);
  }
  function hhmm(hours) {
    var totalMin = Math.round(hours * 60);
    var h = Math.floor(totalMin / 60) % 24, m = totalMin % 60;
    return (h < 10 ? '0' : '') + h + ':' + (m < 10 ? '0' : '') + m;
  }
  function $(id) { return document.getElementById(id); }
  function store(k, v) { try { if (v === undefined) return localStorage.getItem(k); localStorage.setItem(k, v); } catch (e) { return null; } }

  /* ---------- theme ---------- */
  var themes = ['system', 'light', 'dark'];
  var themeNames = { system: 'sistem', light: 'açık', dark: 'koyu' };
  var theme = store('k63theme');
  if (themes.indexOf(theme) < 0) theme = 'system';
  function applyTheme() {
    var root = document.documentElement;
    if (theme === 'system') root.removeAttribute('data-theme'); else root.setAttribute('data-theme', theme);
    $('themeBtn').textContent = 'Tema: ' + themeNames[theme];
  }
  $('themeBtn').addEventListener('click', function () {
    theme = themes[(themes.indexOf(theme) + 1) % themes.length];
    store('k63theme', theme);
    applyTheme();
  });
  applyTheme();
  $('ver').textContent = BUILD;
  // Netlify dal yayını (ör. test--siteadi.netlify.app) ise test ortamı işareti
  var ENV = /--/.test(location.hostname) ? 'test' : 'ana';
  if (ENV === 'test') { $('envBanner').hidden = false; document.body.classList.add('envtest'); }

  /* ---------- chart ---------- */
  var cur = 0;
  var chartEl = $('chart');
  var svgNS = 'http://www.w3.org/2000/svg';
  var geo = null, cursorLine = null, cursorDot = null;

  function el(name, attrs, parent) {
    var e = document.createElementNS(svgNS, name);
    for (var k in attrs) e.setAttribute(k, attrs[k]);
    if (parent) parent.appendChild(e);
    return e;
  }
  function gradeClass(g) {
    if (g >= 12) return 'g-up2';
    if (g >= 4) return 'g-up1';
    if (g <= -12) return 'g-dn2';
    if (g <= -4) return 'g-dn1';
    return 'g-flat';
  }
  function drawChart() {
    var W = Math.max(280, Math.round(chartEl.clientWidth || 340));
    var H = 220;
    var pl = 38, pr = 10, pt = 22, pb = 24;
    var pw = W - pl - pr, ph = H - pt - pb;
    var mn = Infinity, mx = -Infinity;
    for (var i = 0; i < N; i++) { if (ele[i] < mn) mn = ele[i]; if (ele[i] > mx) mx = ele[i]; }
    var y0 = Math.floor((mn - 10) / 100) * 100, y1 = Math.ceil((mx + 10) / 100) * 100;
    function X(m) { return pl + (m / TOTAL) * pw; }
    function Y(e) { return pt + (1 - (e - y0) / (y1 - y0)) * ph; }
    chartEl.textContent = '';
    var svg = el('svg', { viewBox: '0 0 ' + W + ' ' + H, width: W, height: H }, chartEl);
    geo = { W: W, pl: pl, pw: pw, pt: pt, ph: ph, X: X, Y: Y };

    // y grid + labels
    for (var v = y0; v <= y1; v += 100) {
      el('line', { x1: pl, x2: W - pr, y1: Y(v), y2: Y(v), class: 'g-grid' }, svg);
      var t = el('text', { x: pl - 6, y: Y(v) + 4, 'text-anchor': 'end', class: 'g-axis' }, svg);
      t.textContent = v;
    }
    // x labels
    for (var km = 0; km <= TOTAL / 1000; km += 10) {
      var tx = el('text', { x: X(km * 1000), y: H - 6, 'text-anchor': km === 0 ? 'start' : 'middle', class: 'g-axis' }, svg);
      tx.textContent = km + ' km';
    }
    // area
    var ad = 'M' + X(0) + ' ' + Y(y0);
    for (i = 0; i < N; i++) ad += ' L' + X(dist[i]).toFixed(1) + ' ' + Y(ele[i]).toFixed(1);
    ad += ' L' + X(TOTAL) + ' ' + Y(y0) + ' Z';
    el('path', { d: ad, class: 'g-area' }, svg);
    // grade-colored line, grouped by class
    var start = 0, cls = gradeClass(grade[0]);
    function flush(end) {
      var d = '';
      for (var j = start; j <= end; j++) d += (j === start ? 'M' : 'L') + X(dist[j]).toFixed(1) + ' ' + Y(ele[j]).toFixed(1) + ' ';
      el('path', { d: d, class: 'g-line ' + cls }, svg);
    }
    for (i = 1; i < N; i++) {
      var c2 = gradeClass(grade[i]);
      if (c2 !== cls) { flush(i); start = i; cls = c2; }
    }
    flush(N - 1);
    // checkpoints
    cps.forEach(function (c, n) {
      var x = X(c.km * 1000);
      el('line', { x1: x, x2: x, y1: pt - 4, y2: pt + ph, class: 'g-cp' }, svg);
      var lab = el('text', { x: x, y: 13, 'text-anchor': 'middle', class: 'g-cplabel' }, svg);
      lab.textContent = c.id === 'FIN' ? 'F' : String(n + 1);
    });
    // cursor
    cursorLine = el('line', { x1: 0, x2: 0, y1: pt - 4, y2: pt + ph, class: 'g-cursor' }, svg);
    cursorDot = el('circle', { cx: 0, cy: 0, r: 7, class: 'g-dot' }, svg);
    moveCursor();
  }
  function moveCursor() {
    if (!geo || !cursorLine) return;
    var x = geo.X(dist[cur]);
    cursorLine.setAttribute('x1', x); cursorLine.setAttribute('x2', x);
    cursorDot.setAttribute('cx', x); cursorDot.setAttribute('cy', geo.Y(ele[cur]));
  }

  /* ---------- readout + next checkpoint ---------- */
  function update() {
    var km = dist[cur] / 1000;
    $('rKm').textContent = f(km, 1);
    $('rEle').textContent = f(ele[cur], 0);
    $('rGrade').textContent = signed(grade[cur], 1);
    $('rGain').textContent = f(gain[cur], 0);
    chartEl.setAttribute('aria-label', 'Yükseklik profili, ' + f(km, 1) + ' km, eğim yüzde ' + signed(grade[cur], 1));
    moveCursor();

    var next = null, n = 0;
    for (n = 0; n < cps.length; n++) { if (cps[n].idx > cur) { next = cps[n]; break; } }
    var box = $('nextInfo');
    if (!next) {
      $('nextTitle').textContent = 'Finiş';
      box.innerHTML = '<span>Parkurun sonundasın.</span>';
    } else {
      $('nextTitle').textContent = 'Sonraki: ' + next.name + (next.id === 'FIN' ? '' : ' (' + next.id + ')');
      var remKm = next.km - km;
      var remUp = gain[next.idx] - gain[cur];
      var remDn = loss[next.idx] - loss[cur];
      box.innerHTML =
        '<span>' + f(remKm, 1) + ' km kaldı</span>' +
        '<span>Tırmanış ' + f(remUp, 0) + ' m, iniş ' + f(remDn, 0) + ' m</span>' +
        '<span class="dim">Kesim ' + hhmm(next.cut) + ' (saat ' + hhmm(C.startHour + next.cut) + ')</span>';
    }
    var chips = document.querySelectorAll('.chip');
    Array.prototype.forEach.call(chips, function (c) {
      var ci = Number(c.getAttribute('data-idx'));
      c.setAttribute('aria-pressed', String(Math.abs(ci - cur) <= 2));
    });
  }
  function setIdx(i) { cur = Math.max(0, Math.min(N - 1, i)); update(); }

  function onPointer(ev) {
    if (!geo) return;
    var r = chartEl.getBoundingClientRect();
    var x = ev.clientX - r.left;
    var m = (x - geo.pl) / geo.pw * TOTAL;
    setIdx(Math.round(m / STEP));
  }
  var dragging = false;
  chartEl.addEventListener('pointerdown', function (ev) {
    dragging = true;
    try { chartEl.setPointerCapture(ev.pointerId); } catch (e) {}
    onPointer(ev);
  });
  chartEl.addEventListener('pointermove', function (ev) { if (dragging) onPointer(ev); });
  function stopDrag() { dragging = false; }
  chartEl.addEventListener('pointerup', stopDrag);
  chartEl.addEventListener('pointercancel', stopDrag);

  $('back').addEventListener('click', function () { setIdx(cur - Math.round(500 / STEP)); });
  $('fwd').addEventListener('click', function () { setIdx(cur + Math.round(500 / STEP)); });

  // chips
  var chipBox = $('chips');
  function addChip(label, idx) {
    var b = document.createElement('button');
    b.type = 'button'; b.className = 'chip'; b.textContent = label;
    b.setAttribute('data-idx', String(idx));
    b.setAttribute('aria-pressed', 'false');
    b.addEventListener('click', function () { setIdx(idx); });
    chipBox.appendChild(b);
  }
  addChip('Start', 0);
  cps.forEach(function (c, n) { addChip(c.id === 'FIN' ? 'Finiş' : 'CP' + (n + 1), c.idx); });

  // table
  var rows = $('cpRows');
  cps.forEach(function (c, n) {
    var tr = document.createElement('tr');
    tr.innerHTML = '<td>' + c.name + '</td><td class="r">' + f(c.km, 1) + '</td><td class="r">' + hhmm(c.cut) + '</td><td class="r">' + hhmm(C.startHour + c.cut) + '</td>';
    rows.appendChild(tr);
  });

  /* ---------- tests ---------- */
  function setSt(id, text, cls) { var e = $(id); e.textContent = text; e.className = 'st' + (cls ? ' ' + cls : ''); }
  function mmss(ms) { var t = Math.max(0, Math.round(ms / 1000)); var m = Math.floor(t / 60), s = t % 60; return m + ':' + (s < 10 ? '0' : '') + s; }

  // connection
  function netStatus() { if (navigator.onLine) setSt('tNet', 'Çevrimiçi', 'ok'); else setSt('tNet', 'Çevrimdışı (uygulama yine de açıldı)', 'ok'); }
  window.addEventListener('online', netStatus);
  window.addEventListener('offline', netStatus);
  netStatus();

  // standalone
  var standalone = (window.matchMedia && window.matchMedia('(display-mode: standalone)').matches) || window.navigator.standalone === true;
  if (standalone) setSt('tStand', 'Evet', 'ok'); else setSt('tStand', 'Hayır, tarayıcıda açık. Ana ekrana ekleyip oradan aç.', 'warn');

  // service worker + cache
  var EXPECTED = 17;
  function checkCache(tries) {
    if (!('caches' in window)) { setSt('tCache', 'Bu tarayıcıda desteklenmiyor', 'bad'); return; }
    caches.keys().then(function (keys) {
      var mine = keys.filter(function (k) { return k.indexOf('k63-') === 0; });
      if (!mine.length) return Promise.resolve(0);
      return caches.open(mine[mine.length - 1]).then(function (c) { return c.keys(); }).then(function (r) { return r.length; });
    }).then(function (count) {
      if (count >= EXPECTED) setSt('tCache', 'Hazır, ' + count + ' dosya kayıtlı', 'ok');
      else if (tries > 0) { setSt('tCache', 'Hazırlanıyor, bekle', 'warn'); setTimeout(function () { checkCache(tries - 1); }, 1500); }
      else setSt('tCache', 'Eksik: ' + count + ' / ' + EXPECTED + ' dosya', 'bad');
    }).catch(function () { setSt('tCache', 'Kontrol edilemedi', 'bad'); });
  }
  if ('serviceWorker' in navigator) {
    var hadController = !!navigator.serviceWorker.controller;
    navigator.serviceWorker.register('sw.js').then(function () {
      return navigator.serviceWorker.ready;
    }).then(function () { checkCache(8); })
      .catch(function (e) { setSt('tCache', 'Kaydedilemedi: ' + (e && e.name ? e.name : 'hata'), 'bad'); });
    navigator.serviceWorker.addEventListener('controllerchange', function () {
      if (hadController) $('update').hidden = false;
      hadController = true;
    });
    $('updateBtn').addEventListener('click', function () { location.reload(); });
  } else {
    setSt('tCache', 'Bu tarayıcıda desteklenmiyor', 'bad');
  }

  /* ----- screen-on tracking (shared by both methods) ----- */
  // Counts how many times the page was hidden (screen turned off or app switched) while a method is on.
  var track = { sys: null, vid: null };
  function newTrack() { return { start: Date.now(), hidden: 0, firstHiddenAt: null, lastHiddenAt: null, events: [] }; }
  document.addEventListener('visibilitychange', function () {
    ['sys', 'vid'].forEach(function (k) {
      var t = track[k]; if (!t) return;
      if (document.visibilityState === 'hidden') {
        t.hidden += 1; t.lastHiddenAt = Date.now();
        if (t.firstHiddenAt === null) t.firstHiddenAt = Date.now() - t.start;
      }
    });
  });
  function trackText(t) {
    if (!t) return '';
    var s = 'Açık kalma süresi: ' + mmss(Date.now() - t.start) + '. Sayfa gizlendi: ' + t.hidden + ' kez';
    if (t.firstHiddenAt !== null) s += ' (ilk olarak ' + mmss(t.firstHiddenAt) + ' sonra)';
    return s + '.';
  }
  setInterval(function () {
    if (track.sys) $('wakeDetail').textContent = trackText(track.sys);
    if (track.vid) $('vidDetail').textContent = trackText(track.vid);
  }, 1000);

  /* ----- method 1: Screen Wake Lock API ----- */
  var wakeLock = null, wakeWanted = false, wakeReleases = 0;
  if (!('wakeLock' in navigator)) {
    setSt('tWake', 'Bu tarayıcıda desteklenmiyor', 'bad');
    $('wakeBtn').disabled = true;
  }
  function acquireWake() {
    return navigator.wakeLock.request('screen').then(function (l) {
      wakeLock = l;
      setSt('tWake', 'Açık (sistem onayladı)', 'ok'); $('wakeBtn').textContent = 'Kapat';
      l.addEventListener('release', function () {
        wakeReleases += 1;
        if (wakeWanted) setSt('tWake', 'Sistem kapattı (' + wakeReleases + '. kez). Sayfa gizlendiyse ekran kapanmıştır.', 'warn');
      });
    }).catch(function (e) {
      wakeWanted = false; track.sys = null;
      setSt('tWake', 'Açılamadı: ' + (e && e.name ? e.name : 'hata') + (e && e.message ? ' (' + e.message + ')' : ''), 'bad');
      $('wakeBtn').textContent = 'Aç';
    });
  }
  $('wakeBtn').addEventListener('click', function () {
    if (wakeWanted) {
      wakeWanted = false; track.sys = null;
      if (wakeLock) wakeLock.release();
      wakeLock = null; setSt('tWake', 'Kapalı'); $('wakeBtn').textContent = 'Aç'; $('wakeDetail').textContent = '';
    } else { wakeWanted = true; track.sys = newTrack(); wakeReleases = 0; acquireWake(); }
  });
  document.addEventListener('visibilitychange', function () {
    if (document.visibilityState === 'visible' && wakeWanted && 'wakeLock' in navigator) acquireWake();
  });

  /* ----- method 2: hidden looping video ----- */
  var vidEl = null;
  function makeVideo() {
    var v = document.createElement('video');
    v.setAttribute('playsinline', ''); v.setAttribute('muted', ''); v.muted = true; v.loop = true;
    v.setAttribute('title', 'ekran'); v.setAttribute('aria-hidden', 'true');
    v.style.cssText = 'position:fixed;right:0;bottom:0;width:64px;height:64px;opacity:0.02;pointer-events:none;z-index:-1;';
    var a = document.createElement('source'); a.src = window.NOSLEEP_WEBM; a.type = 'video/webm';
    var b = document.createElement('source'); b.src = window.NOSLEEP_MP4; b.type = 'video/mp4';
    v.appendChild(a); v.appendChild(b);
    document.body.appendChild(v);
    return v;
  }
  function stopVideo() {
    if (vidEl) { try { vidEl.pause(); } catch (e) {} if (vidEl.parentNode) vidEl.parentNode.removeChild(vidEl); vidEl = null; }
    track.vid = null; setSt('tVid', 'Kapalı'); $('vidBtn').textContent = 'Aç'; $('vidDetail').textContent = '';
  }
  $('vidBtn').addEventListener('click', function () {
    if (vidEl) { stopVideo(); return; }
    vidEl = makeVideo();
    var p = vidEl.play();
    var okFn = function () { track.vid = newTrack(); setSt('tVid', 'Açık (video oynuyor)', 'ok'); $('vidBtn').textContent = 'Kapat'; };
    if (p && p.then) p.then(okFn).catch(function (e) { stopVideo(); setSt('tVid', 'Açılamadı: ' + (e && e.name ? e.name : 'hata'), 'bad'); });
    else okFn();
  });
  document.addEventListener('visibilitychange', function () {
    // video usually pauses when the page is hidden; restart when visible again
    if (document.visibilityState === 'visible' && vidEl && vidEl.paused) { var p = vidEl.play(); if (p && p.catch) p.catch(function () {}); }
  });

  /* ----- vibration ----- */
  $('vibBtn').addEventListener('click', function () {
    if (!navigator.vibrate) { setSt('tVib', 'Bu cihazda desteklenmiyor. Görsel ve sesli uyarı kullanılacak.', 'warn'); return; }
    var ok = navigator.vibrate(600);
    setSt('tVib', ok ? 'Komut kabul edildi (600 ms). Hissettin mi?' : 'Komut reddedildi', ok ? 'ok' : 'bad');
  });

  /* ----- sound ----- */
  var actx = null;
  $('sndBtn').addEventListener('click', function () {
    try {
      if (navigator.audioSession) navigator.audioSession.type = 'playback';
      var AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) { setSt('tSnd', 'Bu tarayıcıda desteklenmiyor', 'bad'); return; }
      if (!actx) actx = new AC();
      var go = function () {
        var t0 = actx.currentTime + 0.05;
        [0, 0.45].forEach(function (off) {
          var o = actx.createOscillator(), g = actx.createGain();
          o.type = 'sine'; o.frequency.value = 880;
          g.gain.setValueAtTime(0.0001, t0 + off);
          g.gain.exponentialRampToValueAtTime(0.6, t0 + off + 0.03);
          g.gain.exponentialRampToValueAtTime(0.0001, t0 + off + 0.35);
          o.connect(g); g.connect(actx.destination);
          o.start(t0 + off); o.stop(t0 + off + 0.4);
        });
        setSt('tSnd', 'Çalındı (' + actx.state + '). Duydun mu? Duymadıysan medya sesini aç.', 'ok');
      };
      if (actx.state === 'suspended') actx.resume().then(go); else go();
    } catch (e) { setSt('tSnd', 'Çalınamadı: ' + (e && e.name ? e.name : 'hata'), 'bad'); }
  });

  /* ----- location ----- */
  function nearest(lat, lon) {
    var cosLat = Math.cos(lat * Math.PI / 180), best = 0, bd = Infinity;
    for (var i = 0; i < N; i++) {
      var dy = (C.lat[i] - lat) * 111320, dx = (C.lon[i] - lon) * 111320 * cosLat;
      var d2 = dx * dx + dy * dy;
      if (d2 < bd) { bd = d2; best = i; }
    }
    return { idx: best, m: Math.sqrt(bd) };
  }
  function fmtDist(m) { return m >= 1000 ? f(m / 1000, 1) + ' km' : f(Math.round(m), 0) + ' m'; }
  $('locBtn').addEventListener('click', function () {
    var box = $('locDetail');
    if (!navigator.geolocation) { setSt('tLoc', 'Bu tarayıcıda desteklenmiyor', 'bad'); return; }
    setSt('tLoc', 'Konum alınıyor, bekle', 'warn'); box.hidden = true;
    navigator.geolocation.getCurrentPosition(function (p) {
      var r = nearest(p.coords.latitude, p.coords.longitude);
      var acc = Math.round(p.coords.accuracy || 0);
      var off = r.m > 150;
      setSt('tLoc', off ? 'Parkurdan uzakta' : 'Parkurda', off ? 'warn' : 'ok');
      box.hidden = false;
      box.textContent = 'Parkura en yakın nokta: ' + f(dist[r.idx] / 1000, 1) + ' km. Parkura uzaklık: ' + fmtDist(r.m) + ' (GPS doğruluğu ±' + acc + ' m).';
      if (r.m < 3000) setIdx(r.idx);
    }, function (e) {
      var msg = e && e.code === 1 ? 'Konum izni verilmedi. Tarayıcı ayarlarından izin ver.' :
                e && e.code === 3 ? 'Konum zamanında alınamadı. Açık alanda tekrar dene.' : 'Konum alınamadı.';
      setSt('tLoc', msg, 'bad');
    }, { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 });
  });

  /* ----- report ----- */
  $('reportBtn').addEventListener('click', function () {
    var lines = [
      'Sürüm: ' + BUILD + ', ortam: ' + ENV + ' (' + location.hostname + ')',
      'Tarayıcı: ' + navigator.userAgent,
      'Önbellek: ' + $('tCache').textContent,
      'Bağlantı: ' + $('tNet').textContent,
      'Ana ekrandan açıldı: ' + $('tStand').textContent,
      'Ekran açık, yöntem 1: ' + $('tWake').textContent + ' | ' + $('wakeDetail').textContent,
      'Ekran açık, yöntem 2: ' + $('tVid').textContent + ' | ' + $('vidDetail').textContent,
      'Titreşim: ' + $('tVib').textContent,
      'Ses: ' + $('tSnd').textContent,
      'Konum: ' + $('tLoc').textContent + (($('locDetail').hidden) ? '' : ' | ' + $('locDetail').textContent)
    ];
    // plan ve beslenme verileri (doğrulama için)
    try {
      var K = window.K63;
      if (K && K.plan) {
        var ps = K.plan.state();
        ['A', 'B', 'C'].forEach(function (k) {
          var sc = ps.sc[k], r = K.plan.compute(sc);
          lines.push('Plan ' + k + ': mod ' + sc.mode + ', hedef ' + sc.target + ' dk, yavaşlama %' + sc.fat + ', durmalar ' + sc.stops.join('+') + ' dk, bitiş ' + (r.valid ? Math.round(r.finish) + ' dk' : 'geçersiz') + ', hareket ' + (r.valid ? Math.round(r.M) + ' dk' : '-') + ', efor ' + (r.valid ? r.E.toFixed(2) : '-'));
        });
        lines.push('Plan ayarları: seçili ' + ps.sel + ', tırmanış ağırlığı ' + ps.wUp + ', iniş ağırlığı ' + ps.wDn + ', ayrıntı ' + ps.level);
      }
      if (K && K.nutrition) {
        var b = K.nutrition.breakdown(), ns = K.nutrition.state();
        lines.push('Beslenme girdileri: ' + ns.kg + ' kg, terleme ' + ns.sweat + ', ter tuzluluğu ' + ns.salty + ', ' + ns.temp + ' °C, suluk ' + ns.flaskN + 'x' + ns.flaskMl + ', en fazla jel ' + ns.maxGels + ', kafein ' + ns.caf + ', sağlık işareti ' + ns.health + ', plan ' + b.key);
        lines.push('Beslenme hesabı: bitiş ' + Math.round(b.finish) + ' dk, hareket ' + Math.round(b.M) + ' dk, hız ' + b.speed.toFixed(3) + ', tempo ç. ' + b.intF.toFixed(3) + ', terleme ç. ' + b.sweatF + ', sıcaklık ç. ' + b.tempF + ', beden ç. ' + b.kgF.toFixed(3) + ', ham sıvı ' + b.raw.toFixed(1) + ' => sıvı ' + b.fluid + ', ter tuzluluğu ' + b.conc + ' mg/L => sodyum ' + b.na + ', karbonhidrat ' + b.carb + ', kafein sınırı ' + b.cafCap);
      }
    } catch (e) { lines.push('Plan/beslenme verisi alınamadı: ' + e.message); }
    if (window.K63 && window.K63.lastSelfTest) { var ls = window.K63.lastSelfTest; lines.push('Kendini sına: ' + ls.passed + ' / ' + ls.items.length + ' geçti' + (ls.cacheOk === null ? '' : ', önbellek ' + (ls.cacheOk ? 'tamam' : 'SORUNLU')) + (ls.passed < ls.items.length ? ' | kalanlar: ' + ls.items.filter(function (r) { return !r.ok; }).map(function (r) { return r.name; }).join('; ') : '')); }
    var text = lines.join('\n');
    var box = $('report'); box.value = text; box.hidden = false;
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(function () { $('reportBtn').textContent = 'Kopyalandı, sohbete yapıştır'; },
        function () { $('reportBtn').textContent = 'Metni seçip kopyala'; box.select(); });
    } else { $('reportBtn').textContent = 'Metni seçip kopyala'; box.select(); }
  });

  /* ---------- start ---------- */
  var resizeT = null;
  window.addEventListener('resize', function () { clearTimeout(resizeT); resizeT = setTimeout(drawChart, 120); });
  drawChart();
  update();
  window.K63 = { ENV: ENV, BUILD: BUILD, EXPECTED: EXPECTED, ele: ele, grade: grade, C: C, N: N, STEP: STEP, TOTAL: TOTAL, dist: dist, gain: gain, loss: loss, cps: cps, f: f, hhmm: hhmm, $: $, store: store, drawChart: drawChart, update: update };
})();
