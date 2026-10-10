/* 3B arazi görünümü (Profil sekmesi, "2B | 3B" anahtarı).
   Veri uygulamaya gömülü: terrain.bin (Copernicus GLO-30 yükseklik), terrain.jpg (Sentinel-2 görüntü),
   trails.json (OpenStreetMap yolları); üretimi tools/3b/uret.py. İnternet gerekmez.
   Kütüphane yok, el yazımı WebGL 1. Çizim yalnızca etkileşimde yapılır (sürekli döngü yok, pil için). */
(function () {
  'use strict';
  var K = window.K63, C = K.C, N = K.N, $ = K.$;
  var EXAG = 1.5;          // yükseklik abartısı
  var LIFT = 4;            // çizgiler araziden bu kadar metre yukarıda (araziye gömülmesin)
  var FOVY = 32 * Math.PI / 180;
  var TILT0 = 55 * Math.PI / 180, TILT_MIN = 12 * Math.PI / 180, TILT_MAX = 88 * Math.PI / 180;
  var COURSE_RGB = [0.14, 0.29, 0.91];   // #2449E8; görüntü temayla değişmediği için sabit

  /* ---------- veri çözme (WebGL gerektirmez; kendini sına bunları dener) ---------- */
  // terrain.bin: int32 x 8 (sihir 'K63T', sürüm, w, h, taban dm, ...), float64 x 4 (lat0, lat1, lon0, lon1), uint16 x w*h (kuzeyden güneye)
  function parseTerrain(buf) {
    var hd = new Int32Array(buf, 0, 8);
    if (hd[0] !== 0x5433364B || hd[1] !== 1) throw new Error('arazi dosyası tanınmadı');
    var w = hd[2], h = hd[3], bb = new Float64Array(buf, 32, 4);
    if (buf.byteLength !== 64 + w * h * 2) throw new Error('arazi dosyası eksik');
    var T = { w: w, h: h, base: hd[4] / 10, q: new Uint16Array(buf, 64, w * h), lat0: bb[0], lat1: bb[1], lon0: bb[2], lon1: bb[3] };
    T.ky = 110574; T.kx = 111320 * Math.cos((T.lat0 + T.lat1) / 2 * Math.PI / 180);
    T.W = (T.lon1 - T.lon0) * T.kx; T.H = (T.lat1 - T.lat0) * T.ky;   // metre
    return T;
  }
  // ızgara koordinatında (fx sütun, fy satır) rakım, metre; çift doğrusal ara değer
  function sample(T, fx, fy) {
    fx = Math.max(0, Math.min(T.w - 1, fx)); fy = Math.max(0, Math.min(T.h - 1, fy));
    var x0 = Math.min(T.w - 2, Math.floor(fx)), y0 = Math.min(T.h - 2, Math.floor(fy)), tx = fx - x0, ty = fy - y0, q = T.q, i = y0 * T.w + x0;
    return T.base + ((q[i] * (1 - tx) + q[i + 1] * tx) * (1 - ty) + (q[i + T.w] * (1 - tx) + q[i + T.w + 1] * tx) * ty) / 10;
  }
  function heightAt(T, lat, lon) {
    return sample(T, (lon - T.lon0) / (T.lon1 - T.lon0) * (T.w - 1), (T.lat1 - lat) / (T.lat1 - T.lat0) * (T.h - 1));
  }
  // dünya koordinatı: x doğu, z güney (metre, kutu merkezi 0), y = (rakım - taban) * EXAG
  function wx(T, lon) { return ((lon - T.lon0) / (T.lon1 - T.lon0) - 0.5) * T.W; }
  function wz(T, lat) { return ((T.lat1 - lat) / (T.lat1 - T.lat0) - 0.5) * T.H; }
  function wy(T, x, z) { return (sample(T, (x / T.W + 0.5) * (T.w - 1), (z / T.H + 0.5) * (T.h - 1)) - T.base) * EXAG; }
  // trails.json: her yol [tür, x0, y0, dx1, dy1, ...]; x batıdan doğuya, y güneyden kuzeye, 0-65535
  function decodeTrails(j) {
    return j.yollar.map(function (r) {
      var x = r[1], y = r[2], p = [x / 65535, y / 65535];
      for (var i = 3; i < r.length; i += 2) { x += r[i]; y += r[i + 1]; p.push(x / 65535, y / 65535); }
      return { t: r[0], p: p };
    });
  }

  /* ---------- matris ---------- */
  function perspective(fovy, aspect, near, far) {
    var f = 1 / Math.tan(fovy / 2), nf = 1 / (near - far);
    return [f / aspect, 0, 0, 0, 0, f, 0, 0, 0, 0, (far + near) * nf, -1, 0, 0, 2 * far * near * nf, 0];
  }
  function lookAt(e, t) {
    var zx = e[0] - t[0], zy = e[1] - t[1], zz = e[2] - t[2], l = Math.sqrt(zx * zx + zy * zy + zz * zz);
    zx /= l; zy /= l; zz /= l;
    var xx = zz, xz = -zx; l = Math.sqrt(xx * xx + xz * xz) || 1; xx /= l; xz /= l;   // x = yukarı(0,1,0) × z
    var yx = zy * xz, yy = zz * xx - zx * xz, yz = -zy * xx;                            // y = z × x
    return [xx, yx, zx, 0, 0, yy, zy, 0, xz, yz, zz, 0, -(xx * e[0] + xz * e[2]), -(yx * e[0] + yy * e[1] + yz * e[2]), -(zx * e[0] + zy * e[1] + zz * e[2]), 1];
  }
  function mul(a, b) {
    var o = new Array(16);
    for (var c = 0; c < 4; c++) for (var r = 0; r < 4; r++)
      o[c * 4 + r] = a[r] * b[c * 4] + a[4 + r] * b[c * 4 + 1] + a[8 + r] * b[c * 4 + 2] + a[12 + r] * b[c * 4 + 3];
    return o;
  }
  // kamera: hedef noktanın çevresinde yörünge; az = 0 iken kamera güneyde, kuzeye bakar
  function eyeOf(cam) {
    var ct = Math.cos(cam.tilt);
    return [cam.tx + cam.dist * ct * Math.sin(cam.az), cam.ty + cam.dist * Math.sin(cam.tilt), cam.tz + cam.dist * ct * Math.cos(cam.az)];
  }
  function nearOf(cam) { return Math.max(20, cam.dist * 0.02); }
  function viewProj(cam, aspect) {
    return mul(perspective(FOVY, aspect, nearOf(cam), cam.dist + 40000), lookAt(eyeOf(cam), [cam.tx, cam.ty, cam.tz]));
  }
  // dünya noktası -> ekran (CSS pikseli); w <= 0 ise kameranın arkasında
  function project(m, x, y, z, W, H) {
    var cw = m[3] * x + m[7] * y + m[11] * z + m[15];
    var cx = m[0] * x + m[4] * y + m[8] * z + m[12], cy = m[1] * x + m[5] * y + m[9] * z + m[13];
    return { x: (cx / cw * 0.5 + 0.5) * W, y: (0.5 - cy / cw * 0.5) * H, w: cw };
  }

  /* ---------- durum ---------- */
  var box = $('map3d'), canvas = $('m3c'), ov = $('m3ov'), msg = $('m3msg');
  var view = K.store('k63profview') === '3' ? '3' : '2';
  var T = null, trails = null, img = null;           // çözülmüş veri
  var gl = null, G = null;                             // WebGL bağlamı ve kaynakları
  var loading = false, failed = false, raf = 0;
  var cam = { tx: 0, ty: 0, tz: 0, az: 0, tilt: TILT0, dist: 1 }, fit = 1, vpW = 0, vpH = 0, dpr = 1, M = null;
  var course = null;                                   // parkur noktaları, dünya koordinatı (x, y, z) x N
  var labels = [], curEl = null;

  function say(text) { msg.textContent = text || ''; msg.hidden = !text; }
  function fail(text) { failed = true; loading = false; canvas.hidden = true; ov.hidden = true; say(text + ' 2B görünüm çalışmaya devam eder.'); }

  /* ---------- yükleme ---------- */
  function load() {
    if (loading || failed || T) return;
    if (!window.fetch) { fail('3B görünüm bu tarayıcıda desteklenmiyor.'); return; }
    loading = true; say('3B görünüm yükleniyor');
    var pT = fetch('terrain.bin').then(function (r) { if (!r.ok) throw new Error('terrain.bin ' + r.status); return r.arrayBuffer(); }).then(parseTerrain);
    var pI = new Promise(function (res, rej) { var im = new Image(); im.onload = function () { res(im); }; im.onerror = function () { rej(new Error('terrain.jpg')); }; im.src = 'terrain.jpg'; });
    // yollar olmadan da harita çizilir
    var pR = fetch('trails.json').then(function (r) { return r.ok ? r.json() : null; }).then(function (j) { return j ? decodeTrails(j) : []; }).catch(function () { return []; });
    Promise.all([pT, pI, pR]).then(function (a) {
      T = a[0]; img = a[1]; trails = a[2]; loading = false;
      course = new Float32Array(N * 3);
      for (var i = 0; i < N; i++) { var x = wx(T, C.lon[i]), z = wz(T, C.lat[i]); course[i * 3] = x; course[i * 3 + 1] = wy(T, x, z) + LIFT * EXAG; course[i * 3 + 2] = z; }
      start();
    }).catch(function (e) {
      // geçici olabilir (zayıf çekim, önbellek henüz dolmamış): kalıcı işaretlenmez, 3B'ye yeniden dokununca tekrar denenir
      loading = false; canvas.hidden = true; ov.hidden = true;
      say('3B görünüm yüklenemedi (' + (e && e.message ? e.message : 'hata') + '). Yeniden denemek için 3B\'ye dokun. 2B görünüm çalışmaya devam eder.');
    });
  }

  /* ---------- WebGL kaynakları ---------- */
  var VS_T = 'attribute vec3 p;attribute float s;uniform mat4 m;uniform vec2 inv;varying vec2 uv;varying float sh;' +
    'void main(){uv=vec2(p.x*inv.x+0.5,p.z*inv.y+0.5);sh=s;gl_Position=m*vec4(p,1.0);}';
  var FS_T = '#ifdef GL_FRAGMENT_PRECISION_HIGH\nprecision highp float;\n#else\nprecision mediump float;\n#endif\nuniform sampler2D t;varying vec2 uv;varying float sh;void main(){gl_FragColor=vec4(texture2D(t,uv).rgb*sh,1.0);}';
  // bias: çizgiyi kameraya doğru sabit bir metre kadar öne alır (NDC'de 2 * yakın düzlem * metre / w^2).
  // çizgi: ekran uzayında genişletilen şerit. p nokta, a önceki, b sonraki nokta, d yan (+1 / -1); köşede iki yönün ortalaması (gönye)
  var VS_L = 'attribute vec3 p;attribute vec3 a;attribute vec3 b;attribute float d;uniform mat4 m;uniform vec2 vp;uniform float wd;uniform float bias;' +
    'void main(){vec4 P=m*vec4(p,1.0);vec4 A=m*vec4(a,1.0);vec4 B=m*vec4(b,1.0);' +
    'if(A.w<0.001&&P.w>0.001)A=mix(P,A,(P.w-0.001)/(P.w-A.w));if(B.w<0.001&&P.w>0.001)B=mix(P,B,(P.w-0.001)/(P.w-B.w));' +
    'vec2 sp=P.xy/P.w*vp;vec2 d1=sp-A.xy/max(A.w,0.001)*vp;vec2 d2=B.xy/max(B.w,0.001)*vp-sp;' +
    'float l1=length(d1);float l2=length(d2);d1=l1>0.0001?d1/l1:vec2(0.0);d2=l2>0.0001?d2/l2:vec2(0.0);' +
    'if(l1<=0.0001)d1=d2;if(l2<=0.0001)d2=d1;' +
    'vec2 t=d1+d2;float lt=length(t);t=lt>0.0001?t/lt:d1;vec2 n=vec2(-t.y,t.x);' +
    'float k=1.0/max(dot(n,vec2(-d1.y,d1.x)),0.45);' +
    'P.xy+=n*d*wd*k/vp*P.w;P.z-=bias/P.w;gl_Position=P;}';
  var FS_L = 'precision mediump float;uniform vec4 c;void main(){gl_FragColor=c;}';

  function program(vs, fs) {
    function sh(type, src) { var s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s); if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s) || 'gölgelendirici'); return s; }
    var p = gl.createProgram(); gl.attachShader(p, sh(gl.VERTEX_SHADER, vs)); gl.attachShader(p, sh(gl.FRAGMENT_SHADER, fs)); gl.linkProgram(p);
    if (!gl.getProgramParameter(p, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(p) || 'program');
    return p;
  }
  function buffer(target, data) { var b = gl.createBuffer(); gl.bindBuffer(target, b); gl.bufferData(target, data, gl.STATIC_DRAW); return b; }

  // arazi ağı: 16 bit dizin sınırı için satır dilimleri (uzantı gerektirmez)
  function buildTerrain() {
    var w = T.w, h = T.h, q = T.q, rowsPer = Math.floor(65536 / w), chunks = [];
    var dx = T.W / (w - 1), dz = T.H / (h - 1), zf = EXAG * 1.6, lx = 0.5, ly = 0.7, lz = 0.5, ll = Math.sqrt(lx * lx + ly * ly + lz * lz);
    for (var r0 = 0; r0 < h - 1; r0 += rowsPer - 1) {
      var r1 = Math.min(h - 1, r0 + rowsPer - 1), rows = r1 - r0 + 1, v = new Float32Array(rows * w * 4), k = 0;
      for (var j = r0; j <= r1; j++) for (var i = 0; i < w; i++) {
        var e = q[j * w + i] / 10;
        // eğim: merkezî fark; ışık güneydoğudan (uydu görüntüsündeki gölgelerle aynı yön)
        var ex = (q[j * w + Math.min(w - 1, i + 1)] - q[j * w + Math.max(0, i - 1)]) / 10 / ((Math.min(w - 1, i + 1) - Math.max(0, i - 1)) * dx) * zf;
        var ez = (q[Math.min(h - 1, j + 1) * w + i] - q[Math.max(0, j - 1) * w + i]) / 10 / ((Math.min(h - 1, j + 1) - Math.max(0, j - 1)) * dz) * zf;
        var nl = Math.sqrt(ex * ex + 1 + ez * ez), dot = (-ex * lx + ly - ez * lz) / (nl * ll);
        v[k++] = (i / (w - 1) - 0.5) * T.W; v[k++] = e * EXAG; v[k++] = (j / (h - 1) - 0.5) * T.H;
        v[k++] = Math.min(1.25, 0.42 + 0.78 * Math.max(0, dot));
      }
      var ix = new Uint16Array((rows - 1) * (w - 1) * 6); k = 0;
      for (j = 0; j < rows - 1; j++) for (i = 0; i < w - 1; i++) {
        var a = j * w + i, b = a + 1, c = a + w, d = c + 1;
        ix[k++] = a; ix[k++] = c; ix[k++] = b; ix[k++] = b; ix[k++] = c; ix[k++] = d;
      }
      chunks.push({ vb: buffer(gl.ARRAY_BUFFER, v), ib: buffer(gl.ELEMENT_ARRAY_BUFFER, ix), n: ix.length });
    }
    return chunks;
  }
  // polys: her biri [x,y,z, x,y,z, ...] olan çoklu çizgiler. Nokta başına 2 köşe; 16 bit dizin için dilimlenir.
  function buildLines(polys) {
    var chunks = [], v = [], ix = [], nv = 0;
    function flush() {
      if (!ix.length) return;
      chunks.push({ vb: buffer(gl.ARRAY_BUFFER, new Float32Array(v)), ib: buffer(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(ix)), n: ix.length });
      v = []; ix = []; nv = 0;
    }
    polys.forEach(function (q) {
      var n = q.length / 3;
      for (var i = 0; i < n; i++) {
        if (nv + 2 > 65536) { flush(); if (i > 0) i--; }           // dilim doldu: son noktadan devam (şerit kopmasın)
        var o = i * 3, a = Math.max(0, i - 1) * 3, b = Math.min(n - 1, i + 1) * 3;
        for (var sd = 1; sd >= -1; sd -= 2) v.push(q[o], q[o + 1], q[o + 2], q[a], q[a + 1], q[a + 2], q[b], q[b + 1], q[b + 2], sd);
        if (nv >= 2 && lastPoly === q && lastI === i - 1) ix.push(nv - 2, nv - 1, nv, nv - 1, nv + 1, nv);
        nv += 2; lastPoly = q; lastI = i;
      }
    });
    flush();
    return chunks;
  }
  var lastPoly = null, lastI = -1;
  // yol noktalarını araziye oturtur; uzun parçalar bölünür (düz parça tepenin içinden geçmesin)
  function drape(type) {
    var out = [], lift = LIFT * EXAG * 0.6;
    trails.forEach(function (way) {
      if (way.t !== type) return;
      var p = way.p, q = [], px = 0, pz = 0;
      for (var i = 0; i < p.length; i += 2) {
        var x = (p[i] - 0.5) * T.W, z = (0.5 - p[i + 1]) * T.H;
        var n = i ? Math.max(1, Math.ceil(Math.hypot(x - px, z - pz) / 40)) : 1;
        for (var s = 1; s <= n; s++) { var bx = px + (x - px) * s / n, bz = pz + (z - pz) * s / n; if (!i) { bx = x; bz = z; } q.push(bx, wy(T, bx, bz) + lift, bz); }
        px = x; pz = z;
      }
      out.push(q);
    });
    return out;
  }
  function buildGL() {
    gl = canvas.getContext('webgl', { antialias: true, alpha: false }) || canvas.getContext('experimental-webgl', { antialias: true, alpha: false });
    if (!gl) throw new Error('WebGL yok');
    G = { pT: program(VS_T, FS_T), pL: program(VS_L, FS_L) };
    G.terrain = buildTerrain();
    G.roads = buildLines(drape(1)); G.paths = buildLines(drape(0));
    G.course = buildLines([course]);
    G.tex = gl.createTexture(); gl.bindTexture(gl.TEXTURE_2D, G.tex);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, img);
    gl.generateMipmap(gl.TEXTURE_2D);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    var an = gl.getExtension('EXT_texture_filter_anisotropic') || gl.getExtension('WEBKIT_EXT_texture_filter_anisotropic');
    if (an) gl.texParameterf(gl.TEXTURE_2D, an.TEXTURE_MAX_ANISOTROPY_EXT, Math.min(8, gl.getParameter(an.MAX_TEXTURE_MAX_ANISOTROPY_EXT)));
    ['pT', 'pL'].forEach(function (k) {
      var p = G[k], u = {}, n = gl.getProgramParameter(p, gl.ACTIVE_UNIFORMS);
      for (var i = 0; i < n; i++) { var nm = gl.getActiveUniform(p, i).name; u[nm] = gl.getUniformLocation(p, nm); }
      p.u = u; p.a = {};
      ['p', 's', 'a', 'b', 'd'].forEach(function (a) { p.a[a] = gl.getAttribLocation(p, a); });
    });
  }

  /* ---------- kamera ---------- */
  var home = { tz: 0, dist: 1 };
  // başlangıç görünümü: arazinin dört köşesi tuvale sığar ve ortalanır (yinelemeyle; eğik bakışta yakın kenar daha geniş görünür)
  function fitView() {
    var c = { tx: 0, ty: 0, tz: 0, az: 0, tilt: TILT0, dist: T.W / (Math.tan(FOVY / 2) * vpW / vpH) }, hw = T.W / 2, hh = T.H / 2;
    for (var it = 0; it < 14; it++) {
      c.ty = wy(T, 0, c.tz);
      var m = viewProj(c, vpW / vpH), x0 = Infinity, x1 = -Infinity, y0 = Infinity, y1 = -Infinity;
      [[-hw, -hh], [hw, -hh], [-hw, hh], [hw, hh]].forEach(function (k) {
        var s = project(m, k[0], wy(T, k[0], k[1]), k[1], vpW, vpH);
        x0 = Math.min(x0, s.x); x1 = Math.max(x1, s.x); y0 = Math.min(y0, s.y); y1 = Math.max(y1, s.y);
      });
      c.dist *= Math.max((x1 - x0) / (vpW * 0.97), (y1 - y0) / (vpH * 0.93));
      c.tz += ((y0 + y1) / 2 - vpH / 2) * 2 * c.dist * Math.tan(FOVY / 2) / vpH / Math.sin(TILT0);   // ekranda aşağı kaymışsa hedef güneye
    }
    home.tz = c.tz; home.dist = c.dist;
    return c.dist;
  }
  function resetView() { cam.tx = 0; cam.tz = home.tz; cam.ty = wy(T, 0, home.tz); cam.az = 0; cam.tilt = TILT0; cam.dist = fit; }
  function clampCam() {
    cam.tilt = Math.max(TILT_MIN, Math.min(TILT_MAX, cam.tilt));
    cam.dist = Math.max(fit * 0.06, Math.min(fit * 1.5, cam.dist));
    cam.tx = Math.max(-T.W / 2, Math.min(T.W / 2, cam.tx)); cam.tz = Math.max(-T.H / 2, Math.min(T.H / 2, cam.tz));
    cam.ty = wy(T, cam.tx, cam.tz);
    // göz arazinin içine girmesin (vadi tabanına yakınlaşıp eğimi düşürünce): gerekirse eğim yükselir
    for (var k = 0; k < 40; k++) {
      var e = eyeOf(cam);
      if (Math.abs(e[0]) > T.W / 2 || Math.abs(e[2]) > T.H / 2 || e[1] > wy(T, e[0], e[2]) + 40 || cam.tilt >= TILT_MAX) break;
      cam.tilt = Math.min(TILT_MAX, cam.tilt + 0.03);
    }
  }
  function resize() {
    if (!T || !gl) return false;
    var w = Math.round(canvas.clientWidth), h = Math.round(canvas.clientHeight);
    if (w < 2 || h < 2) return false;            // sekme gizli
    var first = !vpW, zoom = first ? 1 : cam.dist / fit;
    vpW = w; vpH = h; dpr = Math.min(2, window.devicePixelRatio || 1);
    canvas.width = Math.round(w * dpr); canvas.height = Math.round(h * dpr);
    fit = fitView();
    if (first) resetView(); else cam.dist = fit * zoom;
    return true;
  }

  /* ---------- çizim ---------- */
  function cssRgb(name) {
    var v = getComputedStyle(document.documentElement).getPropertyValue(name).trim(), m = /^#([0-9a-f]{6})$/i.exec(v);
    if (!m) return [0.5, 0.5, 0.5];
    var n = parseInt(m[1], 16); return [(n >> 16) / 255, (n >> 8 & 255) / 255, (n & 255) / 255];
  }
  function drawLines(chunks, width, color, metres) {
    var p = G.pL;
    gl.uniform1f(p.u.wd, width * dpr); gl.uniform4fv(p.u.c, color); gl.uniform1f(p.u.bias, 2 * nearOf(cam) * metres);
    chunks.forEach(function (c) {
      gl.bindBuffer(gl.ARRAY_BUFFER, c.vb);
      gl.vertexAttribPointer(p.a.p, 3, gl.FLOAT, false, 40, 0); gl.vertexAttribPointer(p.a.a, 3, gl.FLOAT, false, 40, 12);
      gl.vertexAttribPointer(p.a.b, 3, gl.FLOAT, false, 40, 24); gl.vertexAttribPointer(p.a.d, 1, gl.FLOAT, false, 40, 36);
      gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, c.ib); gl.drawElements(gl.TRIANGLES, c.n, gl.UNSIGNED_SHORT, 0);
    });
  }
  function draw() {
    raf = 0;
    if (!gl || !G || view !== '3' || !vpW) return;
    var bg = cssRgb('--surface');
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.clearColor(bg[0], bg[1], bg[2], 1); gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    M = viewProj(cam, vpW / vpH);
    var m32 = new Float32Array(M), p = G.pT;
    gl.enable(gl.DEPTH_TEST); gl.depthFunc(gl.LEQUAL); gl.depthMask(true); gl.disable(gl.BLEND);
    gl.useProgram(p); gl.uniformMatrix4fv(p.u.m, false, m32); gl.uniform2f(p.u.inv, 1 / T.W, 1 / T.H);
    gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, G.tex); gl.uniform1i(p.u.t, 0);
    gl.enableVertexAttribArray(p.a.p); gl.enableVertexAttribArray(p.a.s);
    G.terrain.forEach(function (c) {
      gl.bindBuffer(gl.ARRAY_BUFFER, c.vb);
      gl.vertexAttribPointer(p.a.p, 3, gl.FLOAT, false, 16, 0); gl.vertexAttribPointer(p.a.s, 1, gl.FLOAT, false, 16, 12);
      gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, c.ib); gl.drawElements(gl.TRIANGLES, c.n, gl.UNSIGNED_SHORT, 0);
    });
    gl.disableVertexAttribArray(p.a.s);
    // çizgiler: arazinin arkasında kalan kısım gizlenir; derinliğe yazmazlar
    p = G.pL; gl.useProgram(p); gl.uniformMatrix4fv(p.u.m, false, m32); gl.uniform2f(p.u.vp, canvas.width, canvas.height);
    gl.enableVertexAttribArray(p.a.p); gl.enableVertexAttribArray(p.a.a); gl.enableVertexAttribArray(p.a.b); gl.enableVertexAttribArray(p.a.d);
    gl.depthMask(false); gl.enable(gl.BLEND); gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
    var near = Math.max(0, Math.min(1, (fit / cam.dist - 1) / 3));   // 0 genel bakış, 1 yakın: uzaktan yollar soluk ve ince, parkur öne çıksın
    drawLines(G.roads, 1.0 + 1.4 * near, [1, 0.95, 0.8, 0.22 + 0.33 * near], 8);
    drawLines(G.paths, 1.0 + 1.2 * near, [1, 1, 1, 0.42 + 0.43 * near], 9);
    drawLines(G.course, 6.5, [1, 1, 1, 0.95], 12);
    drawLines(G.course, 3.6, COURSE_RGB.concat(1), 12);
    gl.disableVertexAttribArray(p.a.a); gl.disableVertexAttribArray(p.a.b); gl.disableVertexAttribArray(p.a.d);
    overlay();
  }
  function redraw() { if (!raf && view === '3') raf = requestAnimationFrame(draw); }

  /* ---------- etiketler ve imleç (HTML, tuvalin üstünde) ---------- */
  // kamera ile nokta arasında arazi var mı (ışın yürütme)
  function hiddenBy(x, y, z) {
    var e = eyeOf(cam);
    for (var s = 1; s < 48; s++) {
      var t = s / 48, px = e[0] + (x - e[0]) * t, pz = e[2] + (z - e[2]) * t;
      if (Math.abs(px) > T.W / 2 || Math.abs(pz) > T.H / 2) continue;
      if (wy(T, px, pz) > e[1] + (y - e[1]) * t + 6) return true;
    }
    return false;
  }
  function place(el, i) {
    var x = course[i * 3], y = course[i * 3 + 1], z = course[i * 3 + 2], s = project(M, x, y, z, vpW, vpH);
    var on = s.w > 0 && s.x > -20 && s.x < vpW + 20 && s.y > -20 && s.y < vpH + 20;
    el.hidden = !on; if (!on) return;
    el.style.transform = 'translate(' + s.x.toFixed(1) + 'px,' + s.y.toFixed(1) + 'px)';
    el.classList.toggle('behind', hiddenBy(x, y, z));
  }
  function overlay() {
    if (!labels.length) {
      K.cps.forEach(function (c, n) {
        var d = document.createElement('span'); d.className = 'm3-lab'; d.textContent = c.id === 'FIN' ? 'F' : String(n + 1);
        ov.appendChild(d); labels.push({ el: d, idx: c.idx });
      });
      curEl = document.createElement('span'); curEl.className = 'm3-cur'; ov.appendChild(curEl);
    }
    labels.forEach(function (l) { place(l.el, l.idx); });
    place(curEl, K.cur());
  }

  /* ---------- etkileşim: tek parmak döndür, iki parmak yakınlaştır ve kaydır, dokun = nokta seç ---------- */
  var pts = {}, nPts = 0, tap = null, lastTap = 0, pinch = null;
  function pan(dx, dy) {
    var s = 2 * cam.dist * Math.tan(FOVY / 2) / vpH, sa = Math.sin(cam.az), ca = Math.cos(cam.az), f = dy * s / Math.max(0.3, Math.sin(cam.tilt));
    cam.tx += -dx * s * ca - f * sa; cam.tz += dx * s * sa - f * ca;
  }
  function pick(x, y) {
    var d = new Float32Array(N), w = new Float32Array(N), min = 30, best = -1, bw = Infinity, i;
    for (i = 0; i < N; i++) {
      var s = project(M, course[i * 3], course[i * 3 + 1], course[i * 3 + 2], vpW, vpH);
      d[i] = s.w > 0 ? Math.hypot(s.x - x, s.y - y) : Infinity; w[i] = s.w;
      // 30 px içindeki adaylardan tepe arkasında kalanlar elenir
      if (d[i] < 30 && hiddenBy(course[i * 3], course[i * 3 + 1], course[i * 3 + 2])) d[i] = Infinity;
      if (d[i] < min) min = d[i];
    }
    // en yakın nokta; parkur kendi üstünden geçiyorsa (gidiş-dönüş) kameraya yakın olan
    for (i = 0; i < N; i++) if (d[i] <= min + 5 && d[i] < 30 && w[i] < bw) { bw = w[i]; best = i; }
    return best;
  }
  function two() { var k = Object.keys(pts), a = pts[k[0]], b = pts[k[1]]; return { d: Math.hypot(a.x - b.x, a.y - b.y), x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 }; }
  canvas.addEventListener('pointerdown', function (ev) {
    if (!M) return;
    try { canvas.setPointerCapture(ev.pointerId); } catch (e) {}
    if (ev.isPrimary) pts = {};            // yeni hareket: kaçmış bir "bırakma" olayı sayımı bozmasın
    pts[ev.pointerId] = { x: ev.clientX, y: ev.clientY }; nPts = Object.keys(pts).length;
    tap = nPts === 1 ? { x: ev.clientX, y: ev.clientY, t: Date.now() } : null;
    pinch = nPts === 2 ? two() : null;
  });
  canvas.addEventListener('pointermove', function (ev) {
    var p = pts[ev.pointerId]; if (!p || !M) return;
    var dx = ev.clientX - p.x, dy = ev.clientY - p.y; p.x = ev.clientX; p.y = ev.clientY;
    if (tap && Math.hypot(ev.clientX - tap.x, ev.clientY - tap.y) > 8) tap = null;
    if (nPts === 1) {
      if (ev.shiftKey) pan(dx, dy); else { cam.az -= dx * 0.008; cam.tilt += dy * 0.006; }
    } else if (nPts === 2 && pinch) {
      var n = two();
      if (pinch.d > 10 && n.d > 10) cam.dist *= pinch.d / n.d;
      pan(n.x - pinch.x, n.y - pinch.y); pinch = n;
    }
    clampCam(); redraw();
  });
  function up(ev) {
    if (!pts[ev.pointerId]) return;
    delete pts[ev.pointerId]; nPts = Object.keys(pts).length; pinch = null;
    if (tap && ev.type === 'pointerup' && Date.now() - tap.t < 500) {
      var now = Date.now(), r = canvas.getBoundingClientRect();
      if (now - lastTap < 320) { resetView(); lastTap = 0; redraw(); }       // çift dokunuş: görünümü sıfırla
      else { lastTap = now; var i = pick(ev.clientX - r.left, ev.clientY - r.top); if (i >= 0) { fromMap = true; K.setIdx(i); fromMap = false; } }
    }
    tap = null;
  }
  canvas.addEventListener('pointerup', up); canvas.addEventListener('pointercancel', up);
  canvas.addEventListener('wheel', function (ev) {
    if (!M) return; ev.preventDefault();
    cam.dist *= Math.exp(ev.deltaY * 0.0015); clampCam(); redraw();
  }, { passive: false });
  // bağlam kaybı (ör. uygulama arka plandan dönerken): geri gelene kadar beklenir, hata sayılmaz
  var lost = false;
  canvas.addEventListener('webglcontextlost', function (ev) { ev.preventDefault(); lost = true; gl = null; G = null; M = null; ov.hidden = true; say('3B görünüm yeniden hazırlanıyor'); });
  canvas.addEventListener('webglcontextrestored', function () { lost = false; start(); });

  // imleç değişti (grafik, düğmeler, konum ya da harita). Haritaya yakınlaşılmışsa ve değişiklik dışarıdan geldiyse nokta ortalanır.
  var fromMap = false;
  function onCursor(i) {
    if (!M || view !== '3') return;
    if (!fromMap && cam.dist < fit * 0.6) { cam.tx = course[i * 3]; cam.tz = course[i * 3 + 2]; clampCam(); }
    redraw();
  }

  function start() {
    if (!T || view !== '3' || lost) return;
    try { if (!gl) buildGL(); } catch (e) { gl = null; G = null; fail('3B görünüm bu cihazda açılamadı (' + (e && e.message ? e.message : 'WebGL') + ').'); return; }
    say(''); canvas.hidden = false; ov.hidden = false;
    if (resize()) redraw();
  }

  /* ---------- 2B | 3B anahtarı ---------- */
  var sw = $('profView'), chips = {};
  [['2', '2B'], ['3', '3B']].forEach(function (o) {
    var b = document.createElement('button'); b.type = 'button'; b.className = 'chip'; b.textContent = o[1];
    b.addEventListener('click', function () { setView(o[0]); });
    sw.firstElementChild.appendChild(b); chips[o[0]] = b;
  });
  function setView(v) {
    view = v === '3' ? '3' : '2'; K.store('k63profview', view);
    chips['2'].setAttribute('aria-pressed', String(view === '2')); chips['3'].setAttribute('aria-pressed', String(view === '3'));
    $('chart').hidden = view === '3'; $('legend2').hidden = view === '3';
    box.hidden = view !== '3'; $('legend3').hidden = view !== '3';
    var tip = $('legend3').nextElementSibling;
    if (view === '2' && tip && tip.classList.contains('tipbody')) $('legend3').querySelector('.tipbtn').click();   // açık 3B notu 2B'de kalmasın
    if (view === '2') { K.drawChart(); return; }
    if (failed) return;
    if (T) start(); else load();
  }
  K.infoBtn($('legend3'),
    'Tek parmakla döndür, iki parmakla yakınlaştır ve kaydır. Parkura dokununca o nokta seçilir; çift dokunuş görünümü başa alır. ' +
    'Yükseklik 1,5 kat abartılıdır. Arazi 30 m, görüntü 10 m ayrıntıdadır: dar vadi tabanları yuvarlanır, peribacaları görünmez. Sayılar (km, rakım, eğim) resmî GPX\'ten gelir. ' +
    'Yollar OpenStreetMap\'ten; parkurun bir kısmı orada çizili değil, mavi parkur çizgisi ise eksiksizdir.<br>' +
    'Arazi: produced using Copernicus WorldDEM-30 © DLR e.V. 2010-2014 and © Airbus Defence and Space GmbH 2014-2018 provided under COPERNICUS by the European Union and ESA; all rights reserved. ' +
    'The organisations in charge of the Copernicus programme by law or by delegation do not incur any liability for any use of the Copernicus WorldDEM-30.<br>' +
    'Görüntü: Contains modified Copernicus Sentinel data 2026.<br>' +
    'Yollar: © OpenStreetMap contributors. OSM verisi ODbL lisanslıdır (openstreetmap.org/copyright).');

  window.addEventListener('resize', function () { if (view === '3' && resize()) redraw(); });
  // Profil sekmesi başka sekmeden açılınca tuval ilk kez boyut kazanır
  if (window.ResizeObserver) new ResizeObserver(function () { if (view === '3' && gl && resize()) redraw(); }).observe(box);
  $('themeBtn').addEventListener('click', redraw);
  if (window.matchMedia) { var mq = window.matchMedia('(prefers-color-scheme: dark)'); if (mq.addEventListener) mq.addEventListener('change', redraw); }

  K.map3d = {
    setView: setView, view: function () { return view; }, onCursor: onCursor,
    parseTerrain: parseTerrain, heightAt: heightAt, decodeTrails: decodeTrails,
    perspective: perspective, lookAt: lookAt, mul: mul, viewProj: viewProj, project: project,
    state: function () { return { view: view, loaded: !!T, gl: !!gl, failed: failed, cam: cam, fit: fit, terrain: T, pointers: nPts }; }
  };
  setView(view);
})();
