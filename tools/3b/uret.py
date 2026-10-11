# 3B arazi verisini üretir: terrain.bin (yükseklik), terrain.jpg (uydu görüntüsü), trails.json (OSM yolları).
# Kullanım (depo kökünden):  python3 -I tools/3b/uret.py [--yeniden]
# Gerekenler: rasterio, numpy, pillow (bkz. tools/README.md). İndirilenler tools/out/3b/ altında saklanır
# (git'e girmez); --yeniden verilmezse oradan okunur.
#
# Kaynaklar ve lisanslar: docs/arastirma/3b-veri-raporu.md
#   Yükseklik: Copernicus DEM GLO-30 (AWS açık veri, hesapsız)
#   Görüntü:   Sentinel-2 L2A, 10 m (AWS, Element84 Earth Search), yaz sahnelerinin medyanı
#   Yollar:    OpenStreetMap (Overpass API), ODbL
import json, math, os, struct, sys, urllib.parse, urllib.request

import numpy as np
import rasterio
from rasterio.enums import Resampling
from rasterio.transform import from_bounds
from rasterio.warp import reproject
from rasterio.windows import Window
from PIL import Image

KOK = os.path.normpath(os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..'))
OUT = os.path.join(KOK, 'tools', 'out', '3b')
YENIDEN = '--yeniden' in sys.argv
UA = 'k63-3b-uret/0.18 (kisisel proje; github.com/kaanmt/kapadokya-63k)'

# Parkur kutusu + yaklaşık 1 km pay (parkur: enlem 38,5962-38,6718, boylam 34,8045-34,9096)
LAT0, LAT1 = 38.587, 38.681
LON0, LON1 = 34.793, 34.921
DEM_URL = 'https://copernicus-dem-30m.s3.amazonaws.com/Copernicus_DSM_COG_10_N38_00_E034_00_DEM/Copernicus_DSM_COG_10_N38_00_E034_00_DEM.tif'
# Bulutu %1'in altında, 2026 yazı (16 Temmuz - 9 Eylül); medyan alınır (tek sahnenin gölgesi ve gürültüsü azalır)
SAHNELER = ['S2C_36SXH_20260716_0_L2A', 'S2A_36SXH_20260728_0_L2A', 'S2B_36SXH_20260820_0_L2A', 'S2A_36SXH_20260827_1_L2A',
            'S2C_36SXH_20260904_0_L2A', 'S2A_36SXH_20260906_1_L2A', 'S2B_36SXH_20260909_0_L2A']
STAC = 'https://earth-search.aws.element84.com/v1/collections/sentinel-2-l2a/items/'
OVERPASS = 'https://overpass-api.de/api/interpreter'
DOKU = 1024  # px; WebGL 1'de mipmap için 2'nin kuvveti, Android'de güvenli sınır 4096
PATIKA = {'path', 'footway', 'track', 'steps', 'bridleway', 'cycleway', 'pedestrian'}
ATLA = {'proposed', 'construction', 'razed', 'abandoned', 'platform', 'corridor', 'elevator', 'rest_area', 'services', 'bus_stop'}


def al(url, veri=None):
    req = urllib.request.Request(url, data=veri, headers={'User-Agent': UA})
    with urllib.request.urlopen(req, timeout=180) as r:
        return r.read()


def onbellek(ad, uret):
    yol = os.path.join(OUT, ad)
    if os.path.exists(yol) and not YENIDEN:
        return yol
    os.makedirs(OUT, exist_ok=True)
    uret(yol)
    return yol


# ---------- 1. Yükseklik ----------
def dem():
    def indir(yol):
        with rasterio.open(DEM_URL) as src:
            # kutuyu içine alan en küçük piksel penceresi
            c0, r0 = ~src.transform * (LON0, LAT1)
            c1, r1 = ~src.transform * (LON1, LAT0)
            c0, r0, c1, r1 = int(math.floor(c0)), int(math.floor(r0)), int(math.ceil(c1)), int(math.ceil(r1))
            win = Window(c0, r0, c1 - c0, r1 - r0)
            a = src.read(1, window=win).astype(np.float32)
            t = src.window_transform(win)
        np.savez(yol, a=a, t=np.array([t.a, t.b, t.c, t.d, t.e, t.f]))
    z = np.load(onbellek('dem.npz', indir))
    a, t = z['a'], z['t']
    h, w = a.shape
    # piksel merkezleri: ilk ve son örneğin koordinatı (ızgara bu ikisi arasında eşit aralıklı)
    lon0, lat1 = t[2] + t[0] / 2, t[5] + t[4] / 2
    lon1, lat0 = lon0 + t[0] * (w - 1), lat1 + t[4] * (h - 1)
    return a, (lat0, lat1, lon0, lon1)


# ---------- 2. Görüntü ----------
def goruntu(kutu):
    lat0, lat1, lon0, lon1 = kutu
    # doku pikselleri kutuyu tam kaplar: u = (lon - lon0) / (lon1 - lon0), v = (lat1 - lat) / (lat1 - lat0)
    dst_t = from_bounds(lon0, lat0, lon1, lat1, DOKU, DOKU)

    def indir(yol):
        yigin = []
        for sid in SAHNELER:
            item = json.loads(al(STAC + sid))
            kaydir = 0 if item['properties'].get('earthsearch:boa_offset_applied') else -1000
            rgb = np.zeros((3, DOKU, DOKU), np.float32)
            for i, bant in enumerate(('red', 'green', 'blue')):
                with rasterio.open(item['assets'][bant]['href']) as src:
                    reproject(rasterio.band(src, 1), rgb[i], dst_transform=dst_t, dst_crs='EPSG:4326', resampling=Resampling.bilinear)
            yigin.append(np.clip(rgb + kaydir, 0, None) / 10000.0)
            print('  sahne', sid, 'ortalama yansıtma %.3f' % yigin[-1].mean())
        np.save(yol, np.median(np.stack(yigin), axis=0).astype(np.float32))
    return np.load(onbellek('s2_medyan.npy', indir))


def renk(m):
    # yansıtma -> sRGB: ortak alt/üst yüzdelik (renk dengesi korunur), gama, hafif doygunluk
    lo, hi = np.percentile(m, 0.5), np.percentile(m, 99.7)
    v = np.clip((m - lo) / (hi - lo), 0, 1) ** (1 / 1.9)
    gri = v.mean(axis=0, keepdims=True)
    v = np.clip(gri + (v - gri) * 1.25, 0, 1)
    return (v.transpose(1, 2, 0) * 255 + 0.5).astype(np.uint8)


# ---------- 3. Yollar ----------
def yollar(kutu):
    lat0, lat1, lon0, lon1 = kutu

    def indir(yol):
        q = '[out:json][timeout:120];way[highway](%f,%f,%f,%f);out geom;' % (lat0, lon0, lat1, lon1)
        open(yol, 'wb').write(al(OVERPASS, urllib.parse.urlencode({'data': q}).encode()))
    j = json.load(open(onbellek('osm.json', indir), encoding='utf-8'))
    ky, kx = 110574.0, 111320.0 * math.cos(math.radians((lat0 + lat1) / 2))

    def sade(p, tol):  # Douglas-Peucker (metre)
        if len(p) < 3:
            return p
        (ax, ay), (bx, by) = p[0], p[-1]
        dx, dy = bx - ax, by - ay
        L = math.hypot(dx, dy)
        en, k = 0, 0
        for i in range(1, len(p) - 1):
            d = abs((p[i][0] - ax) * dy - (p[i][1] - ay) * dx) / L if L else math.hypot(p[i][0] - ax, p[i][1] - ay)
            if d > en:
                en, k = d, i
        if en <= tol:
            return [p[0], p[-1]]
        return sade(p[:k + 1], tol)[:-1] + sade(p[k:], tol)

    cikti, say = [], {0: [0, 0], 1: [0, 0]}
    for w in j['elements']:
        tur = w.get('tags', {}).get('highway')
        if tur in ATLA or 'geometry' not in w:
            continue
        t = 0 if tur in PATIKA else 1
        parca = []
        for g in w['geometry'] + [None]:
            ic = g is not None and lat0 <= g['lat'] <= lat1 and lon0 <= g['lon'] <= lon1
            if ic:
                parca.append(((g['lon'] - lon0) * kx, (g['lat'] - lat0) * ky))
                continue
            if len(parca) >= 2:
                s = sade(parca, 2.0 if t == 0 else 3.0)
                qx = [round(x / ((lon1 - lon0) * kx) * 65535) for x, _ in s]
                qy = [round(y / ((lat1 - lat0) * ky) * 65535) for _, y in s]
                satir = [t, qx[0], qy[0]]
                for i in range(1, len(s)):
                    satir += [qx[i] - qx[i - 1], qy[i] - qy[i - 1]]
                cikti.append(satir)
                say[t][0] += 1
                say[t][1] += len(s)
            parca = []
    return cikti, say, j.get('osm3s', {}).get('timestamp_osm_base', '')


def parkur():
    s = open(os.path.join(KOK, 'data.js'), encoding='utf-8').read()
    return json.loads(s[s.index('{'):s.rindex('}') + 1])


def main():
    a, kutu = dem()
    lat0, lat1, lon0, lon1 = kutu
    h, w = a.shape
    print('DEM %d x %d örnek | enlem %.5f-%.5f boylam %.5f-%.5f | rakım %.0f-%.0f m' % (w, h, lat0, lat1, lon0, lon1, a.min(), a.max()))

    # terrain.bin: 32 bayt başlık (int32 x 8: sihir 'K63T', sürüm, w, h, taban dm, ölçek [dm], ayrılmış x2)
    # + 4 x float64 (lat0, lat1, lon0, lon1: ilk ve son örnek merkezleri) + w*h uint16 (kuzeyden güneye, batıdan doğuya; taban üstü dm)
    taban = int(math.floor(a.min() * 10))
    q = np.round(a * 10 - taban).astype(np.int64)
    assert q.min() >= 0 and q.max() < 65536
    with open(os.path.join(KOK, 'terrain.bin'), 'wb') as f:
        f.write(struct.pack('<8i', 0x5433364B, 1, w, h, taban, 1, 0, 0))
        f.write(struct.pack('<4d', lat0, lat1, lon0, lon1))
        f.write(q.astype('<u2').tobytes())

    # doğrulama: parkur noktalarında DEM rakımı ile resmî GPX rakımı
    c = parkur()
    la, lo, el = np.array(c['lat']), np.array(c['lon']), np.array(c['ele'])
    fx, fy = (lo - lon0) / (lon1 - lon0) * (w - 1), (lat1 - la) / (lat1 - lat0) * (h - 1)
    assert fx.min() >= 0 and fx.max() <= w - 1 and fy.min() >= 0 and fy.max() <= h - 1, 'parkur kutunun dışında'
    x0, y0 = np.floor(fx).astype(int).clip(0, w - 2), np.floor(fy).astype(int).clip(0, h - 2)
    tx, ty = fx - x0, fy - y0
    d = (a[y0, x0] * (1 - tx) + a[y0, x0 + 1] * tx) * (1 - ty) + (a[y0 + 1, x0] * (1 - tx) + a[y0 + 1, x0 + 1] * tx) * ty
    f = d - el
    print('Parkurda DEM - GPX rakımı: ortalama %+.1f m, ortalama mutlak %.1f m, en büyük %.1f m, korelasyon %.4f' % (f.mean(), np.abs(f).mean(), np.abs(f).max(), np.corrcoef(d, el)[0, 1]))
    print('Kenar payı: batı %.0f m, doğu %.0f m, güney %.0f m, kuzey %.0f m' % ((lo.min() - lon0) * 87000, (lon1 - lo.max()) * 87000, (la.min() - lat0) * 110574, (lat1 - la.max()) * 110574))

    img = renk(goruntu(kutu))
    Image.fromarray(img).save(os.path.join(KOK, 'terrain.jpg'), quality=82, optimize=True, progressive=True, subsampling='4:2:0')

    y, say, tarih = yollar(kutu)
    veri = {
        'kaynak': 'OpenStreetMap (highway=*), Overpass API, veri tarihi ' + tarih,
        'lisans': 'OSM verisi ODbL lisanslıdır: © OpenStreetMap contributors, https://www.openstreetmap.org/copyright',
        'bicim': 'Her yol [tür, x0, y0, dx1, dy1, ...]; tür 0 patika/toprak yol, 1 araç yolu; x batıdan doğuya, y güneyden kuzeye, 0-65535 (terrain.bin kutusu); sonrakiler fark',
        'yollar': y,
    }
    json.dump(veri, open(os.path.join(KOK, 'trails.json'), 'w', encoding='utf-8'), ensure_ascii=False, separators=(',', ':'))
    print('Yollar: patika %d yol / %d nokta, araç yolu %d yol / %d nokta | OSM veri tarihi %s' % (say[0][0], say[0][1], say[1][0], say[1][1], tarih))
    for ad in ('terrain.bin', 'terrain.jpg', 'trails.json'):
        print('  %-12s %7.1f KB' % (ad, os.path.getsize(os.path.join(KOK, ad)) / 1024))


main()
